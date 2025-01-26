/*
  Warnings:

  - You are about to drop the column `lasIndexedAt` on the `Community` table. All the data in the column will be lost.
  - Added the required column `lastIndexedAt` to the `Community` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Community" DROP COLUMN "lasIndexedAt",
ADD COLUMN     "lastIndexedAt" TIMESTAMP(3) NOT NULL;
