import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateApplicationDto, @Req() req: Request) {
    return this.applicationsService.create(dto, req.ip);
  }

  @Public()
  @Get(':id/status')
  getStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('token') queryToken?: string,
    @Headers('x-application-token') headerToken?: string,
  ) {
    return this.applicationsService.getStatus(id, queryToken || headerToken);
  }
}
