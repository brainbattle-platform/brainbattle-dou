import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { InMemoryStateService } from './in-memory-state.service';
import { HeartsService } from './hearts.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressService, InMemoryStateService, HeartsService],
  exports: [ProgressService, InMemoryStateService, HeartsService],
})
export class ProgressModule {}
