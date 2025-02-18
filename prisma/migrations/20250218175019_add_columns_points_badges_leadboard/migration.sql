/*
  Warnings:

  - Added the required column `badges` to the `CommunityMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `CommunityMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Badge" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "badges" INTEGER NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL;
