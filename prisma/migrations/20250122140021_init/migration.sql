-- CreateTable
CREATE TABLE "Community" (
    "contractAddress" TEXT NOT NULL,
    "factoryAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL,
    "blocktimestamp" TIMESTAMP(3) NOT NULL,
    "totalBadges" INTEGER NOT NULL,
    "lasIndexedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("contractAddress")
);

-- CreateTable
CREATE TABLE "User" (
    "userAddress" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userAddress")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" SERIAL NOT NULL,
    "userAddress" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "contractAddress" TEXT NOT NULL,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityManager" (
    "id" SERIAL NOT NULL,
    "managerAddress" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,

    CONSTRAINT "CommunityManager_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_contractAddress_fkey" FOREIGN KEY ("contractAddress") REFERENCES "Community"("contractAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("userAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityManager" ADD CONSTRAINT "CommunityManager_contractAddress_fkey" FOREIGN KEY ("contractAddress") REFERENCES "Community"("contractAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
