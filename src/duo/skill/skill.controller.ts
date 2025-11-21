import { Controller, Get } from '@nestjs/common';
import { SkillService } from './skill.service';

@Controller('duo/skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Get('health')
  health() {
    return {
      module: 'skill',
      status: 'ok',
      note: 'Skill tree nodes grouped under course',
    };
  }
}
