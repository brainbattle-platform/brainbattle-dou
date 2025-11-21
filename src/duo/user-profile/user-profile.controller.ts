import { Controller, Get } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';

@Controller('duo/user-profile')
export class UserProfileController {
  constructor(private readonly service: UserProfileService) {}

  @Get('health')
  health() {
    return {
      module: 'user-profile',
      status: 'ok',
      note: 'User profile & settings + XP/Streak',
    };
  }
}
