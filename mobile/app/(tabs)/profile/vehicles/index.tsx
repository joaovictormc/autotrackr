import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Trash2, Star, Car, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useVehicle } from '../../../../contexts/VehicleContext';
import { api } from '../../../../lib/api';
import ScreenHeader from '../../../../components/ScreenHeader';
import FormSheet from '../../../../components/FormSheet';
import AddVehicleForm from '../../../../components/AddVehicleForm';
import type { Vehicle } from '@autotrackr/shared';

export default function VehiclesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicles, vehicleId, setVehicleId, loadingVehicles } = useVehicle();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const openAdd = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: () => Alert.alert(t('common.removeError')),
  });

  const handleDelete = (v: Vehicle) => {
    Alert.alert(t('common.delete'), t('dashboard.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(v.id) },
    ]);
  };

  const renderItem = ({ item }: { item: Vehicle }) => {
    const isActive = item.id === vehicleId;
    return (
      <TouchableOpacity
        onPress={() => setVehicleId(item.id)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : colors.border,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
          <Car size={20} color={isActive ? colors.primary : colors.textMuted} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
              {item.brand.name} {item.model.name}
            </Text>
            {item.isFavorite && <Star size={13} color={colors.warning} fill={colors.warning} />}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            {item.year} · {item.plate} · {item.mileage.toLocaleString('pt-BR')} km
          </Text>
        </View>
        {isActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
              <Check size={11} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>Ativo</Text>
            </View>
          </View>
        )}
        <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('profile.vehicles')}
        right={
          <TouchableOpacity
            onPress={openAdd}
            style={{ backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {loadingVehicles ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
              {t('dashboard.noVehiclesYet')}
            </Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        />
      )}

      <FormSheet visible={sheetOpen} onClose={closeSheet}>
        <AddVehicleForm
          onSuccess={() => { closeSheet(); qc.invalidateQueries({ queryKey: ['vehicles'] }); }}
          onClose={closeSheet}
        />
      </FormSheet>
    </View>
  );
}
