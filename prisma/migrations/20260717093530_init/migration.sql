-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'OWNER', 'MANAGER', 'SALES', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "DealershipStatus" AS ENUM ('ACTIVE', 'TRIAL_EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'USED', 'IMPORTED', 'CERTIFIED_PRE_OWNED');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "DriveType" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_WD');

-- CreateEnum
CREATE TYPE "MileageUnit" AS ENUM ('KM', 'MILES');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "CollectionRuleType" AS ENUM ('MANUAL', 'RULE_BASED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('DEPOSIT', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('FLUTTERWAVE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('VEHICLE_INQUIRY', 'CONTACT_FORM', 'DEPOSIT', 'TRADE_IN', 'FINANCE_APPLICATION', 'TEST_DRIVE', 'NEWSLETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PageKey" AS ENUM ('ABOUT', 'PRIVACY', 'TERMS', 'COOKIE_POLICY', 'WARRANTY', 'RETURNS', 'FINANCING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MenuLocation" AS ENUM ('HEADER', 'FOOTER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TradeInStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'OFFER_MADE', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FinanceApplicationStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServiceBookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_LEAD', 'NEW_RESERVATION', 'RESERVATION_EXPIRED', 'PAYMENT_FAILED', 'SUBSCRIPTION_TRIAL_ENDING', 'SUBSCRIPTION_PAST_DUE', 'SUBSCRIPTION_SUSPENDED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'VEHICLE_VIEW', 'RESERVE_CLICK', 'WHATSAPP_CLICK', 'CALL_CLICK', 'LEAD_SUBMITTED');

-- CreateEnum
CREATE TYPE "RedirectStatusCode" AS ENUM ('MOVED_PERMANENTLY', 'FOUND');

-- CreateTable
CREATE TABLE "Dealership" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DealershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DECIMAL(12,2) NOT NULL,
    "priceYearly" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "flutterwaveCustomerId" TEXT,
    "flutterwaveSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL,
    "dealershipId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyType" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "branchId" TEXT,
    "brandId" TEXT NOT NULL,
    "bodyTypeId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "discountPrice" DECIMAL(12,2),
    "mileage" INTEGER,
    "mileageUnit" "MileageUnit" NOT NULL DEFAULT 'KM',
    "fuelType" "FuelType" NOT NULL,
    "transmission" "TransmissionType" NOT NULL,
    "driveType" "DriveType",
    "condition" "VehicleCondition" NOT NULL,
    "color" TEXT,
    "seats" INTEGER,
    "doors" INTEGER,
    "engineSizeCc" INTEGER,
    "vin" TEXT,
    "description" TEXT NOT NULL,
    "features" JSONB,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleImage" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleVideo" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ruleType" "CollectionRuleType" NOT NULL DEFAULT 'MANUAL',
    "ruleConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionVehicle" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "depositAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "holdExpiresAt" TIMESTAMP(3),
    "refundStatus" TEXT,
    "refundNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "reservationId" TEXT,
    "subscriptionId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'FLUTTERWAVE',
    "providerRef" TEXT NOT NULL,
    "flwTransactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "rawPayload" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT,
    "vehicleId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhoto" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "message" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "categoryId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "key" "PageKey" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "location" "MenuLocation" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "businessName" TEXT,
    "tagline" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#2563EB',
    "fontChoice" TEXT NOT NULL DEFAULT 'default',
    "borderRadius" TEXT NOT NULL DEFAULT 'md',
    "buttonStyle" TEXT NOT NULL DEFAULT 'solid',
    "phonePrimary" TEXT,
    "phoneSecondary" TEXT,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "businessHours" JSONB,
    "socialLinks" JSONB,
    "announcementBarText" TEXT,
    "announcementBarActive" BOOLEAN NOT NULL DEFAULT false,
    "homepageSections" JSONB,
    "depositType" TEXT NOT NULL DEFAULT 'FIXED',
    "depositFixedAmount" DECIMAL(12,2),
    "depositPercentage" DECIMAL(5,2),
    "depositHoldHours" INTEGER NOT NULL DEFAULT 48,
    "refundPolicyText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "folder" TEXT,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInRequest" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER NOT NULL,
    "mileage" INTEGER,
    "condition" TEXT,
    "photos" JSONB,
    "status" "TradeInStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceApplication" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "employmentStatus" TEXT,
    "monthlyIncome" DECIMAL(12,2),
    "downPayment" DECIMAL(12,2),
    "loanTermMonths" INTEGER,
    "status" "FinanceApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "branchId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "branchId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "vehicleDescription" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ServiceBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" "RedirectStatusCode" NOT NULL DEFAULT 'MOVED_PERMANENTLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "type" "AnalyticsEventType" NOT NULL,
    "path" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dealership_slug_key" ON "Dealership"("slug");

-- CreateIndex
CREATE INDEX "Dealership_status_idx" ON "Dealership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_dealershipId_key" ON "Subscription"("dealershipId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Branch_dealershipId_idx" ON "Branch"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_dealershipId_idx" ON "User"("dealershipId");

-- CreateIndex
CREATE INDEX "User_dealershipId_role_idx" ON "User"("dealershipId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Brand_dealershipId_idx" ON "Brand"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_dealershipId_slug_key" ON "Brand"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "BodyType_dealershipId_idx" ON "BodyType"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyType_dealershipId_slug_key" ON "BodyType"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "Vehicle_dealershipId_status_idx" ON "Vehicle"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_dealershipId_isFeatured_idx" ON "Vehicle"("dealershipId", "isFeatured");

-- CreateIndex
CREATE INDEX "Vehicle_dealershipId_brandId_idx" ON "Vehicle"("dealershipId", "brandId");

-- CreateIndex
CREATE INDEX "Vehicle_dealershipId_bodyTypeId_idx" ON "Vehicle"("dealershipId", "bodyTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_dealershipId_slug_key" ON "Vehicle"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "VehicleImage_dealershipId_idx" ON "VehicleImage"("dealershipId");

-- CreateIndex
CREATE INDEX "VehicleImage_vehicleId_idx" ON "VehicleImage"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleVideo_dealershipId_idx" ON "VehicleVideo"("dealershipId");

-- CreateIndex
CREATE INDEX "VehicleVideo_vehicleId_idx" ON "VehicleVideo"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleDocument_dealershipId_idx" ON "VehicleDocument"("dealershipId");

-- CreateIndex
CREATE INDEX "VehicleDocument_vehicleId_idx" ON "VehicleDocument"("vehicleId");

-- CreateIndex
CREATE INDEX "Collection_dealershipId_idx" ON "Collection"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_dealershipId_slug_key" ON "Collection"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "CollectionVehicle_dealershipId_idx" ON "CollectionVehicle"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionVehicle_collectionId_vehicleId_key" ON "CollectionVehicle"("collectionId", "vehicleId");

-- CreateIndex
CREATE INDEX "Reservation_dealershipId_status_idx" ON "Reservation"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "Reservation_vehicleId_idx" ON "Reservation"("vehicleId");

-- CreateIndex
CREATE INDEX "Reservation_holdExpiresAt_idx" ON "Reservation"("holdExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_providerRef_key" ON "PaymentTransaction"("providerRef");

-- CreateIndex
CREATE INDEX "PaymentTransaction_dealershipId_status_idx" ON "PaymentTransaction"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_reservationId_idx" ON "PaymentTransaction"("reservationId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_subscriptionId_idx" ON "PaymentTransaction"("subscriptionId");

-- CreateIndex
CREATE INDEX "Lead_dealershipId_status_idx" ON "Lead"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "Lead_dealershipId_createdAt_idx" ON "Lead"("dealershipId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "Testimonial_dealershipId_idx" ON "Testimonial"("dealershipId");

-- CreateIndex
CREATE INDEX "BlogCategory_dealershipId_idx" ON "BlogCategory"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_dealershipId_slug_key" ON "BlogCategory"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "BlogPost_dealershipId_status_idx" ON "BlogPost"("dealershipId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_dealershipId_slug_key" ON "BlogPost"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "Page_dealershipId_idx" ON "Page"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_dealershipId_key_key" ON "Page"("dealershipId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Page_dealershipId_slug_key" ON "Page"("dealershipId", "slug");

-- CreateIndex
CREATE INDEX "Menu_dealershipId_location_idx" ON "Menu"("dealershipId", "location");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_dealershipId_key" ON "Setting"("dealershipId");

-- CreateIndex
CREATE INDEX "MediaAsset_dealershipId_type_idx" ON "MediaAsset"("dealershipId", "type");

-- CreateIndex
CREATE INDEX "Favorite_dealershipId_idx" ON "Favorite"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_vehicleId_key" ON "Favorite"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "TradeInRequest_dealershipId_status_idx" ON "TradeInRequest"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "FinanceApplication_dealershipId_status_idx" ON "FinanceApplication"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "Appointment_dealershipId_status_idx" ON "Appointment"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "Appointment_dealershipId_scheduledAt_idx" ON "Appointment"("dealershipId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ServiceBooking_dealershipId_status_idx" ON "ServiceBooking"("dealershipId", "status");

-- CreateIndex
CREATE INDEX "ServiceBooking_dealershipId_scheduledAt_idx" ON "ServiceBooking"("dealershipId", "scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_dealershipId_idx" ON "NewsletterSubscriber"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_dealershipId_email_key" ON "NewsletterSubscriber"("dealershipId", "email");

-- CreateIndex
CREATE INDEX "Notification_dealershipId_isRead_idx" ON "Notification"("dealershipId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_dealershipId_createdAt_idx" ON "AuditLog"("dealershipId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Redirect_dealershipId_idx" ON "Redirect"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_dealershipId_fromPath_key" ON "Redirect"("dealershipId", "fromPath");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_dealershipId_type_createdAt_idx" ON "AnalyticsEvent"("dealershipId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyType" ADD CONSTRAINT "BodyType_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_bodyTypeId_fkey" FOREIGN KEY ("bodyTypeId") REFERENCES "BodyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleVideo" ADD CONSTRAINT "VehicleVideo_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleVideo" ADD CONSTRAINT "VehicleVideo_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionVehicle" ADD CONSTRAINT "CollectionVehicle_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionVehicle" ADD CONSTRAINT "CollectionVehicle_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionVehicle" ADD CONSTRAINT "CollectionVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCategory" ADD CONSTRAINT "BlogCategory_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInRequest" ADD CONSTRAINT "TradeInRequest_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInRequest" ADD CONSTRAINT "TradeInRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApplication" ADD CONSTRAINT "FinanceApplication_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApplication" ADD CONSTRAINT "FinanceApplication_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApplication" ADD CONSTRAINT "FinanceApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redirect" ADD CONSTRAINT "Redirect_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
