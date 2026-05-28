CREATE TYPE "ContactMessageStatus" AS ENUM ('PENDING', 'READ', 'ARCHIVED');

ALTER TABLE "contact_messages"
ADD COLUMN "status" "ContactMessageStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX "contact_messages_status_createdAt_idx"
ON "contact_messages"("status", "createdAt");
