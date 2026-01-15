import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaHeartsService } from '../../progress/prisma-hearts.service';

export interface LearningProfileOverview {
  userId: number;
  streakDays: number;
  hearts: {
    current: number;
    max: number;
  };
  unitsCompleted: number;
  totalUnits: number;
  planetsCompleted: number;
  lessonsCompleted: number;
  avgAccuracy7d: number;
  lastActiveAt: Date | null;
}

export interface RecentAttempt {
  attemptId: string;
  lessonId: string;
  mode: string;
  score: number; // correctCount
  total: number; // totalQuestions
  accuracy: number; // score / total
  durationSec: number | null;
  completedAt: Date | null;
}

@Injectable()
export class LearningProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('HeartsService') private readonly heartsService: PrismaHeartsService,
  ) {}

  /**
   * Get learning profile overview
   */
  async getOverview(userId: number): Promise<LearningProfileOverview> {
    // Get user progress
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    // Get hearts
    const hearts = await this.heartsService.getHearts(userId);

    // Count units completed (units with mastery > 0 or all modes completed)
    const unitProgress = await this.prisma.unitProgress.findMany({
      where: { userId },
    });
    const unitsCompleted = unitProgress.filter((up) => up.mastery > 0).length;

    // Count total units (published units)
    const totalUnits = await this.prisma.unit.count({
      where: { published: true },
    });

    // Count planets (lessons) completed (all 4 modes completed)
    // Get all completed modes grouped by lessonId
    const completedModes = await this.prisma.planetModeProgress.findMany({
      where: {
        userId,
        state: 'completed',
      },
      select: {
        lessonId: true,
      },
    });

    // Group by lessonId and count
    const lessonModeCounts = new Map<string, number>();
    completedModes.forEach((mode) => {
      const count = lessonModeCounts.get(mode.lessonId) || 0;
      lessonModeCounts.set(mode.lessonId, count + 1);
    });

    // Count lessons with all 4 modes completed
    const planetsCompletedCount = Array.from(lessonModeCounts.values()).filter((count) => count === 4).length;

    // Count lessons completed (completed planet/mode combos)
    // This counts individual mode completions, not full lessons
    const lessonsCompleted = await this.prisma.planetModeProgress.count({
      where: {
        userId,
        state: 'completed',
      },
    });

    // Calculate average accuracy from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        finishedAt: {
          not: null,
          gte: sevenDaysAgo,
        },
      },
      select: {
        correctCount: true,
        totalQuestions: true,
      },
    });

    let avgAccuracy7d = 0;
    if (recentAttempts.length > 0) {
      const totalAccuracy = recentAttempts.reduce((sum, attempt) => {
        if (attempt.totalQuestions > 0) {
          return sum + attempt.correctCount / attempt.totalQuestions;
        }
        return sum;
      }, 0);
      avgAccuracy7d = totalAccuracy / recentAttempts.length;
    }

    // Get last active date from multiple sources
    const lastActiveSources: Date[] = [];

    // From UserProgress
    if (userProgress?.lastActiveDate) {
      lastActiveSources.push(userProgress.lastActiveDate);
    }

    // From PlanetModeProgress (lastAttemptAt)
    const lastModeAttempt = await this.prisma.planetModeProgress.findFirst({
      where: { userId },
      orderBy: { lastAttemptAt: 'desc' },
      select: { lastAttemptAt: true },
    });
    if (lastModeAttempt?.lastAttemptAt) {
      lastActiveSources.push(lastModeAttempt.lastAttemptAt);
    }

    // From QuizAttempt (finishedAt)
    const lastFinishedAttempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });
    if (lastFinishedAttempt?.finishedAt) {
      lastActiveSources.push(lastFinishedAttempt.finishedAt);
    }

    // From QuizAttempt (startedAt) as fallback
    const lastStartedAttempt = await this.prisma.quizAttempt.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    });
    if (lastStartedAttempt?.startedAt) {
      lastActiveSources.push(lastStartedAttempt.startedAt);
    }

    const lastActiveAt = lastActiveSources.length > 0
      ? new Date(Math.max(...lastActiveSources.map((d) => d.getTime())))
      : null;

    return {
      userId,
      streakDays: userProgress?.streak || 0,
      hearts: {
        current: hearts.current,
        max: hearts.max,
      },
      unitsCompleted,
      totalUnits,
      planetsCompleted: planetsCompletedCount,
      lessonsCompleted,
      avgAccuracy7d: Math.round(avgAccuracy7d * 100) / 100, // Round to 2 decimal places
      lastActiveAt,
    };
  }

  /**
   * Get recent attempts
   */
  async getRecentAttempts(userId: number, limit: number = 10): Promise<RecentAttempt[]> {
    const validLimit = Math.min(Math.max(1, limit), 50); // Clamp between 1 and 50

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        finishedAt: { not: null }, // Only finished attempts
      },
      orderBy: { finishedAt: 'desc' },
      take: validLimit,
      select: {
        id: true,
        lessonId: true,
        mode: true,
        correctCount: true,
        totalQuestions: true,
        finishedAt: true,
        startedAt: true,
      },
    });

    return attempts.map((attempt) => {
      const accuracy = attempt.totalQuestions > 0
        ? attempt.correctCount / attempt.totalQuestions
        : 0;

      // Calculate duration in seconds
      const durationSec = attempt.finishedAt && attempt.startedAt
        ? Math.floor((attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 1000)
        : null;

      return {
        attemptId: attempt.id,
        lessonId: attempt.lessonId,
        mode: attempt.mode,
        score: attempt.correctCount,
        total: attempt.totalQuestions,
        accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
        durationSec,
        completedAt: attempt.finishedAt,
      };
    });
  }
}

