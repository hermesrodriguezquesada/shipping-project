import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

const DEFAULT_TOP_ACTORS_LIMIT = 10;
const MAX_TOP_ACTORS_LIMIT = 100;
const DEFAULT_EXPORT_LIMIT = 200;
const MAX_EXPORT_LIMIT = 500;

export function assertValidAdminUserActionLogDateRange(input: { dateFrom: Date; dateTo: Date }): void {
  if (input.dateFrom > input.dateTo) {
    throw new ValidationDomainException('dateFrom must be less than or equal to dateTo');
  }
}

export function resolveAdminUserActionLogTopLimit(limit?: number): number {
  const resolved = limit ?? DEFAULT_TOP_ACTORS_LIMIT;

  if (!Number.isInteger(resolved) || resolved < 1 || resolved > MAX_TOP_ACTORS_LIMIT) {
    throw new ValidationDomainException(`limit must be between 1 and ${MAX_TOP_ACTORS_LIMIT}`);
  }

  return resolved;
}

export function resolveAdminUserActionLogExportPagination(input: {
  offset?: number;
  limit?: number;
}): { offset: number; limit: number } {
  const offset = input.offset ?? 0;
  const limit = input.limit ?? DEFAULT_EXPORT_LIMIT;

  if (!Number.isInteger(offset) || offset < 0) {
    throw new ValidationDomainException('offset must be greater than or equal to 0');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_EXPORT_LIMIT) {
    throw new ValidationDomainException(`limit must be between 1 and ${MAX_EXPORT_LIMIT}`);
  }

  return { offset, limit };
}