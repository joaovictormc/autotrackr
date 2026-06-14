import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiModelDto, UpdateAiModelDto } from './dto/ai.dto';

@Injectable()
export class AiModelsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.aiModelConfig.findMany({ orderBy: { createdAt: 'desc' } });
  }

  getDefault() {
    return this.prisma.aiModelConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
  }

  async create(dto: CreateAiModelDto) {
    const created = await this.prisma.aiModelConfig.create({
      data: {
        provider: dto.provider,
        label: dto.label,
        model: dto.model,
        apiKey: dto.apiKey,
        baseUrl: dto.baseUrl,
        systemPrompt: dto.systemPrompt,
        temperature: dto.temperature ?? 0.7,
        enabled: dto.enabled ?? true,
        isDefault: dto.isDefault ?? false,
      },
    });
    if (created.isDefault) await this.clearOtherDefaults(created.id);
    return created;
  }

  async update(id: string, dto: UpdateAiModelDto) {
    await this.getOrThrow(id);
    const updated = await this.prisma.aiModelConfig.update({ where: { id }, data: dto });
    if (dto.isDefault) await this.clearOtherDefaults(id);
    return updated;
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    return this.prisma.aiModelConfig.delete({ where: { id } });
  }

  private async clearOtherDefaults(keepId: string) {
    await this.prisma.aiModelConfig.updateMany({
      where: { id: { not: keepId } },
      data: { isDefault: false },
    });
  }

  private async getOrThrow(id: string) {
    const m = await this.prisma.aiModelConfig.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Modelo de IA não encontrado');
    return m;
  }
}
