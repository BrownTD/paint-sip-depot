-- CreateEnum
CREATE TYPE "HostTypeRequested" AS ENUM ('INDIVIDUAL', 'ORG');

-- CreateEnum
CREATE TYPE "OrgApprovalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutMode" AS ENUM ('PLATFORM', 'HOST');

-- DropIndex
DROP INDEX "users_stripeAccountId_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hostTypeRequested" "HostTypeRequested" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "orgApprovalStatus" "OrgApprovalStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "orgCity" TEXT,
ADD COLUMN     "orgName" TEXT,
ADD COLUMN     "orgProofUrl" TEXT,
ADD COLUMN     "orgState" TEXT,
ADD COLUMN     "orgWebsite" TEXT,
ADD COLUMN     "payoutMode" "PayoutMode" NOT NULL DEFAULT 'PLATFORM';

-- CreateIndex
CREATE INDEX "users_stripeAccountId_idx" ON "users"("stripeAccountId");
