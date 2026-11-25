import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  InitializeCheckoutInput,
  InitializeCheckoutOutput,
  ParsedWebhookEvent,
  PaymentGatewayAdapter,
  VerifiedTransactionResult,
} from './payment-gateway.interface';

/**
 * Local/dev payment adapter for exercising hosted checkout, signed webhooks,
 * and server-to-server verification before live merchant keys are configured.
 */
@Injectable()
export class MockPaymentGateway implements PaymentGatewayAdapter {
  // Stored as PAYSTACK in PaymentProvider enum with mock reference prefix,
  // or resolved via `mock` provider route for local testing.
  readonly provider = PaymentProvider.PAYSTACK;
  private readonly mockResults = new Map<
    string,
    {
      status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABANDONED';
      amountPesewas: number;
      currency: string;
      channel?: string;
    }
  >();

  constructor(private readonly configService: ConfigService) {}

  async initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<InitializeCheckoutOutput> {
    this.mockResults.set(input.reference, {
      status: 'PENDING',
      amountPesewas: input.amountPesewas,
      currency: input.currency,
    });

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const params = new URLSearchParams({
      reference: input.reference,
      invoiceId: input.invoiceId,
      invoiceNumber: input.invoiceNumber,
      amountPesewas: String(input.amountPesewas),
      currency: input.currency,
      callbackUrl: input.callbackUrl,
    });

    return {
      authorizationUrl: `${frontendUrl}/mock-checkout?${params.toString()}`,
      accessCode: `mock_${input.reference}`,
      providerReference: input.reference,
      rawPayload: { mode: 'mock', reference: input.reference },
    };
  }

  recordSimulatedOutcome(
    reference: string,
    outcome: {
      status: 'SUCCESS' | 'FAILED' | 'ABANDONED';
      amountPesewas: number;
      currency: string;
      channel?: string;
    },
  ) {
    this.mockResults.set(reference, outcome);
  }

  async verifyTransaction(
    providerReference: string,
  ): Promise<VerifiedTransactionResult> {
    const recorded = this.mockResults.get(providerReference);
    if (!recorded) {
      return {
        providerReference,
        status: 'PENDING',
        amountPesewas: 0,
        currency: 'GHS',
        rawPayload: { mode: 'mock', status: 'pending' },
      };
    }

    return {
      providerReference,
      status: recorded.status,
      amountPesewas: recorded.amountPesewas,
      currency: recorded.currency,
      channel: recorded.channel || 'mobile_money',
      paidAt: recorded.status === 'SUCCESS' ? new Date() : undefined,
      rawPayload: { mode: 'mock', ...recorded },
    };
  }

  signMockPayload(rawBody: string): string {
    const secret = this.getWebhookSecret();
    return createHmac('sha512', secret).update(rawBody).digest('hex');
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const secret = this.getWebhookSecret();
    const headerVal =
      headers['x-mock-signature'] || headers['x-paystack-signature'];
    const signature = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    if (!signature) {
      return false;
    }

    const expected = createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  }

  parseWebhookEvent(
    payload: Record<string, unknown>,
  ): ParsedWebhookEvent | null {
    const data =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : null;
    if (!data || typeof data.reference !== 'string') {
      return null;
    }

    const eventType = typeof payload.event === 'string' ? payload.event : '';
    const status =
      eventType === 'charge.success'
        ? 'SUCCESS'
        : eventType === 'charge.failed'
          ? 'FAILED'
          : 'ABANDONED';

    return {
      eventId:
        typeof payload.eventId === 'string'
          ? payload.eventId
          : `mock:${eventType}:${data.reference}`,
      eventType,
      providerReference: data.reference,
      status,
      amountPesewas: typeof data.amount === 'number' ? data.amount : undefined,
      currency:
        typeof data.currency === 'string'
          ? data.currency.toUpperCase()
          : 'GHS',
      channel: typeof data.channel === 'string' ? data.channel : 'mobile_money',
      rawPayload: payload,
    };
  }

  private getWebhookSecret(): string {
    return this.configService.get<string>(
      'MOCK_WEBHOOK_SECRET',
      'dev-mock-webhook-secret-change-me',
    );
  }
}
