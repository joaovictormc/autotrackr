import { Injectable, Logger } from '@nestjs/common';
import { AiProvider as AiProviderEnum } from '@prisma/client';
import { AiGenerateInput, AiProvider } from './ai-provider.interface';

/**
 * Ollama (self-hosted) — STUB. TODO: POST {baseUrl}/api/generate
 * com { model, prompt, system, options:{ temperature } } via HttpService.
 */
@Injectable()
export class OllamaProvider implements AiProvider {
  readonly provider = AiProviderEnum.OLLAMA;
  private readonly logger = new Logger('OllamaProvider');

  async generate(input: AiGenerateInput): Promise<string> {
    this.logger.debug(`[stub] generate via ${input.model} @ ${input.baseUrl ?? 'localhost'}`);
    return input.prompt;
  }
}
