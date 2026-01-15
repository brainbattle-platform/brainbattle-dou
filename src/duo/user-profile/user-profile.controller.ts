import { Controller, Get } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/user-profile')
export class UserProfileController {
  constructor(private readonly service: UserProfileService) {}

  @Get('health')
  @ApiOperation({ summary: 'User profile module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'user-profile',
      status: 'ok',
      note: 'User profile & settings + XP/Streak',
    };
  }
}
