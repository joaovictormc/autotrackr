import { Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';
import { CheckoutInput, CheckoutResult, PaymentProvider } from './payment-provider.interface';

/**
 * Mercado Pago — STUB. Retorna uma checkoutUrl de exemplo.
 * TODO: criar uma Preference real via SDK do Mercado Pago usando
 * input.gatewayConfig.accessToken e configurar webhook de notificação.
 */
@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  readonly provider = PaymentProviderEnum.MERCADO_PAGO;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const externalId = `mp_${input.subscriptionId}`;
    return {
      externalId,
      checkoutUrl: `https://www.mercadopago.com.br/checkout/stub/${externalId}`,
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}
