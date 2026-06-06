import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.22:3000/api/v1';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Web fallback: expo-secure-store usa localStorage no web
const storage = {
  get: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.setItem(key, value) : undefined)
      : SecureStore.setItemAsync(key, value),
  del: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.removeItem(key) : undefined)
      : SecureStore.deleteItemAsync(key),
};

export async function getAccessToken() {
  return storage.get(ACCESS_TOKEN_KEY);
}

export async function setTokens(access: string, refresh?: string) {
  await storage.set(ACCESS_TOKEN_KEY, access);
  if (refresh) await storage.set(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens() {
  await storage.del(ACCESS_TOKEN_KEY);
  await storage.del(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
type QueueItem = { resolve: (t: string) => void; reject: (e: unknown) => void };
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'X-Client': 'mobile' },
});

// Injeta access token em cada requisição
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automático em 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefreshEndpoint = original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.get(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'X-Client': 'mobile' } }
        );
        await setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        // AuthContext ouvirá a flag e redirecionará para login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
