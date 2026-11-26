import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const PHONE_REGEX = /^\+?[0-9\s\-()]{9,20}$/;

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'Please provide a valid emergency contact phone number',
  })
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  emergencyContactRelationship?: string;
}
