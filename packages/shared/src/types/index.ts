// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'OPERADOR' | 'ADMIN';
  plan: 'FREE' | 'PRO';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string; // presente quando X-Client: mobile
  user: UserProfile;
}

export interface MobileRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

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

// ─── Fuel ─────────────────────────────────────────────────────────────────────

export type FuelType =
  | 'GASOLINA'
  | 'GASOLINA_ADITIVADA'
  | 'GASOLINA_PODIUM'
  | 'ETANOL'
  | 'DIESEL'
  | 'GNV'
  | 'ELETRICO';

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
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number;
  longitude?: number;
  notes?: string;
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

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

// ─── Trips ───────────────────────────────────────────────────────────────────

export type TripPurpose = 'WORK' | 'PERSONAL' | 'BUSINESS' | 'OTHER';

export interface Trip {
  id: string;
  vehicleId: string;
  date: string;
  origin: string;
  destination: string;
  distanceKm: number;
  mileageStart?: number | null;
  mileageEnd?: number | null;
  durationMin?: number | null;
  purpose: TripPurpose;
  passengers?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripPayload {
  date: string;
  origin: string;
  destination: string;
  distanceKm: number;
  mileageStart?: number;
  mileageEnd?: number;
  durationMin?: number;
  purpose?: TripPurpose;
  passengers?: number;
  notes?: string;
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

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
