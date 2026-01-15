import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LearningProfileService } from './learning-profile.service';
import { successResponse } from '../../../common/utils/response.util';
import { ApiUserIdHeader } from '../../../common/swagger/api-user-id-header.decorator';
import { UserIdGuard } from '../../../common/guards/user-id.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';

@ApiTags('Learning Profile')
@ApiUserIdHeader()
@UseGuards(UserIdGuard)
@Controller('learning/profile')
export class LearningProfileController {
  constructor(private readonly profileService: LearningProfileService) {}

  /**
   * GET /learning/profile/overview
   * Get learning profile overview with stats
   */
  @Get('overview')
  @ApiOperation({ summary: 'Get learning profile overview' })
  @ApiResponse({
    status: 200,
    description: 'Learning profile overview with stats',
    schema: {
      example: {
        userId: 1,
        streakDays: 5,
        hearts: {
          current: 5,
          max: 5,
        },
        unitsCompleted: 2,
        totalUnits: 20,
        planetsCompleted: 3,
        lessonsCompleted: 12,
        avgAccuracy7d: 0.85,
        lastActiveAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getOverview(@UserId() userId: string) {
    const userIdNum = this.parseUserId(userId);
    const result = await this.profileService.getOverview(userIdNum);
    return successResponse(result);
  }

  /**
   * GET /learning/profile/recent-attempts
   * Get recent quiz attempts
   */
  @Get('recent-attempts')
  @ApiOperation({ summary: 'Get recent quiz attempts' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of attempts to return (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent quiz attempts',
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
          },
          {
            attemptId: 'clxyz124',
            lessonId: 'lesson-1-2',
            mode: 'listening',
            score: 9,
            total: 10,
            accuracy: 0.9,
            durationSec: 180,
            completedAt: '2024-01-14T15:20:00.000Z',
          },
        ],
      },
    },
  })
  async getRecentAttempts(
    @UserId() userId: string,
    @Query('limit') limit?: string,
  ) {
    const userIdNum = this.parseUserId(userId);
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const items = await this.profileService.getRecentAttempts(userIdNum, limitNum);
    return successResponse({ items });
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

