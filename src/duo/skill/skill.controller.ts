import { Controller, Get } from '@nestjs/common';
import { SkillService } from './skill.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Get('health')
  @ApiOperation({ summary: 'Skill module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'skill',
      status: 'ok',
      note: 'Skill tree nodes grouped under course',
    };
  }
}
