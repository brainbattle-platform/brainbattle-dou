import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { ExerciseModule } from '../exercise/exercise.module';
import { ProgressModule } from '../progress/progress.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [ExerciseModule, ProgressModule, PrismaModule, StorageModule],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {}
