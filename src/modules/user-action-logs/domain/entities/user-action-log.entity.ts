import { UserActionLogAction } from '@prisma/client';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

export type UserActionLogEntity = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: UserActionLogAction;
  resourceType: string | null;
  resourceId: string | null;
  description: string | null;
  metadataJson: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: UserEntity | null;
};