import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useVehicle } from '../../../../contexts/VehicleContext';
import { api } from '../../../../lib/api';
import ScreenHeader from '../../../../components/ScreenHeader';
import RevenueForm from '../../../../components/RevenueForm';
import type { RevenueRecord } from '@autotrackr/shared';

export default function RevenueScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const sheetRef = useRef<BottomSheet>(null);
  const [editing, setEditing] = useState<RevenueRecord | null>(null);

  const { data: records = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['revenue', vehicleId],
    queryFn: () => api.get<RevenueRecord[]>(`/vehicles/${vehicleId}/revenue`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${vehicleId}/revenue/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revenue', vehicleId] }),
  });

  const openNew = () => { setEditing(null); sheetRef.current?.expand(); };
  const openEdit = (r: RevenueRecord) => { setEditing(r); sheetRef.current?.expand(); };
  const closeSheet = useCallback(() => sheetRef.current?.close(), []);

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('revenue.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);

  const renderItem = ({ item }: { item: RevenueRecord }) => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{item.category}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
          {item.notes ? ` · ${item.notes}` : ''}
        </Text>
      </View>
      <Text style={{ color: colors.success, fontSize: 14, fontWeight: '700', marginRight: 10 }}>
        R$ {parseFloat(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </Text>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('revenue.title')}
        subtitle={vehicle ? `${vehicle.brand.name} ${vehicle.model.name}` : undefined}
        right={
          <TouchableOpacity
            onPress={openNew}
            disabled={!vehicleId}
            style={{ backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: vehicleId ? 1 : 0.4 }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* Total card */}
      {records.length > 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: colors.success }}>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('revenue.list')}</Text>
          <Text style={{ color: colors.success, fontSize: 22, fontWeight: '700', marginTop: 2 }}>
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

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
              {vehicleId ? t('revenue.empty') : t('common.selectVehicle')}
            </Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        />
      )}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['65%', '90%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <RevenueForm
          vehicleId={vehicleId!}
          record={editing}
          onSuccess={() => { closeSheet(); qc.invalidateQueries({ queryKey: ['revenue', vehicleId] }); }}
          onClose={closeSheet}
        />
      </BottomSheet>
    </View>
  );
}
