import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { RemindersService } from './reminders.service';
import { UpdateRemindersDto, UpdateEvolutionDto } from './dto/reminders.dto';
import {
  CONFIG_KEYS, DEFAULT_EVOLUTION, DEFAULT_REMINDERS, EvolutionConfig, RemindersConfig,
  IntegrationConfigService,
} from '../integrations/integration-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('reminders')
export class RemindersController {
  constructor(
    private reminders: RemindersService,
    private config: IntegrationConfigService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Obter config de lembretes e Evolution (admin)' })
  async getConfig() {
    const [reminders, evolution] = await Promise.all([
      this.config.get<RemindersConfig>(CONFIG_KEYS.REMINDERS, DEFAULT_REMINDERS),
      this.config.get<EvolutionConfig>(CONFIG_KEYS.EVOLUTION, DEFAULT_EVOLUTION),
    ]);
    return { reminders, evolution };
  }

  @Put('config')
  @ApiOperation({ summary: 'Atualizar config de lembretes (admin)' })
  async updateReminders(@Body() dto: UpdateRemindersDto) {
    const current = await this.config.get<RemindersConfig>(CONFIG_KEYS.REMINDERS, DEFAULT_REMINDERS);
    const next: RemindersConfig = {
      enabled: dto.enabled ?? current.enabled,
      hour: dto.hour ?? current.hour,
      channels: {
        email: dto.emailEnabled ?? current.channels.email,
        whatsapp: dto.whatsappEnabled ?? current.channels.whatsapp,
      },
    };
    await this.config.set(CONFIG_KEYS.REMINDERS, next);
    return next;
  }

  @Put('evolution')
  @ApiOperation({ summary: 'Atualizar config Evolution/WhatsApp (admin)' })
  async updateEvolution(@Body() dto: UpdateEvolutionDto) {
    const current = await this.config.get<EvolutionConfig>(CONFIG_KEYS.EVOLUTION, DEFAULT_EVOLUTION);
    const next: EvolutionConfig = {
      enabled: dto.enabled ?? current.enabled,
      baseUrl: dto.baseUrl ?? current.baseUrl,
      instance: dto.instance ?? current.instance,
      apiKey: dto.apiKey ?? current.apiKey,
    };
    await this.config.set(CONFIG_KEYS.EVOLUTION, next);
    return next;
  }

  @Post('run-now')
  @ApiOperation({ summary: 'Disparar a varredura de lembretes agora (admin)' })
  runNow() {
    return this.reminders.run();
  }
}
