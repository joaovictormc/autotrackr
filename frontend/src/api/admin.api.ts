import { api } from './client';
import { UserProfile } from './auth.api';

export interface AdminStats {
  users: number;
  vehicles: number;
  brands: number;
  models: number;
  admins: number;
  proUsers: number;
}

export interface AdminUser extends UserProfile {
  proSince?: string | null;
  createdAt?: string;
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),

  getUsers: () => api.get<AdminUser[]>('/admin/users').then((r) => r.data),

  updateRole: (id: string, role: 'USER' | 'OPERADOR' | 'ADMIN') =>
    api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  updatePlan: (id: string, plan: 'FREE' | 'PRO') =>
    api.put(`/admin/users/${id}/plan`, { plan }).then((r) => r.data),
};
