/*
  Warnings:

  - You are about to drop the column `exerciseId` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the `SkillProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProgress` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `mode` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionId` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `LessonSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `LessonSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SkillProgress" DROP CONSTRAINT "SkillProgress_userId_fkey";

-- AlterTable
ALTER TABLE "Attempt" DROP COLUMN "exerciseId",
ADD COLUMN     "mode" TEXT NOT NULL,
ADD COLUMN     "questionId" TEXT NOT NULL,
ADD COLUMN     "timeMs" INTEGER;

-- AlterTable
ALTER TABLE "LessonSession" ADD COLUMN     "mode" TEXT NOT NULL,
ADD COLUMN     "unitId" TEXT NOT NULL;

-- DropTable
DROP TABLE "SkillProgress";

-- DropTable
DROP TABLE "UserProgress";

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "lessonId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_attempts" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "answerText" TEXT,
    "answerJson" JSONB,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeMs" INTEGER,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "userId" INTEGER NOT NULL,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_hearts" (
    "userId" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 5,
    "max" INTEGER NOT NULL DEFAULT 5,
    "lastRefillAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_hearts_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "unit_progress" (
    "userId" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,
    "mastery" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unit_progress_pkey" PRIMARY KEY ("userId","unitId")
);

-- CreateTable
CREATE TABLE "planet_mode_progress" (
    "userId" INTEGER NOT NULL,
    "lessonId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'available',
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "planet_mode_progress_pkey" PRIMARY KEY ("userId","lessonId","mode")
);

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_lessonId_idx" ON "quiz_attempts"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_unitId_idx" ON "quiz_attempts"("userId", "unitId");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_startedAt_idx" ON "quiz_attempts"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "question_attempts_attemptId_idx" ON "question_attempts"("attemptId");

-- CreateIndex
CREATE INDEX "question_attempts_userId_questionId_idx" ON "question_attempts"("userId", "questionId");

-- CreateIndex
CREATE INDEX "question_attempts_userId_answeredAt_idx" ON "question_attempts"("userId", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "question_attempts_attemptId_questionId_key" ON "question_attempts"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "planet_mode_progress_userId_lessonId_idx" ON "planet_mode_progress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "planet_mode_progress_userId_mode_idx" ON "planet_mode_progress"("userId", "mode");

-- CreateIndex
CREATE INDEX "Attempt_sessionId_questionId_idx" ON "Attempt"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "LessonSession_userId_lessonId_idx" ON "LessonSession"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonSession_userId_unitId_idx" ON "LessonSession"("userId", "unitId");

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hearts" ADD CONSTRAINT "user_hearts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_progress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_progress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planet_mode_progress" ADD CONSTRAINT "planet_mode_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_progress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
