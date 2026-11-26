import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestInfoDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  message!: string;
}
