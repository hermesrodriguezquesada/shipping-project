import { DomainException } from "./domain.exception";

export class UnauthorizedDomainException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedDomainException';
  }
}

