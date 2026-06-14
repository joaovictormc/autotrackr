import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Garante, no startup, que a conta indicada em ADMIN_EMAIL tenha role ADMIN.
 * - Se o usuário existe: promove a ADMIN (idempotente).
 * - Se não existe e ADMIN_PASSWORD está definido: cria o admin.
 */
@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger('AdminBootstrap');

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim();
    if (!email) return;

    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== Role.ADMIN) {
        await this.prisma.user.update({ where: { email }, data: { role: Role.ADMIN } });
        this.logger.log(`Usuário ${email} promovido a ADMIN.`);
      }
      return;
    }

    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!password) {
      this.logger.warn(`ADMIN_EMAIL=${email} não encontrado e ADMIN_PASSWORD não definido — admin não criado.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
        name: this.config.get<string>('ADMIN_NAME') ?? 'Administrador',
        role: Role.ADMIN,
      },
    });
    this.logger.log(`Admin ${email} criado.`);
  }
}
