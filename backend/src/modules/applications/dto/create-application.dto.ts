import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  Equals,
} from 'class-validator';

const PHONE_REGEX = /^\+?[0-9\s\-()]{9,20}$/;

export class CreateApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'Please provide a valid phone number (e.g. +233 24 000 0000)',
  })
  phone!: string;

  @IsUUID()
  instrumentId!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

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
  @MaxLength(80)
  experienceLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goals?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  availability?: string;

  @IsBoolean()
  @Equals(true, {
    message: 'You must confirm consent and academy terms to submit an application',
  })
  consentAccepted!: boolean;
}
