/*
  Warnings:

  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive",
ADD COLUMN     "accountRecoveryCode" TEXT,
ADD COLUMN     "accountRecoveryCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionReason" TEXT;

-- CreateTable
CREATE TABLE "account_action_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_action_logs_targetUserId_idx" ON "account_action_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "account_action_logs_actorId_idx" ON "account_action_logs"("actorId");

-- AddForeignKey
ALTER TABLE "account_action_logs" ADD CONSTRAINT "account_action_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_action_logs" ADD CONSTRAINT "account_action_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
