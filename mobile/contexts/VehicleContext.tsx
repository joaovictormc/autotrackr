import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Vehicle } from '@autotrackr/shared';

interface VehicleContextValue {
  vehicleId: string | null;
  vehicle: Vehicle | null;
  vehicles: Vehicle[];
  setVehicleId: (id: string) => void;
  loadingVehicles: boolean;
}

const VehicleContext = createContext<VehicleContextValue | null>(null);
const STORAGE_KEY = 'autotrackr-vehicle-id';

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicleId, setVehicleIdState] = useState<string | null>(null);

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  });

  // Carrega o veículo salvo do AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setVehicleIdState(stored);
    });
  }, []);

  // Auto-seleciona o primeiro veículo se nenhum estiver salvo
  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) {
      const id = vehicles[0].id;
      setVehicleIdState(id);
      AsyncStorage.setItem(STORAGE_KEY, id);
    }
  }, [vehicles, vehicleId]);

  const setVehicleId = (id: string) => {
    setVehicleIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id);
  };

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  return (
    <VehicleContext.Provider value={{ vehicleId, vehicle, vehicles, setVehicleId, loadingVehicles }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicle must be used within VehicleProvider');
  return ctx;
}
