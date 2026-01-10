import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DbController } from './db.controller';

@Global()
@Module({
  controllers: [DbController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}