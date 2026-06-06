import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../../contexts/ThemeContext';
import { useVehicle } from '../../../contexts/VehicleContext';
import { api } from '../../../lib/api';
import MaintenanceForm from '../../../components/MaintenanceForm';
import type { MaintenanceRecord } from '@autotrackr/shared';

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const qc = useQueryClient();
  const sheetRef = useRef<BottomSheet>(null);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);

  const { data: records = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      api.put(`/vehicles/${vehicleId}/maintenance/${id}`, { isCompleted }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance', vehicleId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${vehicleId}/maintenance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance', vehicleId] }),
  });

  const openNew = () => { setEditing(null); sheetRef.current?.expand(); };
  const openEdit = (r: MaintenanceRecord) => { setEditing(r); sheetRef.current?.expand(); };
  const closeSheet = useCallback(() => sheetRef.current?.close(), []);

  const today = new Date();
  const getStatus = (r: MaintenanceRecord) => {
    if (r.isCompleted) return 'completed';
    if (r.reminderDate && new Date(r.reminderDate) <= today) return 'overdue';
    if (r.reminderMileage && vehicle && vehicle.mileage >= r.reminderMileage) return 'overdue';
    return 'pending';
  };

  const statusColors: Record<string, string> = {
    completed: colors.success,
    overdue: colors.warning,
    pending: colors.textMuted,
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('maintenance.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderItem = ({ item }: { item: MaintenanceRecord }) => {
    const status = getStatus(item);
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity onPress={() => toggleMutation.mutate({ id: item.id, isCompleted: !item.isCompleted })}>
          {item.isCompleted
            ? <CheckCircle size={22} color={colors.success} />
            : <Circle size={22} color={statusColors[status]} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{item.maintenanceType.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
            {new Date(item.date).toLocaleDateString('pt-BR')} · {item.mileage.toLocaleString('pt-BR')} km
          </Text>
          {status === 'overdue' && (
            <Text style={{ color: colors.warning, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              {t('maintenance.overdue')}
            </Text>
          )}
        </View>
        {item.cost && (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            R$ {parseFloat(item.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 6 }}>
            <Pencil size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{t('maintenance.title')}</Text>
            {vehicle && <Text style={{ color: colors.textMuted, fontSize: 12 }}>{vehicle.brand.name} {vehicle.model.name}</Text>}
          </View>
          <TouchableOpacity
            onPress={openNew}
            disabled={!vehicleId}
            style={{ backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: vehicleId ? 1 : 0.4 }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={records}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                {vehicleId ? t('maintenance.empty') : t('common.selectVehicle')}
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['75%', '95%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <MaintenanceForm
          vehicleId={vehicleId!}
          vehicle={vehicle!}
          record={editing}
          onSuccess={() => { closeSheet(); qc.invalidateQueries({ queryKey: ['maintenance', vehicleId] }); }}
          onClose={closeSheet}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}
