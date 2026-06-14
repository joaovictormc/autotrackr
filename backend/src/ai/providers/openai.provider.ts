import { Injectable, Logger } from '@nestjs/common';
import { AiProvider as AiProviderEnum } from '@prisma/client';
import { AiGenerateInput, AiProvider } from './ai-provider.interface';

/**
 * OpenAI — STUB. TODO: instalar `openai` e chamar chat.completions.create
 * com model=input.model, messages=[system, user], temperature.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly provider = AiProviderEnum.OPENAI;
  private readonly logger = new Logger('OpenAiProvider');

  async generate(input: AiGenerateInput): Promise<string> {
    this.logger.debug(`[stub] generate via ${input.model}`);
    return input.prompt;
  }
}
