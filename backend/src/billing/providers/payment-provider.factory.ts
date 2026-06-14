import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';
import { PaymentProvider } from './payment-provider.interface';
import { PixDiretoProvider } from './pix-direto.provider';
import { MercadoPagoProvider } from './mercadopago.provider';
import { StripeProvider } from './stripe.provider';

@Injectable()
export class PaymentProviderFactory {
  private readonly registry: Record<PaymentProviderEnum, PaymentProvider>;

  constructor(
    pix: PixDiretoProvider,
    mercadoPago: MercadoPagoProvider,
    stripe: StripeProvider,
  ) {
    this.registry = {
      [PaymentProviderEnum.PIX_DIRETO]: pix,
      [PaymentProviderEnum.MERCADO_PAGO]: mercadoPago,
      [PaymentProviderEnum.STRIPE]: stripe,
    };
  }

  get(provider: PaymentProviderEnum): PaymentProvider {
    const impl = this.registry[provider];
    if (!impl) throw new BadRequestException(`Gateway não suportado: ${provider}`);
    return impl;
  }
}
