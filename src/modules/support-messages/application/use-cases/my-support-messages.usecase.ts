import { Inject, Injectable } from '@nestjs/common';
import { SUPPORT_MESSAGE_QUERY_PORT } from 'src/shared/constants/tokens';
import { SupportMessageEntity } from '../../domain/entities/support-message.entity';
import { SupportMessageQueryPort } from '../../domain/ports/support-message-query.port';

@Injectable()
export class MySupportMessagesUseCase {
  constructor(
    @Inject(SUPPORT_MESSAGE_QUERY_PORT)
    private readonly queryPort: SupportMessageQueryPort,
  ) {}

  async execute(input: {
    authorId: string;
    offset?: number;
    limit?: number;
  }): Promise<SupportMessageEntity[]> {
    return this.queryPort.listByAuthor(input.authorId, {
      offset: input.offset ?? 0,
      limit: input.limit ?? 50,
    });
  }
}
