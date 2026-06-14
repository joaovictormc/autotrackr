import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../contexts/ThemeContext';
import { useVehicle } from '../../../contexts/VehicleContext';
import { api } from '../../../lib/api';
import FormSheet from '../../../components/FormSheet';
import FuelForm from '../../../components/FuelForm';
import AdInterstitial from '../../../components/AdInterstitial';
import { useAdInterstitial } from '../../../hooks/useAdInterstitial';
import { fmtDate } from '../../../lib/dateUtils';
import type { FuelRecord } from '@autotrackr/shared';

export default function FuelScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const { adVisible, triggerAd, dismissAd, goToUpgrade } = useAdInterstitial();

  const { data: records = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['fuel', vehicleId],
    queryFn: () => api.get<FuelRecord[]>(`/vehicles/${vehicleId}/fuel`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${vehicleId}/fuel/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuel', vehicleId] }),
  });

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (record: FuelRecord) => { setEditing(record); setSheetOpen(true); };
  const closeSheet = () => setSheetOpen(false);

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('fuel.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  // Estimativa de duração para o abastecimento mais recente
  const latestEstimate = (() => {
    if (records.length < 2) return null;
    const sorted = [...records].sort((a, b) => b.mileage - a.mileage);
    const r0 = sorted[0];
    const r1 = sorted[1];
    const kmDriven = r0.mileage - r1.mileage;
    if (kmDriven <= 0) return null;
    const prevQty = parseFloat(r1.quantity as any);
    if (!prevQty || prevQty <= 0) return null;
    const avgKmPerL = kmDriven / prevQty;
    const daysBetween = Math.max(1, (new Date(r0.date).getTime() - new Date(r1.date).getTime()) / 86_400_000);
    const dailyKm = kmDriven / daysBetween;
    if (dailyKm <= 0) return null;
    const totalDays = Math.round((parseFloat(r0.quantity) * avgKmPerL) / dailyKm);
    const elapsed = (Date.now() - new Date(r0.date).getTime()) / 86_400_000;
    const remaining = Math.max(0, Math.round(totalDays - elapsed));
    const nextMileage = r0.mileage + Math.round(parseFloat(r0.quantity) * avgKmPerL);
    return { recordId: r0.id, totalDays, remaining, nextMileage };
  })();

  const renderItem = ({ item }: { item: FuelRecord }) => {
    const estimate = latestEstimate?.recordId === item.id ? latestEstimate : null;
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
              {t(`fuel.types.${item.fuelType}`)}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
              {fmtDate(item.date)}
              {item.station ? ` · ${item.station}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
              {parseFloat(item.quantity).toFixed(3)} L
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              R$ {parseFloat(item.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 6 }}>
              <Pencil size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        {estimate && (
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.primary + '15', borderRadius: 6, padding: 7, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 1 }}>Duração est.</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>~{estimate.totalDays} dias</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: estimate.remaining <= 3 ? '#7f1d1d20' : colors.success + '15', borderRadius: 6, padding: 7, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 1 }}>Restante</Text>
              <Text style={{ color: estimate.remaining <= 3 ? colors.danger : colors.success, fontSize: 12, fontWeight: '700' }}>~{estimate.remaining} dias</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.warning + '15', borderRadius: 6, padding: 7, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 1 }}>Próximo abast.</Text>
              <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700' }}>~{estimate.nextMileage.toLocaleString('pt-BR')} km</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{t('fuel.title')}</Text>
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
                {vehicleId ? t('fuel.empty') : t('common.selectVehicle')}
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>

      <FormSheet visible={sheetOpen} onClose={closeSheet}>
        <FuelForm
          vehicleId={vehicleId!}
          vehicle={vehicle!}
          record={editing}
          records={records}
          onSuccess={() => {
            const isNew = !editing;
            closeSheet();
            qc.invalidateQueries({ queryKey: ['fuel', vehicleId] });
            qc.invalidateQueries({ queryKey: ['vehicles'] });
            if (isNew) triggerAd();
          }}
          onClose={closeSheet}
        />
      </FormSheet>

      <AdInterstitial visible={adVisible} onDismiss={dismissAd} onUpgrade={goToUpgrade} />
    </SafeAreaView>
  );
}
