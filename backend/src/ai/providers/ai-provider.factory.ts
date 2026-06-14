import { BadRequestException, Injectable } from '@nestjs/common';
import { AiProvider as AiProviderEnum } from '@prisma/client';
import { AiProvider } from './ai-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAiProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { OllamaProvider } from './ollama.provider';

@Injectable()
export class AiProviderFactory {
  private readonly registry: Record<AiProviderEnum, AiProvider>;

  constructor(
    anthropic: AnthropicProvider,
    openai: OpenAiProvider,
    gemini: GeminiProvider,
    ollama: OllamaProvider,
  ) {
    this.registry = {
      [AiProviderEnum.ANTHROPIC]: anthropic,
      [AiProviderEnum.OPENAI]: openai,
      [AiProviderEnum.GEMINI]: gemini,
      [AiProviderEnum.OLLAMA]: ollama,
    };
  }

  get(provider: AiProviderEnum): AiProvider {
    const impl = this.registry[provider];
    if (!impl) throw new BadRequestException(`Provedor de IA não suportado: ${provider}`);
    return impl;
  }
}
