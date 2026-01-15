import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Answer submitted by user (can be string, object for match, etc.)' })
  @IsNotEmpty()
  answer: string | object;
}

