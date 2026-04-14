import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageType } from '../graphql/types/support-message.type';

export class SupportMessageMapper {
  static toGraphQL(entity: SupportMessageEntity): SupportMessageType {
    return {
      id: entity.id,
      authorId: entity.authorId,
      title: entity.title,
      content: entity.content,
      answer: entity.answer,
      answeredById: entity.answeredById,
      answeredAt: entity.answeredAt,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
