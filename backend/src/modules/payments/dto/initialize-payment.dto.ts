import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @IsUUID()
  invoiceId!: string;

  @IsOptional()
  @IsString()
  applicationToken?: string;

  @IsOptional()
  @IsIn(['mock', 'paystack', 'hubtel'])
  provider?: 'mock' | 'paystack' | 'hubtel';
}
