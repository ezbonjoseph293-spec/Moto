-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "pendingBillingInterval" "BillingInterval",
ADD COLUMN     "pendingPlanId" TEXT;
