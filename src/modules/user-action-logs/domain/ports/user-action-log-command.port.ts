import { UserActionLogAction } from '@prisma/client';
import { UserActionLogEntity } from '../entities/user-action-log.entity';

export type CreateUserActionLogInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: UserActionLogAction;
  resourceType?: string | null;
  resourceId?: string | null;
  description?: string | null;
  metadataJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export interface UserActionLogCommandPort {
  create(input: CreateUserActionLogInput): Promise<UserActionLogEntity>;
}