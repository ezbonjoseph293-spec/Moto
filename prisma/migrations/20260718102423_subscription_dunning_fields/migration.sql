-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "dunningStage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDunningSentAt" TIMESTAMP(3),
ADD COLUMN     "pastDueSince" TIMESTAMP(3);
