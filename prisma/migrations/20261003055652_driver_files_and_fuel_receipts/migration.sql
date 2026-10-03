-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'CDL';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_CARD';
ALTER TYPE "DocumentType" ADD VALUE 'DRUG_TEST_RESULT';
ALTER TYPE "DocumentType" ADD VALUE 'MVR';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "gallons" DECIMAL(8,3),
ADD COLUMN     "receiptFilePath" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
