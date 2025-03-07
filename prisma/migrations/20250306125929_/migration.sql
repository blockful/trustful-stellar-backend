-- CreateTable
CREATE TABLE "HiddenCommunity" (
    "communityId" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenCommunity_pkey" PRIMARY KEY ("communityId")
);

-- AddForeignKey
ALTER TABLE "HiddenCommunity" ADD CONSTRAINT "HiddenCommunity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;