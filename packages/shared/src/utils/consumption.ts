import type { FuelRecord, FuelType } from '../types';
import { fuelTypeInfo } from '../constants';

/**
 * Calcula o consumo médio (km/L, km/m³, etc.) pelo método do tanque cheio.
 *
 * - Agrupa os abastecimentos por tipo de combustível e usa o tipo com mais
 *   registros (evita misturar gasolina/etanol, que têm consumos diferentes).
 * - Ordena por quilometragem crescente.
 * - Soma distância e litros apenas nos segmentos que terminam em tanque cheio.
 *
 * Retorna { value, label } ou null quando não há dados suficientes.
 */
export function avgConsumption(records: FuelRecord[]): { value: number; label: string } | null {
  const byType = new Map<FuelType, FuelRecord[]>();
  records.forEach((r) => {
    const a = byType.get(r.fuelType) ?? [];
    a.push(r);
    byType.set(r.fuelType, a);
  });

  let best: FuelType | null = null;
  let bestCount = 0;
  byType.forEach((a, type) => {
    if (a.length > bestCount) { bestCount = a.length; best = type; }
  });
  if (!best) return null;

  const recs = byType.get(best)!.slice().sort((a, b) => a.mileage - b.mileage);
  let dist = 0;
  let qty = 0;
  for (let i = 1; i < recs.length; i++) {
    if (recs[i].fullTank) {
      const d = recs[i].mileage - recs[i - 1].mileage;
      const q = parseFloat(recs[i].quantity);
      if (d > 0 && q > 0) { dist += d; qty += q; }
    }
  }
  if (qty === 0) return null;
  return { value: dist / qty, label: fuelTypeInfo(best).consumptionLabel };
}
