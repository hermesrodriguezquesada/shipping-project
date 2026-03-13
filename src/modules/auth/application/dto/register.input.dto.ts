import { ClientType } from '@prisma/client';

export class RegisterInputDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly clientType?: ClientType,
    public readonly companyName?: string | null,
  ) {}
}
