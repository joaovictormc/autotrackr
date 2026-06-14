import { Module } from '@nestjs/common';

import { AiModelsController } from './ai-models.controller';
import { AiModelsService } from './ai-models.service';
import { AiService } from './ai.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  controllers: [AiModelsController],
  providers: [
    AiModelsService,
    AiService,
    AiProviderFactory,
    AnthropicProvider,
    OpenAiProvider,
    GeminiProvider,
    OllamaProvider,
  ],
  exports: [AiService],
})
export class AiModule {}
