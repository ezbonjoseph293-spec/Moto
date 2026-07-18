-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "ctaBodyText" TEXT,
ADD COLUMN     "ctaTitle" TEXT,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "whyChooseUsItems" JSONB;
