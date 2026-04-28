import { Injectable } from '@nestjs/common';
import { DomainException } from 'src/core/exceptions/domain/domain.exception';
import { DomainErrorCode } from 'src/core/exceptions/domain/error-codes';
import { GetElToqueRatesUseCase } from './get-eltoque-rates.usecase';

export type ElToqueRatesPayload = {
  tasas: Record<string, unknown>;
  date?: string;
  hour?: number;
  minutes?: number;
  seconds?: number;
};

@Injectable()
export class GetElToqueRatesNormalizedUseCase {
  constructor(private readonly getElToqueRatesUseCase: GetElToqueRatesUseCase) {}

  async execute(params: { dateFrom?: string; dateTo?: string }): Promise<ElToqueRatesPayload> {
    const raw = await this.getElToqueRatesUseCase.execute(params);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new DomainException(
        `elTOQUE normalized payload is invalid JSON: ${String(error)}`,
        DomainErrorCode.UNKNOWN,
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new DomainException('elTOQUE normalized payload must be an object', DomainErrorCode.UNKNOWN);
    }

    const payload = parsed as Record<string, unknown>;
    const tasas = payload.tasas;
    if (!tasas || typeof tasas !== 'object' || Array.isArray(tasas)) {
      throw new DomainException('elTOQUE normalized payload must contain tasas object', DomainErrorCode.UNKNOWN);
    }

    return {
      tasas: tasas as Record<string, unknown>,
      date: typeof payload.date === 'string' ? payload.date : undefined,
      hour: typeof payload.hour === 'number' ? payload.hour : undefined,
      minutes: typeof payload.minutes === 'number' ? payload.minutes : undefined,
      seconds: typeof payload.seconds === 'number' ? payload.seconds : undefined,
    };
  }
}