import { DomainException } from "./domain.exception";

export class ValidationDomainException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationDomainException';
  }
}
