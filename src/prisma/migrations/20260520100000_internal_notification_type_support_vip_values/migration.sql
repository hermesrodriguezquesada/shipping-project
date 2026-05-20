-- AlterEnum: add new notification type values for support and VIP
ALTER TYPE "InternalNotificationType" ADD VALUE IF NOT EXISTS 'CREATE_SUPPORT_MESSAGE';
ALTER TYPE "InternalNotificationType" ADD VALUE IF NOT EXISTS 'ANSWER_SUPPORT_MESSAGE';
ALTER TYPE "InternalNotificationType" ADD VALUE IF NOT EXISTS 'SET_USER_VIP';
ALTER TYPE "InternalNotificationType" ADD VALUE IF NOT EXISTS 'UNSET_USER_VIP';
