import { Controller, Get } from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/recommend')
export class RecommendController {
  constructor(private readonly service: RecommendService) {}

  @Get('health')
  @ApiOperation({ summary: 'Recommend module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'recommend',
      status: 'ok',
      note: 'Recommendation / next lesson',
    };
  }
}
