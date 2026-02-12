import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UserType } from '../graphql/types/user.type';

export class UserMapper {
  static toGraphQL(user: UserEntity): UserType {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
            firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      phone: user.phone ?? undefined,
      birthDate: user.birthDate ?? undefined,
      addressLine1: user.addressLine1 ?? undefined,
      addressLine2: user.addressLine2 ?? undefined,
      city: user.city ?? undefined,
      country: user.country ?? undefined,
      postalCode: user.postalCode ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
