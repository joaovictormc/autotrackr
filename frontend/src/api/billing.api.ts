import { api } from './client';

export type PaymentProvider = 'MERCADO_PAGO' | 'STRIPE' | 'PIX_DIRETO';
export type CouponType = 'PERCENT' | 'FIXED';
export type SubscriptionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  maxRedemptions?: number | null;
  timesRedeemed: number;
  expiresAt?: string | null;
  active: boolean;
}

export interface Gateway {
  id: string;
  provider: PaymentProvider;
  label: string;
  enabled: boolean;
  isDefault: boolean;
  config: Record<string, any>;
}

export interface AvailableGateway {
  provider: PaymentProvider;
  label: string;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  amount: string;
  checkoutUrl?: string | null;
  pixPayload?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface PricePreview {
  basePrice: number;
  discount: number;
  finalAmount: number;
}

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  maxRedemptions?: number;
  expiresAt?: string;
  active?: boolean;
}

export const billingApi = {
  // Cupons (admin)
  listCoupons: () => api.get<Coupon[]>('/billing/coupons').then((r) => r.data),
  createCoupon: (dto: CreateCouponInput) => api.post<Coupon>('/billing/coupons', dto).then((r) => r.data),
  updateCoupon: (id: string, dto: Partial<CreateCouponInput>) =>
    api.put<Coupon>(`/billing/coupons/${id}`, dto).then((r) => r.data),
  deleteCoupon: (id: string) => api.delete(`/billing/coupons/${id}`).then((r) => r.data),

  // Gateways (admin)
  listGateways: () => api.get<Gateway[]>('/billing/gateways').then((r) => r.data),
  upsertGateway: (provider: PaymentProvider, dto: { label: string; enabled?: boolean; config?: Record<string, any> }) =>
    api.put<Gateway>(`/billing/gateways/${provider}`, dto).then((r) => r.data),
  setDefaultGateway: (provider: PaymentProvider) =>
    api.post<Gateway>(`/billing/gateways/${provider}/default`).then((r) => r.data),

  // Cliente
  availableGateways: () => api.get<AvailableGateway[]>('/billing/gateways/available').then((r) => r.data),
  preview: (coupon?: string) =>
    api.get<PricePreview>('/billing/preview', { params: coupon ? { coupon } : {} }).then((r) => r.data),
  checkout: (provider: PaymentProvider, couponCode?: string) =>
    api.post<Subscription>('/billing/checkout', { provider, couponCode }).then((r) => r.data),
  confirm: (id: string) => api.post<Subscription>(`/billing/checkout/${id}/confirm`).then((r) => r.data),
  mySubscriptions: () => api.get<Subscription[]>('/billing/subscriptions/me').then((r) => r.data),
};
