/*
  Warnings:

  - You are about to drop the column `filename` on the `audio_assets` table. All the data in the column will be lost.
  - You are about to drop the column `localPath` on the `audio_assets` table. All the data in the column will be lost.
  - You are about to drop the column `objectKey` on the `audio_assets` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `audio_assets` table. All the data in the column will be lost.
  - You are about to drop the column `audioUrl` on the `questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `audio_assets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `audio_assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `audio_assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "audio_assets_filename_idx";

-- AlterTable
ALTER TABLE "audio_assets" DROP COLUMN "filename",
DROP COLUMN "localPath",
DROP COLUMN "objectKey",
DROP COLUMN "url",
ADD COLUMN     "bucket" TEXT NOT NULL DEFAULT 'bb-learning',
ADD COLUMN     "durationSec" DOUBLE PRECISION,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "audioUrl",
ADD COLUMN     "audioAssetId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "audio_assets_key_key" ON "audio_assets"("key");

-- CreateIndex
CREATE INDEX "audio_assets_originalName_idx" ON "audio_assets"("originalName");

-- CreateIndex
CREATE INDEX "questions_audioAssetId_idx" ON "questions"("audioAssetId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
