import { Injectable } from '@nestjs/common';
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
  totalQuestions: number; // Renamed from totalCount
  questionIds: string[]; // Ordered list of question IDs for this mode
  answeredCount: number;
  correctCount: number;
  xpEarnedTotal: number;
  answeredQuestionIds: Set<string>; // Renamed from answeredExerciseIds
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

@Injectable()
export class InMemoryStateService {
  private userProgress: Map<number, UserProgress> = new Map();
  private activeSessions: Map<string, LessonSession> = new Map();
  private planetModeProgress: Map<string, PlanetModeProgress> = new Map(); // key: `${userId}:${lessonId}:${mode}`

  getUserProgress(userId: number): UserProgress {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        userId,
        xpTotal: 0,
        streak: 0,
        lastActiveDate: getTodayYYYYMMDD(),
        skillMastery: {},
      });
    }
    return this.userProgress.get(userId)!;
  }

  updateSkillMastery(userId: number, skillId: string, masteryDelta: number) {
    const progress = this.getUserProgress(userId);
    if (!progress.skillMastery[skillId]) {
      progress.skillMastery[skillId] = 0;
    }
    progress.skillMastery[skillId] += masteryDelta;
    return progress.skillMastery[skillId];
  }

  getSkillMastery(userId: number, skillId: string): number {
    const progress = this.getUserProgress(userId);
    return progress.skillMastery[skillId] || 0;
  }

  createSession(
    userId: number,
    unitId: string,
    lessonId: string,
    mode: string,
    questionIds: string[],
  ): LessonSession {
    const sessionId = `sess_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
    const session: LessonSession = {
      sessionId,
      userId,
      unitId,
      lessonId,
      mode,
      startedAt: new Date(),
      totalQuestions: questionIds.length,
      questionIds,
      answeredCount: 0,
      correctCount: 0,
      xpEarnedTotal: 0,
      answeredQuestionIds: new Set(),
    };
    this.activeSessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): LessonSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  submitAnswer(
    sessionId: string,
    questionId: string,
    isCorrect: boolean,
  ): LessonSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Ignore if question already answered
    if (session.answeredQuestionIds.has(questionId)) {
      return session;
    }

    session.answeredQuestionIds.add(questionId);
    session.answeredCount += 1;
    if (isCorrect) {
      session.correctCount += 1;
      session.xpEarnedTotal += 10;
    }

    return session;
  }

  finishSession(sessionId: string): LessonSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (session.finishedAt) {
      return session; // Already finished
    }

    session.finishedAt = new Date();

    // Update user progress
    const progress = this.getUserProgress(session.userId);
    progress.xpTotal += session.xpEarnedTotal;

    const today = getTodayYYYYMMDD();
    if (progress.lastActiveDate !== today) {
      progress.streak += 1;
      progress.lastActiveDate = today;
    }

    // Update planet mode progress
    const accuracy = session.totalQuestions > 0 ? session.correctCount / session.totalQuestions : 0;
    this.updatePlanetModeProgress(
      session.userId,
      session.lessonId,
      session.mode,
      accuracy,
    );

    return session;
  }

  getPlanetModeProgress(userId: number, lessonId: string, mode: string): PlanetModeProgress {
    const key = `${userId}:${lessonId}:${mode}`;
    if (!this.planetModeProgress.has(key)) {
      this.planetModeProgress.set(key, {
        userId,
        lessonId,
        mode,
        state: 'available',
        bestScore: 0.0,
      });
    }
    return this.planetModeProgress.get(key)!;
  }

  updatePlanetModeProgress(
    userId: number,
    lessonId: string,
    mode: string,
    accuracy: number,
  ): PlanetModeProgress {
    const progress = this.getPlanetModeProgress(userId, lessonId, mode);
    
    // Update best score
    if (accuracy > progress.bestScore) {
      progress.bestScore = accuracy;
    }

    // Mark as completed if accuracy >= 0.7 and not already completed
    if (accuracy >= 0.7 && progress.state !== 'completed') {
      progress.state = 'completed';
      progress.completedAt = new Date();
    }

    progress.lastAttemptAt = new Date();
    this.planetModeProgress.set(`${userId}:${lessonId}:${mode}`, progress);
    return progress;
  }

  getPlanetModes(userId: number, lessonId: string): PlanetModeProgress[] {
    const modes: Array<'listening' | 'speaking' | 'reading' | 'writing'> = [
      'listening',
      'speaking',
      'reading',
      'writing',
    ];
    return modes.map((mode) => this.getPlanetModeProgress(userId, lessonId, mode));
  }

  getCompletedModesForPlanet(userId: number, lessonId: string): number {
    const modes = this.getPlanetModes(userId, lessonId);
    return modes.filter((m) => m.state === 'completed').length;
  }
}

