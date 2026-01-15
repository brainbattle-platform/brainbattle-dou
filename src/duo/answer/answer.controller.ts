import { Body, Controller, Param, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SubmitAnswerSessionDto } from './dto/submit-answer-session.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { successResponse } from '../../common/utils/response.util';

@ApiTags('Learning (Legacy - In-Memory)')
@Controller('duo')
export class AnswerController {
  constructor(private readonly service: AnswerService) {}

  @Post('sessions/:sessionId/answer')
  @ApiOperation({ summary: 'Submit answer for a question (Figma 5.6) [LEGACY - In-Memory]' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiResponse({ status: 200, description: 'Answer submitted with result and next question' })
  submitAnswerBySession(@Param('sessionId') sessionId: string, @Body() dto: SubmitAnswerSessionDto) {
    try {
      const result = this.service.submitAnswerBySession(sessionId, dto);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to submit answer' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('lessons/:lessonId/answer')
  @ApiOperation({ summary: 'Submit answer for an exercise [LEGACY - In-Memory]' })
  @ApiParam({ name: 'lessonId', type: String })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  submitAnswer(@Param('lessonId') lessonId: string, @Body() dto: SubmitAnswerDto) {
    try {
      const result = this.service.submitAnswer(lessonId, dto);
      return successResponse(result);
    } catch (error: any) {
      throw new HttpException(
        { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to submit answer' } },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
