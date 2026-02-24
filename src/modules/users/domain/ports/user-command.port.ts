import { Role } from '@prisma/client';
import { UserEntity } from '../entities/user.entity';

export type UpdateUserProfileInput = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
};

export interface UserCommandPort {
  create(input: {
    email: string;
    passwordHash: string;
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
  }): Promise<UserEntity>;
  updateStatus(input: { id: string; isActive?: boolean; isDeleted?: boolean }): Promise<UserEntity>;
  updateRoles(input: { id: string; roles: Role[] }): Promise<UserEntity>;
  updateProfile(input: UpdateUserProfileInput): Promise<any>;
  updatePassword(input: { id: string; passwordHash: string }): Promise<any>;

}
