import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/core/config/config.service';
import { DomainException } from 'src/core/exceptions/domain/domain.exception';
import { DomainErrorCode } from 'src/core/exceptions/domain/error-codes';
import { ElToqueRateEntity } from '../../domain/entities/eltoque-rate.entity';
import { ElToqueCurrentRatesPort } from '../../domain/ports/eltoque-current-rates.port';

// This query depends on the public El Toque web payload. If their page structure changes,
// this adapter may need to be adjusted without affecting the raw /v1/trmi proxy query.
const ELTOQUE_PUBLIC_PAGE_URL = 'https://eltoque.com/tasas-de-cambio-cuba';
const ELTOQUE_PUBLIC_SOURCE = 'ELTOQUE_PUBLIC_WEB';

type PublicStatisticsEntry = {
  median?: number | string;
};

type PublicCurrency = {
  short_show?: string;
  short_db?: string;
  Nombre?: string;
  enabled?: boolean;
};

type PublicPagePayload = {
  props?: {
    pageProps?: {
      trmiExchange?: {
        date?: string;
        data?: {
          monedas?: PublicCurrency[];
          api?: {
            statistics?: Record<string, PublicStatisticsEntry>;
          };
        };
      };
    };
  };
};

function parseNextData(html: string): PublicPagePayload {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match?.[1]) {
    throw new DomainException('elTOQUE public page payload was not found', DomainErrorCode.UNKNOWN);
  }

  try {
    return JSON.parse(match[1]) as PublicPagePayload;
  } catch (error) {
    throw new DomainException(
      `elTOQUE public page payload is invalid: ${String(error)}`,
      DomainErrorCode.UNKNOWN,
    );
  }
}

function toRateString(value: number | string | undefined): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

@Injectable()
export class HttpElToqueCurrentRatesAdapter implements ElToqueCurrentRatesPort {
  constructor(private readonly config: AppConfigService) {}

  async getCurrentRates(): Promise<ElToqueRateEntity[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.elToqueTimeoutMs);

    let response: Response;
    try {
      response = await fetch(ELTOQUE_PUBLIC_PAGE_URL, {
        method: 'GET',
        signal: controller.signal,
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new DomainException(
        isAbort ? 'elTOQUE public page request timed out' : `elTOQUE public page request failed: ${String(err)}`,
        DomainErrorCode.UNKNOWN,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new DomainException(
        `elTOQUE public page upstream error (${response.status})`,
        DomainErrorCode.UNKNOWN,
      );
    }

    const html = await response.text();
    const payload = parseNextData(html);
    const exchange = payload.props?.pageProps?.trmiExchange;
    const currencies = exchange?.data?.monedas ?? [];
    const statistics = exchange?.data?.api?.statistics ?? {};
    const updatedAt = exchange?.date;

    return currencies.flatMap((currency) => {
      if (!currency.enabled || !currency.short_show || !currency.short_db) {
        return [];
      }

      const stats = statistics[currency.short_db];
      const rate = toRateString(stats?.median);
      if (!rate) {
        return [];
      }

      return [
        {
          code: currency.short_show === 'EUR' || currency.short_db === 'ECU' ? 'EUR' : currency.short_show,
          sourceCode: currency.short_db,
          name: currency.Nombre,
          rate,
          source: ELTOQUE_PUBLIC_SOURCE,
          updatedAt,
        },
      ];
    });
  }
}