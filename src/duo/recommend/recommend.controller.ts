import { Controller, Get } from '@nestjs/common';
import { RecommendService } from './recommend.service';

@Controller('duo/recommend')
export class RecommendController {
  constructor(private readonly service: RecommendService) {}

  @Get('health')
  health() {
    return {
      module: 'recommend',
      status: 'ok',
      note: 'Recommendation / next lesson',
    };
  }
}
