import { Module } from '@nestjs/common';
import { AdminStudentsController } from './admin-students.controller';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController, AdminStudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
