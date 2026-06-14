import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const CONFIG_KEYS = {
  REMINDERS: 'reminders',
  EVOLUTION: 'evolution',
} as const;

export interface RemindersConfig {
  enabled: boolean;
  channels: { email: boolean; whatsapp: boolean };
  hour: number; // hora do dia (0-23) — informativo; cron roda diariamente
}

export interface EvolutionConfig {
  enabled: boolean;
  baseUrl: string;
  instance: string;
  apiKey: string;
}

export const DEFAULT_REMINDERS: RemindersConfig = {
  enabled: false,
  channels: { email: true, whatsapp: false },
  hour: 9,
};

export const DEFAULT_EVOLUTION: EvolutionConfig = {
  enabled: false,
  baseUrl: '',
  instance: '',
  apiKey: '',
};

@Injectable()
export class IntegrationConfigService {
  constructor(private prisma: PrismaService) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.integrationConfig.findUnique({ where: { key } });
    if (!row) return fallback;
    return { ...fallback, ...(row.value as object) } as T;
  }

  async set(key: string, value: object) {
    return this.prisma.integrationConfig.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }
}
