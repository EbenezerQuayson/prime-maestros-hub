import { IsIn, IsOptional, IsString } from 'class-validator';

export class SimulateMockPaymentDto {
  @IsString()
  reference!: string;

  @IsIn(['SUCCESS', 'FAILED', 'ABANDONED'])
  outcome!: 'SUCCESS' | 'FAILED' | 'ABANDONED';

  @IsOptional()
  @IsString()
  channel?: string;
}
