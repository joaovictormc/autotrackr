import { Injectable, Logger } from '@nestjs/common';
import { AiProvider as AiProviderEnum } from '@prisma/client';
import { AiGenerateInput, AiProvider } from './ai-provider.interface';

/**
 * Anthropic (Claude) — STUB. Retorna o prompt já montado (passthrough).
 * TODO: instalar @anthropic-ai/sdk e chamar messages.create com
 * model=input.model, system=input.systemPrompt, max_tokens, temperature.
 */
@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly provider = AiProviderEnum.ANTHROPIC;
  private readonly logger = new Logger('AnthropicProvider');

  async generate(input: AiGenerateInput): Promise<string> {
    this.logger.debug(`[stub] generate via ${input.model}`);
    return input.prompt;
  }
}
