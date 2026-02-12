import { Role } from '@prisma/client';

export type UserEntity = {
  id: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  isActive: boolean;
  isDeleted: boolean;

  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;

  createdAt: Date;
  updatedAt: Date;
};