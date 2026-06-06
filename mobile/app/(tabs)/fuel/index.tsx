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
import type { FuelRecord } from '@autotrackr/shared';

export default function FuelScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);

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

  const renderItem = ({ item }: { item: FuelRecord }) => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
          {t(`fuel.types.${item.fuelType}`)}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
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
  );

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
          onSuccess={() => { closeSheet(); qc.invalidateQueries({ queryKey: ['fuel', vehicleId] }); }}
          onClose={closeSheet}
        />
      </FormSheet>
    </SafeAreaView>
  );
}
