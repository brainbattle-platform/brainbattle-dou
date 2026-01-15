import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { AdminContentService } from './admin-content.service';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  BulkReorderUnitsDto,
  BulkReorderLessonsDto,
  BulkReorderQuestionsDto,
} from './dto/bulk-reorder.dto';
import { successResponse } from '../../common/utils/response.util';

@ApiTags('Learning Admin')
@Controller('admin/learning')
@UseGuards(AdminKeyGuard)
export class AdminContentController {
  constructor(private readonly service: AdminContentService) {}

  // ============================================
  // Unit CRUD
  // ============================================

  @Post('units')
  @ApiOperation({ summary: 'Create a new unit' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: CreateUnitDto })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., unitId already exists)' })
  async createUnit(@Body() dto: CreateUnitDto) {
    try {
      const unit = await this.service.createUnit(dto);
      return successResponse(unit);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('units')
  @ApiOperation({ summary: 'Get all units' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean, description: 'Filter by published status' })
  @ApiResponse({ status: 200, description: 'List of units' })
  async findAllUnits(@Query('publishedOnly') publishedOnly?: string) {
    const published = publishedOnly === 'true';
    const units = await this.service.findAllUnits(published);
    return successResponse(units);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get unit by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Unit details' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async findUnitById(@Param('id') id: string) {
    try {
      const unit = await this.service.findUnitById(id);
      return successResponse(unit);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update unit by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateUnitDto })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    try {
      const unit = await this.service.updateUnit(id, dto);
      return successResponse(unit);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Delete unit by Prisma PK (id) - fails if unit has lessons' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete unit with lessons' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async deleteUnit(@Param('id') id: string) {
    try {
      await this.service.deleteUnit(id);
      return successResponse({ message: 'Unit deleted successfully' });
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Post('units/:id/publish')
  @ApiOperation({ summary: 'Publish unit by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Unit published' })
  async publishUnit(@Param('id') id: string) {
    const unit = await this.service.publishUnit(id);
    return successResponse(unit);
  }

  @Post('units/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish unit by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Unit unpublished' })
  async unpublishUnit(@Param('id') id: string) {
    const unit = await this.service.unpublishUnit(id);
    return successResponse(unit);
  }

  @Put('units/:id/order')
  @ApiOperation({ summary: 'Update unit order by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Unit order updated' })
  async updateUnitOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const unit = await this.service.updateUnitOrder(id, dto.order);
    return successResponse(unit);
  }

  // ============================================
  // Unit CRUD by Business Key (unitId)
  // ============================================

  @Get('units/by-unitId/:unitId')
  @ApiOperation({ summary: 'Get unit by business key (unitId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'unitId', type: String, description: 'Business key (e.g., "unit-1")' })
  @ApiResponse({ status: 200, description: 'Unit details' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async findUnitByUnitId(@Param('unitId') unitId: string) {
    try {
      const unit = await this.service.findUnitByUnitId(unitId);
      return successResponse(unit);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('units/by-unitId/:unitId')
  @ApiOperation({ summary: 'Update unit by business key (unitId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'unitId', type: String, description: 'Business key (e.g., "unit-1")' })
  @ApiBody({ type: UpdateUnitDto })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async updateUnitByUnitId(@Param('unitId') unitId: string, @Body() dto: UpdateUnitDto) {
    try {
      const unit = await this.service.updateUnitByUnitId(unitId, dto);
      return successResponse(unit);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('units/by-unitId/:unitId')
  @ApiOperation({ summary: 'Delete unit by business key (unitId) - fails if unit has lessons' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'unitId', type: String, description: 'Business key (e.g., "unit-1")' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete unit with lessons' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async deleteUnitByUnitId(@Param('unitId') unitId: string) {
    try {
      await this.service.deleteUnitByUnitId(unitId);
      return successResponse({ message: 'Unit deleted successfully' });
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  // ============================================
  // Bulk Reorder
  // ============================================

  @Post('units/reorder')
  @ApiOperation({ summary: 'Bulk reorder units (accepts either id or unitId per item)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: BulkReorderUnitsDto })
  @ApiResponse({ status: 200, description: 'Units reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkReorderUnits(@Body() dto: BulkReorderUnitsDto) {
    try {
      const units = await this.service.bulkReorderUnits(dto);
      return successResponse(units);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============================================
  // Lesson CRUD
  // ============================================

  @Post('lessons')
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createLesson(@Body() dto: CreateLessonDto) {
    try {
      const lesson = await this.service.createLesson(dto);
      return successResponse(lesson);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get all lessons' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiQuery({ name: 'unitId', required: false, type: String, description: 'Filter by unit ID' })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean, description: 'Filter by published status' })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  async findAllLessons(
    @Query('unitId') unitId?: string,
    @Query('publishedOnly') publishedOnly?: string,
  ) {
    const published = publishedOnly === 'true';
    const lessons = await this.service.findAllLessons(unitId, published);
    return successResponse(lessons);
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Lesson details' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findLessonById(@Param('id') id: string) {
    try {
      const lesson = await this.service.findLessonById(id);
      return successResponse(lesson);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('lessons/:id')
  @ApiOperation({ summary: 'Update lesson by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    try {
      const lesson = await this.service.updateLesson(id, dto);
      return successResponse(lesson);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('lessons/:id')
  @ApiOperation({ summary: 'Delete lesson by Prisma PK (id) - fails if lesson has questions' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete lesson with questions' })
  async deleteLesson(@Param('id') id: string) {
    try {
      await this.service.deleteLesson(id);
      return successResponse({ message: 'Lesson deleted successfully' });
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('lessons/:id/publish')
  @ApiOperation({ summary: 'Publish lesson by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Lesson published' })
  async publishLesson(@Param('id') id: string) {
    const lesson = await this.service.publishLesson(id);
    return successResponse(lesson);
  }

  @Post('lessons/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish lesson by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Lesson unpublished' })
  async unpublishLesson(@Param('id') id: string) {
    const lesson = await this.service.unpublishLesson(id);
    return successResponse(lesson);
  }

  @Put('lessons/:id/order')
  @ApiOperation({ summary: 'Update lesson order by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Lesson order updated' })
  async updateLessonOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const lesson = await this.service.updateLessonOrder(id, dto.order);
    return successResponse(lesson);
  }

  // ============================================
  // Lesson CRUD by Business Key (lessonId)
  // ============================================

  @Get('lessons/by-lessonId/:lessonId')
  @ApiOperation({ summary: 'Get lesson by business key (lessonId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'lessonId', type: String, description: 'Business key (e.g., "lesson-1-1")' })
  @ApiResponse({ status: 200, description: 'Lesson details' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findLessonByLessonId(@Param('lessonId') lessonId: string) {
    try {
      const lesson = await this.service.findLessonByLessonId(lessonId);
      return successResponse(lesson);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('lessons/by-lessonId/:lessonId')
  @ApiOperation({ summary: 'Update lesson by business key (lessonId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'lessonId', type: String, description: 'Business key (e.g., "lesson-1-1")' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async updateLessonByLessonId(@Param('lessonId') lessonId: string, @Body() dto: UpdateLessonDto) {
    try {
      const lesson = await this.service.updateLessonByLessonId(lessonId, dto);
      return successResponse(lesson);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('lessons/by-lessonId/:lessonId')
  @ApiOperation({ summary: 'Delete lesson by business key (lessonId) - fails if lesson has questions' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'lessonId', type: String, description: 'Business key (e.g., "lesson-1-1")' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete lesson with questions' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async deleteLessonByLessonId(@Param('lessonId') lessonId: string) {
    try {
      await this.service.deleteLessonByLessonId(lessonId);
      return successResponse({ message: 'Lesson deleted successfully' });
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Post('lessons/reorder')
  @ApiOperation({ summary: 'Bulk reorder lessons (accepts either id or lessonId per item)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: BulkReorderLessonsDto })
  @ApiResponse({ status: 200, description: 'Lessons reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkReorderLessons(@Body() dto: BulkReorderLessonsDto) {
    try {
      const lessons = await this.service.bulkReorderLessons(dto);
      return successResponse(lessons);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============================================
  // Question CRUD
  // ============================================

  @Post('questions')
  @ApiOperation({ summary: 'Create a new question' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createQuestion(@Body() dto: CreateQuestionDto) {
    try {
      const question = await this.service.createQuestion(dto);
      return successResponse(question);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('questions')
  @ApiOperation({ summary: 'Get all questions' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiQuery({ name: 'lessonId', required: false, type: String, description: 'Filter by lesson ID' })
  @ApiQuery({ name: 'mode', required: false, type: String, description: 'Filter by mode' })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean, description: 'Filter by published status' })
  @ApiResponse({ status: 200, description: 'List of questions' })
  async findAllQuestions(
    @Query('lessonId') lessonId?: string,
    @Query('mode') mode?: string,
    @Query('publishedOnly') publishedOnly?: string,
  ) {
    const published = publishedOnly === 'true';
    const questions = await this.service.findAllQuestions(lessonId, mode, published);
    return successResponse(questions);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get question by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findQuestionById(@Param('id') id: string) {
    try {
      const question = await this.service.findQuestionById(id);
      return successResponse(question);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Update question by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  async updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    try {
      const question = await this.service.updateQuestion(id, dto);
      return successResponse(question);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete question by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  async deleteQuestion(@Param('id') id: string) {
    try {
      await this.service.deleteQuestion(id);
      return successResponse({ message: 'Question deleted successfully' });
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('questions/:id/publish')
  @ApiOperation({ summary: 'Publish question by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Question published' })
  async publishQuestion(@Param('id') id: string) {
    const question = await this.service.publishQuestion(id);
    return successResponse(question);
  }

  @Post('questions/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish question by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiResponse({ status: 200, description: 'Question unpublished' })
  async unpublishQuestion(@Param('id') id: string) {
    const question = await this.service.unpublishQuestion(id);
    return successResponse(question);
  }

  @Put('questions/:id/order')
  @ApiOperation({ summary: 'Update question order by Prisma PK (id)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'id', type: String, description: 'Prisma primary key (cuid/uuid)' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Question order updated' })
  async updateQuestionOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    const question = await this.service.updateQuestionOrder(id, dto.order);
    return successResponse(question);
  }

  // ============================================
  // Question CRUD by Business Key (questionId)
  // ============================================

  @Get('questions/by-questionId/:questionId')
  @ApiOperation({ summary: 'Get question by business key (questionId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'questionId', type: String, description: 'Business key (e.g., "q-listening-01")' })
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findQuestionByQuestionId(@Param('questionId') questionId: string) {
    try {
      const question = await this.service.findQuestionByQuestionId(questionId);
      return successResponse(question);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('questions/by-questionId/:questionId')
  @ApiOperation({ summary: 'Update question by business key (questionId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'questionId', type: String, description: 'Business key (e.g., "q-listening-01")' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestionByQuestionId(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    try {
      const question = await this.service.updateQuestionByQuestionId(questionId, dto);
      return successResponse(question);
    } catch (error: any) {
      const status = error.message.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(
        { error: { code: status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message } },
        status,
      );
    }
  }

  @Delete('questions/by-questionId/:questionId')
  @ApiOperation({ summary: 'Delete question by business key (questionId)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiParam({ name: 'questionId', type: String, description: 'Business key (e.g., "q-listening-01")' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteQuestionByQuestionId(@Param('questionId') questionId: string) {
    try {
      await this.service.deleteQuestionByQuestionId(questionId);
      return successResponse({ message: 'Question deleted successfully' });
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'NOT_FOUND', message: error.message } },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('questions/reorder')
  @ApiOperation({ summary: 'Bulk reorder questions (accepts either id or questionId per item)' })
  @ApiHeader({ name: 'x-admin-key', description: 'Admin key: dev-admin', required: true })
  @ApiBody({ type: BulkReorderQuestionsDto })
  @ApiResponse({ status: 200, description: 'Questions reordered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkReorderQuestions(@Body() dto: BulkReorderQuestionsDto) {
    try {
      const questions = await this.service.bulkReorderQuestions(dto);
      return successResponse(questions);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

