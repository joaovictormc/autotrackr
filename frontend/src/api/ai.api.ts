import { api } from './client';

export type AiProvider = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'OLLAMA';

export interface AiModel {
  id: string;
  provider: AiProvider;
  label: string;
  model: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  systemPrompt?: string | null;
  temperature: number;
  enabled: boolean;
  isDefault: boolean;
}

export interface AiModelInput {
  provider: AiProvider;
  label: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
  enabled?: boolean;
  isDefault?: boolean;
}

export const aiApi = {
  list: () => api.get<AiModel[]>('/ai/models').then((r) => r.data),
  create: (dto: AiModelInput) => api.post<AiModel>('/ai/models', dto).then((r) => r.data),
  update: (id: string, dto: Partial<AiModelInput>) => api.put<AiModel>(`/ai/models/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete(`/ai/models/${id}`).then((r) => r.data),
  test: (id: string) => api.post<{ output: string }>(`/ai/models/${id}/test`).then((r) => r.data),
};
