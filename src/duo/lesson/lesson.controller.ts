import { Controller, Get, Param, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { ExerciseService } from '../exercise/exercise.service';
import { StartLessonDto } from './dto/start-lesson.dto';
import { FinishLessonDto } from './dto/finish-lesson.dto';
import { InMemoryStateService } from '../progress/in-memory-state.service';
import { HeartsService } from '../progress/hearts.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { successResponse } from '../../common/utils/response.util';
import { UserContextService } from '../../common/user/user-context.service';

@ApiTags('Learning (Legacy - In-Memory)')
@Controller('duo')
export class LessonController {
  constructor(
    private readonly service: LessonService,
    private readonly exerciseService: ExerciseService,
    private readonly stateService: InMemoryStateService,
    private readonly heartsService: HeartsService,
    private readonly userContext: UserContextService,
  ) {}

  @Get('map')
  @ApiOperation({ summary: 'Get learning map (Figma 5.1) [LEGACY - In-Memory]' })
  @ApiResponse({ status: 200, description: 'Units and planets with progress' })
  getMap() {
    const userId = this.userContext.getUserIdAsNumber();
    const activeUnitId = this.service.getActiveUnitId();
    const units = this.service.getAllSkills();
    const allLessons = this.service.getAllLessons();
    const activeLessons = this.service.getLessonsByUnitId(activeUnitId);

    // Build planets array with state and progress
    const planets = activeLessons.map((lesson, index) => {
      // MVP: first planet is available, others locked (or all available)
      // For better demo: make all planets available
      const state = 'available'; // index === 0 ? 'available' : 'locked';
      const completedModes = this.stateService.getCompletedModesForPlanet(userId, lesson.lessonId);

      // Generate deterministic UI placement (evenly spaced around orbit)
      const angle = (index * 120) % 360; // Space 3 planets evenly (120 degrees apart)
      const size = index === 0 ? 'md' : 'sm'; // First planet larger

      return {
        lessonId: lesson.lessonId,
        unitId: lesson.skillId, // Map skillId to unitId
        title: lesson.title,
        order: lesson.order,
        state,
        progress: {
          completedModes,
          totalModes: 4,
        },
        ui: {
          orbitIndex: 0,
          angle,
          size,
        },
      };
    });

    return successResponse({
      activeUnitId,
      units,
      planets,
    });
  }

  @Get('home')
  @ApiOperation({ summary: 'Get user home screen data [LEGACY - In-Memory]' })
  @ApiResponse({ status: 200, description: 'User progress and next lesson' })
  getHome() {
    const userId = this.userContext.getUserIdAsNumber();
    const progress = this.stateService.getUserProgress(userId);
    const continueLesson = this.service.getFirstAvailableLesson();

    if (!continueLesson) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: 'No lessons available' } },
        HttpStatus.NOT_FOUND,
      );
    }

    return successResponse({
      userId: progress.userId,
      xpTotal: progress.xpTotal,
      streak: progress.streak,
      lastActiveDate: progress.lastActiveDate,
      continue: continueLesson,
    });
  }

  @Get('skills/:skillId/lessons')
  @ApiOperation({ summary: 'Get lessons for a skill [LEGACY]' })
  @ApiParam({ name: 'skillId', type: String })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  getLessonsBySkill(@Param('skillId') skillId: string) {
    const lessons = this.service.getLessonsBySkill(skillId);
    return successResponse({
      skillId,
      lessons,
    });
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson (planet) detail [LEGACY]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Planet detail with exercise count (always 4)' })
  getLessonDetail(@Param('id') id: string) {
    const lesson = this.service.getLessonDetail(id);
    if (!lesson) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        HttpStatus.NOT_FOUND,
      );
    }
    // Each planet has exactly 4 exercises (one per modality)
    return successResponse({
      lessonId: lesson.lessonId,
      skillId: lesson.skillId,
      title: lesson.title,
      description: lesson.description,
      exerciseCount: 4, // Always 4 (one per modality: listening, speaking, reading, writing)
    });
  }

  @Get('lessons/:lessonId/modes')
  @ApiOperation({ summary: 'Get modes for a planet (Figma 5.2) [LEGACY - In-Memory]' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiResponse({ status: 200, description: '4 modes with state and best score' })
  getLessonModes(@Param('lessonId') lessonId: string) {
    const userId = this.userContext.getUserIdAsNumber();
    const lesson = this.service.getLessonDetail(lessonId);
    if (!lesson) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        HttpStatus.NOT_FOUND,
      );
    }

    const modesProgress = this.stateService.getPlanetModes(userId, lessonId);
    const modes = modesProgress.map((mp) => ({
      mode: mp.mode,
      state: mp.state,
      bestScore: mp.bestScore,
    }));

    return successResponse({
      lessonId: lesson.lessonId,
      unitId: lesson.skillId, // Map skillId to unitId
      title: lesson.title,
      modes,
    });
  }

  @Get('lessons/:lessonId/overview')
  @ApiOperation({ summary: 'Get lesson overview (Figma 5.4) [LEGACY - In-Memory]' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiQuery({ name: 'mode', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lesson overview with XP, hearts, question count' })
  getLessonOverview(@Param('lessonId') lessonId: string, @Query('mode') mode?: string) {
    const userId = this.userContext.getUserIdAsNumber();
    const lesson = this.service.getLessonDetail(lessonId);
    if (!lesson) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        HttpStatus.NOT_FOUND,
      );
    }

    // Default to first mode if not specified
    const targetMode = (mode || 'listening') as any;
    
    // Use question picker to get questions for this lesson+mode (returns exactly 5)
    const modeQuestions = this.exerciseService.getQuestionsForLessonMode(lessonId, targetMode, 5);
    const questionCount = modeQuestions.length; // Always 5

    // XP reward: 10 XP per question
    const xpReward = questionCount * 10;

    const hearts = this.heartsService.getHearts(userId);

    return successResponse({
      lessonId: lesson.lessonId,
      unitId: lesson.skillId, // Map skillId to unitId
      mode: targetMode,
      title: lesson.title,
      subtitle: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      xpReward,
      questionCount,
      streakProtect: { available: true },
      hearts: {
        current: hearts.current,
        max: hearts.max,
        regen: {
          secondsPerHeart: hearts.regen.secondsPerHeart,
        },
      },
    });
  }

  @Get('lessons/:id/exercises')
  @ApiOperation({ summary: 'Get exercises for a lesson (fallback/debug) [LEGACY - DEBUG]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'List of exercises (exactly 4, one per modality)' })
  getExercisesForLesson(@Param('id') id: string) {
    const exercises = this.exerciseService.getExercisesForLesson(id);
    // Ensure exactly 4 exercises are returned (one per modality)
    return successResponse({
      lessonId: id,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        mode: e.mode,
        type: e.type,
        prompt: e.prompt,
        choices: e.choices,
      })),
    });
  }

  @Post('lesson/start')
  @ApiOperation({ summary: 'Start a lesson (planet) session (Figma 5.5) [LEGACY - In-Memory]' })
  @ApiResponse({ status: 200, description: 'Lesson started with first question and hearts' })
  startLesson(@Body() dto: StartLessonDto) {
    try {
      const userId = this.userContext.getUserIdAsNumber();
      const result = this.service.startLesson(userId, dto.lessonId, dto.mode);
      const hearts = this.heartsService.getHearts(userId);

      return successResponse({
        ...result,
        hearts: {
          current: hearts.current,
          max: hearts.max,
        },
      });
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to start lesson' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('lesson/finish')
  @ApiOperation({ summary: 'Finish a lesson session [LEGACY - In-Memory]' })
  @ApiResponse({ status: 200, description: 'Lesson finished' })
  finishLesson(@Body() dto: FinishLessonDto) {
    try {
      const result = this.service.finishLesson(dto.sessionId);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to finish lesson' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
