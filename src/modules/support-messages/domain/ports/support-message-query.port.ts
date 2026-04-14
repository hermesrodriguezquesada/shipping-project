import { OffsetPagination } from 'src/shared/utils/pagination';
import { SupportMessageEntity } from '../entities/support-message.entity';

export interface SupportMessageQueryPort {
  findById(id: string): Promise<SupportMessageEntity | null>;
  listByAuthor(authorId: string, pagination: OffsetPagination): Promise<SupportMessageEntity[]>;
  listAll(pagination: OffsetPagination): Promise<SupportMessageEntity[]>;
}
