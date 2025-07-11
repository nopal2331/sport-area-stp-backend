-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'expired';

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_booking_id_fkey";

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "booking_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
