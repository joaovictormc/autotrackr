import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Marca não encontrada');
    return brand;
  }

  create(dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: { name: dto.name, apiCode: dto.apiCode } });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.brand.delete({ where: { id } });
  }

  async bulkImport(brands: CreateBrandDto[]) {
    const results = await Promise.allSettled(
      brands.map((b) =>
        this.prisma.brand.upsert({
          where: { name: b.name },
          create: { name: b.name, apiCode: b.apiCode },
          update: {},
        }),
      ),
    );
    const created = results.filter((r) => r.status === 'fulfilled').length;
    return { created, total: brands.length };
  }
}
