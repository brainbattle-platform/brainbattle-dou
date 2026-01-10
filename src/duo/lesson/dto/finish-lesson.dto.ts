import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinishLessonDto {
  @ApiProperty({ description: 'Session ID to finish', example: 'sess_7f2c1f1e' })
  @IsString()
  sessionId: string;
}