import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Public()
  @Get()
  findAll() {
    return this.programsService.findAllActive();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.programsService.findBySlug(slug);
  }
}
