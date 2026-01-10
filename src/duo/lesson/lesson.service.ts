import { Injectable } from '@nestjs/common';
import { ExerciseService } from '../exercise/exercise.service';
import { InMemoryStateService } from '../progress/in-memory-state.service';

export interface Lesson {
  lessonId: string;
  skillId: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
}

@Injectable()
export class LessonService {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly stateService: InMemoryStateService,
  ) {}

  // Seed data: 2 Units (skills) × 3 Planets (lessons) = 6 lessons total
  // Each planet has exactly 4 exercises (one per modality: listening, speaking, reading, writing)
  private skills = [
    { skillId: 'skill-1', title: 'Basics', order: 1 }, // Unit 1
    { skillId: 'skill-2', title: 'Greetings', order: 2 }, // Unit 2
  ];

  private lessons: Lesson[] = [
    // Unit 1 (skill-1): Basics - 3 Planets
    {
      lessonId: 'lesson-1',
      skillId: 'skill-1',
      title: 'Fruits 1',
      description: 'Learn basic fruit names: apple, orange, banana.',
      order: 1,
      estimatedMinutes: 5,
    },
    {
      lessonId: 'lesson-2',
      skillId: 'skill-1',
      title: 'Fruits 2',
      description: 'Learn more fruit names: orange, banana, grape.',
      order: 2,
      estimatedMinutes: 5,
    },
    {
      lessonId: 'lesson-3',
      skillId: 'skill-1',
      title: 'Fruits 3',
      description: 'Master fruit vocabulary: banana and more.',
      order: 3,
      estimatedMinutes: 5,
    },
    // Unit 2 (skill-2): Greetings - 3 Planets
    {
      lessonId: 'lesson-4',
      skillId: 'skill-2',
      title: 'Greetings 1',
      description: 'Learn basic greetings: Hello, Thank you, Goodbye.',
      order: 1,
      estimatedMinutes: 5,
    },
    {
      lessonId: 'lesson-5',
      skillId: 'skill-2',
      title: 'Greetings 2',
      description: 'Practice polite expressions: Thank you, Please.',
      order: 2,
      estimatedMinutes: 5,
    },
    {
      lessonId: 'lesson-6',
      skillId: 'skill-2',
      title: 'Greetings 3',
      description: 'Master farewell expressions: Goodbye, See you later.',
      order: 3,
      estimatedMinutes: 5,
    },
  ];

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

  getLessonDetail(lessonId: string): Lesson | undefined {
    return this.lessons.find((l) => l.lessonId === lessonId);
  }

  getAllSkills() {
    return this.skills.map((s) => ({
      unitId: s.skillId, // Map skillId to unitId for response
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
    return this.skills.length > 0 ? this.skills[0].skillId : 'skill-1';
  }

  startLesson(userId: number, lessonId: string, mode: string) {
    const lesson = this.getLessonDetail(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Filter exercises by mode
    const allExercises = this.exerciseService.getExercisesForLesson(lessonId);
    const modeExercises = allExercises.filter((e) => e.mode === mode);

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
