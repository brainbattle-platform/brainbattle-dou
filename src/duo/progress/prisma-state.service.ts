import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getTodayYYYYMMDD } from '../../common/utils/date.util';

export interface UserProgress {
  userId: number;
  xpTotal: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  skillMastery: Record<string, number>; // skillId -> mastery level
}

export interface LessonSession {
  sessionId: string;
  userId: number;
  unitId: string;
  lessonId: string;
  mode: string; // "listening" | "speaking" | "reading" | "writing"
  startedAt: Date;
  finishedAt?: Date;
  totalQuestions: number;
  questionIds: string[]; // Ordered list of question IDs for this mode
  answeredCount: number;
  correctCount: number;
  xpEarnedTotal: number;
  answeredQuestionIds: Set<string>;
}

export interface PlanetModeProgress {
  userId: number;
  lessonId: string;
  mode: string;
  state: 'available' | 'locked' | 'completed';
  bestScore: number; // 0.0 - 1.0
  completedAt?: Date;
  lastAttemptAt?: Date;
}

/**
 * Prisma-based state service that replaces InMemoryStateService
 * All data is persisted in PostgreSQL via Prisma
 */
@Injectable()
export class PrismaStateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create user progress
   */
  async getUserProgress(userId: number): Promise<UserProgress> {
    let progress = await this.prisma.userProgress.findUnique({
      where: { userId },
      include: { unitProgress: true },
    });

    if (!progress) {
      progress = await this.prisma.userProgress.create({
        data: {
          userId,
          xpTotal: 0,
          streak: 0,
          lastActiveDate: new Date(),
        },
        include: { unitProgress: true },
      });
    }

    // Convert skillMastery from UnitProgress records
    const skillMastery: Record<string, number> = {};
    progress.unitProgress.forEach((up) => {
      skillMastery[up.unitId] = up.mastery;
    });

    return {
      userId: progress.userId,
      xpTotal: progress.xpTotal,
      streak: progress.streak,
      lastActiveDate: progress.lastActiveDate.toISOString().split('T')[0],
      skillMastery,
    };
  }

  /**
   * Update skill mastery
   */
  async updateSkillMastery(userId: number, skillId: string, masteryDelta: number): Promise<number> {
    await this.getUserProgress(userId); // Ensure user exists

    const existing = await this.prisma.unitProgress.findUnique({
      where: { userId_unitId: { userId, unitId: skillId } },
    });

    if (existing) {
      const updated = await this.prisma.unitProgress.update({
        where: { userId_unitId: { userId, unitId: skillId } },
        data: { mastery: { increment: masteryDelta } },
      });
      return updated.mastery;
    } else {
      const created = await this.prisma.unitProgress.create({
        data: {
          userId,
          unitId: skillId,
          mastery: masteryDelta,
        },
      });
      return created.mastery;
    }
  }

  /**
   * Get skill mastery
   */
  async getSkillMastery(userId: number, skillId: string): Promise<number> {
    const progress = await this.prisma.unitProgress.findUnique({
      where: { userId_unitId: { userId, unitId: skillId } },
    });
    return progress?.mastery || 0;
  }

  /**
   * Create a quiz attempt session (stable attemptId stored in DB)
   */
  async createSession(
    userId: number,
    unitId: string,
    lessonId: string,
    mode: string,
    questionIds: string[],
  ): Promise<LessonSession> {
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        unitId,
        lessonId,
        mode,
        questionIds,
        totalQuestions: questionIds.length,
        correctCount: 0,
        xpEarned: 0,
      },
    });

    return {
      sessionId: attempt.id,
      userId: attempt.userId,
      unitId: attempt.unitId,
      lessonId: attempt.lessonId,
      mode: attempt.mode,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt || undefined,
      totalQuestions: attempt.totalQuestions,
      questionIds: attempt.questionIds,
      answeredCount: 0,
      correctCount: 0,
      xpEarnedTotal: 0,
      answeredQuestionIds: new Set(),
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<LessonSession | undefined> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: { questionAttempts: true },
    });

    if (!attempt) {
      return undefined;
    }

    const answeredQuestionIds = new Set(attempt.questionAttempts.map((qa) => qa.questionId));

    return {
      sessionId: attempt.id,
      userId: attempt.userId,
      unitId: attempt.unitId,
      lessonId: attempt.lessonId,
      mode: attempt.mode,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt || undefined,
      totalQuestions: attempt.totalQuestions,
      questionIds: attempt.questionIds,
      answeredCount: attempt.questionAttempts.length,
      correctCount: attempt.correctCount,
      xpEarnedTotal: attempt.xpEarned,
      answeredQuestionIds,
    };
  }

  /**
   * Get session by ID and userId (validates ownership)
   */
  async getSessionByUser(sessionId: string, userId: number): Promise<LessonSession | undefined> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        id: sessionId,
        userId, // Validate ownership
      },
      include: { questionAttempts: true },
    });

    if (!attempt) {
      return undefined;
    }

    const answeredQuestionIds = new Set(attempt.questionAttempts.map((qa) => qa.questionId));

    return {
      sessionId: attempt.id,
      userId: attempt.userId,
      unitId: attempt.unitId,
      lessonId: attempt.lessonId,
      mode: attempt.mode,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt || undefined,
      totalQuestions: attempt.totalQuestions,
      questionIds: attempt.questionIds,
      answeredCount: attempt.questionAttempts.length,
      correctCount: attempt.correctCount,
      xpEarnedTotal: attempt.xpEarned,
      answeredQuestionIds,
    };
  }

  /**
   * Submit an answer and store it in DB
   * Note: Ownership validation should be done before calling this method
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    isCorrect: boolean,
    answer?: string | object,
  ): Promise<LessonSession | null> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: { questionAttempts: true },
    });

    if (!attempt) {
      return null;
    }

    // Check if already answered (prevent duplicates)
    const existing = attempt.questionAttempts.find((qa) => qa.questionId === questionId);
    if (existing) {
      return this.getSession(sessionId);
    }

    // Store answer in DB
    const answerText = typeof answer === 'string' ? answer : null;
    const answerJson = typeof answer === 'object' && answer !== null ? answer : null;

    await this.prisma.questionAttempt.create({
      data: {
        attemptId: sessionId,
        userId: attempt.userId,
        questionId,
        answerText,
        answerJson: answerJson as any,
        isCorrect,
        answeredAt: new Date(),
      },
    });

    // Update attempt stats
    const xpEarned = isCorrect ? 10 : 0;
    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: sessionId },
      data: {
        correctCount: isCorrect ? { increment: 1 } : undefined,
        xpEarned: { increment: xpEarned },
      },
      include: { questionAttempts: true },
    });

    return this.getSession(sessionId);
  }

  /**
   * Finish session and update progress
   */
  async finishSession(sessionId: string): Promise<LessonSession | null> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: { questionAttempts: true },
    });

    if (!attempt) {
      return null;
    }

    if (attempt.finishedAt) {
      return this.getSession(sessionId); // Already finished
    }

    // Mark as finished
    await this.prisma.quizAttempt.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    });

    // Update user progress
    await this.prisma.userProgress.upsert({
      where: { userId: attempt.userId },
      create: {
        userId: attempt.userId,
        xpTotal: attempt.xpEarned,
        streak: 1,
        lastActiveDate: new Date(),
      },
      update: {
        xpTotal: { increment: attempt.xpEarned },
      },
    });

    // Update streak if needed
    const today = getTodayYYYYMMDD();
    const progress = await this.prisma.userProgress.findUnique({
      where: { userId: attempt.userId },
    });

    if (progress) {
      const lastActiveDate = progress.lastActiveDate.toISOString().split('T')[0];
      if (lastActiveDate !== today) {
        await this.prisma.userProgress.update({
          where: { userId: attempt.userId },
          data: {
            streak: { increment: 1 },
            lastActiveDate: new Date(),
          },
        });
      }
    }

    // Update planet mode progress
    const accuracy = attempt.totalQuestions > 0 ? attempt.correctCount / attempt.totalQuestions : 0;
    await this.updatePlanetModeProgress(attempt.userId, attempt.lessonId, attempt.mode, accuracy);

    // Check if all 4 modes are completed, and unlock next lesson if so
    const isCompleted = await this.isLessonCompleted(attempt.userId, attempt.lessonId);
    if (isCompleted) {
      await this.unlockNextLesson(attempt.userId, attempt.lessonId);
    }

    return this.getSession(sessionId);
  }

  /**
   * Get planet mode progress
   * Returns 'locked' if lesson is locked (previous lesson not completed)
   * First lesson in each unit is always available
   */
  async getPlanetModeProgress(userId: number, lessonId: string, mode: string): Promise<PlanetModeProgress> {
    // Check if lesson exists in DB and get its unit/order
    let lesson = await this.prisma.lesson.findUnique({
      where: { lessonId },
    });

    let isLessonLocked = false;
    
    // If lesson not in DB, check seed data (for backward compatibility)
    if (!lesson) {
      // Try to infer from lessonId pattern (e.g., "lesson-1-1" -> unit-1, order 1)
      // For seed data, we'll check if it's the first lesson in its unit
      // This is a fallback - ideally all lessons should be in DB
      isLessonLocked = false; // Default to available for seed data lessons
    } else {
      // Check if previous lesson is completed
      const prevLesson = await this.prisma.lesson.findFirst({
        where: {
          unitId: lesson.unitId,
          order: lesson.order - 1,
          published: true,
        },
      });

      if (prevLesson) {
        const prevCompletedModes = await this.prisma.planetModeProgress.count({
          where: {
            userId,
            lessonId: prevLesson.lessonId,
            state: 'completed',
          },
        });
        isLessonLocked = prevCompletedModes < 4;
      } else {
        // First lesson in unit (order = 1 or no previous lesson) is always available
        isLessonLocked = false;
      }
    }

    const progress = await this.prisma.planetModeProgress.findUnique({
      where: {
        userId_lessonId_mode: {
          userId,
          lessonId,
          mode,
        },
      },
    });

    if (progress) {
      // Override state if lesson is locked
      const state = isLessonLocked ? 'locked' : (progress.state as 'available' | 'locked' | 'completed');
      return {
        userId: progress.userId,
        lessonId: progress.lessonId,
        mode: progress.mode,
        state,
        bestScore: progress.bestScore,
        completedAt: progress.completedAt || undefined,
        lastAttemptAt: progress.lastAttemptAt || undefined,
      };
    }

    // Create default if not exists (locked if lesson is locked, otherwise available)
    const initialState = isLessonLocked ? 'locked' : 'available';
    const created = await this.prisma.planetModeProgress.create({
      data: {
        userId,
        lessonId,
        mode,
        state: initialState,
        bestScore: 0.0,
      },
    });

    return {
      userId: created.userId,
      lessonId: created.lessonId,
      mode: created.mode,
      state: created.state as 'available' | 'locked' | 'completed',
      bestScore: created.bestScore,
      completedAt: created.completedAt || undefined,
      lastAttemptAt: created.lastAttemptAt || undefined,
    };
  }

  /**
   * Update planet mode progress
   * Marks mode as completed if accuracy >= 0.7 (pass condition)
   */
  async updatePlanetModeProgress(
    userId: number,
    lessonId: string,
    mode: string,
    accuracy: number,
  ): Promise<PlanetModeProgress> {
    const existing = await this.prisma.planetModeProgress.findUnique({
      where: {
        userId_lessonId_mode: {
          userId,
          lessonId,
          mode,
        },
      },
    });

    const updateData: any = {
      bestScore: existing && existing.bestScore > accuracy ? existing.bestScore : accuracy,
      lastAttemptAt: new Date(),
    };

    // Mark as completed if accuracy >= 0.7 (pass condition) and not already completed
    const isPassing = accuracy >= 0.7;
    if (isPassing && (!existing || existing.state !== 'completed')) {
      updateData.state = 'completed';
      updateData.completedAt = new Date();
    }

    const progress = await this.prisma.planetModeProgress.upsert({
      where: {
        userId_lessonId_mode: {
          userId,
          lessonId,
          mode,
        },
      },
      create: {
        userId,
        lessonId,
        mode,
        state: 'available',
        bestScore: accuracy,
        lastAttemptAt: new Date(),
        ...(isPassing && {
          state: 'completed',
          completedAt: new Date(),
        }),
      },
      update: updateData,
    });

    return {
      userId: progress.userId,
      lessonId: progress.lessonId,
      mode: progress.mode,
      state: progress.state as 'available' | 'locked' | 'completed',
      bestScore: progress.bestScore,
      completedAt: progress.completedAt || undefined,
      lastAttemptAt: progress.lastAttemptAt || undefined,
    };
  }

  /**
   * Check if all 4 modes are completed for a lesson
   */
  async isLessonCompleted(userId: number, lessonId: string): Promise<boolean> {
    const completedModes = await this.prisma.planetModeProgress.count({
      where: {
        userId,
        lessonId,
        state: 'completed',
      },
    });
    return completedModes >= 4;
  }

  /**
   * Unlock the next lesson in the same unit
   * Next lesson = order+1 where published=true
   */
  async unlockNextLesson(userId: number, completedLessonId: string): Promise<void> {
    // Get the completed lesson to find its unit and order
    const completedLesson = await this.prisma.lesson.findUnique({
      where: { lessonId: completedLessonId },
    });

    if (!completedLesson) {
      return; // Lesson not found, skip unlocking
    }

    // Find next lesson in the same unit (order + 1, published)
    const nextLesson = await this.prisma.lesson.findFirst({
      where: {
        unitId: completedLesson.unitId,
        order: completedLesson.order + 1,
        published: true,
      },
    });

    if (!nextLesson) {
      return; // No next lesson found
    }

    // Unlock all 4 modes for the next lesson (set state to 'available')
    const modes: Array<'listening' | 'speaking' | 'reading' | 'writing'> = [
      'listening',
      'speaking',
      'reading',
      'writing',
    ];

    await Promise.all(
      modes.map(async (mode) => {
        const existing = await this.prisma.planetModeProgress.findUnique({
          where: {
            userId_lessonId_mode: {
              userId,
              lessonId: nextLesson.lessonId,
              mode,
            },
          },
        });

        if (existing) {
          // Only unlock if currently locked, don't override completed
          if (existing.state === 'locked') {
            await this.prisma.planetModeProgress.update({
              where: {
                userId_lessonId_mode: {
                  userId,
                  lessonId: nextLesson.lessonId,
                  mode,
                },
              },
              data: {
                state: 'available',
              },
            });
          }
        } else {
          // Create as available
          await this.prisma.planetModeProgress.create({
            data: {
              userId,
              lessonId: nextLesson.lessonId,
              mode,
              state: 'available',
              bestScore: 0.0,
            },
          });
        }
      }),
    );
  }

  /**
   * Get all planet modes for a lesson
   */
  async getPlanetModes(userId: number, lessonId: string): Promise<PlanetModeProgress[]> {
    const modes: Array<'listening' | 'speaking' | 'reading' | 'writing'> = [
      'listening',
      'speaking',
      'reading',
      'writing',
    ];

    const results = await Promise.all(
      modes.map((mode) => this.getPlanetModeProgress(userId, lessonId, mode)),
    );

    return results;
  }

  /**
   * Get completed modes count for a planet
   */
  async getCompletedModesForPlanet(userId: number, lessonId: string): Promise<number> {
    const modes = await this.prisma.planetModeProgress.findMany({
      where: {
        userId,
        lessonId,
        state: 'completed',
      },
    });

    return modes.length;
  }
}

