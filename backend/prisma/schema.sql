-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGED', 'STARRED', 'UNSTARRED', 'PRIORITY_SET', 'PRIORITY_CLEARED', 'NOTE_ADDED', 'TAG_ADDED', 'TAG_REMOVED', 'VIEWED', 'EMAILED', 'INTERVIEW_SCHEDULED', 'FEEDBACK_SUBMITTED', 'OFFER_SENT', 'OFFER_RESPONDED', 'SPOT_JOB_POSTED', 'SPOT_JOB_MATCHED', 'SPOT_JOB_CONFIRMED', 'SPOT_JOB_COMPLETED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'declined');

-- CreateEnum
CREATE TYPE "OfferLetterStatus" AS ENUM ('draft', 'pending', 'sent', 'viewed', 'accepted', 'declined', 'negotiating', 'expired', 'withdrawn');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'screened', 'technical_round', 'hr_round', 'offer_sent', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "CandidatePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('LINKEDIN', 'GITHUB', 'REFERRAL', 'CAREERS_PAGE', 'JOB_PORTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "CandidateCrmStatus" AS ENUM ('ACTIVE', 'NURTURING', 'FUTURE_OPPORTUNITY', 'DO_NOT_CONTACT', 'HIRED_ELSEWHERE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'reschedule_requested', 'confirmed');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('video', 'coding_test', 'mixed');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('active', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('shortlist', 'reject', 'on_hold', 'next_round');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'not_available', 'spot_available');

-- CreateEnum
CREATE TYPE "SpotJobStatus" AS ENUM ('POSTED', 'SEARCHING', 'MATCHED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpotBookingStatus" AS ENUM ('PENDING_RESPONSE', 'ACCEPTED', 'DECLINED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "WalkInRoomStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "globalRoles" INTEGER NOT NULL DEFAULT 1,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSeekerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "portfolio" TEXT,
    "bio" TEXT,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'available',
    "jobPreferences" JSONB,
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "aiResumeBuilderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSeekerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "filePath" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "atsScore" INTEGER,
    "content" JSONB,
    "aiSuggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "location" TEXT,
    "startMonth" TEXT,
    "startYear" TEXT,
    "endMonth" TEXT,
    "endYear" TEXT,
    "cgpa" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "startMonth" TEXT,
    "startYear" TEXT,
    "endMonth" TEXT,
    "endYear" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "skillsUsed" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" TEXT[],
    "githubLink" TEXT,
    "liveLink" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "issueDate" TEXT,
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "logoUrl" TEXT,
    "registrationNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationBadge" TEXT NOT NULL DEFAULT 'none',
    "tagline" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "products" JSONB,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coreValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "youtubeLink" TEXT,
    "officeLocations" JSONB,
    "socialMedia" JSONB,
    "corporateLink" TEXT,
    "pendingMobile" TEXT,
    "aiResumeBuilderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" INTEGER NOT NULL DEFAULT 8,
    "permissions" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewBatchInterviewer" (
    "id" TEXT NOT NULL,
    "interviewBatchId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "InterviewBatchInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewInterviewer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "InterviewInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "locationType" TEXT,
    "location" TEXT,
    "experienceRequired" TEXT,
    "requiredSkills" JSONB NOT NULL,
    "salaryRange" TEXT,
    "deadline" TIMESTAMP(3),
    "openings" INTEGER NOT NULL DEFAULT 1,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'active',
    "disallowAiCv" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "pipelineIndex" INTEGER NOT NULL DEFAULT 0,
    "candidateNotes" TEXT,
    "isWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchScore" INTEGER,
    "matchAnalysis" JSONB,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByType" TEXT NOT NULL DEFAULT 'user',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyCandidateProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "ownerId" TEXT,
    "source" "CandidateSource",
    "sourceUrl" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "crmPriority" "CandidatePriority",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "crmNotes" TEXT,
    "status" "CandidateCrmStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPoolMember" (
    "id" TEXT NOT NULL,
    "talentPoolId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentPoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmInteractionLog" (
    "id" TEXT NOT NULL,
    "companyCandidateProfileId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "interviewFormat" "InterviewFormat" NOT NULL,
    "selectedCandidateIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "batchId" TEXT,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "format" "InterviewFormat" NOT NULL DEFAULT 'video',
    "livekitRoomName" TEXT NOT NULL,
    "joinLink" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "recordingPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedByRole" INTEGER,
    "proposedTime" TIMESTAMP(3) NOT NULL,
    "candidateNote" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "technicalRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "problemSolvingRating" INTEGER NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLetter" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "salary" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "employmentType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "filePath" TEXT,
    "status" "OfferLetterStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "candidateResponse" TEXT,
    "negotiationNote" TEXT,
    "companySignature" JSONB,
    "candidateSignature" JSONB,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSentAt" TIMESTAMP(3),
    "emailOpenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "rate" DECIMAL(10,2) NOT NULL,
    "rateType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "status" "SpotJobStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotJobBooking" (
    "id" TEXT NOT NULL,
    "spotJobId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "status" "SpotBookingStatus" NOT NULL DEFAULT 'PENDING_RESPONSE',
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotJobBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
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
    "allowSeekerAiResumeCreation" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB NOT NULL,
    "maxJobPostings" INTEGER NOT NULL DEFAULT 3,
    "maxTeamMembers" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySubscription" (
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
CREATE TABLE "CompanyFeatureRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedFeatures" JSONB NOT NULL,
    "message" TEXT,
    "budgetRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyFeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkInRoom" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minExperience" TEXT,
    "priorityThreshold" INTEGER NOT NULL DEFAULT 70,
    "evaluationCriteria" TEXT,
    "roomCode" TEXT NOT NULL,
    "livekitRoom" TEXT NOT NULL,
    "status" "WalkInRoomStatus" NOT NULL DEFAULT 'OPEN',
    "maxQueue" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkInQueueEntry" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "resumeId" TEXT,
    "cvFileUrl" TEXT,
    "cvAnalysis" JSONB,
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
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");

-- CreateIndex
CREATE INDEX "User_mobileNumber_idx" ON "User"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToken_token_key" ON "NotificationToken"("token");

-- CreateIndex
CREATE INDEX "NotificationToken_userId_idx" ON "NotificationToken"("userId");

-- CreateIndex
CREATE INDEX "Otp_mobileNumber_idx" ON "Otp"("mobileNumber");

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_userId_key" ON "JobSeekerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_email_key" ON "JobSeekerProfile"("email");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_email_idx" ON "JobSeekerProfile"("email");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_userId_idx" ON "JobSeekerProfile"("userId");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_discoverable_idx" ON "JobSeekerProfile"("discoverable");

-- CreateIndex
CREATE INDEX "Resume_jobSeekerProfileId_idx" ON "Resume"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Skill_jobSeekerProfileId_idx" ON "Skill"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_jobSeekerProfileId_name_key" ON "Skill"("jobSeekerProfileId", "name");

-- CreateIndex
CREATE INDEX "Education_jobSeekerProfileId_idx" ON "Education"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Experience_jobSeekerProfileId_idx" ON "Experience"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Project_jobSeekerProfileId_idx" ON "Project"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Certification_jobSeekerProfileId_idx" ON "Certification"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Language_jobSeekerProfileId_idx" ON "Language"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Achievement_jobSeekerProfileId_idx" ON "Achievement"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_email_idx" ON "Company"("email");

-- CreateIndex
CREATE INDEX "TeamMember_companyId_idx" ON "TeamMember"("companyId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_companyId_userId_key" ON "TeamMember"("companyId", "userId");

-- CreateIndex
CREATE INDEX "InterviewBatchInterviewer_teamMemberId_idx" ON "InterviewBatchInterviewer"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewBatchInterviewer_interviewBatchId_teamMemberId_key" ON "InterviewBatchInterviewer"("interviewBatchId", "teamMemberId");

-- CreateIndex
CREATE INDEX "InterviewInterviewer_teamMemberId_idx" ON "InterviewInterviewer"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewInterviewer_interviewId_teamMemberId_key" ON "InterviewInterviewer"("interviewId", "teamMemberId");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_createdAt_idx" ON "JobPosting"("createdAt");

-- CreateIndex
CREATE INDEX "SavedJob_jobSeekerProfileId_idx" ON "SavedJob"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "SavedJob_jobPostingId_idx" ON "SavedJob"("jobPostingId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_jobSeekerProfileId_jobPostingId_key" ON "SavedJob"("jobSeekerProfileId", "jobPostingId");

-- CreateIndex
CREATE INDEX "Application_jobSeekerProfileId_idx" ON "Application"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_idx" ON "Application"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_lastActivityAt_idx" ON "Application"("lastActivityAt");

-- CreateIndex
CREATE INDEX "ApplicationHistory_applicationId_idx" ON "ApplicationHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationHistory_createdAt_idx" ON "ApplicationHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationHistory_toStatus_idx" ON "ApplicationHistory"("toStatus");

-- CreateIndex
CREATE INDEX "ApplicationActivity_applicationId_idx" ON "ApplicationActivity"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationActivity_activityType_idx" ON "ApplicationActivity"("activityType");

-- CreateIndex
CREATE INDEX "ApplicationActivity_createdAt_idx" ON "ApplicationActivity"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_companyId_idx" ON "CompanyCandidateProfile"("companyId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_jobSeekerProfileId_idx" ON "CompanyCandidateProfile"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_ownerId_idx" ON "CompanyCandidateProfile"("ownerId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_status_idx" ON "CompanyCandidateProfile"("status");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_isStarred_idx" ON "CompanyCandidateProfile"("isStarred");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_crmPriority_idx" ON "CompanyCandidateProfile"("crmPriority");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCandidateProfile_companyId_jobSeekerProfileId_key" ON "CompanyCandidateProfile"("companyId", "jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "TalentPool_companyId_idx" ON "TalentPool"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPool_companyId_name_key" ON "TalentPool"("companyId", "name");

-- CreateIndex
CREATE INDEX "TalentPoolMember_talentPoolId_idx" ON "TalentPoolMember"("talentPoolId");

-- CreateIndex
CREATE INDEX "TalentPoolMember_jobSeekerProfileId_idx" ON "TalentPoolMember"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPoolMember_talentPoolId_jobSeekerProfileId_key" ON "TalentPoolMember"("talentPoolId", "jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "CrmInteractionLog_companyCandidateProfileId_idx" ON "CrmInteractionLog"("companyCandidateProfileId");

-- CreateIndex
CREATE INDEX "CrmInteractionLog_createdAt_idx" ON "CrmInteractionLog"("createdAt");

-- CreateIndex
CREATE INDEX "InterviewBatch_companyId_idx" ON "InterviewBatch"("companyId");

-- CreateIndex
CREATE INDEX "InterviewBatch_startTime_idx" ON "InterviewBatch"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_livekitRoomName_key" ON "Interview"("livekitRoomName");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_scheduledTime_idx" ON "Interview"("scheduledTime");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "RescheduleRequest_interviewId_idx" ON "RescheduleRequest"("interviewId");

-- CreateIndex
CREATE INDEX "RescheduleRequest_requestedByUserId_idx" ON "RescheduleRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewId_idx" ON "InterviewFeedback"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewerId_idx" ON "InterviewFeedback"("interviewerId");

-- CreateIndex
CREATE INDEX "OfferLetter_applicationId_idx" ON "OfferLetter"("applicationId");

-- CreateIndex
CREATE INDEX "OfferLetter_status_idx" ON "OfferLetter"("status");

-- CreateIndex
CREATE INDEX "OfferLetter_sentAt_idx" ON "OfferLetter"("sentAt");

-- CreateIndex
CREATE INDEX "OfferTemplate_companyId_idx" ON "OfferTemplate"("companyId");

-- CreateIndex
CREATE INDEX "OfferTemplate_isDefault_idx" ON "OfferTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "SpotJob_companyId_idx" ON "SpotJob"("companyId");

-- CreateIndex
CREATE INDEX "SpotJob_status_idx" ON "SpotJob"("status");

-- CreateIndex
CREATE INDEX "SpotJob_startTime_idx" ON "SpotJob"("startTime");

-- CreateIndex
CREATE INDEX "SpotJobBooking_spotJobId_idx" ON "SpotJobBooking"("spotJobId");

-- CreateIndex
CREATE INDEX "SpotJobBooking_jobSeekerProfileId_idx" ON "SpotJobBooking"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotJobBooking_spotJobId_jobSeekerProfileId_key" ON "SpotJobBooking"("spotJobId", "jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE INDEX "PlatformAdmin_email_idx" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_name_idx" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isPublic_idx" ON "SubscriptionPlan"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySubscription_companyId_key" ON "CompanySubscription"("companyId");

-- CreateIndex
CREATE INDEX "CompanySubscription_companyId_idx" ON "CompanySubscription"("companyId");

-- CreateIndex
CREATE INDEX "CompanySubscription_planId_idx" ON "CompanySubscription"("planId");

-- CreateIndex
CREATE INDEX "CompanySubscription_isActive_idx" ON "CompanySubscription"("isActive");

-- CreateIndex
CREATE INDEX "CompanyFeatureRequest_companyId_idx" ON "CompanyFeatureRequest"("companyId");

-- CreateIndex
CREATE INDEX "CompanyFeatureRequest_status_idx" ON "CompanyFeatureRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WalkInRoom_roomCode_key" ON "WalkInRoom"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "WalkInRoom_livekitRoom_key" ON "WalkInRoom"("livekitRoom");

-- CreateIndex
CREATE INDEX "WalkInRoom_companyId_idx" ON "WalkInRoom"("companyId");

-- CreateIndex
CREATE INDEX "WalkInRoom_status_idx" ON "WalkInRoom"("status");

-- CreateIndex
CREATE INDEX "WalkInRoom_roomCode_idx" ON "WalkInRoom"("roomCode");

-- CreateIndex
CREATE INDEX "WalkInQueueEntry_roomId_idx" ON "WalkInQueueEntry"("roomId");

-- CreateIndex
CREATE INDEX "WalkInQueueEntry_status_idx" ON "WalkInQueueEntry"("status");

-- CreateIndex
CREATE INDEX "WalkInQueueEntry_priorityScore_idx" ON "WalkInQueueEntry"("priorityScore");

-- CreateIndex
CREATE UNIQUE INDEX "WalkInQueueEntry_roomId_jobSeekerProfileId_key" ON "WalkInQueueEntry"("roomId", "jobSeekerProfileId");

-- AddForeignKey
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSeekerProfile" ADD CONSTRAINT "JobSeekerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatchInterviewer" ADD CONSTRAINT "InterviewBatchInterviewer_interviewBatchId_fkey" FOREIGN KEY ("interviewBatchId") REFERENCES "InterviewBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatchInterviewer" ADD CONSTRAINT "InterviewBatchInterviewer_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPool" ADD CONSTRAINT "TalentPool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_talentPoolId_fkey" FOREIGN KEY ("talentPoolId") REFERENCES "TalentPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmInteractionLog" ADD CONSTRAINT "CrmInteractionLog_companyCandidateProfileId_fkey" FOREIGN KEY ("companyCandidateProfileId") REFERENCES "CompanyCandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatch" ADD CONSTRAINT "InterviewBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatch" ADD CONSTRAINT "InterviewBatch_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InterviewBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OfferTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTemplate" ADD CONSTRAINT "OfferTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotJob" ADD CONSTRAINT "SpotJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotJobBooking" ADD CONSTRAINT "SpotJobBooking_spotJobId_fkey" FOREIGN KEY ("spotJobId") REFERENCES "SpotJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotJobBooking" ADD CONSTRAINT "SpotJobBooking_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureRequest" ADD CONSTRAINT "CompanyFeatureRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInRoom" ADD CONSTRAINT "WalkInRoom_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInQueueEntry" ADD CONSTRAINT "WalkInQueueEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "WalkInRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInQueueEntry" ADD CONSTRAINT "WalkInQueueEntry_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInQueueEntry" ADD CONSTRAINT "WalkInQueueEntry_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

