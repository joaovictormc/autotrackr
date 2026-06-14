import { AiProvider as AiProviderEnum } from '@prisma/client';

export interface AiGenerateInput {
  model: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  systemPrompt?: string | null;
  temperature: number;
  prompt: string;
}

export interface AiProvider {
  readonly provider: AiProviderEnum;
  generate(input: AiGenerateInput): Promise<string>;
}
