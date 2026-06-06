import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useVehicle } from '../../../../contexts/VehicleContext';
import { api } from '../../../../lib/api';
import ScreenHeader from '../../../../components/ScreenHeader';
import type { FuelRecord, MaintenanceRecord, RevenueRecord } from '@autotrackr/shared';

type Period = '30d' | '3m' | '6m' | '12m' | 'all';
const PERIODS: Period[] = ['30d', '3m', '6m', '12m', 'all'];

function periodStart(p: Period): Date | null {
  if (p === 'all') return null;
  const d = new Date();
  if (p === '30d') d.setDate(d.getDate() - 30);
  else if (p === '3m') d.setMonth(d.getMonth() - 3);
  else if (p === '6m') d.setMonth(d.getMonth() - 6);
  else if (p === '12m') d.setMonth(d.getMonth() - 12);
  return d;
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('3m');

  const { data: fuel = [], isLoading: l1 } = useQuery({
    queryKey: ['fuel', vehicleId],
    queryFn: () => api.get<FuelRecord[]>(`/vehicles/${vehicleId}/fuel`).then(r => r.data),
    enabled: !!vehicleId,
  });
  const { data: maintenance = [], isLoading: l2 } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`).then(r => r.data),
    enabled: !!vehicleId,
  });
  const { data: revenue = [], isLoading: l3 } = useQuery({
    queryKey: ['revenue', vehicleId],
    queryFn: () => api.get<RevenueRecord[]>(`/vehicles/${vehicleId}/revenue`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const stats = useMemo(() => {
    const start = periodStart(period);
    const inRange = (d: string) => !start || new Date(d) >= start;

    const fuelInRange = fuel.filter(f => inRange(f.date));
    const maintInRange = maintenance.filter(m => inRange(m.date));
    const revInRange = revenue.filter(r => inRange(r.date));

    const fuelCost = fuelInRange.reduce((s, f) => s + parseFloat(f.totalCost), 0);
    const maintCost = maintInRange.reduce((s, m) => s + (m.cost ? parseFloat(m.cost) : 0), 0);
    const totalExpense = fuelCost + maintCost;
    const totalRevenue = revInRange.reduce((s, r) => s + parseFloat(r.amount), 0);
    const balance = totalRevenue - totalExpense;

    // Expenses by month for bar chart
    const byMonth: Record<string, number> = {};
    [...fuelInRange.map(f => ({ date: f.date, val: parseFloat(f.totalCost) })),
     ...maintInRange.map(m => ({ date: m.date, val: m.cost ? parseFloat(m.cost) : 0 }))]
      .forEach(({ date, val }) => {
        const key = date.slice(0, 7); // YYYY-MM
        byMonth[key] = (byMonth[key] ?? 0) + val;
      });
    const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    const maxMonth = Math.max(...months.map(([, v]) => v), 1);

    return { fuelCost, maintCost, totalExpense, totalRevenue, balance, months, maxMonth };
  }, [fuel, maintenance, revenue, period]);

  const loading = l1 || l2 || l3;
  const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('reports.title')}
        subtitle={vehicle ? `${vehicle.brand.name} ${vehicle.model.name}` : undefined}
      />

      {!vehicleId ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>{t('reports.needVehicle')}</Text>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
          {/* Period selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: period === p ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: period === p ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: period === p ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                  {t(`reports.periods.${p}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Summary cards */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderTopWidth: 2, borderTopColor: colors.danger }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('reports.totalExpense')}</Text>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 3 }}>{brl(stats.totalExpense)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{t('reports.totalExpenseSub')}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderTopWidth: 2, borderTopColor: colors.success }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('reports.totalRevenue')}</Text>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 3 }}>{brl(stats.totalRevenue)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{t('reports.totalRevenueSub')}</Text>
            </View>
          </View>

          {/* Balance */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: stats.balance >= 0 ? colors.success : colors.danger }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('reports.balance')}</Text>
            <Text style={{ color: stats.balance >= 0 ? colors.success : colors.danger, fontSize: 24, fontWeight: '800', marginTop: 2 }}>
              {brl(stats.balance)}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
              {stats.balance >= 0 ? t('reports.profit') : t('reports.loss')}
            </Text>
          </View>

          {/* Expense distribution */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 10 }}>{t('reports.expenseDistribution')}</Text>
            {[
              { label: t('reports.fuel'), val: stats.fuelCost, color: colors.primary },
              { label: t('reports.maintenance'), val: stats.maintCost, color: colors.warning },
            ].map(({ label, val, color }) => {
              const pct = stats.totalExpense > 0 ? (val / stats.totalExpense) * 100 : 0;
              return (
                <View key={label} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{brl(val)}</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Monthly expenses bar chart */}
          {stats.months.length > 0 && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 14 }}>{t('reports.expensesByMonth')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, gap: 6 }}>
                {stats.months.map(([month, val]) => {
                  const h = (val / stats.maxMonth) * 100;
                  const [, mm] = month.split('-');
                  return (
                    <View key={month} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 9, marginBottom: 4 }}>
                        {(val / 1000).toFixed(1)}k
                      </Text>
                      <View style={{ width: '70%', height: `${Math.max(h, 3)}%`, backgroundColor: colors.primary, borderRadius: 4, minHeight: 4 }} />
                      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>{mm}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {stats.totalExpense === 0 && stats.totalRevenue === 0 && (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>{t('reports.noData')}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
