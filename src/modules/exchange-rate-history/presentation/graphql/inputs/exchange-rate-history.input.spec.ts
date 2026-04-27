import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExchangeRateHistoryInput } from './exchange-rate-history.input';

describe('ExchangeRateHistoryInput', () => {
  it('rejects limits above the public maximum', async () => {
    const input = plainToInstance(ExchangeRateHistoryInput, { limit: 101, offset: 0 });

    const errors = await validate(input);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});