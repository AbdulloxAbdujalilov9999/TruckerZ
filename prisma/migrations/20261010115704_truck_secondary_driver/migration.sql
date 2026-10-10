-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "secondaryDriverId" TEXT;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_secondaryDriverId_fkey" FOREIGN KEY ("secondaryDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
