import { Controller, Get } from '@nestjs/common';
import { LanguageService } from './language.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/languages')
export class LanguageController {
  constructor(private readonly service: LanguageService) {}

  @Get('health')
  @ApiOperation({ summary: 'Language module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'language',
      status: 'ok',
      note: 'Languages & CEFR levels',
    };
  }
}
