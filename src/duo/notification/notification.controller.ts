import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Notification module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'notification',
      status: 'ok',
      note: 'Notification & reminders',
    };
  }
}
