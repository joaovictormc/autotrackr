import { Injectable, Logger } from '@nestjs/common';
import { AiProvider as AiProviderEnum } from '@prisma/client';
import { AiGenerateInput, AiProvider } from './ai-provider.interface';

/**
 * Google Gemini — STUB. TODO: instalar `@google/generative-ai` e chamar
 * getGenerativeModel({ model }).generateContent(...).
 */
@Injectable()
export class GeminiProvider implements AiProvider {
  readonly provider = AiProviderEnum.GEMINI;
  private readonly logger = new Logger('GeminiProvider');

  async generate(input: AiGenerateInput): Promise<string> {
    this.logger.debug(`[stub] generate via ${input.model}`);
    return input.prompt;
  }
}
