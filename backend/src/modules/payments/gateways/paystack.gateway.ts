import { BadGatewayException, Injectable } from '@nestjs/common';
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

@Injectable()
export class PaystackGateway implements PaymentGatewayAdapter {
  readonly provider = PaymentProvider.PAYSTACK;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly configService: ConfigService) {}

  async initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<InitializeCheckoutOutput> {
    const secretKey = this.getSecretKey();
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountPesewas,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: ['mobile_money', 'card', 'bank'],
        metadata: input.metadata,
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      status?: boolean;
      message?: string;
      data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
      };
    } | null;

    if (!response.ok || !body?.status || !body.data?.authorization_url) {
      throw new BadGatewayException(
        body?.message || 'Paystack checkout initialization failed',
      );
    }

    return {
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
      providerReference: body.data.reference || input.reference,
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  async verifyTransaction(
    providerReference: string,
  ): Promise<VerifiedTransactionResult> {
    const secretKey = this.getSecretKey();
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(providerReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const body = (await response.json().catch(() => null)) as {
      status?: boolean;
      message?: string;
      data?: {
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
        channel?: string;
        paid_at?: string;
      };
    } | null;

    if (!response.ok || !body?.status || !body.data) {
      throw new BadGatewayException(
        body?.message || 'Paystack transaction verification failed',
      );
    }

    const mappedStatus = this.mapPaystackStatus(body.data.status);

    return {
      providerReference: body.data.reference || providerReference,
      status: mappedStatus,
      amountPesewas: Number(body.data.amount || 0),
      currency: (body.data.currency || 'GHS').toUpperCase(),
      channel: body.data.channel,
      paidAt: body.data.paid_at ? new Date(body.data.paid_at) : undefined,
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const secret =
      this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') ||
      this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      return false;
    }

    const headerVal = headers['x-paystack-signature'];
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
    const eventType = typeof payload.event === 'string' ? payload.event : '';
    const data =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : null;

    if (!data || typeof data.reference !== 'string') {
      return null;
    }

    const rawId = data.id !== undefined ? String(data.id) : data.reference;
    const status =
      eventType === 'charge.success'
        ? 'SUCCESS'
        : this.mapPaystackStatus(
            typeof data.status === 'string' ? data.status : undefined,
          );

    return {
      eventId: eventType ? `paystack:${eventType}:${rawId}` : undefined,
      eventType,
      providerReference: data.reference,
      status,
      amountPesewas: typeof data.amount === 'number' ? data.amount : undefined,
      currency:
        typeof data.currency === 'string'
          ? data.currency.toUpperCase()
          : undefined,
      channel: typeof data.channel === 'string' ? data.channel : undefined,
      rawPayload: payload,
    };
  }

  private mapPaystackStatus(
    status?: string,
  ): 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABANDONED' {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'SUCCESS';
      case 'failed':
        return 'FAILED';
      case 'abandoned':
        return 'ABANDONED';
      default:
        return 'PENDING';
    }
  }

  private getSecretKey(): string {
    const key = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new BadGatewayException('PAYSTACK_SECRET_KEY is not configured');
    }
    return key;
  }
}
