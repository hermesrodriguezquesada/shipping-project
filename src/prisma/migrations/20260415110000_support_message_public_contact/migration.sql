ALTER TABLE "SupportMessage"
DROP CONSTRAINT "SupportMessage_authorId_fkey";

ALTER TABLE "SupportMessage"
ALTER COLUMN "authorId" DROP NOT NULL,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
