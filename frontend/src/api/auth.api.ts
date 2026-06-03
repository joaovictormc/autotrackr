import { api } from './client';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/sign-in', { email, password }).then((r) => r.data),

  signUp: (email: string, password: string, name: string, phone?: string) =>
    api.post<AuthResponse>('/auth/sign-up', { email, password, name, phone }).then((r) => r.data),

  signOut: () => api.post('/auth/sign-out'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  updatePassword: (password: string) => api.put('/auth/update-password', { password }),

  getMe: () => api.get<UserProfile>('/auth/me').then((r) => r.data),

  updateMe: (data: { name?: string; phone?: string }) =>
    api.put<UserProfile>('/auth/me', data).then((r) => r.data),
};
