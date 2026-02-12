import { Role } from '@prisma/client';

export class AdminListUsersInputDto {
  id?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  isDeleted?: boolean;
  offset?: number;
  limit?: number;
}
