import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useVehicle } from '../../../contexts/VehicleContext';
import { api } from '../../../lib/api';
import FormSheet from '../../../components/FormSheet';
import TripForm from '../../../components/TripForm';
import AdInterstitial from '../../../components/AdInterstitial';
import { useAdInterstitial } from '../../../hooks/useAdInterstitial';
import { fmtDate } from '../../../lib/dateUtils';
import type { Trip } from '@autotrackr/shared';

const PURPOSE_COLORS: Record<string, string> = {
  WORK: '#3b82f6',
  PERSONAL: '#10b981',
  BUSINESS: '#f59e0b',
  OTHER: '#8b5cf6',
};

export default function TripsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vehicleId, vehicle } = useVehicle();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const { adVisible, triggerAd, dismissAd, goToUpgrade } = useAdInterstitial();

  useFocusEffect(
    React.useCallback(() => {
      if (vehicleId) {
        qc.invalidateQueries({ queryKey: ['trips', vehicleId] });
      }
    }, [vehicleId, qc]),
  );

  const { data: records = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['trips', vehicleId],
    queryFn: () => api.get<Trip[]>(`/vehicles/${vehicleId}/trips`).then(r => r.data),
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${vehicleId}/trips/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips', vehicleId] });
    },
  });

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (record: Trip) => { setEditing(record); setSheetOpen(true); };
  const closeSheet = () => setSheetOpen(false);

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('trips.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Trip }) => {
    const purposeColor = PURPOSE_COLORS[item.purpose] ?? colors.textMuted;
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {item.origin}
              </Text>
              <ArrowRight size={12} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {item.destination}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {fmtDate(item.date)}
              {item.durationMin ? ` · ${item.durationMin} min` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginLeft: 8 }}>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 6 }}>
              <Pencil size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <View style={{ backgroundColor: purposeColor + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: purposeColor, fontSize: 11, fontWeight: '600' }}>
              {t(`trips.purposes.${item.purpose}`)}
            </Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
            {item.distanceKm.toLocaleString('pt-BR')} km
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{t('trips.title')}</Text>
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
                {vehicleId ? t('trips.empty') : t('trips.selectToView')}
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>

      <FormSheet visible={sheetOpen} onClose={closeSheet}>
        <TripForm
          vehicleId={vehicleId!}
          vehicle={vehicle!}
          record={editing}
          onSuccess={() => {
            const isNew = !editing;
            closeSheet();
            qc.invalidateQueries({ queryKey: ['trips', vehicleId] });
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
