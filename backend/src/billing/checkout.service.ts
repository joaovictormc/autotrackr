import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from './coupons.service';
import { GatewaysService } from './gateways.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { CreateCheckoutDto } from './dto/billing.dto';

/** Preço do plano Pro (R$). TODO: tornar configurável via admin. */
export const PRO_PRICE = 19.9;

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
    private gateways: GatewaysService,
    private factory: PaymentProviderFactory,
  ) {}

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.plan === Plan.PRO) throw new BadRequestException('Você já é Pro.');

    const gateway = await this.gateways.getConfig(dto.provider);
    if (!gateway || !gateway.enabled) throw new BadRequestException('Método de pagamento indisponível.');

    let amount = PRO_PRICE;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const v = await this.coupons.validate(dto.couponCode, amount);
      amount = v.finalAmount;
      couponId = v.coupon.id;
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: Plan.PRO,
        status: SubscriptionStatus.PENDING,
        provider: dto.provider,
        amount,
        couponId,
      },
    });

    const result = await this.factory.get(dto.provider).createCheckout({
      subscriptionId: subscription.id,
      amount,
      userEmail: user.email,
      gatewayConfig: (gateway.config as Record<string, any>) ?? {},
    });

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        externalId: result.externalId,
        checkoutUrl: result.checkoutUrl,
        pixPayload: result.pixPayload,
      },
    });
  }

  /** STUB do webhook: confirma o pagamento e promove o usuário a Pro. */
  async confirm(userId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Assinatura não encontrada');
    if (sub.userId !== userId) throw new ForbiddenException();
    if (sub.status === SubscriptionStatus.PAID) return sub;

    const ok = await this.factory.get(sub.provider).verify(sub.externalId);
    if (!ok) throw new BadRequestException('Pagamento não confirmado.');

    const [updated] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: Plan.PRO, proSince: new Date() },
      }),
      ...(sub.couponId
        ? [this.prisma.coupon.update({ where: { id: sub.couponId }, data: { timesRedeemed: { increment: 1 } } })]
        : []),
    ]);

    return updated;
  }

  listMine(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Prévia de preço com cupom aplicado (sem criar assinatura). */
  async preview(couponCode?: string) {
    if (!couponCode) return { basePrice: PRO_PRICE, discount: 0, finalAmount: PRO_PRICE };
    const v = await this.coupons.validate(couponCode, PRO_PRICE);
    return { basePrice: PRO_PRICE, discount: v.discount, finalAmount: v.finalAmount };
  }
}
