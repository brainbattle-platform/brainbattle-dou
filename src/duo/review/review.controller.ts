import { Controller, Get } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('duo/review')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get('health')
  health() {
    return {
      module: 'review',
      status: 'ok',
      note: 'Review & SRS tasks',
    };
  }
}
