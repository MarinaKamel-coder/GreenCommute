/*
  Warnings:

  - You are about to drop the column `consommation` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `consumption` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "consommation",
ADD COLUMN     "consumption" DOUBLE PRECISION NOT NULL;
