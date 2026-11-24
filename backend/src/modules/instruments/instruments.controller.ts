import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { InstrumentsService } from './instruments.service';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Public()
  @Get()
  findAll() {
    return this.instrumentsService.findAllActive();
  }
}
