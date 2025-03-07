-- Step 1: Create new tables
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "firstSeenLedger" INTEGER NOT NULL,
    "lastSeenLedger" INTEGER,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAddition" (
    "id" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    CONSTRAINT "UserAddition_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add temporary columns to Community table
ALTER TABLE "Community" 
    ADD COLUMN "temp_id" TEXT,
    ADD COLUMN "issuer" TEXT DEFAULT '',
    ADD COLUMN "totalMembers" INTEGER DEFAULT 0;

-- Step 3: Copy data from communityAddress to temp_id
UPDATE "Community" SET 
    "temp_id" = "communityAddress",
    "issuer" = "creatorAddress";

-- Step 4: Add temporary columns to CommunityMember table
ALTER TABLE "CommunityMember" 
    ADD COLUMN "temp_userId" TEXT,
    ADD COLUMN "temp_communityId" TEXT,
    ADD COLUMN "score" FLOAT DEFAULT 0,
    ADD COLUMN "lastScoreUpdate" TEXT;

-- Step 5: Copy data to temporary columns
UPDATE "CommunityMember" SET 
    "temp_userId" = "userAddress",
    "temp_communityId" = "communityAddress",
    "score" = CASE WHEN "points" IS NOT NULL THEN "points"::FLOAT ELSE 0 END;

-- Step 6: Create Account records for all users
INSERT INTO "Account" ("id", "firstSeenLedger")
SELECT DISTINCT "userAddress", 1 FROM "CommunityMember"
ON CONFLICT ("id") DO NOTHING;

-- Step 7: Drop foreign key constraints
ALTER TABLE "CommunityMember" DROP CONSTRAINT IF EXISTS "CommunityMember_communityAddress_fkey";
ALTER TABLE "CommunityMember" DROP CONSTRAINT IF EXISTS "CommunityMember_userAddress_fkey";
ALTER TABLE "Badge" DROP CONSTRAINT IF EXISTS "Badge_communityAddress_fkey" CASCADE;
ALTER TABLE "CommunityManager" DROP CONSTRAINT IF EXISTS "CommunityManager_communityAddress_fkey" CASCADE;

-- Step 8: Rename columns and drop old columns
ALTER TABLE "Community" DROP CONSTRAINT "Community_pkey";
ALTER TABLE "Community" ALTER COLUMN "temp_id" SET NOT NULL;
ALTER TABLE "Community" ADD CONSTRAINT "Community_pkey" PRIMARY KEY ("temp_id");
ALTER TABLE "Community" DROP COLUMN "communityAddress";
ALTER TABLE "Community" DROP COLUMN "factoryAddress";
ALTER TABLE "Community" DROP COLUMN "creatorAddress";
ALTER TABLE "Community" DROP COLUMN "blocktimestamp";
ALTER TABLE "Community" DROP COLUMN "lastIndexedAt";
ALTER TABLE "Community" DROP COLUMN "totalBadges";
ALTER TABLE "Community" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Community" ALTER COLUMN "isHidden" SET DEFAULT false;
ALTER TABLE "Community" RENAME COLUMN "temp_id" TO "id";

-- Step 9: Update CommunityMember table
ALTER TABLE "CommunityMember" DROP CONSTRAINT "CommunityMember_pkey";
ALTER TABLE "CommunityMember" ALTER COLUMN "temp_userId" SET NOT NULL;
ALTER TABLE "CommunityMember" ALTER COLUMN "temp_communityId" SET NOT NULL;
ALTER TABLE "CommunityMember" DROP COLUMN "userAddress";
ALTER TABLE "CommunityMember" DROP COLUMN "communityAddress";
ALTER TABLE "CommunityMember" DROP COLUMN "points";
ALTER TABLE "CommunityMember" DROP COLUMN "badges";
ALTER TABLE "CommunityMember" DROP COLUMN "lastIndexedAt";
ALTER TABLE "CommunityMember" RENAME COLUMN "temp_userId" TO "userId";
ALTER TABLE "CommunityMember" RENAME COLUMN "temp_communityId" TO "communityId";
ALTER TABLE "CommunityMember" ALTER COLUMN "id" TYPE TEXT;

-- Step 10: Add foreign key constraints
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" 
    FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAddition" ADD CONSTRAINT "UserAddition_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAddition" ADD CONSTRAINT "UserAddition_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Drop unused tables
DROP TABLE IF EXISTS "Badge" CASCADE;
DROP TABLE IF EXISTS "CommunityManager" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Step 12: Update member counts
UPDATE "Community" c
SET "totalMembers" = (
    SELECT COUNT(*) FROM "CommunityMember" cm
    WHERE cm."communityId" = c."id"
);