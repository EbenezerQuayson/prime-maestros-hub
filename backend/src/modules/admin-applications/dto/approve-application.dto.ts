import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ApproveApplicationDto {
  @IsUUID()
  programId!: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionReason?: string;
}
