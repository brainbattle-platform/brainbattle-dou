import { Module } from '@nestjs/common';
import { AudioAssetsController } from './audio-assets.controller';
import { AudioAssetsService } from './audio-assets.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StorageModule } from '../../../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AudioAssetsController],
  providers: [AudioAssetsService],
  exports: [AudioAssetsService],
})
export class AudioAssetsModule {}

