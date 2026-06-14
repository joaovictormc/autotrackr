import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGatewayDto } from './dto/billing.dto';

const DEFAULTS: { provider: PaymentProvider; label: string }[] = [
  { provider: PaymentProvider.PIX_DIRETO, label: 'Pix direto' },
  { provider: PaymentProvider.MERCADO_PAGO, label: 'Mercado Pago' },
  { provider: PaymentProvider.STRIPE, label: 'Stripe' },
];

@Injectable()
export class GatewaysService {
  constructor(private prisma: PrismaService) {}

  /** Garante que os 3 gateways existam (desabilitados) para aparecerem no admin. */
  private async ensureSeeded() {
    for (const d of DEFAULTS) {
      await this.prisma.paymentGateway.upsert({
        where: { provider: d.provider },
        create: { provider: d.provider, label: d.label, enabled: false },
        update: {},
      });
    }
  }

  async findAll() {
    await this.ensureSeeded();
    return this.prisma.paymentGateway.findMany({ orderBy: { label: 'asc' } });
  }

  /** Gateways habilitados, sem credenciais — para o cliente escolher o método. */
  async findAvailable() {
    const list = await this.prisma.paymentGateway.findMany({
      where: { enabled: true },
      select: { provider: true, label: true, isDefault: true },
      orderBy: { isDefault: 'desc' },
    });
    return list;
  }

  async upsert(provider: PaymentProvider, dto: UpsertGatewayDto) {
    return this.prisma.paymentGateway.upsert({
      where: { provider },
      create: { provider, label: dto.label, enabled: dto.enabled ?? false, config: dto.config ?? {} },
      update: { label: dto.label, enabled: dto.enabled, config: dto.config },
    });
  }

  async setDefault(provider: PaymentProvider) {
    const gw = await this.prisma.paymentGateway.findUnique({ where: { provider } });
    if (!gw) throw new NotFoundException('Gateway não encontrado');
    await this.prisma.$transaction([
      this.prisma.paymentGateway.updateMany({ data: { isDefault: false } }),
      this.prisma.paymentGateway.update({ where: { provider }, data: { isDefault: true, enabled: true } }),
    ]);
    return this.prisma.paymentGateway.findUnique({ where: { provider } });
  }

  getConfig(provider: PaymentProvider) {
    return this.prisma.paymentGateway.findUnique({ where: { provider } });
  }
}
