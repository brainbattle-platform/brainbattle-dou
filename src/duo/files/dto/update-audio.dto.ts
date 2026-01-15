import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAudioDto {
  @ApiProperty({ description: 'New filename', example: 'lesson-1-audio.mp3', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  filename?: string;
}

