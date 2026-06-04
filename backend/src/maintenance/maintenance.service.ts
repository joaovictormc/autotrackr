import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private async assertOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  // ── Tipos de manutenção ─────────────────────────────────────────────

  findAllTypes() {
    return this.prisma.maintenanceType.findMany({ orderBy: { name: 'asc' } });
  }

  async createType(name: string, defaultIntervalKm?: number, defaultIntervalMonths?: number) {
    try {
      return await this.prisma.maintenanceType.create({
        data: {
          name,
          defaultIntervalKm: defaultIntervalKm ?? null,
          defaultIntervalMonths: defaultIntervalMonths ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe um tipo com esse nome.');
      }
      throw err;
    }
  }

  // ── Registros de manutenção ─────────────────────────────────────────

  async findAllByVehicle(vehicleId: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      include: { maintenanceType: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, userId: string, dto: CreateMaintenanceDto) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        maintenanceTypeId: dto.maintenanceTypeId,
        date: new Date(dto.date),
        mileage: dto.mileage,
        cost: dto.cost != null ? dto.cost : null,
        notes: dto.notes,
        location: dto.location,
        reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : null,
        reminderMileage: dto.reminderMileage ?? null,
        isCompleted: dto.isCompleted ?? false,
      },
      include: { maintenanceType: { select: { id: true, name: true } } },
    });
  }

  async update(vehicleId: string, id: string, userId: string, dto: UpdateMaintenanceDto) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: {
        ...(dto.maintenanceTypeId && { maintenanceTypeId: dto.maintenanceTypeId }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.mileage != null && { mileage: dto.mileage }),
        ...(dto.cost != null && { cost: dto.cost }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.reminderDate !== undefined && { reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : null }),
        ...(dto.reminderMileage !== undefined && { reminderMileage: dto.reminderMileage }),
        ...(dto.isCompleted !== undefined && { isCompleted: dto.isCompleted }),
      },
      include: { maintenanceType: { select: { id: true, name: true } } },
    });
  }

  async remove(vehicleId: string, id: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.maintenanceRecord.delete({ where: { id } });
  }
}
