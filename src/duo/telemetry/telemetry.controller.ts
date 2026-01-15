import { Controller, Get } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Learning (Legacy - DEBUG)')
@Controller('duo/telemetry')
export class TelemetryController {
  constructor(private readonly service: TelemetryService) {}

  @Get('health')
  @ApiOperation({ summary: 'Telemetry module health check [LEGACY - DEBUG]' })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return {
      module: 'telemetry',
      status: 'ok',
      note: 'Telemetry & learning analytics',
    };
  }
}
