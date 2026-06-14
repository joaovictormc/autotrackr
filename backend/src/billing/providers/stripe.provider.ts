import { Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';
import { CheckoutInput, CheckoutResult, PaymentProvider } from './payment-provider.interface';

/**
 * Stripe — STUB. Retorna uma checkoutUrl de exemplo.
 * TODO: criar uma Checkout Session real via SDK do Stripe usando
 * input.gatewayConfig.secretKey e validar via webhook de eventos.
 */
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly provider = PaymentProviderEnum.STRIPE;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const externalId = `cs_test_${input.subscriptionId}`;
    return {
      externalId,
      checkoutUrl: `https://checkout.stripe.com/c/stub/${externalId}`,
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}
