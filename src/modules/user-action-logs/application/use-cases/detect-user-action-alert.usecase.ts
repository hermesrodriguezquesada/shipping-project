import { Inject, Injectable } from '@nestjs/common';
import { UserActionAlertType, UserActionLogAction } from '@prisma/client';
import {
  USER_ACTION_ALERT_COMMAND_PORT,
  USER_ACTION_ALERT_QUERY_PORT,
  USER_ACTION_LOG_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { UserActionLogEntity } from '../../domain/entities/user-action-log.entity';
import { UserActionAlertCommandPort } from '../../domain/ports/user-action-alert-command.port';
import { UserActionAlertQueryPort } from '../../domain/ports/user-action-alert-query.port';
import { UserActionLogQueryPort } from '../../domain/ports/user-action-log-query.port';
import { sanitizeUserActionLogMetadata } from '../utils/sanitize-user-action-log-metadata';

const LOGIN_WINDOW_MINUTES = 5;
const LOGIN_THRESHOLD = 5;
const CANCELLATION_WINDOW_MINUTES = 30;
const CANCELLATION_THRESHOLD = 3;
const SENSITIVE_ADMIN_ACTION_DUPLICATE_WINDOW_MINUTES = 5;
const SENSITIVE_ADMIN_ACTIONS = new Set<UserActionLogAction>([
  UserActionLogAction.ADMIN_SET_USER_VIP,
  UserActionLogAction.ADMIN_UNSET_USER_VIP,
  UserActionLogAction.ADMIN_UPDATE_USER,
  UserActionLogAction.ADMIN_BLOCK_USER,
  UserActionLogAction.ADMIN_UNBLOCK_USER,
  UserActionLogAction.ADMIN_UPDATE_SYSTEM_SETTING,
  UserActionLogAction.ADMIN_CONFIRM_REMITTANCE_PAYMENT,
  UserActionLogAction.ADMIN_CANCEL_VIP_PAYMENT_PROOF,
]);

@Injectable()
export class DetectUserActionAlertUseCase {
  constructor(
    @Inject(USER_ACTION_LOG_QUERY_PORT)
    private readonly userActionLogQueryPort: UserActionLogQueryPort,
    @Inject(USER_ACTION_ALERT_QUERY_PORT)
    private readonly userActionAlertQueryPort: UserActionAlertQueryPort,
    @Inject(USER_ACTION_ALERT_COMMAND_PORT)
    private readonly userActionAlertCommandPort: UserActionAlertCommandPort,
  ) {}

  async execute(log: UserActionLogEntity): Promise<void> {
    if (!log.actorUserId) {
      return;
    }

    switch (log.action) {
      case UserActionLogAction.LOGIN:
        await this.detectManyRecentLogins(log);
        return;
      case UserActionLogAction.CANCEL_REMITTANCE:
        await this.detectManyRemittanceCancellations(log);
        return;
      default:
        if (SENSITIVE_ADMIN_ACTIONS.has(log.action)) {
          await this.detectSensitiveAdminAction(log);
        }
    }
  }

  private async detectManyRecentLogins(log: UserActionLogEntity): Promise<void> {
    const dateFrom = this.minutesAgo(LOGIN_WINDOW_MINUTES);
    const loginCount = await this.userActionLogQueryPort.countRecentByActorAndActions(log.actorUserId!, [UserActionLogAction.LOGIN], dateFrom);

    if (loginCount <= LOGIN_THRESHOLD) {
      return;
    }

    const hasDuplicate = await this.userActionAlertQueryPort.existsRecentDuplicate(
      UserActionAlertType.MANY_RECENT_LOGINS,
      log.actorUserId!,
      dateFrom,
    );

    if (hasDuplicate) {
      return;
    }

    await this.userActionAlertCommandPort.create({
      type: UserActionAlertType.MANY_RECENT_LOGINS,
      actorUserId: log.actorUserId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      description: `Actor exceeded ${LOGIN_THRESHOLD} LOGIN actions in ${LOGIN_WINDOW_MINUTES} minutes.`,
      metadataJson: sanitizeUserActionLogMetadata({
        windowMinutes: LOGIN_WINDOW_MINUTES,
        loginCount,
      }),
    });
  }

  private async detectManyRemittanceCancellations(log: UserActionLogEntity): Promise<void> {
    const dateFrom = this.minutesAgo(CANCELLATION_WINDOW_MINUTES);
    const cancellationCount = await this.userActionLogQueryPort.countRecentByActorAndActions(
      log.actorUserId!,
      [UserActionLogAction.CANCEL_REMITTANCE],
      dateFrom,
    );

    if (cancellationCount <= CANCELLATION_THRESHOLD) {
      return;
    }

    const hasDuplicate = await this.userActionAlertQueryPort.existsRecentDuplicate(
      UserActionAlertType.MANY_REMITTANCE_CANCELLATIONS,
      log.actorUserId!,
      dateFrom,
    );

    if (hasDuplicate) {
      return;
    }

    await this.userActionAlertCommandPort.create({
      type: UserActionAlertType.MANY_REMITTANCE_CANCELLATIONS,
      actorUserId: log.actorUserId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      description: `Actor exceeded ${CANCELLATION_THRESHOLD} remittance cancellations in ${CANCELLATION_WINDOW_MINUTES} minutes.`,
      metadataJson: sanitizeUserActionLogMetadata({
        windowMinutes: CANCELLATION_WINDOW_MINUTES,
        cancellationCount,
      }),
    });
  }

  private async detectSensitiveAdminAction(log: UserActionLogEntity): Promise<void> {
    const dateFrom = this.minutesAgo(SENSITIVE_ADMIN_ACTION_DUPLICATE_WINDOW_MINUTES);
    const hasDuplicate = await this.userActionAlertQueryPort.existsRecentDuplicate(
      UserActionAlertType.SENSITIVE_ADMIN_ACTION,
      log.actorUserId!,
      dateFrom,
    );

    if (hasDuplicate) {
      return;
    }

    await this.userActionAlertCommandPort.create({
      type: UserActionAlertType.SENSITIVE_ADMIN_ACTION,
      actorUserId: log.actorUserId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      description: `Sensitive admin action detected: ${log.action}.`,
      metadataJson: sanitizeUserActionLogMetadata({
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
      }),
    });
  }

  private minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000);
  }
}