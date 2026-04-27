import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserActionLogAction } from '@prisma/client';
import { USER_ACTION_LOG_COMMAND_PORT } from 'src/shared/constants/tokens';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';
import { UserActionLogCommandPort } from '../../domain/ports/user-action-log-command.port';
import { DetectUserActionAlertUseCase } from './detect-user-action-alert.usecase';
import { sanitizeUserActionLogMetadata } from '../utils/sanitize-user-action-log-metadata';

type RecordUserActionLogInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: UserActionLogAction;
  resourceType?: string | null;
  resourceId?: string | null;
  correlationId?: string | null;
  description?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class RecordUserActionLogUseCase {
  private readonly logger = new Logger(RecordUserActionLogUseCase.name);

  constructor(
    @Inject(USER_ACTION_LOG_COMMAND_PORT)
    private readonly commandPort: UserActionLogCommandPort,
    private readonly detectUserActionAlertUseCase: DetectUserActionAlertUseCase,
  ) {}

  async execute(input: RecordUserActionLogInput): Promise<UserActionLogEntity> {
    const createdLog = await this.commandPort.create({
      actorUserId: this.normalize(input.actorUserId),
      actorEmail: this.normalize(input.actorEmail),
      actorRole: this.normalize(input.actorRole),
      action: input.action,
      resourceType: this.normalize(input.resourceType),
      resourceId: this.normalize(input.resourceId),
      correlationId: this.normalize(input.correlationId),
      description: this.normalize(input.description),
      metadataJson: sanitizeUserActionLogMetadata(input.metadata),
      ipAddress: this.normalize(input.ipAddress),
      userAgent: this.normalize(input.userAgent),
    });

    try {
      await this.detectUserActionAlertUseCase.execute(createdLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking user action alert failure. action=${createdLog.action} error=${message}`);
    }

    return createdLog;
  }

  private normalize(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}