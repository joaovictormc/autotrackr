import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, TrendingUp, Gauge, ChevronDown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVehicle } from '../../contexts/VehicleContext';
import { api } from '../../lib/api';
import type { MaintenanceRecord, FuelRecord } from '@autotrackr/shared';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { vehicleId, vehicle, vehicles, setVehicleId, loadingVehicles } = useVehicle();
  const [vehiclePicker, setVehiclePicker] = React.useState(false);

  const { data: maintenanceRecords = [], refetch: refetchMaint, isRefetching } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const { data: fuelRecords = [] } = useQuery({
    queryKey: ['fuel', vehicleId],
    queryFn: () => api.get<FuelRecord[]>(`/vehicles/${vehicleId}/fuel`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const today = new Date();
  const overdueMaints = maintenanceRecords.filter(m => {
    if (m.isCompleted) return false;
    if (m.reminderDate && new Date(m.reminderDate) <= today) return true;
    if (m.reminderMileage && vehicle && vehicle.mileage >= m.reminderMileage) return true;
    return false;
  });

  const lastFuel = fuelRecords[0];
  const avgConsumption = (() => {
    const fullTanks = fuelRecords.filter(f => f.fullTank);
    if (fullTanks.length < 2) return null;
    const totalKm = fullTanks[0].mileage - fullTanks[fullTanks.length - 1].mileage;
    const totalL = fullTanks.slice(0, -1).reduce((s, f) => s + parseFloat(f.quantity), 0);
    return totalL > 0 ? (totalKm / totalL).toFixed(1) : null;
  })();

  const s = { background: colors.background, surface: colors.surface, border: colors.border };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: s.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchMaint} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
            {t('nav.appName')}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {user?.name?.split(' ')[0]}
          </Text>
        </View>

        {/* Vehicle Selector */}
        <TouchableOpacity
          onPress={() => setVehiclePicker(!vehiclePicker)}
          style={{ backgroundColor: s.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: s.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 2 }}>{t('common.vehicle')}</Text>
            {loadingVehicles
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                  {vehicle ? `${vehicle.brand.name} ${vehicle.model.name} · ${vehicle.plate}` : t('common.selectVehicle')}
                </Text>
            }
          </View>
          <ChevronDown size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Vehicle picker dropdown */}
        {vehiclePicker && vehicles.length > 0 && (
          <View style={{ backgroundColor: s.surface, borderRadius: 12, borderWidth: 1, borderColor: s.border, overflow: 'hidden' }}>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                onPress={() => { setVehicleId(v.id); setVehiclePicker(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: s.border, backgroundColor: v.id === vehicleId ? colors.primary + '20' : 'transparent' }}
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: s.surface, borderRadius: 12, padding: 14, borderTopWidth: 2, borderTopColor: colors.primary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Gauge size={14} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>KM atual</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
                {vehicle.mileage.toLocaleString('pt-BR')}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: s.surface, borderRadius: 12, padding: 14, borderTopWidth: 2, borderTopColor: colors.success }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <TrendingUp size={14} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Média km/L</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
                {avgConsumption ?? '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Overdue maintenance alerts */}
        {overdueMaints.length > 0 && (
          <View style={{ backgroundColor: '#422006', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: colors.warning }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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

        {/* Recent activity */}
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontWeight: '600' }}>
            {t('dashboard.recentActivity')}
          </Text>
          {fuelRecords.length === 0 && maintenanceRecords.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('dashboard.noRecentActivity')}</Text>
          ) : (
            [...fuelRecords.slice(0, 3).map(f => ({ ...f, _type: 'fuel' as const })),
             ...maintenanceRecords.slice(0, 2).map(m => ({ ...m, _type: 'maint' as const }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((item) => (
                <View key={item.id} style={{ backgroundColor: s.surface, borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item._type === 'fuel' ? (
                    <>
                      <View>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                          {(item as FuelRecord).fuelType.replace('_', ' ')}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                          {new Date((item as FuelRecord).date).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                        {parseFloat((item as FuelRecord).quantity).toFixed(3)} L
                      </Text>
                    </>
                  ) : (
                    <>
                      <View>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                          {(item as MaintenanceRecord).maintenanceType.name}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>
                          {new Date((item as MaintenanceRecord).date).toLocaleDateString('pt-BR')}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
