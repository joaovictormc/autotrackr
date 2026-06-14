import { Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';
import { CheckoutInput, CheckoutResult, PaymentProvider } from './payment-provider.interface';

/**
 * Pix direto — STUB. Gera um payload "copia e cola" de exemplo a partir da
 * chave Pix configurada. TODO: gerar EMV/BR Code real (com CRC16) ou via PSP.
 */
@Injectable()
export class PixDiretoProvider implements PaymentProvider {
  readonly provider = PaymentProviderEnum.PIX_DIRETO;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const pixKey = input.gatewayConfig?.pixKey ?? 'chave-pix-nao-configurada';
    const receiver = input.gatewayConfig?.receiverName ?? 'AutoTrackr';
    // Stub: string ilustrativa de "copia e cola". Não é um BR Code válido.
    const pixPayload =
      `00020126BR.GOV.BCB.PIX|chave:${pixKey}|recebedor:${receiver}` +
      `|valor:${input.amount.toFixed(2)}|ref:${input.subscriptionId}`;
    return { externalId: `pix_${input.subscriptionId}`, pixPayload };
  }

  async verify(): Promise<boolean> {
    // Stub: assume confirmação manual via endpoint de confirm.
    return true;
  }
}
