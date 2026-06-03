import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

@Injectable()
export class ModelsService {
  constructor(private prisma: PrismaService) {}

  findAll(brandId?: string) {
    return this.prisma.model.findMany({
      where: brandId ? { brandId } : undefined,
      include: { brand: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      include: { brand: { select: { id: true, name: true } } },
    });
    if (!model) throw new NotFoundException('Modelo não encontrado');
    return model;
  }

  create(dto: CreateModelDto) {
    return this.prisma.model.create({
      data: { name: dto.name, brandId: dto.brandId, apiCode: dto.apiCode },
      include: { brand: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateModelDto) {
    await this.findOne(id);
    return this.prisma.model.update({
      where: { id },
      data: dto,
      include: { brand: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.model.delete({ where: { id } });
  }

  async bulkImport(models: CreateModelDto[]) {
    const results = await Promise.allSettled(
      models.map((m) =>
        this.prisma.model.upsert({
          where: { brandId_name: { brandId: m.brandId, name: m.name } },
          create: { name: m.name, brandId: m.brandId, apiCode: m.apiCode },
          update: {},
        }),
      ),
    );
    const created = results.filter((r) => r.status === 'fulfilled').length;
    return { created, total: models.length };
  }
}
