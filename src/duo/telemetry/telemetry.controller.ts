import { Controller, Get } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('duo/telemetry')
export class TelemetryController {
  constructor(private readonly service: TelemetryService) {}

  @Get('health')
  health() {
    return {
      module: 'telemetry',
      status: 'ok',
      note: 'Telemetry & learning analytics',
    };
  }
}
