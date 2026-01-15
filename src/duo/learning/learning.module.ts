import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { LearningProfileController } from './profile/learning-profile.controller';
import { LearningProfileService } from './profile/learning-profile.service';
import { LessonModule } from '../lesson/lesson.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { ProgressModule } from '../progress/progress.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [LessonModule, ExerciseModule, ProgressModule, PrismaModule, StorageModule],
  controllers: [LearningController, LearningProfileController],
  providers: [LearningService, LearningProfileService],
  exports: [LearningService],
})
export class LearningModule {}

