import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, TrendingUp, Gauge, Route, ChevronDown } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVehicle } from '../../contexts/VehicleContext';
import AdBanner from '../../components/AdBanner';
import { api } from '../../lib/api';
import { fmtDate, parseLocalDate } from '../../lib/dateUtils';
import { avgConsumption } from '@autotrackr/shared';
import type { MaintenanceRecord, FuelRecord, Trip } from '@autotrackr/shared';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { vehicleId, vehicle, vehicles, setVehicleId, loadingVehicles } = useVehicle();
  const qc = useQueryClient();
  const [vehiclePicker, setVehiclePicker] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (vehicleId) {
        qc.invalidateQueries({ queryKey: ['fuel', vehicleId] });
        qc.invalidateQueries({ queryKey: ['maintenance', vehicleId] });
        qc.invalidateQueries({ queryKey: ['trips', vehicleId] });
        qc.invalidateQueries({ queryKey: ['vehicles'] });
      }
    }, [vehicleId, qc]),
  );

  const { data: maintenanceRecords = [], refetch: refetchMaint, isRefetching } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const { data: fuelRecords = [], refetch: refetchFuel } = useQuery({
    queryKey: ['fuel', vehicleId],
    queryFn: () => api.get<FuelRecord[]>(`/vehicles/${vehicleId}/fuel`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const { data: trips = [], refetch: refetchTrips } = useQuery({
    queryKey: ['trips', vehicleId],
    queryFn: () => api.get<Trip[]>(`/vehicles/${vehicleId}/trips`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const handleRefresh = () => { refetchMaint(); refetchFuel(); refetchTrips(); };

  const today = new Date();
  const overdueMaints = maintenanceRecords.filter(m => {
    if (m.isCompleted) return false;
    if (m.reminderDate && parseLocalDate(m.reminderDate) <= today) return true;
    if (m.reminderMileage && vehicle && vehicle.mileage >= m.reminderMileage) return true;
    return false;
  });

  const consumption = avgConsumption(fuelRecords);

  const now = new Date();
  const kmThisMonth = trips
    .filter(tr => {
      const d = new Date(tr.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, tr) => sum + tr.distanceKm, 0);

  const recentItems = [
    ...fuelRecords.slice(0, 2).map(f => ({ ...f, _type: 'fuel' as const })),
    ...maintenanceRecords.slice(0, 2).map(m => ({ ...m, _type: 'maint' as const })),
    ...trips.slice(0, 2).map(tr => ({ ...tr, _type: 'trip' as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
            {t('nav.appName')}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {user?.name?.split(' ')[0]}
          </Text>
        </View>

        {/* Vehicle Selector */}
        <TouchableOpacity
          onPress={() => setVehiclePicker(v => !v)}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 3 }}>
              {t('common.vehicle')}
            </Text>
            {loadingVehicles ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                {vehicle
                  ? `${vehicle.brand.name} ${vehicle.model.name} · ${vehicle.plate}`
                  : t('common.selectVehicle')}
              </Text>
            )}
          </View>
          <ChevronDown size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Vehicle picker dropdown */}
        {vehiclePicker && vehicles.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12 }}>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                onPress={() => { setVehicleId(v.id); setVehiclePicker(false); }}
                style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: v.id === vehicleId ? colors.primary + '20' : 'transparent',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: v.id === vehicleId ? '600' : '400' }}>
                  {v.brand.name} {v.model.name} · {v.plate}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats row */}
        {vehicle && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderTopWidth: 2, borderTopColor: colors.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Gauge size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>KM atual</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {vehicle.mileage.toLocaleString('pt-BR')}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderTopWidth: 2, borderTopColor: colors.success }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <TrendingUp size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Média km/L</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {consumption ? consumption.value.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderTopWidth: 2, borderTopColor: '#8b5cf6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Route size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{t('trips.kmThisMonth')}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {kmThisMonth.toLocaleString('pt-BR')}
              </Text>
            </View>
          </View>
        )}

        {/* Overdue maintenance alerts */}
        {overdueMaints.length > 0 && (
          <View style={{ backgroundColor: '#422006', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: colors.warning, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={{ color: '#fed7aa', fontWeight: '600', fontSize: 13 }}>
                {t('notifications.count_other', { count: overdueMaints.length })}
              </Text>
            </View>
            {overdueMaints.slice(0, 3).map(m => (
              <Text key={m.id} style={{ color: '#fb923c', fontSize: 12, marginBottom: 2 }}>
                • {m.maintenanceType.name}
              </Text>
            ))}
          </View>
        )}

        {/* Ad banner (Free apenas) */}
        <AdBanner />

        {/* Recent activity */}
        <Text style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, fontWeight: '600' }}>
          {t('dashboard.recentActivity')}
        </Text>

        {recentItems.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {t('dashboard.noRecentActivity')}
          </Text>
        ) : (
          recentItems.map(item => (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {item._type === 'fuel' ? (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                      {t(`fuel.types.${(item as FuelRecord).fuelType}`)}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {fmtDate((item as FuelRecord).date)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {parseFloat((item as FuelRecord).quantity).toFixed(3)} L
                  </Text>
                </>
              ) : item._type === 'trip' ? (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                      {(item as Trip).origin} → {(item as Trip).destination}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {fmtDate((item as Trip).date)} · {t(`trips.purposes.${(item as Trip).purpose}`)}
                    </Text>
                  </View>
                  <Text style={{ color: '#8b5cf6', fontSize: 13, fontWeight: '600' }}>
                    {(item as Trip).distanceKm.toLocaleString('pt-BR')} km
                  </Text>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                      {(item as MaintenanceRecord).maintenanceType.name}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {fmtDate((item as MaintenanceRecord).date)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {(item as MaintenanceRecord).mileage.toLocaleString('pt-BR')} km
                  </Text>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
