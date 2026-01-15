import { ApiProperty } from '@nestjs/swagger';

export class CreateAudioDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Audio file (mp3, wav, m4a)' })
  file: Express.Multer.File;
}

