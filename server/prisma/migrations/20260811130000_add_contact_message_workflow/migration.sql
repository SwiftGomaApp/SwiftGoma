CREATE TYPE "ContactMessageStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

ALTER TABLE "contact_messages" ADD COLUMN "status" "ContactMessageStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "contact_messages" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contact_messages" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "contact_messages" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "assignedAt" TIMESTAMP(3);
ALTER TABLE "contact_messages" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "contact_messages" ADD COLUMN "internalNote" TEXT;

CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");
CREATE INDEX "contact_messages_isRead_idx" ON "contact_messages"("isRead");
CREATE INDEX "contact_messages_assignedToId_idx" ON "contact_messages"("assignedToId");

ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
