import { SupportMessageStatus } from '@prisma/client';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

export interface SupportMessageEntity {
  id: string;
  authorId: string | null;
  email: string | null;
  phone: string | null;
  title: string;
  content: string;
  answer: string | null;
  answeredById: string | null;
  answeredAt: Date | null;
  status: SupportMessageStatus;
  createdAt: Date;
  updatedAt: Date;
  author?: UserEntity | null;
  answeredBy?: UserEntity | null;
}
