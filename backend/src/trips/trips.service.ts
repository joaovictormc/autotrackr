import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  private async assertOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async findAllByVehicle(vehicleId: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.trip.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId: string, userId: string, dto: CreateTripDto) {
    const vehicle = await this.assertOwnership(vehicleId, userId);

    const distanceKm =
      dto.mileageStart != null && dto.mileageEnd != null && dto.mileageEnd > dto.mileageStart
        ? dto.mileageEnd - dto.mileageStart
        : dto.distanceKm;

    const shouldUpdateVehicle = dto.mileageEnd != null && dto.mileageEnd > vehicle.mileage;

    const [trip] = await this.prisma.$transaction([
      this.prisma.trip.create({
        data: {
          vehicleId,
          date: new Date(dto.date),
          origin: dto.origin,
          destination: dto.destination,
          distanceKm,
          mileageStart: dto.mileageStart ?? null,
          mileageEnd: dto.mileageEnd ?? null,
          durationMin: dto.durationMin ?? null,
          purpose: dto.purpose ?? 'PERSONAL',
          passengers: dto.passengers ?? null,
          notes: dto.notes ?? null,
        },
      }),
      ...(shouldUpdateVehicle
        ? [this.prisma.vehicle.update({ where: { id: vehicleId }, data: { mileage: dto.mileageEnd! } })]
        : []),
    ]);
    return trip;
  }

  async update(vehicleId: string, id: string, userId: string, dto: UpdateTripDto) {
    const vehicle = await this.assertOwnership(vehicleId, userId);
    const trip = await this.prisma.trip.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.distanceKm != null && { distanceKm: dto.distanceKm }),
        ...(dto.mileageStart !== undefined && { mileageStart: dto.mileageStart ?? null }),
        ...(dto.mileageEnd !== undefined && { mileageEnd: dto.mileageEnd ?? null }),
        ...(dto.durationMin !== undefined && { durationMin: dto.durationMin ?? null }),
        ...(dto.purpose && { purpose: dto.purpose }),
        ...(dto.passengers !== undefined && { passengers: dto.passengers ?? null }),
        ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
      },
    });
    if (dto.mileageEnd != null && dto.mileageEnd > vehicle.mileage) {
      await this.prisma.vehicle.update({ where: { id: vehicleId }, data: { mileage: dto.mileageEnd } });
    }
    return trip;
  }

  async remove(vehicleId: string, id: string, userId: string) {
    await this.assertOwnership(vehicleId, userId);
    return this.prisma.trip.delete({ where: { id } });
  }
}
