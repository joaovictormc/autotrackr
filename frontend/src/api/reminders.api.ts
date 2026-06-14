import { api } from './client';

export interface RemindersConfig {
  enabled: boolean;
  channels: { email: boolean; whatsapp: boolean };
  hour: number;
}

export interface EvolutionConfig {
  enabled: boolean;
  baseUrl: string;
  instance: string;
  apiKey: string;
}

export interface RunResult {
  enabled: boolean;
  processed: number;
  sent: number;
}

export const remindersApi = {
  getConfig: () =>
    api.get<{ reminders: RemindersConfig; evolution: EvolutionConfig }>('/reminders/config').then((r) => r.data),
  updateReminders: (dto: { enabled?: boolean; emailEnabled?: boolean; whatsappEnabled?: boolean; hour?: number }) =>
    api.put<RemindersConfig>('/reminders/config', dto).then((r) => r.data),
  updateEvolution: (dto: Partial<EvolutionConfig>) =>
    api.put<EvolutionConfig>('/reminders/evolution', dto).then((r) => r.data),
  runNow: () => api.post<RunResult>('/reminders/run-now').then((r) => r.data),
};
