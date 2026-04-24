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

export type AdminUserActionLogReportFilters = {
  dateFrom: Date;
  dateTo: Date;
  actorUserId?: string;
  action?: UserActionLogAction;
  resourceType?: string;
  resourceId?: string;
};

export type UserActionLogPagination = {
  offset?: number;
  limit?: number;
};

export type UserActionLogSummary = {
  totalActions: number;
  uniqueActors: number;
  dateFrom: Date;
  dateTo: Date;
};

export type UserActionLogActivityBucket = {
  date: string;
  actionCount: number;
  uniqueActors: number;
};

export type UserActionLogTopActor = {
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  actionCount: number;
  lastActionAt: Date;
};

export type UserActionLogTopAction = {
  action: UserActionLogAction;
  actionCount: number;
};

export interface UserActionLogQueryPort {
  listMine(actorUserId: string, filters: UserActionLogListFilters, pagination: UserActionLogPagination): Promise<UserActionLogEntity[]>;
  listAdmin(filters: AdminUserActionLogListFilters, pagination: UserActionLogPagination): Promise<UserActionLogEntity[]>;
  getAdminSummary(filters: AdminUserActionLogReportFilters): Promise<UserActionLogSummary>;
  getAdminActivityByDay(filters: AdminUserActionLogReportFilters): Promise<UserActionLogActivityBucket[]>;
  getAdminTopActors(filters: AdminUserActionLogReportFilters, limit: number): Promise<UserActionLogTopActor[]>;
  getAdminTopActions(filters: AdminUserActionLogReportFilters): Promise<UserActionLogTopAction[]>;
  listAdminForExport(filters: AdminUserActionLogReportFilters, pagination: UserActionLogPagination): Promise<UserActionLogEntity[]>;
}