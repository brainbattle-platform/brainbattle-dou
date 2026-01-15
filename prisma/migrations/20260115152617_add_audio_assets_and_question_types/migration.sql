-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placeholder" TEXT,
ALTER COLUMN "type" SET DEFAULT 'MCQ';

-- CreateTable
CREATE TABLE "audio_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "objectKey" TEXT,
    "localPath" TEXT,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audio_assets_filename_idx" ON "audio_assets"("filename");
