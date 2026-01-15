import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - In-Memory)')
@Controller('duo/progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Get user progress [LEGACY - In-Memory]' })
  @ApiResponse({ status: 200, description: 'User progress data' })
  getProgress() {
    return this.service.getProgress(1);
  }

  @Get('health')
  @ApiOperation({ summary: 'Progress module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'progress',
      status: 'ok',
      note: 'User progress & mastery',
    };
  }
}
