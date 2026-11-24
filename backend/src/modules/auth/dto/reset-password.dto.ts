import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsString()
  @MinLength(10)
  newPassword!: string;
}
