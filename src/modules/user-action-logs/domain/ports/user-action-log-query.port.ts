import { UserActionLogAction } from '@prisma/client';
import { UserActionLogEntity } from '../entities/user-action-log.entity';

export type UserActionLogListFilters = {
  action?: UserActionLogAction;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AdminUserActionLogListFilters = UserActionLogListFilters & {
  actorUserId?: string;
  resourceType?: string;
  resourceId?: string;
};

export type UserActionLogPagination = {
  offset?: number;
  limit?: number;
};

export interface UserActionLogQueryPort {
  listMine(actorUserId: string, filters: UserActionLogListFilters, pagination: UserActionLogPagination): Promise<UserActionLogEntity[]>;
  listAdmin(filters: AdminUserActionLogListFilters, pagination: UserActionLogPagination): Promise<UserActionLogEntity[]>;
}