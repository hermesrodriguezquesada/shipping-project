import { Injectable } from '@nestjs/common';
import { AppConfigService } from 'src/core/config/config.service';
import { DomainException } from 'src/core/exceptions/domain/domain.exception';
import { DomainErrorCode } from 'src/core/exceptions/domain/error-codes';
import { ElToqueRatesPort } from '../../domain/ports/eltoque-rates.port';

@Injectable()
export class HttpElToqueRatesAdapter implements ElToqueRatesPort {
  constructor(private readonly config: AppConfigService) {}

  async getRates(params: { dateFrom?: string; dateTo?: string }): Promise<string> {
    const baseUrl = this.config.elToqueApiBaseUrl;
    const token = this.config.elToqueApiToken;
    const timeoutMs = this.config.elToqueTimeoutMs;

    const url = new URL('/v1/trmi', baseUrl);
    if (params.dateFrom) url.searchParams.set('date_from', params.dateFrom);
    if (params.dateTo) url.searchParams.set('date_to', params.dateTo);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new DomainException(
        isAbort ? 'elTOQUE request timed out' : `elTOQUE request failed: ${String(err)}`,
        DomainErrorCode.UNKNOWN,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let body = '';
      try {
        body = await response.text();
      } catch {
        // ignore body read error
      }
      switch (response.status) {
        case 401:
          throw new DomainException('elTOQUE authentication failed (401)', DomainErrorCode.UNAUTHORIZED);
        case 422:
          throw new DomainException(`elTOQUE validation error (422): ${body}`, DomainErrorCode.VALIDATION);
        case 429:
          throw new DomainException('elTOQUE rate limit exceeded (429)', DomainErrorCode.UNKNOWN);
        default:
          throw new DomainException(
            `elTOQUE upstream error (${response.status}): ${body}`,
            DomainErrorCode.UNKNOWN,
          );
      }
    }

    const data = await response.json();
    return JSON.stringify(data);
  }
}
