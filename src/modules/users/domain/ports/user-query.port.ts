import { Role } from '@prisma/client';
import { OffsetPagination } from 'src/shared/utils/pagination';
import { UserEntity } from '../entities/user.entity';

export type UserListQuery = {
  id?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  isDeleted?: boolean;
};

export interface UserQueryPort {
  findById(id: string): Promise<UserEntity | null>;
  findMany(query: UserListQuery, pagination: OffsetPagination): Promise<UserEntity[]>;
}
