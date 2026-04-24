import { Logger } from '@nestjs/common';
import { RecordUserActionLogUseCase } from '../use-cases/record-user-action-log.usecase';

type RecordUserActionLogInput = Parameters<RecordUserActionLogUseCase['execute']>[0];

export async function recordUserActionLogSafe(
  logger: Logger,
  recordUserActionLog: RecordUserActionLogUseCase,
  input: RecordUserActionLogInput,
): Promise<void> {
  try {
    await recordUserActionLog.execute(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Non-blocking user action log failure. action=${input.action} error=${message}`);
  }
}