import { Controller, Get } from '@nestjs/common';
import { CourseService } from './course.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Course module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'course',
      status: 'ok',
      note: 'Courses for each language',
    };
  }
}
