import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('duo/notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('health')
  health() {
    return {
      module: 'notification',
      status: 'ok',
      note: 'Notification & reminders',
    };
  }
}
