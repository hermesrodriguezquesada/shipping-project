-- AlterEnum: add ADMIN_CREATE_NEW_USER action for auditing admin user creation
ALTER TYPE "UserActionLogAction" ADD VALUE IF NOT EXISTS 'ADMIN_CREATE_NEW_USER';
