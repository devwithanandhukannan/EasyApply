-- CreateEnum
CREATE TYPE "WalkInRoomStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "aiResumeBuilderEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "JobSeekerProfile" ADD COLUMN IF NOT EXISTS "discoverable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "walkInQueueMaxGlobal" INTEGER NOT NULL DEFAULT 200,
    "razorpayKeyId" TEXT,
    "razorpayKeySecret" TEXT,
    "razorpayWebhookSecret" TEXT,
    "razorpayMode" TEXT NOT NULL DEFAULT 'test',
    "smtpHost" TEXT DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "emailFrom" TEXT,
    "emailFromName" TEXT DEFAULT 'EasyApply',
    "groqApiKey" TEXT,
    "groqModel" TEXT DEFAULT 'llama-3.3-70b-versatile',
    "livekitApiUrl" TEXT,
    "livekitApiKey" TEXT,
    "livekitApiSecret" TEXT,
    "platformName" TEXT DEFAULT 'EasyApply',
    "platformLogoUrl" TEXT,
    "supportEmail" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowNewCompanyReg" BOOLEAN NOT NULL DEFAULT true,
    "allowNewSeekerReg" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB NOT NULL,
    "maxJobPostings" INTEGER NOT NULL DEFAULT 3,
    "maxTeamMembers" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanySubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "features" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WalkInRoom" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roomCode" TEXT NOT NULL,
    "livekitRoom" TEXT NOT NULL,
    "status" "WalkInRoomStatus" NOT NULL DEFAULT 'OPEN',
    "maxQueue" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WalkInQueueEntry" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "resumeId" TEXT,
    "skillScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waitingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "agingBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "livekitToken" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInQueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdmin_email_key" ON "PlatformAdmin"("email");
CREATE INDEX IF NOT EXISTS "PlatformAdmin_email_idx" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompanySubscription_companyId_key" ON "CompanySubscription"("companyId");
CREATE INDEX IF NOT EXISTS "CompanySubscription_companyId_idx" ON "CompanySubscription"("companyId");
CREATE INDEX IF NOT EXISTS "CompanySubscription_planId_idx" ON "CompanySubscription"("planId");
CREATE INDEX IF NOT EXISTS "CompanySubscription_isActive_idx" ON "CompanySubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WalkInRoom_roomCode_key" ON "WalkInRoom"("roomCode");
CREATE UNIQUE INDEX IF NOT EXISTS "WalkInRoom_livekitRoom_key" ON "WalkInRoom"("livekitRoom");
CREATE INDEX IF NOT EXISTS "WalkInRoom_companyId_idx" ON "WalkInRoom"("companyId");
CREATE INDEX IF NOT EXISTS "WalkInRoom_status_idx" ON "WalkInRoom"("status");
CREATE INDEX IF NOT EXISTS "WalkInRoom_roomCode_idx" ON "WalkInRoom"("roomCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WalkInQueueEntry_roomId_idx" ON "WalkInQueueEntry"("roomId");
CREATE INDEX IF NOT EXISTS "WalkInQueueEntry_status_idx" ON "WalkInQueueEntry"("status");
CREATE INDEX IF NOT EXISTS "WalkInQueueEntry_priorityScore_idx" ON "WalkInQueueEntry"("priorityScore");
CREATE UNIQUE INDEX IF NOT EXISTS "WalkInQueueEntry_roomId_jobSeekerProfileId_key" ON "WalkInQueueEntry"("roomId", "jobSeekerProfileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobSeekerProfile_discoverable_idx" ON "JobSeekerProfile"("discoverable");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanySubscription_companyId_fkey') THEN
    ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanySubscription_planId_fkey') THEN
    ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WalkInRoom_companyId_fkey') THEN
    ALTER TABLE "WalkInRoom" ADD CONSTRAINT "WalkInRoom_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WalkInQueueEntry_roomId_fkey') THEN
    ALTER TABLE "WalkInQueueEntry" ADD CONSTRAINT "WalkInQueueEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "WalkInRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WalkInQueueEntry_jobSeekerProfileId_fkey') THEN
    ALTER TABLE "WalkInQueueEntry" ADD CONSTRAINT "WalkInQueueEntry_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
