import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@Controller('webhooks/payments')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  handleProviderWebhook(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() payload: Record<string, unknown>,
  ) {
    const rawBody =
      req.rawBody instanceof Buffer
        ? req.rawBody
        : Buffer.from(JSON.stringify(payload ?? {}), 'utf8');

    return this.paymentsService.handleWebhook(
      provider,
      rawBody,
      headers,
      payload,
      req.ip,
    );
  }
}
