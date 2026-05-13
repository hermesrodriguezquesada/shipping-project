import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientType, InternalNotificationType, Role } from '@prisma/client';
import { ConflictDomainException } from 'src/core/exceptions/domain/conflict.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { InternalNotificationCommandPort } from 'src/modules/internal-notifications/domain/ports/internal-notification-command.port';
import { INTERNAL_NOTIFICATION_COMMAND_PORT, PASSWORD_HASHER, USER_AUTH_PORT, USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';

import { PasswordHasherPort } from 'src/modules/auth/domain/ports/password-hasher.port';
import { UserAuthPort } from 'src/modules/users/domain/ports/user-auth.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { normalizeRoles } from 'src/shared/utils/normaliceRoles';

@Injectable()
export class AdminCreateUserUseCase {
  private readonly logger = new Logger(AdminCreateUserUseCase.name);

  constructor(
    @Inject(USER_AUTH_PORT) 
    private readonly authPort: UserAuthPort,
    @Inject(USER_COMMAND_PORT) 
    private readonly commandPort: UserCommandPort,
    @Inject(PASSWORD_HASHER) 
    private readonly hasher: PasswordHasherPort,
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    role?: Role;
    roles?: Role[];
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: Date;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    isVip?: boolean;
    clientType?: ClientType;
    companyName?: string;
  }) {
    const email = input.email.trim().toLowerCase();
    if (!email) throw new ValidationDomainException('Email is required');

    const existing = await this.authPort.findAuthByEmail(email);
    if (existing) throw new ConflictDomainException('Email already in use');

    const passwordHash = await this.hasher.hash(input.password);
    const clientType = input.clientType ?? ClientType.PERSON;
    const companyNameCandidate = input.companyName?.trim() || null;
    if (clientType === ClientType.COMPANY && !companyNameCandidate) {
      throw new ValidationDomainException('companyName is required for COMPANY');
    }

    const hasRole = input.role !== undefined && input.role !== null;
    const hasRoles = (input.roles?.length ?? 0) > 0;
    if (hasRole === hasRoles) {
      throw new ValidationDomainException('Exactly one of role or roles must be provided');
    }

    const effectiveRoles = hasRole ? [input.role!] : input.roles;

    const created = await this.commandPort.create({
      email,
      passwordHash,
      roles: normalizeRoles(effectiveRoles),
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.isVip !== undefined ? { isVip: input.isVip } : {}),
      clientType,
      companyName: clientType === ClientType.COMPANY ? companyNameCandidate : null,
    });

    await this.notifyAdminsSafe(created.id);

    return created;
  }

  private async notifyAdminsSafe(referenceId: string): Promise<void> {
    try {
      const admins = await this.userQuery.findMany(
        { role: Role.ADMIN, isDeleted: false },
        { limit: 200 },
      );
      await Promise.all(
        admins.map((admin) =>
          this.notificationCommand.create({
            userId: admin.id,
            type: InternalNotificationType.NEW_CLIENT,
            referenceId,
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-blocking notification failure for NEW_CLIENT. referenceId=${referenceId} error=${message}`,
      );
    }
  }
}
