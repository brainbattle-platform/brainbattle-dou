import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminAnalyticsService } from './admin-analytics.service';
import { successResponse } from '../../common/utils/response.util';

@ApiTags('Admin Analytics')
@Controller('admin/learning')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  /**
   * GET /admin/learning/summary
   * Get admin summary statistics
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get admin summary statistics' })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin summary statistics',
    schema: {
      example: {
        usersTotal: 150,
        usersActive7d: 45,
        attemptsTotal: 1250,
        attemptsInRange: 320,
        completionsInRange: 280,
        avgAccuracyInRange: 0.82,
      },
    },
  })
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.analyticsService.getSummary(from, to);
    return successResponse(result);
  }

  /**
   * GET /admin/learning/timeseries/attempts
   * Get timeseries data for attempts
   */
  @Get('timeseries/attempts')
  @ApiOperation({ summary: 'Get timeseries data for attempts' })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeseries data for attempts',
    schema: {
      example: {
        points: [
          { date: '2024-01-15', attempts: 123, completions: 45 },
          { date: '2024-01-16', attempts: 145, completions: 52 },
        ],
      },
    },
  })
  async getAttemptsTimeseries(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.analyticsService.getAttemptsTimeseries(from, to);
    return successResponse(result);
  }

  /**
   * GET /admin/learning/top-lessons
   * Get top lessons by metric
   */
  @Get('top-lessons')
  @ApiOperation({ summary: 'Get top lessons by metric' })
  @ApiQuery({
    name: 'metric',
    required: false,
    enum: ['attempts', 'completions'],
    description: 'Metric to rank by',
    example: 'attempts',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of lessons to return (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top lessons by metric',
    schema: {
      example: {
        items: [
          { lessonId: 'lesson-1-1', count: 245 },
          { lessonId: 'lesson-1-2', count: 189 },
        ],
      },
    },
  })
  async getTopLessons(
    @Query('metric') metric?: string,
    @Query('limit') limit?: string,
  ) {
    const metricType = (metric === 'completions' ? 'completions' : 'attempts') as 'attempts' | 'completions';
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.analyticsService.getTopLessons(metricType, limitNum);
    return successResponse(result);
  }

  /**
   * GET /admin/learning/users/:userId/overview
   * Get user learning overview (admin view)
   */
  @Get('users/:userId/overview')
  @ApiOperation({ summary: 'Get user learning overview (admin view)' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User learning overview',
    schema: {
      example: {
        userId: 1,
        hearts: {
          current: 5,
          max: 5,
        },
        streakDays: 5,
        unitsCompleted: 2,
        planetsCompleted: 3,
        lastActiveAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getUserOverview(@Param('userId') userId: string) {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      throw new HttpException('Invalid userId', HttpStatus.BAD_REQUEST);
    }
    const result = await this.analyticsService.getUserOverview(userIdNum);
    return successResponse(result);
  }

  /**
   * GET /admin/learning/users/:userId/attempts
   * Get user attempts (admin view)
   */
  @Get('users/:userId/attempts')
  @ApiOperation({ summary: 'Get user attempts (admin view)' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of attempts to return (default: 50, max: 100)',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'User attempts',
    schema: {
      example: {
        items: [
          {
            attemptId: 'clxyz123',
            lessonId: 'lesson-1-1',
            mode: 'reading',
            score: 8,
            total: 10,
            accuracy: 0.8,
            durationSec: 120,
            completedAt: '2024-01-15T10:30:00.000Z',
            startedAt: '2024-01-15T10:28:00.000Z',
          },
        ],
      },
    },
  })
  async getUserAttempts(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      throw new HttpException('Invalid userId', HttpStatus.BAD_REQUEST);
    }
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const items = await this.analyticsService.getUserAttempts(userIdNum, limitNum);
    return successResponse({ items });
  }
}

