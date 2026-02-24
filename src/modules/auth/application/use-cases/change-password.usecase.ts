import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER, USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly users: UserQueryPort,
    @Inject(USER_COMMAND_PORT)
    private readonly userCommands: UserCommandPort,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(input: { userId: string; oldPassword: string; newPassword: string }): Promise<boolean> {
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new ValidationDomainException('Password must be at least 6 characters');
    }

    const user = await this.users.findById(input.userId);

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedDomainException('Not authenticated');
    }

    const isValidOldPassword = await this.hasher.compare(input.oldPassword, user.passwordHash);
    if (!isValidOldPassword) {
      throw new UnauthorizedDomainException('Invalid credentials');
    }

    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.userCommands.updatePassword({ id: user.id, passwordHash });

    return true;
  }
}