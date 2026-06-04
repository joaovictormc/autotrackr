import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  findAllByUser(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      include: {
        brand: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();
    return vehicle;
  }

  async create(userId: string, dto: CreateVehicleDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const brand = await tx.brand.upsert({
          where: { name: dto.brandName },
          create: { name: dto.brandName, apiCode: dto.brandApiCode },
          update: {},
        });

        const model = await tx.model.upsert({
          where: { brandId_name: { brandId: brand.id, name: dto.modelName } },
          create: { name: dto.modelName, brandId: brand.id, apiCode: dto.modelApiCode },
          update: {},
        });

        return await tx.vehicle.create({
          data: {
            userId,
            brandId: brand.id,
            modelId: model.id,
            plate: dto.plate.toUpperCase(),
            year: dto.year,
            mileage: dto.mileage ?? 0,
            color: dto.color,
            vin: dto.vin,
            details: dto.details,
            apiYearCode: dto.apiYearCode,
          },
          include: {
            brand: { select: { id: true, name: true } },
            model: { select: { id: true, name: true } },
          },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe um veículo cadastrado com essa placa.');
      }
      throw err;
    }
  }

  async update(id: string, userId: string, dto: UpdateVehicleDto) {
    await this.findOne(id, userId);
    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
      include: {
        brand: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
