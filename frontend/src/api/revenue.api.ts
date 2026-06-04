import { api } from './client';

export const REVENUE_CATEGORIES = [
  'Aplicativo de transporte',
  'Frete/Entrega',
  'Aluguel',
  'Serviço',
  'Outros',
];

export interface RevenueRecord {
  id: string;
  vehicleId: string;
  date: string;
  category: string;
  amount: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRevenuePayload {
  date: string;
  category: string;
  amount: number;
  notes?: string;
}

export const revenueApi = {
  getRecords: (vehicleId: string) =>
    api.get<RevenueRecord[]>(`/vehicles/${vehicleId}/revenue`).then((r) => r.data),

  createRecord: (vehicleId: string, data: CreateRevenuePayload) =>
    api.post<RevenueRecord>(`/vehicles/${vehicleId}/revenue`, data).then((r) => r.data),

  updateRecord: (vehicleId: string, id: string, data: Partial<CreateRevenuePayload>) =>
    api.put<RevenueRecord>(`/vehicles/${vehicleId}/revenue/${id}`, data).then((r) => r.data),

  deleteRecord: (vehicleId: string, id: string) =>
    api.delete(`/vehicles/${vehicleId}/revenue/${id}`),
};
