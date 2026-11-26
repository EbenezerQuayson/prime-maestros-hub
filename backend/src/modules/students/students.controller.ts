import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { StudentsService } from './students.service';

@Roles(Role.STUDENT)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.studentsService.updateMyProfile(user.id, dto);
  }

  @Get('me/courses')
  getMyCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyCourses(user.id);
  }
}
