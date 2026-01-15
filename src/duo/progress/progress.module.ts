import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { InMemoryStateService } from './in-memory-state.service';
import { PrismaStateService } from './prisma-state.service';
import { HeartsService } from './hearts.service';
import { PrismaHeartsService } from './prisma-hearts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    InMemoryStateService, // Keep for backward compatibility
    PrismaStateService, // New Prisma-based service
    HeartsService, // Keep for backward compatibility
    PrismaHeartsService, // New Prisma-based service
    // Use PrismaStateService as the default export
    {
      provide: 'StateService',
      useClass: PrismaStateService,
    },
    {
      provide: 'HeartsService',
      useClass: PrismaHeartsService,
    },
  ],
  exports: [
    ProgressService,
    InMemoryStateService, // Keep for backward compatibility
    PrismaStateService, // Export new service
    HeartsService, // Keep for backward compatibility
    PrismaHeartsService, // Export new service
    'StateService', // Export as alias
    'HeartsService', // Export as alias
  ],
})
export class ProgressModule {}
