import { PaymentProvider } from '@prisma/client';

export interface InitializeCheckoutInput {
  invoiceId: string;
  invoiceNumber: string;
  reference: string;
  amountPesewas: number;
  currency: string;
  email: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeCheckoutOutput {
  authorizationUrl: string;
  accessCode?: string;
  providerReference: string;
  rawPayload?: Record<string, unknown>;
}

export interface VerifiedTransactionResult {
  providerReference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABANDONED';
  amountPesewas: number;
  currency: string;
  channel?: string;
  paidAt?: Date;
  rawPayload?: Record<string, unknown>;
}

export interface ParsedWebhookEvent {
  eventId?: string;
  eventType: string;
  providerReference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABANDONED';
  amountPesewas?: number;
  currency?: string;
  channel?: string;
  rawPayload: Record<string, unknown>;
}

export interface PaymentGatewayAdapter {
  readonly provider: PaymentProvider;

  initializeCheckout(
    input: InitializeCheckoutInput,
  ): Promise<InitializeCheckoutOutput>;

  verifyTransaction(
    providerReference: string,
  ): Promise<VerifiedTransactionResult>;

  verifyWebhookSignature(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): boolean;

  parseWebhookEvent(payload: Record<string, unknown>): ParsedWebhookEvent | null;
}
