import { Module } from '@nestjs/common';
import { UserProfileModule } from './duo/user-profile/user-profile.module';
import { LanguageModule } from './duo/language/language.module';
import { CourseModule } from './duo/course/course.module';
import { SkillModule } from './duo/skill/skill.module';
import { LessonModule } from './duo/lesson/lesson.module';
import { ExerciseModule } from './duo/exercise/exercise.module';
import { AnswerModule } from './duo/answer/answer.module';
import { ProgressModule } from './duo/progress/progress.module';
import { ReviewModule } from './duo/review/review.module';
import { RecommendModule } from './duo/recommend/recommend.module';
import { TelemetryModule } from './duo/telemetry/telemetry.module';
import { NotificationModule } from './duo/notification/notification.module';

@Module({
  imports: [
    UserProfileModule,
    LanguageModule,
    CourseModule,
    SkillModule,
    LessonModule,
    ExerciseModule,
    AnswerModule,
    ProgressModule,
    ReviewModule,
    RecommendModule,
    TelemetryModule,
    NotificationModule,
  ],
})
export class AppModule {}
