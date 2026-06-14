import { api } from './client';

export interface MaintenanceType {
  id: string;
  name: string;
  description?: string;
  defaultIntervalKm?: number | null;
  defaultIntervalMonths?: number | null;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceTypeId: string;
  maintenanceType: { id: string; name: string };
  date: string;
  mileage: number;
  cost?: string | null;
  notes?: string | null;
  location?: string | null;
  reminderDate?: string | null;
  reminderMileage?: number | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenancePayload {
  maintenanceTypeId: string;
  date: string;
  mileage: number;
  cost?: number;
  notes?: string;
  location?: string;
  reminderDate?: string;
  reminderMileage?: number;
  isCompleted?: boolean;
}

export const maintenanceApi = {
  getTypes: () =>
    api.get<MaintenanceType[]>('/maintenance/types').then((r) => r.data),

  createType: (name: string) =>
    api.post<MaintenanceType>('/maintenance/types', { name }).then((r) => r.data),

  getRecords: (vehicleId: string) =>
    api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`).then((r) => r.data),

  createRecord: (vehicleId: string, data: CreateMaintenancePayload) =>
    api.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, data).then((r) => r.data),

  updateRecord: (vehicleId: string, id: string, data: Partial<CreateMaintenancePayload>) =>
    api.put<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance/${id}`, data).then((r) => r.data),

  deleteRecord: (vehicleId: string, id: string) =>
    api.delete(`/vehicles/${vehicleId}/maintenance/${id}`),
};
