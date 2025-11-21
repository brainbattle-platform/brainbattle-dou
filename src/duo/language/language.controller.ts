import { Controller, Get } from '@nestjs/common';
import { LanguageService } from './language.service';

@Controller('duo/languages')
export class LanguageController {
  constructor(private readonly service: LanguageService) {}

  @Get('health')
  health() {
    return {
      module: 'language',
      status: 'ok',
      note: 'Languages & CEFR levels',
    };
  }
}
