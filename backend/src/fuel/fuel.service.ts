import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuelRecordDto, UpdateFuelRecordDto } from './dto/fuel.dto';

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  private async assertOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async findAllByVehicle(vehicleId: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.fuelRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, userId: string, dto: CreateFuelRecordDto) {
    const vehicle = await this.assertOwnership(vehicleId, userId);
    const [record] = await this.prisma.$transaction([
      this.prisma.fuelRecord.create({
        data: {
          vehicleId,
          date: new Date(dto.date),
          fuelType: dto.fuelType,
          mileage: dto.mileage,
          quantity: dto.quantity,
          pricePerUnit: dto.pricePerUnit,
          totalCost: dto.totalCost,
          fullTank: dto.fullTank ?? true,
          station: dto.station,
          latitude: dto.latitude,
          longitude: dto.longitude,
          notes: dto.notes,
        },
      }),
      // Mantém a quilometragem do veículo atualizada com o maior valor registrado
      ...(dto.mileage > vehicle.mileage
        ? [this.prisma.vehicle.update({ where: { id: vehicleId }, data: { mileage: dto.mileage } })]
        : []),
    ]);
    return record;
  }

  async update(vehicleId: string, id: string, userId: string, dto: UpdateFuelRecordDto) {
    const vehicle = await this.assertOwnership(vehicleId, userId);
    const record = await this.prisma.fuelRecord.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.fuelType && { fuelType: dto.fuelType }),
        ...(dto.mileage != null && { mileage: dto.mileage }),
        ...(dto.quantity != null && { quantity: dto.quantity }),
        ...(dto.pricePerUnit != null && { pricePerUnit: dto.pricePerUnit }),
        ...(dto.totalCost != null && { totalCost: dto.totalCost }),
        ...(dto.fullTank !== undefined && { fullTank: dto.fullTank }),
        ...(dto.station !== undefined && { station: dto.station }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    if (dto.mileage != null && dto.mileage > vehicle.mileage) {
      await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { mileage: dto.mileage } });
    }
    return record;
  }

  async remove(vehicleId: string, id: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.fuelRecord.delete({ where: { id } });
  }
}
