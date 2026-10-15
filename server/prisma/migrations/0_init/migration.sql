-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FIELD_AGENT',
    "branch" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,
    "resetPasswordOtp" TEXT,
    "resetPasswordOtpExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "loanType" TEXT NOT NULL DEFAULT 'Home Loan',
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "businessName" TEXT,
    "branch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCase" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "branch" TEXT,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "adminId" TEXT,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "addressLatitude" DOUBLE PRECISION,
    "addressLongitude" DOUBLE PRECISION,
    "addressAccuracy" TEXT,
    "remarks" TEXT,
    "profileData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "dateRange" TEXT,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "slaDays" INTEGER NOT NULL,
    "emailOverdue" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewUpload" BOOLEAN NOT NULL DEFAULT false,
    "notifyCaseComplete" BOOLEAN NOT NULL DEFAULT false,
    "fuelRatePerKm" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "errorRows" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "section" TEXT,
    "verificationCaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRide" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelRatePerKm" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reimbursementStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAmount" DOUBLE PRECISION,
    "approvedAmount" DOUBLE PRECISION,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLocation" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomalyReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSegment" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "caseId" TEXT,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "startLat" DOUBLE PRECISION NOT NULL,
    "startLng" DOUBLE PRECISION NOT NULL,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_applicationId_key" ON "Customer"("applicationId");

-- CreateIndex
CREATE INDEX "Customer_adminId_createdAt_idx" ON "Customer"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "VerificationCase_adminId_status_idx" ON "VerificationCase"("adminId", "status");

-- CreateIndex
CREATE INDEX "VerificationCase_agentId_status_idx" ON "VerificationCase"("agentId", "status");

-- CreateIndex
CREATE INDEX "VerificationCase_status_idx" ON "VerificationCase"("status");

-- CreateIndex
CREATE INDEX "VerificationCase_createdAt_idx" ON "VerificationCase"("createdAt");

-- CreateIndex
CREATE INDEX "VerificationCase_customerId_idx" ON "VerificationCase"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_adminId_key" ON "SystemSetting"("adminId");

-- CreateIndex
CREATE INDEX "Media_verificationCaseId_idx" ON "Media"("verificationCaseId");

-- CreateIndex
CREATE INDEX "AgentRide_status_idx" ON "AgentRide"("status");

-- CreateIndex
CREATE INDEX "AgentRide_agentId_status_idx" ON "AgentRide"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentRide_adminId_status_idx" ON "AgentRide"("adminId", "status");

-- CreateIndex
CREATE INDEX "AgentRide_createdAt_idx" ON "AgentRide"("createdAt");

-- CreateIndex
CREATE INDEX "AgentLocation_rideId_timestamp_idx" ON "AgentLocation"("rideId", "timestamp");

-- CreateIndex
CREATE INDEX "TripSegment_rideId_idx" ON "TripSegment"("rideId");

-- CreateIndex
CREATE INDEX "TripSegment_agentId_idx" ON "TripSegment"("agentId");

-- CreateIndex
CREATE INDEX "TripSegment_caseId_idx" ON "TripSegment"("caseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_verificationCaseId_fkey" FOREIGN KEY ("verificationCaseId") REFERENCES "VerificationCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRide" ADD CONSTRAINT "AgentRide_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLocation" ADD CONSTRAINT "AgentLocation_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "AgentRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSegment" ADD CONSTRAINT "TripSegment_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "AgentRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
