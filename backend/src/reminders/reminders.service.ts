import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Plan, ReminderChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AiService } from '../ai/ai.service';
import {
  CONFIG_KEYS, DEFAULT_REMINDERS, RemindersConfig, IntegrationConfigService,
} from '../integrations/integration-config.service';

const DEDUPE_DAYS = 30;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger('RemindersService');

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private whatsapp: WhatsappService,
    private ai: AiService,
    private config: IntegrationConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyCron() {
    await this.run();
  }

  /** Varre manutenções vencidas de usuários PRO e dispara lembretes. */
  async run(): Promise<{ enabled: boolean; processed: number; sent: number }> {
    const cfg = await this.config.get<RemindersConfig>(CONFIG_KEYS.REMINDERS, DEFAULT_REMINDERS);
    if (!cfg.enabled) {
      this.logger.log('Lembretes desabilitados — varredura ignorada.');
      return { enabled: false, processed: 0, sent: 0 };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Apenas registros pendentes de veículos de usuários PRO, com algum lembrete definido.
    const records = await this.prisma.maintenanceRecord.findMany({
      where: {
        isCompleted: false,
        vehicle: { user: { plan: Plan.PRO } },
        OR: [{ reminderDate: { not: null } }, { reminderMileage: { not: null } }],
      },
      include: {
        maintenanceType: { select: { name: true } },
        vehicle: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    let processed = 0;
    let sent = 0;

    for (const r of records) {
      const byDate = r.reminderDate != null && new Date(r.reminderDate) <= today;
      const byKm = r.reminderMileage != null && r.vehicle.mileage >= r.reminderMileage;
      if (!byDate && !byKm) continue;
      processed++;

      const reason = byDate
        ? `venceu em ${new Date(r.reminderDate!).toLocaleDateString('pt-BR')}`
        : `atingiu a quilometragem prevista (${r.reminderMileage} km)`;

      const message = await this.ai.generateReminder({
        userName: r.vehicle.user.name,
        vehicleLabel: `${r.vehicle.brand.name} ${r.vehicle.model.name} · ${r.vehicle.plate}`,
        serviceName: r.maintenanceType.name,
        reason,
      });

      if (cfg.channels.email) {
        sent += (await this.dispatch(r.id, r.vehicle.user.id, ReminderChannel.EMAIL, message, () =>
          this.mail.send(r.vehicle.user.email, 'AutoTrackr — Lembrete de manutenção', `<p>${message}</p>`),
        )) ? 1 : 0;
      }
      if (cfg.channels.whatsapp) {
        sent += (await this.dispatch(r.id, r.vehicle.user.id, ReminderChannel.WHATSAPP, message, () =>
          this.whatsapp.sendText(r.vehicle.user.phone, message),
        )) ? 1 : 0;
      }
    }

    this.logger.log(`Lembretes: ${processed} vencidos processados, ${sent} enviados.`);
    return { enabled: true, processed, sent };
  }

  /** Envia por um canal com dedupe (não reenvia o mesmo registro+canal em DEDUPE_DAYS). */
  private async dispatch(
    maintenanceRecordId: string,
    userId: string,
    channel: ReminderChannel,
    message: string,
    sendFn: () => Promise<boolean>,
  ): Promise<boolean> {
    const since = new Date(Date.now() - DEDUPE_DAYS * 24 * 60 * 60 * 1000);
    const recent = await this.prisma.reminderLog.findFirst({
      where: { maintenanceRecordId, channel, sentAt: { gte: since } },
    });
    if (recent) return false;

    let ok = false;
    try {
      ok = await sendFn();
    } catch (e) {
      this.logger.error(`Erro ao enviar ${channel}: ${(e as Error).message}`);
    }

    await this.prisma.reminderLog.create({
      data: { userId, maintenanceRecordId, channel, status: ok ? 'SENT' : 'SKIPPED', message },
    });
    return ok;
  }
}
