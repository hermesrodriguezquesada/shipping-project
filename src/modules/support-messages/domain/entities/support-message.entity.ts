import { SupportMessageStatus } from '@prisma/client';

export interface SupportMessageEntity {
  id: string;
  authorId: string;
  title: string;
  content: string;
  answer: string | null;
  answeredById: string | null;
  answeredAt: Date | null;
  status: SupportMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}
