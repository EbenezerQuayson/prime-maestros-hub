import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApplicationStatus, Role } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminApplicationsService } from './admin-applications.service';
import { ApproveApplicationDto } from './dto/approve-application.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { RequestInfoDto } from './dto/request-info.dto';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(
    private readonly adminApplicationsService: AdminApplicationsService,
  ) {}

  @Get()
  list(
    @Query('status') status?: ApplicationStatus,
    @Query('instrumentId') instrumentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminApplicationsService.listApplications({
      status,
      instrumentId,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminApplicationsService.getApplicationDetail(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminApplicationsService.approveApplication(
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminApplicationsService.rejectApplication(
      id,
      dto.reason,
      user.id,
      req.ip,
    );
  }

  @Post(':id/request-info')
  @HttpCode(HttpStatus.OK)
  requestInfo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RequestInfoDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminApplicationsService.requestInformation(
      id,
      dto.message,
      user.id,
      req.ip,
    );
  }
}
