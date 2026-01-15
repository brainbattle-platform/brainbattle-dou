import { Controller, Get } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/exercises')
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Exercise module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'exercise',
      status: 'ok',
      note: 'Exercise/question engine',
    };
  }
}
