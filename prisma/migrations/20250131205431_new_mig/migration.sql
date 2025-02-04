-- CreateTable
CREATE TABLE "Badge" (
    "issuer" TEXT NOT NULL,
    "communityAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("issuer","communityAddress")
);

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_communityAddress_fkey" FOREIGN KEY ("communityAddress") REFERENCES "Community"("communityAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
