import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/billing.dto';

export interface CouponValidation {
  coupon: Coupon;
  discount: number;
  finalAmount: number;
}

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    try {
      return await this.prisma.coupon.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          type: dto.type,
          value: dto.value,
          maxRedemptions: dto.maxRedemptions,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          active: dto.active ?? true,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Já existe um cupom com esse código.');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.getOrThrow(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        type: dto.type,
        value: dto.value,
        maxRedemptions: dto.maxRedemptions,
        expiresAt: dto.expiresAt !== undefined ? (dto.expiresAt ? new Date(dto.expiresAt) : null) : undefined,
        active: dto.active,
      },
    });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  private async getOrThrow(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cupom não encontrado');
    return c;
  }

  /** Valida um cupom para um valor e retorna o desconto. Lança BadRequest se inválido. */
  async validate(code: string, amount: number): Promise<CouponValidation> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.active) throw new BadRequestException('Cupom inválido.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Cupom expirado.');
    if (coupon.maxRedemptions != null && coupon.timesRedeemed >= coupon.maxRedemptions) {
      throw new BadRequestException('Cupom esgotado.');
    }

    const value = Number(coupon.value);
    const discount = coupon.type === CouponType.PERCENT
      ? (amount * value) / 100
      : value;
    const finalAmount = Math.max(0, Number((amount - discount).toFixed(2)));
    return { coupon, discount: Number(discount.toFixed(2)), finalAmount };
  }
}
