import { Inject, Injectable } from '@nestjs/common';
import { USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { UserCommandPort } from 'src/modules/users/domain/ports/user-command.port';

@Injectable()
export class AdminUpdateUserProfileUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly usersQuery: UserQueryPort,
    @Inject(USER_COMMAND_PORT)
    private readonly usersCmd: UserCommandPort,
  ) {}

  async execute(input: {
    userId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: Date;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }) {
    const existing = await this.usersQuery.findById(input.userId);
    if (!existing) throw new NotFoundDomainException('User not found');

    return this.usersCmd.updateProfile({
      id: input.userId,
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
    });
  }
}