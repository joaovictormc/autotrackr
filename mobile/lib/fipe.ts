import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export interface FipeEntry {
  code: string;
  name: string;
}

interface RawEntry { codigo: string | number; nome: string; }
interface RawModelResponse { modelos: RawEntry[]; }

const CACHE_V = 'v1';
const TTL_LONG = 24 * 60 * 60 * 1000; // 24h marcas/modelos
const TTL_SHORT = 6 * 60 * 60 * 1000; // 6h anos

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttl }));
  } catch {
    /* ignora */
  }
}

// Retry com backoff exponencial para lidar com 429/503
async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get<T>(url);
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const isLast = attempt === retries - 1;
      if (isLast || (status !== 429 && status !== 503)) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Todas as tentativas falharam');
}

export async function getBrands(): Promise<FipeEntry[]> {
  const key = `fipe:${CACHE_V}:brands`;
  const cached = await getCache<FipeEntry[]>(key);
  if (cached) return cached;
  const raw = await fetchWithRetry<RawEntry[]>(`${BASE_URL}/carros/marcas`);
  const data = raw.map(b => ({ code: String(b.codigo), name: b.nome }));
  await setCache(key, data, TTL_LONG);
  return data;
}

export async function getModels(brandCode: string): Promise<FipeEntry[]> {
  const key = `fipe:${CACHE_V}:models:${brandCode}`;
  const cached = await getCache<FipeEntry[]>(key);
  if (cached) return cached;
  const raw = await fetchWithRetry<RawModelResponse>(`${BASE_URL}/carros/marcas/${brandCode}/modelos`);
  const data = raw.modelos.map(m => ({ code: String(m.codigo), name: m.nome }));
  await setCache(key, data, TTL_LONG);
  return data;
}

export async function getYears(brandCode: string, modelCode: string): Promise<FipeEntry[]> {
  const key = `fipe:${CACHE_V}:years:${brandCode}:${modelCode}`;
  const cached = await getCache<FipeEntry[]>(key);
  if (cached) return cached;
  const raw = await fetchWithRetry<RawEntry[]>(`${BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos`);
  const data = raw.map(y => ({ code: String(y.codigo), name: y.nome }));
  await setCache(key, data, TTL_SHORT);
  return data;
}
