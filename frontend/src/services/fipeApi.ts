import axios from 'axios';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string;
  name: string;
}

export interface FipeModelResponse {
  models: FipeModel[];
}

export interface FipeVehicleInfo {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  tipoVeiculo: number;
  siglaCombustivel: string;
}

// Cache TTL: 24 horas para marcas/modelos, 6 horas para anos
const TTL_LONG = 24 * 60 * 60 * 1000;
const TTL_SHORT = 6 * 60 * 60 * 1000;

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, ttl: number): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttl }));
  } catch {
    // localStorage cheio — ignora silenciosamente
  }
}

// Retry com backoff exponencial para lidar com 429
async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get<T>(url);
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const isLast = attempt === retries - 1;

      if (isLast || (status !== 429 && status !== 503)) throw err;

      // Espera exponencial: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Todas as tentativas falharam');
}

export const getBrands = async (): Promise<FipeBrand[]> => {
  const cacheKey = 'fipe:brands';
  const cached = getCache<FipeBrand[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry<FipeBrand[]>(`${BASE_URL}/carros/marcas`);
  setCache(cacheKey, data, TTL_LONG);
  return data;
};

export const getModels = async (brandCode: string): Promise<FipeModelResponse> => {
  const cacheKey = `fipe:models:${brandCode}`;
  const cached = getCache<FipeModelResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry<FipeModelResponse>(
    `${BASE_URL}/carros/marcas/${brandCode}/modelos`
  );
  setCache(cacheKey, data, TTL_LONG);
  return data;
};

export const getYears = async (brandCode: string, modelCode: string): Promise<FipeYear[]> => {
  const cacheKey = `fipe:years:${brandCode}:${modelCode}`;
  const cached = getCache<FipeYear[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry<FipeYear[]>(
    `${BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos`
  );
  setCache(cacheKey, data, TTL_SHORT);
  return data;
};

export const getVehicleInfo = async (
  brandCode: string,
  modelCode: string,
  yearCode: string
): Promise<FipeVehicleInfo> => {
  const cacheKey = `fipe:info:${brandCode}:${modelCode}:${yearCode}`;
  const cached = getCache<FipeVehicleInfo>(cacheKey);
  if (cached) return cached;

  const data = await fetchWithRetry<FipeVehicleInfo>(
    `${BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`
  );
  setCache(cacheKey, data, TTL_LONG);
  return data;
};

export default { getBrands, getModels, getYears, getVehicleInfo };
