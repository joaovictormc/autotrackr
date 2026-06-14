import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CONFIG_KEYS, DEFAULT_EVOLUTION, EvolutionConfig, IntegrationConfigService } from '../integrations/integration-config.service';

/**
 * Cliente Evolution API (WhatsApp). Guarded: só envia quando a integração
 * está habilitada e configurada; caso contrário apenas loga (modo stub/dev).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger('WhatsappService');

  constructor(
    private http: HttpService,
    private config: IntegrationConfigService,
  ) {}

  async sendText(phone: string | null | undefined, message: string): Promise<boolean> {
    const cfg = await this.config.get<EvolutionConfig>(CONFIG_KEYS.EVOLUTION, DEFAULT_EVOLUTION);

    if (!phone) {
      this.logger.warn('Usuário sem telefone — WhatsApp não enviado.');
      return false;
    }
    if (!cfg.enabled || !cfg.baseUrl || !cfg.instance) {
      this.logger.warn(`Evolution desabilitada/incompleta — WhatsApp para ${phone} não enviado (stub).`);
      return false;
    }

    try {
      const url = `${cfg.baseUrl.replace(/\/$/, '')}/message/sendText/${cfg.instance}`;
      await firstValueFrom(
        this.http.post(
          url,
          { number: phone, text: message },
          { headers: { apikey: cfg.apiKey }, timeout: 10000 },
        ),
      );
      return true;
    } catch (e) {
      this.logger.error(`Falha ao enviar WhatsApp via Evolution: ${(e as Error).message}`);
      return false;
    }
  }
}
