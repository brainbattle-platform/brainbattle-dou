import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaHeartsService } from '../progress/prisma-hearts.service';

export interface AdminSummary {
  usersTotal: number;
  usersActive7d: number;
  attemptsTotal: number;
  attemptsInRange: number;
  completionsInRange: number;
  avgAccuracyInRange: number;
}

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  attempts: number;
  completions: number;
}

export interface TopLesson {
  lessonId: string;
  count: number;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly heartsService: PrismaHeartsService,
  ) {}

  /**
   * Get admin summary statistics
   */
  async getSummary(from?: string, to?: string): Promise<AdminSummary> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    // Total users (users with any progress)
    const usersTotal = await this.prisma.userProgress.count();

    // Active users in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const usersActive7d = await this.prisma.userProgress.count({
      where: {
        lastActiveDate: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Total attempts (all time)
    const attemptsTotal = await this.prisma.quizAttempt.count();

    // Attempts in date range
    const attemptsInRange = await this.prisma.quizAttempt.count({
      where: {
        startedAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
    });

    // Completions in date range (attempts with finishedAt)
    const completionsInRange = await this.prisma.quizAttempt.count({
      where: {
        finishedAt: {
          not: null,
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
    });

    // Average accuracy in range
    const attemptsWithAccuracy = await this.prisma.quizAttempt.findMany({
      where: {
        finishedAt: {
          not: null,
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
        totalQuestions: {
          gt: 0,
        },
      },
      select: {
        correctCount: true,
        totalQuestions: true,
      },
    });

    let avgAccuracyInRange = 0;
    if (attemptsWithAccuracy.length > 0) {
      const totalAccuracy = attemptsWithAccuracy.reduce((sum, attempt) => {
        return sum + attempt.correctCount / attempt.totalQuestions;
      }, 0);
      avgAccuracyInRange = totalAccuracy / attemptsWithAccuracy.length;
    }

    return {
      usersTotal,
      usersActive7d,
      attemptsTotal,
      attemptsInRange,
      completionsInRange,
      avgAccuracyInRange: Math.round(avgAccuracyInRange * 100) / 100,
    };
  }

  /**
   * Get timeseries data for attempts
   */
  async getAttemptsTimeseries(from?: string, to?: string): Promise<{ points: TimeseriesPoint[] }> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    // Get all attempts in range
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        startedAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
      select: {
        startedAt: true,
        finishedAt: true,
      },
    });

    // Group by date
    const dateMap = new Map<string, { attempts: number; completions: number }>();

    attempts.forEach((attempt) => {
      const dateStr = attempt.startedAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { attempts: 0, completions: 0 });
      }

      const dayData = dateMap.get(dateStr)!;
      dayData.attempts += 1;

      if (attempt.finishedAt) {
        dayData.completions += 1;
      }
    });

    // Convert to array and sort by date
    const points: TimeseriesPoint[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        attempts: data.attempts,
        completions: data.completions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { points };
  }

  /**
   * Get top lessons by metric
   */
  async getTopLessons(metric: 'attempts' | 'completions', limit: number = 10): Promise<{ items: TopLesson[] }> {
    const validLimit = Math.min(Math.max(1, limit), 100); // Clamp between 1 and 100

    if (metric === 'attempts') {
      // Group by lessonId and count attempts
      const attempts = await this.prisma.quizAttempt.groupBy({
        by: ['lessonId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: validLimit,
      });

      return {
        items: attempts.map((a) => ({
          lessonId: a.lessonId,
          count: a._count.id,
        })),
      };
    } else {
      // Group by lessonId and count completions (finishedAt not null)
      const completions = await this.prisma.quizAttempt.groupBy({
        by: ['lessonId'],
        where: {
          finishedAt: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: validLimit,
      });

      return {
        items: completions.map((c) => ({
          lessonId: c.lessonId,
          count: c._count.id,
        })),
      };
    }
  }

  /**
   * Get user learning overview (admin view)
   */
  async getUserOverview(userId: number) {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const hearts = await this.heartsService.getHearts(userId);

    // Count units completed
    const unitsCompleted = await this.prisma.unitProgress.count({
      where: {
        userId,
        mastery: {
          gt: 0,
        },
      },
    });

    // Count planets (lessons) completed (all 4 modes completed)
    const completedModes = await this.prisma.planetModeProgress.findMany({
      where: {
        userId,
        state: 'completed',
      },
      select: {
        lessonId: true,
      },
    });

    const lessonModeCounts = new Map<string, number>();
    completedModes.forEach((mode) => {
      const count = lessonModeCounts.get(mode.lessonId) || 0;
      lessonModeCounts.set(mode.lessonId, count + 1);
    });

    const planetsCompleted = Array.from(lessonModeCounts.values()).filter((count) => count === 4).length;

    // Get last active date
    const lastActiveSources: Date[] = [];

    if (userProgress?.lastActiveDate) {
      lastActiveSources.push(userProgress.lastActiveDate);
    }

    const lastModeAttempt = await this.prisma.planetModeProgress.findFirst({
      where: { userId },
      orderBy: { lastAttemptAt: 'desc' },
      select: { lastAttemptAt: true },
    });
    if (lastModeAttempt?.lastAttemptAt) {
      lastActiveSources.push(lastModeAttempt.lastAttemptAt);
    }

    const lastFinishedAttempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });
    if (lastFinishedAttempt?.finishedAt) {
      lastActiveSources.push(lastFinishedAttempt.finishedAt);
    }

    const lastActiveAt = lastActiveSources.length > 0
      ? new Date(Math.max(...lastActiveSources.map((d) => d.getTime())))
      : null;

    return {
      userId,
      hearts: {
        current: hearts.current,
        max: hearts.max,
      },
      streakDays: userProgress?.streak || 0,
      unitsCompleted,
      planetsCompleted,
      lastActiveAt,
    };
  }

  /**
   * Get user attempts (admin view)
   */
  async getUserAttempts(userId: number, limit: number = 50) {
    const validLimit = Math.min(Math.max(1, limit), 100); // Clamp between 1 and 100

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: validLimit,
      select: {
        id: true,
        lessonId: true,
        mode: true,
        correctCount: true,
        totalQuestions: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    return attempts.map((attempt) => {
      const accuracy = attempt.totalQuestions > 0
        ? attempt.correctCount / attempt.totalQuestions
        : 0;

      const durationSec = attempt.finishedAt && attempt.startedAt
        ? Math.floor((attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 1000)
        : null;

      return {
        attemptId: attempt.id,
        lessonId: attempt.lessonId,
        mode: attempt.mode,
        score: attempt.correctCount,
        total: attempt.totalQuestions,
        accuracy: Math.round(accuracy * 100) / 100,
        durationSec,
        completedAt: attempt.finishedAt,
        startedAt: attempt.startedAt,
      };
    });
  }
}

