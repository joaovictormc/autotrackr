import { api } from './client';
import { UserProfile } from './auth.api';

export interface AdminStats {
  users: number;
  vehicles: number;
  brands: number;
  models: number;
  admins: number;
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),

  getUsers: () => api.get<UserProfile[]>('/admin/users').then((r) => r.data),

  updateRole: (id: string, role: 'USER' | 'ADMIN') =>
    api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),
};
