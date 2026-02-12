import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ConflictDomainException } from 'src/core/exceptions/domain/conflict.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { PASSWORD_HASHER, USER_AUTH_PORT, USER_COMMAND_PORT } from 'src/shared/constants/tokens';

import { PasswordHasherPort } from 'src/modules/auth/domain/ports/password-hasher.port';
import { UserAuthPort } from 'src/modules/users/domain/ports/user-auth.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { normalizeRoles } from 'src/shared/utils/normaliceRoles';

@Injectable()
export class AdminCreateUserUseCase {
  constructor(
    @Inject(USER_AUTH_PORT) 
    private readonly authPort: UserAuthPort,
    @Inject(USER_COMMAND_PORT) 
    private readonly commandPort: UserCommandPort,
    @Inject(PASSWORD_HASHER) 
    private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(input: { email: string; password: string; roles?: Role[] }) {
    const email = input.email.trim().toLowerCase();
    if (!email) throw new ValidationDomainException('Email is required');

    const existing = await this.authPort.findAuthByEmail(email);
    if (existing) throw new ConflictDomainException('Email already in use');

    const passwordHash = await this.hasher.hash(input.password);

    return this.commandPort.create({
      email,
      passwordHash,
      roles: normalizeRoles(input.roles)
    });
  }
}
