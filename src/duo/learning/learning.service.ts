import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { LessonService } from '../lesson/lesson.service';
import { ExerciseService } from '../exercise/exercise.service';
import { PrismaStateService } from '../progress/prisma-state.service';
import { PrismaHeartsService } from '../progress/prisma-hearts.service';
import { normalizeQuestion, sanitizeQuestionForClient } from './utils/question-mapper.util';
import { checkAnswer } from './utils/answer-checker.util';
import { getAudioUrlForQuestion } from './utils/audio-lookup.util';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class LearningService {
  constructor(
    private readonly lessonService: LessonService,
    private readonly exerciseService: ExerciseService,
    @Inject('StateService') private readonly stateService: PrismaStateService,
    @Inject('HeartsService') private readonly heartsService: PrismaHeartsService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * GET /learning/map
   * Returns current learning map for the user
   */
  async getMap(userId: number) {
    const activeUnitId = this.lessonService.getActiveUnitId();
    const units = this.lessonService.getAllSkills();
    const activeLessons = this.lessonService.getLessonsByUnitId(activeUnitId);

    // Build skills array with state and progress
    const skills = await Promise.all(activeLessons.map(async (lesson, index) => {
      const completedModes = await this.stateService.getCompletedModesForPlanet(userId, lesson.lessonId);
      const progressPercent = (completedModes / 4) * 100;

      // Determine state: LOCKED | AVAILABLE | COMPLETED | CURRENT
      let state: 'LOCKED' | 'AVAILABLE' | 'COMPLETED' | 'CURRENT';
      
      if (completedModes === 4) {
        // Lesson is 100% complete
        state = 'COMPLETED';
      } else if (index === 0) {
        // First lesson is always CURRENT (or AVAILABLE if completed)
        state = 'CURRENT';
      } else {
        // Check if previous lesson is completed (all 4 modes)
        const prevLesson = activeLessons[index - 1];
        const prevCompletedModes = await this.stateService.getCompletedModesForPlanet(userId, prevLesson.lessonId);
        
        if (prevCompletedModes === 4) {
          // Previous lesson completed, this one is AVAILABLE
          state = 'AVAILABLE';
        } else {
          // Previous lesson not completed, this one is LOCKED
          state = 'LOCKED';
        }
      }

      return {
        skillId: lesson.lessonId, // Using lessonId as skillId for now
        title: lesson.title,
        state,
        position: index,
        progressPercent,
      };
    }));

    return {
      unitId: activeUnitId,
      unitTitle: units.find((u) => u.unitId === activeUnitId)?.title || 'Unit 1',
      skills,
    };
  }

  /**
   * GET /learning/units/{unitId}/skills
   * Returns skills for a unit
   */
  async getSkillsForUnit(unitId: string, userId: number) {
    const lessons = this.lessonService.getLessonsByUnitId(unitId);
    
    return Promise.all(lessons.map(async (lesson, index) => {
      const completedModes = await this.stateService.getCompletedModesForPlanet(userId, lesson.lessonId);
      const progressPercent = (completedModes / 4) * 100;

      let state: 'LOCKED' | 'AVAILABLE' | 'COMPLETED' | 'CURRENT';
      if (completedModes === 4) {
        state = 'COMPLETED';
      } else if (index === 0) {
        state = 'CURRENT';
      } else {
        const prevLesson = lessons[index - 1];
        const prevCompletedModes = await this.stateService.getCompletedModesForPlanet(userId, prevLesson.lessonId);
        state = prevCompletedModes === 4 ? 'AVAILABLE' : 'LOCKED';
      }

      return {
        skillId: lesson.lessonId,
        title: lesson.title,
        state,
        position: index,
        progressPercent,
      };
    }));
  }

  /**
   * GET /learning/skills/{skillId}/modes
   * Returns available modes for a skill (skillId is lessonId)
   */
  async getModesForSkill(skillId: string, userId: number) {
    const lesson = this.lessonService.getLessonDetail(skillId);
    if (!lesson) {
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    // Check if lesson is locked (previous lesson not completed)
    const lessons = this.lessonService.getLessonsByUnitId(lesson.skillId); // skillId is unitId
    const lessonIndex = lessons.findIndex((l) => l.lessonId === skillId);
    let isLessonLocked = false;

    if (lessonIndex > 0) {
      const prevLesson = lessons[lessonIndex - 1];
      const prevCompletedModes = await this.stateService.getCompletedModesForPlanet(userId, prevLesson.lessonId);
      isLessonLocked = prevCompletedModes < 4;
    }

    const modesProgress = await this.stateService.getPlanetModes(userId, skillId);
    
    // If lesson is locked, all modes are locked
    const modes = modesProgress.map((mp) => {
      let state = mp.state;
      let bestScore = mp.bestScore;

      if (isLessonLocked) {
        state = 'locked';
        bestScore = 0.0;
      }

      return {
        mode: mp.mode,
        state: state.toUpperCase(), // AVAILABLE | LOCKED | COMPLETED
        bestScore,
      };
    });

    return {
      skillId: lesson.lessonId,
      skillTitle: lesson.title,
      modes,
    };
  }

  /**
   * GET /learning/lessons/{lessonId}
   * Returns lesson detail
   */
  getLessonDetail(lessonId: string) {
    const lesson = this.lessonService.getLessonDetail(lessonId);
    if (!lesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }

    return {
      lessonId: lesson.lessonId,
      lessonTitle: lesson.title,
      description: lesson.description,
      level: 'A1', // Default level
      mode: 'listening', // Default mode
    };
  }

  /**
   * GET /learning/lessons/{lessonId}/overview
   * Returns lesson overview with XP, time, questions
   */
  async getLessonOverview(lessonId: string, mode?: string, userId?: number) {
    const lesson = this.lessonService.getLessonDetail(lessonId);
    if (!lesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }

    const targetMode = (mode || 'listening') as 'listening' | 'speaking' | 'reading' | 'writing';
    const modeQuestions = this.exerciseService.getQuestionsForLessonMode(lessonId, targetMode, 5);
    const questionCount = modeQuestions.length;
    const xpReward = questionCount * 10;
    const hearts = userId ? await this.heartsService.getHearts(userId) : { current: 5, max: 5, regen: { secondsPerHeart: 1800 } };

    return {
      lessonId: lesson.lessonId,
      lessonTitle: lesson.title,
      description: lesson.description,
      level: 'A1',
      mode: targetMode,
      estimatedTimeMinutes: lesson.estimatedMinutes,
      xpReward,
      totalQuestions: questionCount,
      streakProtected: true,
      hearts: {
        current: hearts.current,
        max: hearts.max,
      },
    };
  }

  /**
   * POST /learning/lessons/{lessonId}/start
   * Start a lesson session (creates or resumes attempt for this userId)
   */
  async startLesson(lessonId: string, userId: number, mode?: string) {
    const targetMode = (mode || 'listening') as 'listening' | 'speaking' | 'reading' | 'writing';
    return this.lessonService.startLesson(userId, lessonId, targetMode);
  }

  /**
   * POST /learning/quiz/start
   * Start a quiz attempt (creates attempt for this userId)
   */
  async startQuiz(lessonId: string, userId: number, mode?: string) {
    const targetMode = (mode || 'listening') as 'listening' | 'speaking' | 'reading' | 'writing';
    const result = await this.lessonService.startLesson(userId, lessonId, targetMode);
    const hearts = await this.heartsService.getHearts(userId);

    // result.question is already normalized and sanitized from lessonService
    // Just return it with attempt metadata
    return {
      attemptId: result.sessionId,
      lessonId: result.lessonId,
      mode: result.mode,
      currentQuestionIndex: 1,
      totalQuestions: result.totalQuestions,
      heartsRemaining: hearts.current,
      question: result.question,
    };
  }

  /**
   * GET /learning/quiz/{attemptId}/question
   * Get current question for quiz attempt (validates ownership)
   */
  async getQuizQuestion(attemptId: string, userId: number) {
    const session = await this.stateService.getSessionByUser(attemptId, userId);
    if (!session) {
      throw new HttpException('Quiz attempt not found or access denied', HttpStatus.NOT_FOUND);
    }

    // Find current unanswered question
    const nextQuestionId = session.questionIds.find(
      (qId) => !session.answeredQuestionIds.has(qId),
    );

    if (!nextQuestionId) {
      throw new HttpException('No more questions', HttpStatus.NOT_FOUND);
    }

    const exercise = this.exerciseService.getExerciseById(nextQuestionId) ||
                     this.exerciseService.getExercise(session.lessonId, nextQuestionId);
    
    if (!exercise) {
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    const index = session.questionIds.indexOf(nextQuestionId) + 1;
    const hearts = await this.heartsService.getHearts(session.userId);

    // Get audioUrl for listening questions
    const audioUrl = exercise.mode === 'listening'
      ? await getAudioUrlForQuestion(nextQuestionId, this.prisma, this.storageService)
      : undefined;

    // Normalize question
    const normalized = normalizeQuestion(exercise, audioUrl);
    const sanitized = sanitizeQuestionForClient(normalized);

    return {
      attemptId: session.sessionId,
      currentQuestionIndex: index,
      totalQuestions: session.totalQuestions,
      heartsRemaining: hearts.current,
      question: sanitized,
    };
  }

  /**
   * POST /learning/quiz/{attemptId}/answer
   * Submit answer for current question (validates ownership)
   */
  async submitQuizAnswer(attemptId: string, answer: string | object, userId: number) {
    const session = await this.stateService.getSessionByUser(attemptId, userId);
    if (!session) {
      throw new HttpException('Quiz attempt not found or access denied', HttpStatus.NOT_FOUND);
    }

    // Find current unanswered question
    const currentQuestionId = session.questionIds.find(
      (qId) => !session.answeredQuestionIds.has(qId),
    );

    if (!currentQuestionId) {
      throw new HttpException('No current question', HttpStatus.BAD_REQUEST);
    }

    const exercise = this.exerciseService.getExerciseById(currentQuestionId) ||
                     this.exerciseService.getExercise(session.lessonId, currentQuestionId);
    
    if (!exercise) {
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    // Normalize question for answer checking
    const normalized = normalizeQuestion(exercise);
    
    // Check answer using normalized checker
    const answerStr = typeof answer === 'string' ? answer : JSON.stringify(answer);
    const isCorrect = checkAnswer(normalized, answerStr);
    
    // Update session and store answer in DB
    await this.stateService.submitAnswer(attemptId, currentQuestionId, isCorrect, answer);
    
    // Decrement hearts if wrong
    if (!isCorrect) {
      await this.heartsService.decrementOnWrong(session.userId);
    }

    const hearts = await this.heartsService.getHearts(session.userId);
    const isOutOfHearts = hearts.current <= 0;
    const heartsWithRegen = await this.heartsService.getHeartsWithRegen(session.userId);

    return {
      attemptId: session.sessionId,
      isCorrect,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation || `The correct answer is "${exercise.correctAnswer}".`,
      heartsRemaining: hearts.current,
      outOfHearts: isOutOfHearts,
      ...(isOutOfHearts && {
        cooldownSeconds: heartsWithRegen.regen.secondsPerHeart,
      }),
    };
  }

  /**
   * POST /learning/quiz/{attemptId}/next
   * Move to next question
   */
  async nextQuestion(attemptId: string, userId: number) {
    return this.getQuizQuestion(attemptId, userId);
  }

  /**
   * POST /learning/quiz/{attemptId}/finish
   * Finish quiz attempt (validates ownership)
   * Updates mode progress and unlocks next lesson if all 4 modes completed
   */
  async finishQuiz(attemptId: string, userId: number) {
    const session = await this.stateService.getSessionByUser(attemptId, userId);
    if (!session) {
      throw new HttpException('Quiz attempt not found or access denied', HttpStatus.NOT_FOUND);
    }

    // Finish session in DB (this also updates mode progress and unlocks next lesson if needed)
    const finishedSession = await this.stateService.finishSession(attemptId);
    if (!finishedSession) {
      throw new HttpException('Failed to finish quiz', HttpStatus.BAD_REQUEST);
    }

    const accuracy = finishedSession.totalQuestions > 0
      ? finishedSession.correctCount / finishedSession.totalQuestions
      : 0;

    return {
      attemptId: finishedSession.sessionId,
      lessonId: finishedSession.lessonId,
      result: {
        correctCount: finishedSession.correctCount,
        totalQuestions: finishedSession.totalQuestions,
        accuracy,
        xpEarned: finishedSession.xpEarnedTotal,
      },
    };
  }

  /**
   * GET /learning/lessons/{lessonId}/modes
   * Get mode states for a lesson (bestScore/state/completedAt for this userId)
   */
  async getLessonModes(lessonId: string, userId: number) {
    const modes = await this.stateService.getPlanetModes(userId, lessonId);
    return modes.map((mode) => ({
      mode: mode.mode,
      state: mode.state,
      bestScore: mode.bestScore,
      completedAt: mode.completedAt,
      lastAttemptAt: mode.lastAttemptAt,
    }));
  }

  /**
   * GET /learning/hearts
   * Get user hearts status
   */
  async getHearts(userId: number) {
    return this.heartsService.getHeartsWithRegen(userId);
  }

  /**
   * POST /learning/hearts/consume
   * Consume a heart
   */
  async consumeHeart(userId: number) {
    const hearts = await this.heartsService.getHearts(userId);
    if (hearts.current <= 0) {
      throw new HttpException('No hearts available', HttpStatus.BAD_REQUEST);
    }
    await this.heartsService.decrementOnWrong(userId);
    return this.heartsService.getHearts(userId);
  }

  /**
   * POST /learning/hearts/recover
   * Recover hearts (practice to earn)
   */
  async recoverHearts(userId: number) {
    const hearts = await this.heartsService.getHearts(userId);
    if (hearts.current >= hearts.max) {
      return hearts;
    }
    // For MVP: restore to max
    // In production: implement practice-based recovery
    return hearts;
  }

  /**
   * GET /learning/practice/hub
   * Get practice hub data
   */
  async getPracticeHub(userId: number) {
    // Get all lessons to check for weak skills
    const allLessons = this.lessonService.getAllLessons();
    const weakSkills: any[] = [];

    // Check each lesson for weak modes
    for (const lesson of allLessons) {
      const modes = await this.stateService.getPlanetModes(userId, lesson.lessonId);
      modes.forEach((modeProgress) => {
        if (modeProgress.bestScore < 0.7 && modeProgress.state !== 'locked') {
          weakSkills.push({
            skillId: lesson.lessonId,
            mode: modeProgress.mode,
            bestScore: modeProgress.bestScore,
          });
        }
      });
    }

    // Get mistake questions (from recent sessions)
    const mistakeQuestions: any[] = []; // TODO: implement mistake tracking

    // Get spaced repetition queue
    const spacedRepetitionQueue: any[] = []; // TODO: implement spaced repetition

    return {
      weakSkills,
      mistakeQuestions,
      spacedRepetitionQueue,
    };
  }

  /**
   * POST /learning/practice/start
   * Start a practice session
   */
  async startPractice(practiceType: string, userId: number, targetId?: string) {
    // For MVP: start a practice lesson
    if (practiceType === 'mistakes' && targetId) {
      // Start practice with mistake questions
      return this.startQuiz(targetId, userId, undefined);
    }
    // Default: start a practice lesson
    const firstLesson = this.lessonService.getFirstAvailableLesson();
    if (!firstLesson) {
      throw new HttpException('No lessons available', HttpStatus.NOT_FOUND);
    }
    return this.startQuiz(firstLesson.lessonId, userId, undefined);
  }
}

