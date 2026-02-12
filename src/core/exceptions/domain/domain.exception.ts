import { DomainErrorCode } from './error-codes';

export class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: DomainErrorCode = DomainErrorCode.UNKNOWN,
  ) {
    super(message);
  }
}
