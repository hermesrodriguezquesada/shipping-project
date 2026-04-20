import { UserMapper } from 'src/modules/users/presentation/mappers/user.mapper';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageType } from '../graphql/types/support-message.type';

export class SupportMessageMapper {
  static toGraphQL(entity: SupportMessageEntity): SupportMessageType {
    return {
      id: entity.id,
      authorId: entity.authorId,
      email: entity.email,
      phone: entity.phone,
      title: entity.title,
      content: entity.content,
      answer: entity.answer,
      answeredById: entity.answeredById,
      answeredAt: entity.answeredAt,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      author: entity.author ? UserMapper.toGraphQL(entity.author) : null,
      answeredBy: entity.answeredBy ? UserMapper.toGraphQL(entity.answeredBy) : null,
    };
  }
}
