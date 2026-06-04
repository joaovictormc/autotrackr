import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRevenueRecordDto, UpdateRevenueRecordDto } from './dto/revenue.dto';

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  private async assertOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async findAllByVehicle(vehicleId: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.revenueRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, userId: string, dto: CreateRevenueRecordDto) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.revenueRecord.create({
      data: {
        vehicleId,
        date: new Date(dto.date),
        category: dto.category,
        amount: dto.amount,
        notes: dto.notes,
      },
    });
  }

  async update(vehicleId: string, id: string, userId: string, dto: UpdateRevenueRecordDto) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.revenueRecord.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.category && { category: dto.category }),
        ...(dto.amount != null && { amount: dto.amount }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(vehicleId: string, id: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.revenueRecord.delete({ where: { id } });
  }
}
