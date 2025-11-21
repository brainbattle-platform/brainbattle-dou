import { Controller, Get } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('duo/courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Get('health')
  health() {
    return {
      module: 'course',
      status: 'ok',
      note: 'Courses for each language',
    };
  }
}
