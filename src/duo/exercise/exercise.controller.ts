import { Controller, Get } from '@nestjs/common';
import { ExerciseService } from './exercise.service';

@Controller('duo/exercises')
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get('health')
  health() {
    return {
      module: 'exercise',
      status: 'ok',
      note: 'Exercise/question engine',
    };
  }
}
