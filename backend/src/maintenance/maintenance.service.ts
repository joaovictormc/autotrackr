import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private async assertOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async findAllByVehicle(vehicleId: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      include: { maintenanceType: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, userId: string, data: Record<string, unknown>) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.create({
      data: { vehicleId, ...data } as Parameters<typeof this.prisma.maintenanceRecord.create>[0]['data'],
      include: { maintenanceType: { select: { id: true, name: true } } },
    });
  }

  async update(vehicleId: string, id: string, userId: string, data: Record<string, unknown>) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.maintenanceRecord.update>[0]['data'],
    });
  }

  async remove(vehicleId: string, id: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.delete({ where: { id } });
  }
}
