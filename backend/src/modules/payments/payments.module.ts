import { Module } from '@nestjs/common';
import { HubtelGateway } from './gateways/hubtel.gateway';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { PaystackGateway } from './gateways/paystack.gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    PaystackGateway,
    HubtelGateway,
    MockPaymentGateway,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
