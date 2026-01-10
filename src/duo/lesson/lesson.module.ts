import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { ExerciseModule } from '../exercise/exercise.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ExerciseModule, ProgressModule],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
