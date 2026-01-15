import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { successResponse } from '../../common/utils/response.util';
import { ApiUserIdHeader } from '../../common/swagger/api-user-id-header.decorator';
import { UserIdGuard } from '../../common/guards/user-id.guard';
import { UserId } from '../../common/decorators/user-id.decorator';

@ApiTags('Learning (User)')
@ApiUserIdHeader()
@UseGuards(UserIdGuard)
@Controller('learning')
export class LearningController {
  constructor(
    private readonly learningService: LearningService,
  ) {}

  /**
   * GET /learning/map
   * Get learning map (Figma 5.1)
   */
  @Get('map')
  @ApiOperation({ summary: 'Get learning map (Figma 5.1)' })
  @ApiResponse({ status: 200, description: 'Learning map with units and skills' })
  async getMap(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getMap(userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/units/{unitId}/skills
   * Get skills for a unit
   */
  @Get('units/:unitId/skills')
  @ApiOperation({ summary: 'Get skills for a unit' })
  @ApiParam({ name: 'unitId', type: String })
  @ApiResponse({ status: 200, description: 'List of skills in the unit' })
  async getSkillsForUnit(@Param('unitId') unitId: string, @UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getSkillsForUnit(unitId, userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/skills/{skillId}/modes
   * Get available modes for a skill (Figma 5.2)
   */
  @Get('skills/:skillId/modes')
  @ApiOperation({ summary: 'Get available modes for a skill (Figma 5.2)' })
  @ApiParam({ name: 'skillId', type: String })
  @ApiResponse({ status: 200, description: 'Available and locked modes for the skill' })
  async getModesForSkill(@Param('skillId') skillId: string, @UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getModesForSkill(skillId, userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/lessons/{lessonId}
   * Get lesson detail (Figma 5.3)
   */
  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get lesson detail (Figma 5.3)' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiResponse({ status: 200, description: 'Lesson detail' })
  getLessonDetail(@Param('lessonId') lessonId: string) {
    const result = this.learningService.getLessonDetail(lessonId);
    return successResponse(result);
  }

  /**
   * GET /learning/lessons/{lessonId}/modes
   * Get mode states for a lesson (bestScore/state/completedAt for this userId)
   */
  @Get('lessons/:lessonId/modes')
  @ApiOperation({ summary: 'Get mode states for a lesson' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiResponse({ status: 200, description: 'Mode states with bestScore, state, completedAt' })
  async getLessonModes(@Param('lessonId') lessonId: string, @UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getLessonModes(lessonId, userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/lessons/{lessonId}/overview
   * Get lesson overview (Figma 5.4)
   */
  @Get('lessons/:lessonId/overview')
  @ApiOperation({ summary: 'Get lesson overview (Figma 5.4)' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiQuery({ name: 'mode', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lesson overview with XP, time, questions' })
  async getLessonOverview(
    @Param('lessonId') lessonId: string,
    @Query('mode') mode: string | undefined,
    @UserId() userId: string,
  ) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getLessonOverview(lessonId, mode, userIdNum);
    return successResponse(result);
  }

  /**
   * POST /learning/lessons/{lessonId}/start
   * Start a lesson
   */
  @Post('lessons/:lessonId/start')
  @ApiOperation({ summary: 'Start a lesson' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiBody({ schema: { type: 'object', properties: { mode: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Lesson started' })
  async startLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: { mode?: string },
    @UserId() userId: string,
  ) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.startLesson(lessonId, userIdNum, body.mode);
    return successResponse(result);
  }

  /**
   * POST /learning/quiz/start
   * Start a quiz attempt (Figma 5.5)
   */
  @Post('quiz/start')
  @ApiOperation({ summary: 'Start a quiz attempt (Figma 5.5)' })
  @ApiBody({ type: StartQuizDto })
  @ApiResponse({ status: 200, description: 'Quiz started with first question' })
  async startQuiz(@Body() dto: StartQuizDto, @UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    try {
      const result = await this.learningService.startQuiz(dto.lessonId, userIdNum, dto.mode);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to start quiz' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /learning/quiz/{attemptId}/question
   * Get current question for quiz attempt
   */
  @Get('quiz/:attemptId/question')
  @ApiOperation({ summary: 'Get current question for quiz attempt' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({ status: 200, description: 'Current question' })
  async getQuizQuestion(@Param('attemptId') attemptId: string, @UserId() userId: string) {
    try {
      const userIdNum = this.parseUserId(userId);
      const result = await this.learningService.getQuizQuestion(attemptId, userIdNum);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message || 'Question not found' } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * POST /learning/quiz/{attemptId}/answer
   * Submit answer for current question (Figma 5.6)
   */
  @Post('quiz/:attemptId/answer')
  @ApiOperation({ summary: 'Submit answer for current question (Figma 5.6)' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiBody({ type: SubmitAnswerDto })
  @ApiResponse({ status: 200, description: 'Answer result with correctness and explanation' })
  async submitQuizAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAnswerDto,
    @UserId() userId: string,
  ) {
    const userIdNum = this.parseUserId(userId);
    try {
      const result = await this.learningService.submitQuizAnswer(attemptId, dto.answer, userIdNum);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to submit answer' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /learning/quiz/{attemptId}/next
   * Move to next question
   */
  @Post('quiz/:attemptId/next')
  @ApiOperation({ summary: 'Move to next question' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({ status: 200, description: 'Next question' })
  async nextQuestion(@Param('attemptId') attemptId: string, @UserId() userId: string) {
    try {
      const userIdNum = this.parseUserId(userId);
      const result = await this.learningService.nextQuestion(attemptId, userIdNum);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message || 'Question not found' } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * POST /learning/quiz/{attemptId}/finish
   * Finish quiz attempt
   */
  @Post('quiz/:attemptId/finish')
  @ApiOperation({ summary: 'Finish quiz attempt' })
  @ApiParam({ name: 'attemptId', type: String })
  @ApiResponse({ status: 200, description: 'Quiz finished with results' })
  async finishQuiz(@Param('attemptId') attemptId: string, @UserId() userId: string) {
    try {
      const userIdNum = this.parseUserId(userId);
      const result = await this.learningService.finishQuiz(attemptId, userIdNum);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to finish quiz' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /learning/hearts
   * Get user hearts status
   */
  @Get('hearts')
  @ApiOperation({ summary: 'Get user hearts status' })
  @ApiResponse({ status: 200, description: 'Current hearts and regen info' })
  async getHearts(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getHearts(userIdNum);
    return successResponse(result);
  }

  /**
   * POST /learning/hearts/consume
   * Consume a heart
   */
  @Post('hearts/consume')
  @ApiOperation({ summary: 'Consume a heart' })
  @ApiResponse({ status: 200, description: 'Heart consumed' })
  async consumeHeart(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    try {
      const result = await this.learningService.consumeHeart(userIdNum);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Cannot consume heart' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /learning/hearts/recover
   * Recover hearts (practice to earn)
   */
  @Post('hearts/recover')
  @ApiOperation({ summary: 'Recover hearts (practice to earn)' })
  @ApiResponse({ status: 200, description: 'Hearts recovered' })
  async recoverHearts(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.recoverHearts(userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/practice/hub
   * Get practice hub data (Figma 5.8)
   */
  @Get('practice/hub')
  @ApiOperation({ summary: 'Get practice hub data (Figma 5.8)' })
  @ApiResponse({ status: 200, description: 'Practice hub with weak skills and mistakes' })
  async getPracticeHub(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.learningService.getPracticeHub(userIdNum);
    return successResponse(result);
  }

  /**
   * POST /learning/practice/start
   * Start a practice session
   */
  @Post('practice/start')
  @ApiOperation({ summary: 'Start a practice session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        practiceType: { type: 'string' },
        targetId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Practice session started' })
  async startPractice(
    @Body() body: { practiceType: string; targetId?: string },
    @UserId() userId: string,
  ) {
    const userIdNum = this.parseUserId(userId);
    try {
      const result = await this.learningService.startPractice(body.practiceType, userIdNum, body.targetId);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to start practice' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Helper method to parse userId string to number
   * Supports formats: "1", "user_1", "user-1"
   */
  private parseUserId(userId: string): number {
    // Try direct number
    const directNum = parseInt(userId, 10);
    if (!isNaN(directNum)) {
      return directNum;
    }

    // Try "user_1" or "user-1" format
    const match = userId.match(/^user[_-]?(\d+)$/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Fallback to 1 if format is invalid (should not happen due to guard validation)
    return 1;
  }
}

