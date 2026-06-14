import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { Plan, Prisma } from '@prisma/client';

/** Limite de veículos do plano gratuito. Pro = ilimitado. */
export const FREE_VEHICLE_LIMIT = 1;

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      include: {
        brand: { select: { id: true, name: true } },
        model: { select: { id: true, name: true } },
        // Busca apenas o registro com maior KM de cada tipo
        fuelRecords: { select: { mileage: true }, orderBy: { mileage: 'desc' }, take: 1 },
        maintenanceRecords: { select: { mileage: true }, orderBy: { mileage: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Retorna a quilometragem real (máximo entre cadastro, combustível e manutenção)
    return vehicles.map(({ fuelRecords, maintenanceRecords, ...v }) => ({
      ...v,
      mileage: Math.max(
        v.mileage,
        fuelRecords[0]?.mileage ?? 0,
        maintenanceRecords[0]?.mileage ?? 0,
      ),
    }));
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
    // Gating de plano: usuários FREE podem cadastrar no máximo FREE_VEHICLE_LIMIT veículos.
    const [user, count] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
      this.prisma.vehicle.count({ where: { userId } }),
    ]);
    if (user?.plan !== Plan.PRO && count >= FREE_VEHICLE_LIMIT) {
      throw new ForbiddenException({
        code: 'VEHICLE_LIMIT',
        message: `O plano gratuito permite apenas ${FREE_VEHICLE_LIMIT} veículo. Faça upgrade para o Pro para cadastrar mais.`,
      });
    }

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
    const data = { ...dto };
    if (data.plate) data.plate = data.plate.toUpperCase();
    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data,
        include: {
          brand: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Já existe um veículo cadastrado com essa placa.');
      }
      throw err;
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
