import { ValidationDomainException } from "src/core/exceptions/domain/validation.exception";

export class Credentials {
  private constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}

  static create(email: string, password: string): Credentials {
    if (!email) {
      throw new ValidationDomainException('Email is required');
    }

    if (!password || password.length < 6) {
      throw new ValidationDomainException('Password must be at least 6 characters');
    }

    return new Credentials(email, password);
  }
}
