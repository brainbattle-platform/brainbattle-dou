import { Controller, Get, Param, ParseIntPipe, Req } from '@nestjs/common';
import { LessonService } from './lesson.service';

@Controller('duo')
export class LessonController {
  constructor(private readonly service: LessonService) {}

  @Get('skills/:skillId/lessons')
  getLessonsBySkill(
    @Param('skillId', ParseIntPipe) skillId: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'demo-user';
    return this.service.getLessonsBySkill(skillId, userId);
  }

  @Get('lessons/:id')
  getLessonDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getLessonDetail(id);
  }
}
