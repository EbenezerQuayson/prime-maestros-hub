import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { StudentsService } from './students.service';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminStudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('students')
  listStudents(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentsService.listStudents({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('students/:id')
  getStudent(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.studentsService.getStudentDetail(id);
  }

  @Patch('enrollments/:id')
  updateEnrollment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.studentsService.updateEnrollment(id, dto, user.id, req.ip);
  }
}
