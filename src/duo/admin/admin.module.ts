import { Module } from '@nestjs/common';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [PrismaModule, ProgressModule],
  controllers: [AdminContentController, AdminAnalyticsController],
  providers: [AdminContentService, AdminAnalyticsService],
  exports: [AdminContentService, AdminAnalyticsService],
})
export class AdminModule {}

