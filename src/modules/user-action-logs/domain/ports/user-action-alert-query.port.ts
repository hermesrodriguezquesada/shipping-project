import { UserActionAlertType } from '@prisma/client';
import { UserActionAlertEntity } from '../entities/user-action-alert.entity';

export type AdminUserActionAlertListFilters = {
  type?: UserActionAlertType;
  actorUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type UserActionAlertPagination = {
  offset?: number;
  limit?: number;
};

export interface UserActionAlertQueryPort {
  listAdmin(filters: AdminUserActionAlertListFilters, pagination: UserActionAlertPagination): Promise<UserActionAlertEntity[]>;
  existsRecentDuplicate(type: UserActionAlertType, actorUserId: string, dateFrom: Date): Promise<boolean>;
}