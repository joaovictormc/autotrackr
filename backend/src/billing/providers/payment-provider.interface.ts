import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';

export interface CheckoutInput {
  subscriptionId: string;
  amount: number;
  userEmail: string;
  /** Config do gateway (chaves, pixKey, etc.) salvo em PaymentGateway.config */
  gatewayConfig: Record<string, any>;
}

export interface CheckoutResult {
  externalId?: string;
  /** URL de checkout hospedado (gateways de cartão) */
  checkoutUrl?: string;
  /** Payload Pix "copia e cola" (Pix direto) */
  pixPayload?: string;
}

export interface PaymentProvider {
  readonly provider: PaymentProviderEnum;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Confirma/verifica o pagamento. Stub retorna true. */
  verify(externalId: string | null): Promise<boolean>;
}
