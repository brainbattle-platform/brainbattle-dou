import { Module } from '@nestjs/common';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { ProgressModule } from '../progress/progress.module';
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [ProgressModule, ExerciseModule],
  controllers: [AnswerController],
  providers: [AnswerService],
})
export class AnswerModule {}
