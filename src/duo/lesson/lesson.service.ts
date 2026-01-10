import { Injectable } from '@nestjs/common';
import { ExerciseService } from '../exercise/exercise.service';
import { InMemoryStateService } from '../progress/in-memory-state.service';
import { UNITS_SEED, Unit } from '../data/units.seed';
import { LESSONS_SEED, Lesson } from '../data/lessons.seed';

export interface LessonInternal {
  lessonId: string;
  skillId: string; // Internal: skillId maps to unitId for responses
  title: string;
  description: string;
  subtitle?: string;
  order: number;
  estimatedMinutes: number;
}

@Injectable()
export class LessonService {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly stateService: InMemoryStateService,
  ) {}

  // Use seed data: 20 Units × 3 Planets = 60 lessons total
  // Keep skills with unitId directly (matches seed data)
  private skills: Unit[] = UNITS_SEED;

  // Map lessons: skillId internally maps to unitId from seed
  private lessons: LessonInternal[] = LESSONS_SEED.map((l) => ({
    lessonId: l.lessonId,
    skillId: l.unitId, // skillId is unitId internally (for backward compatibility with existing code)
    title: l.title,
    description: l.subtitle || l.title,
    subtitle: l.subtitle,
    order: l.order,
    estimatedMinutes: l.estimatedMinutes,
  }));

  getLessonsBySkill(skillId: string) {
    const filtered = this.lessons.filter((l) => l.skillId === skillId);
    return filtered.map((l) => ({
      lessonId: l.lessonId,
      title: l.title,
      order: l.order,
      estimatedMinutes: l.estimatedMinutes,
      isCompleted: false, // Always false for MVP
    }));
  }

  getLessonDetail(lessonId: string): LessonInternal | undefined {
    return this.lessons.find((l) => l.lessonId === lessonId);
  }

  getAllSkills() {
    // Return units with unitId (already correct from seed)
    return this.skills.map((s) => ({
      unitId: s.unitId,
      title: s.title,
      order: s.order,
    }));
  }

  getAllLessons() {
    return this.lessons;
  }

  getLessonsByUnitId(unitId: string) {
    // unitId is the skillId internally
    return this.lessons.filter((l) => l.skillId === unitId);
  }

  getFirstAvailableLesson(): { skillId: string; lessonId: string } | null {
    if (this.lessons.length === 0) {
      return null;
    }
    const firstLesson = this.lessons[0];
    return {
      skillId: firstLesson.skillId,
      lessonId: firstLesson.lessonId,
    };
  }

  getActiveUnitId(): string {
    // MVP: return first unit as active
    return this.skills.length > 0 ? this.skills[0].unitId : 'unit-1';
  }

  startLesson(userId: number, lessonId: string, mode: string) {
    const lesson = this.getLessonDetail(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Use deterministic question picker to get exactly 5 questions for this lesson+mode
    const modeExercises = this.exerciseService.getQuestionsForLessonMode(lessonId, mode as any, 5);

    if (modeExercises.length === 0) {
      throw new Error(`No exercises found for mode: ${mode}`);
    }

    // Create ordered list of question IDs for this mode
    const questionIds = modeExercises.map((e) => e.exerciseId);

    // Create session with mode and unitId
    const session = this.stateService.createSession(
      userId,
      lesson.skillId, // unitId (skillId internally)
      lessonId,
      mode,
      questionIds,
    );

    // Return first question (per-question flow)
    const firstQuestion = modeExercises[0];

    return {
      sessionId: session.sessionId,
      lessonId: session.lessonId,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      question: {
        index: 1,
        questionId: firstQuestion.exerciseId,
        type: firstQuestion.type,
        prompt: firstQuestion.prompt,
        choices: firstQuestion.choices,
        hintAvailable: !!firstQuestion.hint,
      },
    };
  }

  finishLesson(sessionId: string) {
    const session = this.stateService.finishSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const accuracy = session.totalQuestions > 0 ? session.correctCount / session.totalQuestions : 0;
    const progress = this.stateService.getUserProgress(session.userId);

    // Calculate mastery delta (simplified: +1 if accuracy >= 0.7, else 0)
    const lesson = this.getLessonDetail(session.lessonId);
    const unitId = session.unitId;
    const masteryDelta = accuracy >= 0.7 ? 1 : 0;

    // Update unit mastery if accuracy >= 0.7
    if (masteryDelta > 0) {
      this.stateService.updateSkillMastery(session.userId, unitId, masteryDelta);
    }
    const currentMastery = this.stateService.getSkillMastery(session.userId, unitId);

    // Get completed modes for this planet
    const completedModes = this.stateService.getCompletedModesForPlanet(
      session.userId,
      session.lessonId,
    );

    return {
      sessionId: session.sessionId,
      lessonId: session.lessonId,
      mode: session.mode,
      result: {
        correctCount: session.correctCount,
        totalQuestions: session.totalQuestions,
        accuracy,
        xpEarnedTotal: session.xpEarnedTotal,
      },
      updated: {
        xpTotal: progress.xpTotal,
        streak: progress.streak,
        planetProgress: {
          lessonId: session.lessonId,
          completedModes,
          totalModes: 4,
        },
      },
    };
  }
}
