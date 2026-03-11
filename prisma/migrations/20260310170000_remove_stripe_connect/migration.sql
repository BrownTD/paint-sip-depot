DROP INDEX IF EXISTS "users_stripeAccountId_idx";

DROP INDEX IF EXISTS "users_stripeAccountId_key";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "stripeAccountId",
DROP COLUMN IF EXISTS "stripeDetailsSubmitted",
DROP COLUMN IF EXISTS "stripeChargesEnabled",
DROP COLUMN IF EXISTS "stripePayoutsEnabled",
DROP COLUMN IF EXISTS "stripeOnboardingStatus",
DROP COLUMN IF EXISTS "stripeRequirements",
DROP COLUMN IF EXISTS "stripeDisabledReason",
DROP COLUMN IF EXISTS "stripeLastSyncedAt",
DROP COLUMN IF EXISTS "hostTypeRequested",
DROP COLUMN IF EXISTS "orgApprovalStatus",
DROP COLUMN IF EXISTS "payoutMode",
DROP COLUMN IF EXISTS "orgName",
DROP COLUMN IF EXISTS "orgWebsite",
DROP COLUMN IF EXISTS "orgCity",
DROP COLUMN IF EXISTS "orgState",
DROP COLUMN IF EXISTS "orgProofUrl";

DROP TYPE IF EXISTS "StripeOnboardingStatus";
DROP TYPE IF EXISTS "HostTypeRequested";
DROP TYPE IF EXISTS "OrgApprovalStatus";
DROP TYPE IF EXISTS "PayoutMode";
