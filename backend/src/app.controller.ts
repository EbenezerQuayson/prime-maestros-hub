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
        programs: '/api/v1/programs',
        instructors: '/api/v1/instructors',
        applications: '/api/v1/applications',
        payments: '/api/v1/payments',
        auth: '/api/v1/auth',
      },
    };
  }
}
