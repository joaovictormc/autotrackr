import { Injectable, Logger } from '@nestjs/common';
import { AiModelsService } from './ai-models.service';
import { AiProviderFactory } from './providers/ai-provider.factory';

export interface ReminderContext {
  userName?: string | null;
  vehicleLabel: string;
  serviceName: string;
  /** Motivo do vencimento, ex.: "venceu em 10/06/2026" ou "atingiu a quilometragem prevista" */
  reason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger('AiService');

  constructor(
    private models: AiModelsService,
    private factory: AiProviderFactory,
  ) {}

  /** Mensagem-base determinística (usada como prompt e como fallback sem IA). */
  private baseMessage(ctx: ReminderContext): string {
    const hi = ctx.userName ? `Olá, ${ctx.userName}!` : 'Olá!';
    return (
      `${hi} Passando para lembrar que o serviço "${ctx.serviceName}" do seu ${ctx.vehicleLabel} ` +
      `${ctx.reason}. Recomendamos agendar o quanto antes para manter seu veículo em dia. — AutoTrackr`
    );
  }

  /** Gera o texto do lembrete usando o modelo de IA padrão (stub: retorna a base). */
  async generateReminder(ctx: ReminderContext): Promise<string> {
    const base = this.baseMessage(ctx);
    const cfg = await this.models.getDefault();
    if (!cfg) return base;
    try {
      return await this.factory.get(cfg.provider).generate({
        model: cfg.model,
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl,
        systemPrompt: cfg.systemPrompt,
        temperature: cfg.temperature,
        prompt: base,
      });
    } catch (e) {
      this.logger.warn(`Falha na geração via IA, usando mensagem base: ${(e as Error).message}`);
      return base;
    }
  }

  /** Testa um modelo específico gerando um lembrete de exemplo. */
  async test(modelId: string): Promise<{ output: string }> {
    const all = await this.models.findAll();
    const cfg = all.find((m) => m.id === modelId);
    if (!cfg) return { output: 'Modelo não encontrado.' };
    const sample = this.baseMessage({
      userName: 'João',
      vehicleLabel: 'Honda Civic · ABC1D23',
      serviceName: 'Troca de óleo',
      reason: 'venceu em 01/06/2026',
    });
    const output = await this.factory.get(cfg.provider).generate({
      model: cfg.model,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      systemPrompt: cfg.systemPrompt,
      temperature: cfg.temperature,
      prompt: sample,
    });
    return { output };
  }
}
