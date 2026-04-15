import { SupportMessageStatus } from '@prisma/client';

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
}
