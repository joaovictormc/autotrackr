import type { FuelType } from '../types';

export interface FuelTypeOption {
  key: FuelType;
  label: string;
  unit: string;
  consumptionLabel: string;
}

export const FUEL_TYPES: FuelTypeOption[] = [
  { key: 'GASOLINA',           label: 'Gasolina Comum',     unit: 'L',   consumptionLabel: 'km/L' },
  { key: 'GASOLINA_ADITIVADA', label: 'Gasolina Aditivada', unit: 'L',   consumptionLabel: 'km/L' },
  { key: 'GASOLINA_PODIUM',    label: 'Gasolina Podium',    unit: 'L',   consumptionLabel: 'km/L' },
  { key: 'ETANOL',             label: 'Etanol',             unit: 'L',   consumptionLabel: 'km/L' },
  { key: 'DIESEL',             label: 'Diesel',             unit: 'L',   consumptionLabel: 'km/L' },
  { key: 'GNV',                label: 'GNV',                unit: 'm³',  consumptionLabel: 'km/m³' },
  { key: 'ELETRICO',           label: 'Energia Elétrica',   unit: 'kWh', consumptionLabel: 'km/kWh' },
];

export function fuelTypeInfo(type: FuelType): FuelTypeOption {
  return FUEL_TYPES.find((f) => f.key === type) ?? FUEL_TYPES[0];
}

export const REVENUE_CATEGORIES = [
  'Aplicativo de transporte',
  'Frete/Entrega',
  'Aluguel',
  'Serviço',
  'Outros',
];
