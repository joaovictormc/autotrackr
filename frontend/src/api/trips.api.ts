import { api } from './client';

export type TripPurpose = 'WORK' | 'PERSONAL' | 'BUSINESS' | 'OTHER';

export const TRIP_PURPOSES: Array<{ key: TripPurpose; labelPt: string; labelEn: string }> = [
  { key: 'PERSONAL', labelPt: 'Pessoal', labelEn: 'Personal' },
  { key: 'WORK', labelPt: 'Trabalho', labelEn: 'Work' },
  { key: 'BUSINESS', labelPt: 'Negócios', labelEn: 'Business' },
  { key: 'OTHER', labelPt: 'Outro', labelEn: 'Other' },
];

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

export const tripsApi = {
  getTrips: (vehicleId: string) =>
    api.get<Trip[]>(`/vehicles/${vehicleId}/trips`).then((r) => r.data),

  createTrip: (vehicleId: string, data: CreateTripPayload) =>
    api.post<Trip>(`/vehicles/${vehicleId}/trips`, data).then((r) => r.data),

  updateTrip: (vehicleId: string, id: string, data: Partial<CreateTripPayload>) =>
    api.put<Trip>(`/vehicles/${vehicleId}/trips/${id}`, data).then((r) => r.data),

  deleteTrip: (vehicleId: string, id: string) =>
    api.delete(`/vehicles/${vehicleId}/trips/${id}`),
};
