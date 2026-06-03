import { api } from './client';

export interface Brand {
  id: string;
  name: string;
  apiCode?: string;
}

export const brandsApi = {
  getAll: () => api.get<Brand[]>('/brands').then((r) => r.data),

  create: (name: string, apiCode?: string) =>
    api.post<Brand>('/brands', { name, apiCode }).then((r) => r.data),

  update: (id: string, data: { name?: string; apiCode?: string }) =>
    api.put<Brand>(`/brands/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/brands/${id}`),

  bulkImport: (brands: Array<{ name: string; apiCode?: string }>) =>
    api.post<{ created: number; total: number }>('/brands/bulk-import', { brands }).then((r) => r.data),
};
