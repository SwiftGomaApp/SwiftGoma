-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "lastRenewalAttemptAt" TIMESTAMP(3),
ADD COLUMN     "renewalCountry" TEXT,
ADD COLUMN     "renewalPhoneNumber" TEXT,
ADD COLUMN     "renewalProvider" TEXT;
