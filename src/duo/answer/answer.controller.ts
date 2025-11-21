import { Body, Controller, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('duo')
export class AnswerController {
  constructor(private readonly service: AnswerService) {}

  @Post('lessons/:lessonId/answer')
  submitAnswer(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: SubmitAnswerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'demo-user';
    return this.service.submitAnswer(userId, lessonId, dto);
  }
}
