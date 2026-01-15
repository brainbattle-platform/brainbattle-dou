import { Controller, Get } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/review')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get('health')
  @ApiOperation({ summary: 'Review module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'review',
      status: 'ok',
      note: 'Review & SRS tasks',
    };
  }
}
