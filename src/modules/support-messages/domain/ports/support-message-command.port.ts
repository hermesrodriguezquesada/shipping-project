import { SupportMessageEntity } from '../entities/support-message.entity';

export interface SupportMessageCommandPort {
  create(input: {
    authorId: string;
    title: string;
    content: string;
  }): Promise<SupportMessageEntity>;

  answer(input: {
    id: string;
    answer: string;
    answeredById: string;
    answeredAt: Date;
  }): Promise<SupportMessageEntity>;
}
