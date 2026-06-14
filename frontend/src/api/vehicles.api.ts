import { api } from './client';

export interface Vehicle {
  id: string;
  plate: string;
  year: number;
  mileage: number;
  color?: string;
  vin?: string;
  details?: string;
  apiYearCode?: string;
  isFavorite: boolean;
  brand: { id: string; name: string };
  model: { id: string; name: string };
  createdAt: string;
}

export interface CreateVehiclePayload {
  brandName: string;
  brandApiCode?: string;
  modelName: string;
  modelApiCode?: string;
  plate: string;
  year: number;
  mileage?: number;
  color?: string;
  vin?: string;
  details?: string;
  apiYearCode?: string;
}

export const vehiclesApi = {
  getMyVehicles: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),

  getVehicle: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),

  createVehicle: (payload: CreateVehiclePayload) =>
    api.post<Vehicle>('/vehicles', payload).then((r) => r.data),

  updateVehicle: (id: string, data: Partial<Pick<Vehicle, 'mileage' | 'color' | 'details' | 'isFavorite'>>) =>
    api.put<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),

  deleteVehicle: (id: string) => api.delete(`/vehicles/${id}`),
};
