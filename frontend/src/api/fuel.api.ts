import { api } from './client';

export type FuelType = 'GASOLINA' | 'ETANOL' | 'DIESEL' | 'GNV' | 'ELETRICO';

export interface FuelTypeOption {
  key: FuelType;
  label: string;
  unit: string; // L, m³, kWh
  consumptionLabel: string; // km/L, km/m³, km/kWh
}

export const FUEL_TYPES: FuelTypeOption[] = [
  { key: 'GASOLINA', label: 'Gasolina', unit: 'L', consumptionLabel: 'km/L' },
  { key: 'ETANOL', label: 'Etanol', unit: 'L', consumptionLabel: 'km/L' },
  { key: 'DIESEL', label: 'Diesel', unit: 'L', consumptionLabel: 'km/L' },
  { key: 'GNV', label: 'GNV', unit: 'm³', consumptionLabel: 'km/m³' },
  { key: 'ELETRICO', label: 'Energia Elétrica', unit: 'kWh', consumptionLabel: 'km/kWh' },
];

export function fuelTypeInfo(type: FuelType): FuelTypeOption {
  return FUEL_TYPES.find((f) => f.key === type) ?? FUEL_TYPES[0];
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: FuelType;
  mileage: number;
  quantity: string;
  pricePerUnit: string;
  totalCost: string;
  fullTank: boolean;
  station?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFuelPayload {
  date: string;
  fuelType: FuelType;
  mileage: number;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  fullTank?: boolean;
  station?: string;
  notes?: string;
}

export const fuelApi = {
  getRecords: (vehicleId: string) =>
    api.get<FuelRecord[]>(`/vehicles/${vehicleId}/fuel`).then((r) => r.data),

  createRecord: (vehicleId: string, data: CreateFuelPayload) =>
    api.post<FuelRecord>(`/vehicles/${vehicleId}/fuel`, data).then((r) => r.data),

  updateRecord: (vehicleId: string, id: string, data: Partial<CreateFuelPayload>) =>
    api.put<FuelRecord>(`/vehicles/${vehicleId}/fuel/${id}`, data).then((r) => r.data),

  deleteRecord: (vehicleId: string, id: string) =>
    api.delete(`/vehicles/${vehicleId}/fuel/${id}`),
};
