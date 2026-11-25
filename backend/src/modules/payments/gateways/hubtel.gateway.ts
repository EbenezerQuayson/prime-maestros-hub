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
export class HubtelGateway implements PaymentGatewayAdapter {
  readonly provider = PaymentProvider.HUBTEL;

  constructor(private readonly configService: ConfigService) {}

  async initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<InitializeCheckoutOutput> {
    const clientId = this.configService.get<string>('HUBTEL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HUBTEL_CLIENT_SECRET');
    const merchantAccount = this.configService.get<string>(
      'HUBTEL_MERCHANT_ACCOUNT_NUMBER',
    );

    if (!clientId || !clientSecret || !merchantAccount) {
      throw new BadGatewayException(
        'Hubtel merchant credentials are not configured yet',
      );
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const response = await fetch(
      'https://payproxyapi.hubtel.com/items/initiate',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: Number((input.amountPesewas / 100).toFixed(2)),
          description: `Prime Maestros Hub Invoice ${input.invoiceNumber}`,
          callbackUrl: input.callbackUrl,
          returnUrl: input.callbackUrl,
          cancellationUrl: input.callbackUrl,
          merchantAccountNumber: merchantAccount,
          clientReference: input.reference,
        }),
      },
    );

    const body = (await response.json().catch(() => null)) as {
      responseCode?: string;
      status?: string;
      data?: {
        checkoutUrl?: string;
        checkoutId?: string;
        clientReference?: string;
      };
    } | null;

    if (!response.ok || !body?.data?.checkoutUrl) {
      throw new BadGatewayException('Hubtel checkout initialization failed');
    }

    return {
      authorizationUrl: body.data.checkoutUrl,
      accessCode: body.data.checkoutId,
      providerReference: body.data.clientReference || input.reference,
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  async verifyTransaction(
    providerReference: string,
  ): Promise<VerifiedTransactionResult> {
    const clientId = this.configService.get<string>('HUBTEL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HUBTEL_CLIENT_SECRET');
    const merchantAccount = this.configService.get<string>(
      'HUBTEL_MERCHANT_ACCOUNT_NUMBER',
    );

    if (!clientId || !clientSecret || !merchantAccount) {
      throw new BadGatewayException(
        'Hubtel merchant credentials are not configured yet',
      );
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const response = await fetch(
      `https://api-txnstatus.hubtel.com/transactions/${encodeURIComponent(merchantAccount)}/status?clientReference=${encodeURIComponent(providerReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      },
    );

    const body = (await response.json().catch(() => null)) as {
      data?: {
        status?: string;
        amount?: number;
        paymentMethod?: string;
      };
    } | null;

    if (!response.ok || !body?.data) {
      throw new BadGatewayException('Hubtel transaction verification failed');
    }

    const normalized = (body.data.status || '').toLowerCase();
    const status =
      normalized === 'paid'
        ? 'SUCCESS'
        : normalized === 'unpaid'
          ? 'PENDING'
          : 'FAILED';

    return {
      providerReference,
      status,
      amountPesewas: Math.round(Number(body.data.amount || 0) * 100),
      currency: 'GHS',
      channel: body.data.paymentMethod,
      rawPayload: body as unknown as Record<string, unknown>,
    };
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const secret = this.configService.get<string>('HUBTEL_WEBHOOK_SECRET');
    if (!secret) {
      return false;
    }

    const headerVal = headers['x-hubtel-signature'];
    const signature = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    if (!signature) {
      return false;
    }

    const expected = createHmac('sha256', secret)
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
      payload.Data && typeof payload.Data === 'object'
        ? (payload.Data as Record<string, unknown>)
        : null;
    if (!data || typeof data.ClientReference !== 'string') {
      return null;
    }

    const statusStr =
      typeof data.Status === 'string' ? data.Status.toLowerCase() : '';
    const status =
      statusStr === 'success'
        ? 'SUCCESS'
        : statusStr === 'failed'
          ? 'FAILED'
          : 'PENDING';

    return {
      eventId:
        typeof data.CheckoutId === 'string'
          ? `hubtel:${data.CheckoutId}`
          : undefined,
      eventType: statusStr || 'hubtel.callback',
      providerReference: data.ClientReference,
      status,
      amountPesewas:
        typeof data.Amount === 'number'
          ? Math.round(data.Amount * 100)
          : undefined,
      currency: 'GHS',
      rawPayload: payload,
    };
  }
}
