import { api } from './client';

export interface Model {
  id: string;
  brandId: string;
  name: string;
  apiCode?: string;
  brand: { id: string; name: string };
}

export const modelsApi = {
  getAll: (brandId?: string) =>
    api.get<Model[]>('/models', { params: brandId ? { brandId } : undefined }).then((r) => r.data),

  create: (brandId: string, name: string, apiCode?: string) =>
    api.post<Model>('/models', { brandId, name, apiCode }).then((r) => r.data),

  update: (id: string, data: { brandId?: string; name?: string }) =>
    api.put<Model>(`/models/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/models/${id}`),

  bulkImport: (models: Array<{ brandId: string; name: string }>) =>
    api.post<{ created: number; total: number }>('/models/bulk-import', { models }).then((r) => r.data),
};
