import { UserActionAlertType } from '@prisma/client';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

export type UserActionAlertEntity = {
  id: string;
  type: UserActionAlertType;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  description: string;
  metadataJson: string | null;
  createdAt: Date;
  actor: UserEntity | null;
};