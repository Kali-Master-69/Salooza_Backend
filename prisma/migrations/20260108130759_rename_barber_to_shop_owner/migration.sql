/*
  Warnings:

  - The values [BARBER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `barberId` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `barberId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `barberId` on the `CustomerVisit` table. All the data in the column will be lost.
  - You are about to drop the `Barber` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `shopOwnerId` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopOwnerId` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopOwnerId` to the `CustomerVisit` table without a default value. This is not possible if the table is not empty.
  - Made the column `tokenNumber` on table `QueueItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'SHOP_OWNER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_barberId_fkey";

-- DropForeignKey
ALTER TABLE "Barber" DROP CONSTRAINT "Barber_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Barber" DROP CONSTRAINT "Barber_userId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_barberId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerVisit" DROP CONSTRAINT "CustomerVisit_barberId_fkey";

-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "barberId",
ADD COLUMN     "shopOwnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "barberId",
ADD COLUMN     "shopOwnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CustomerVisit" DROP COLUMN "barberId",
ADD COLUMN     "shopOwnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QueueItem" ALTER COLUMN "tokenNumber" SET NOT NULL;

-- DropTable
DROP TABLE "Barber";

-- CreateTable
CREATE TABLE "ShopOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopOwner_userId_key" ON "ShopOwner"("userId");

-- AddForeignKey
ALTER TABLE "ShopOwner" ADD CONSTRAINT "ShopOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOwner" ADD CONSTRAINT "ShopOwner_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVisit" ADD CONSTRAINT "CustomerVisit_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
