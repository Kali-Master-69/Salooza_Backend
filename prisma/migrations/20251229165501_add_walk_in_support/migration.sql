-- DropForeignKey
ALTER TABLE "QueueItem" DROP CONSTRAINT "QueueItem_customerId_fkey";

-- AlterTable
ALTER TABLE "QueueItem" ADD COLUMN     "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenNumber" INTEGER,
ADD COLUMN     "walkInName" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
