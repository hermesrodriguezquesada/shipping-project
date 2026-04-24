import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { UserActionLogEntity } from '../../../domain/entities/user-action-log.entity';
import { UserActionLogType } from '../types/user-action-log.type';

export class UserActionLogMapper {
  static toGraphQL(log: UserActionLogEntity): UserActionLogType {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      description: log.description,
      metadataJson: log.metadataJson,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: log.actor ? UserMapper.toGraphQL(log.actor) : null,
    };
  }
}