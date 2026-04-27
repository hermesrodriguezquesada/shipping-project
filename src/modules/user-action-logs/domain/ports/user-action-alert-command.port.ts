import { UserActionAlertType } from '@prisma/client';
import { UserActionAlertEntity } from '../entities/user-action-alert.entity';

export type CreateUserActionAlertInput = {
  type: UserActionAlertType;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  description: string;
  metadataJson?: string | null;
};

export interface UserActionAlertCommandPort {
  create(input: CreateUserActionAlertInput): Promise<UserActionAlertEntity>;
}