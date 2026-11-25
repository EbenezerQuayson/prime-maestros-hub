import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getApiInfo() {
    return {
      name: 'Prime Maestros Hub API',
      version: 'v1',
      status: 'ok',
      endpoints: {
        health: '/api/v1/health',
        instruments: '/api/v1/instruments',
        auth: '/api/v1/auth',
      },
    };
  }
}
