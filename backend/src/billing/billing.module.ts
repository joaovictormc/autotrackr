import { Module } from '@nestjs/common';

import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { GatewaysController } from './gateways.controller';
import { GatewaysService } from './gateways.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PixDiretoProvider } from './providers/pix-direto.provider';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  controllers: [CouponsController, GatewaysController, CheckoutController],
  providers: [
    CouponsService,
    GatewaysService,
    CheckoutService,
    PaymentProviderFactory,
    PixDiretoProvider,
    MercadoPagoProvider,
    StripeProvider,
  ],
})
export class BillingModule {}
