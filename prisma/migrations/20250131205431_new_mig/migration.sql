-- CreateTable
CREATE TABLE "Badge" (
    "issuer" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("issuer","contractAddress")
);

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_contractAddress_fkey" FOREIGN KEY ("contractAddress") REFERENCES "Community"("contractAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
