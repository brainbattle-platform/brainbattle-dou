import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('duo/progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  getProgress() {
    return this.service.getProgress(1);
  }

  @Get('health')
  health() {
    return {
      module: 'progress',
      status: 'ok',
      note: 'User progress & mastery',
    };
  }
}
