import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import DateField from './DateField';
import LocationPicker from './LocationPicker';
import { FUEL_TYPES, fuelTypeInfo } from '@autotrackr/shared';
import type { FuelRecord, FuelType, CreateFuelPayload, Vehicle } from '@autotrackr/shared';

interface Props {
  vehicleId: string;
  vehicle: Vehicle;
  record: FuelRecord | null;
  records?: FuelRecord[];
  onSuccess: () => void;
  onClose: () => void;
}

function estimateFuel(
  newQuantity: number,
  currentMileage: number,
  prevRecords: FuelRecord[],
): { days: number; nextMileage: number } | null {
  if (newQuantity <= 0 || prevRecords.length < 2) return null;

  const sorted = [...prevRecords].sort((a, b) => b.mileage - a.mileage);
  const r0 = sorted[0];
  const r1 = sorted[1];

  const kmDriven = r0.mileage - r1.mileage;
  if (kmDriven <= 0) return null;

  const prevQty = parseFloat(r1.quantity as any);
  if (!prevQty || prevQty <= 0) return null;
  const avgKmPerL = kmDriven / prevQty;

  const daysBetween = Math.max(
    1,
    (new Date(r0.date).getTime() - new Date(r1.date).getTime()) / 86_400_000,
  );
  const dailyKm = kmDriven / daysBetween;
  if (dailyKm <= 0) return null;

  const days = Math.round((newQuantity * avgKmPerL) / dailyKm);
  const nextMileage = currentMileage + Math.round(newQuantity * avgKmPerL);
  return { days, nextMileage };
}

async function scheduleFuelNotification(days: number): Promise<void> {
  // Notificações locais não funcionam no Expo Go (SDK 53+)
  if ((Constants.appOwnership as string) === 'expo') return;
  if (days <= 1 || days > 365) return;
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⛽ Combustível acabando',
        body: 'Estimativa de combustível esgotado. Hora de abastecer!',
      },
      trigger: { seconds: days * 86_400, repeats: false } as any,
    });
  } catch {
    // silently ignore — notification é opcional
  }
}

interface FuelFormState {
  fuelType: FuelType;
  date: string;
  mileage: string;
  pricePerUnit: string;
  totalCost: string;
  quantity: string;
  fullTank: boolean;
  station: string;
  notes: string;
}

const today = () => new Date().toISOString().split('T')[0];

export default function FuelForm({ vehicleId, vehicle, record, records = [], onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [form, setForm] = useState<FuelFormState>({
    fuelType: 'GASOLINA',
    date: today(),
    mileage: vehicle ? String(vehicle.mileage) : '',
    pricePerUnit: '',
    totalCost: '',
    quantity: '',
    fullTank: true,
    station: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        fuelType: record.fuelType,
        date: record.date.slice(0, 10),
        mileage: String(record.mileage),
        pricePerUnit: String(parseFloat(record.pricePerUnit)),
        totalCost: String(parseFloat(record.totalCost)),
        quantity: String(parseFloat(record.quantity)),
        fullTank: record.fullTank,
        station: record.station ?? '',
        notes: record.notes ?? '',
      });
    }
  }, [record]);

  // Preço → recalcula quantidade
  const onPrice = (val: string) => {
    setForm(p => {
      const price = parseFloat(val);
      const total = parseFloat(p.totalCost);
      const next = { ...p, pricePerUnit: val };
      if (!isNaN(price) && !isNaN(total) && price > 0) next.quantity = (total / price).toFixed(3);
      return next;
    });
  };

  // Total → recalcula quantidade
  const onTotal = (val: string) => {
    setForm(p => {
      const total = parseFloat(val);
      const price = parseFloat(p.pricePerUnit);
      const next = { ...p, totalCost: val };
      if (!isNaN(total) && !isNaN(price) && price > 0) next.quantity = (total / price).toFixed(3);
      return next;
    });
  };

  // Quantidade manual → recalcula total
  const onQuantity = (val: string) => {
    setForm(p => {
      const q = parseFloat(val);
      const price = parseFloat(p.pricePerUnit);
      const next = { ...p, quantity: val };
      if (!isNaN(q) && !isNaN(price) && price > 0) next.totalCost = (q * price).toFixed(2);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateFuelPayload) =>
      record
        ? api.put(`/vehicles/${vehicleId}/fuel/${record.id}`, payload)
        : api.post(`/vehicles/${vehicleId}/fuel`, payload),
    onSuccess: (_, payload) => {
      if (!record) {
        const result = estimateFuel(payload.quantity, payload.mileage, records);
        if (result?.days) scheduleFuelNotification(result.days);
      }
      onSuccess();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    },
  });

  const handleSave = () => {
    const mileage = parseInt(form.mileage, 10);
    const quantity = parseFloat(form.quantity);
    const pricePerUnit = parseFloat(form.pricePerUnit);
    const totalCost = parseFloat(form.totalCost);

    if (isNaN(mileage)) return setError(t('fuel.errMileage'));
    if (isNaN(quantity) || quantity <= 0) return setError(t('fuel.errQuantity'));
    if (isNaN(totalCost) || totalCost < 0) return setError(t('fuel.errTotal'));

    setError('');
    mutation.mutate({
      date: form.date,
      fuelType: form.fuelType,
      mileage,
      quantity,
      pricePerUnit: isNaN(pricePerUnit) ? totalCost / quantity : pricePerUnit,
      totalCost,
      fullTank: form.fullTank,
      station: form.station || undefined,
      notes: form.notes || undefined,
    });
  };

  const unit = fuelTypeInfo(form.fuelType).unit;
  const inputStyle = {
    backgroundColor: colors.background,
    borderWidth: 1 as const,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 15,
  };
  const labelStyle = { color: colors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: '500' as const };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>
        {record ? t('fuel.editTitle') : t('fuel.newTitle')}
      </Text>

      {error ? (
        <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {/* Fuel type selector */}
      <View>
        <Text style={labelStyle}>{t('fuel.type')}</Text>
        <TouchableOpacity
          onPress={() => setTypeOpen(!typeOpen)}
          style={{ ...inputStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={{ color: colors.text, fontSize: 15 }}>{t(`fuel.types.${form.fuelType}`)}</Text>
          <Text style={{ color: colors.textMuted }}>▾</Text>
        </TouchableOpacity>
        {typeOpen && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' }}>
            {FUEL_TYPES.map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => { setForm(p => ({ ...p, fuelType: f.key })); setTypeOpen(false); }}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: f.key === form.fuelType ? colors.primary + '20' : 'transparent' }}
              >
                <Text style={{ color: colors.text }}>{t(`fuel.types.${f.key}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Date & Mileage */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <DateField label={t('common.date')} value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('fuel.mileage')}</Text>
          <TextInput style={inputStyle} value={form.mileage} onChangeText={v => setForm(p => ({ ...p, mileage: v }))} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      {/* Price & Total */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('fuel.pricePerUnit', { unit })}</Text>
          <TextInput style={inputStyle} value={form.pricePerUnit} onChangeText={onPrice} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} placeholder="0,000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('fuel.total')}</Text>
          <TextInput style={inputStyle} value={form.totalCost} onChangeText={onTotal} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} placeholder="0,00" />
        </View>
      </View>

      {/* Quantity (calculated) */}
      <View>
        <Text style={labelStyle}>{t('fuel.quantity', { unit })}</Text>
        <TextInput
          style={{ ...inputStyle, borderColor: form.quantity ? colors.primary : colors.border, color: form.quantity ? colors.primary : colors.textMuted }}
          value={form.quantity}
          onChangeText={onQuantity}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
          placeholder={t('fuel.quantityHelper')}
        />
      </View>

      {/* Estimated fuel duration + next refuel mileage — aparece quando há ≥2 abastecimentos anteriores */}
      {(() => {
        const qty = parseFloat(form.quantity);
        const mileage = parseInt(form.mileage, 10) || 0;
        if (!isNaN(qty) && qty > 0 && records.length >= 2) {
          const result = estimateFuel(qty, mileage, records);
          if (result && result.days > 0) {
            return (
              <View style={{ gap: 6 }}>
                <View style={{ backgroundColor: colors.primary + '15', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15 }}>⛽</Text>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {t('fuel.estimatedDays', { days: result.days })}
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.warning + '15', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15 }}>🛣️</Text>
                  <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '600' }}>
                    {t('fuel.nextRefuelKm', { km: result.nextMileage.toLocaleString('pt-BR') })}
                  </Text>
                </View>
              </View>
            );
          }
        }
        return null;
      })()}

      {/* Station */}
      <LocationPicker
        label={t('fuel.station')}
        value={form.station}
        onChange={v => setForm(p => ({ ...p, station: v }))}
        nearbyType="gas_station"
      />

      {/* Full tank switch */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 15 }}>{t('fuel.fullTank')}</Text>
        <Switch value={form.fullTank} onValueChange={v => setForm(p => ({ ...p, fullTank: v }))} trackColor={{ true: colors.primary }} />
      </View>

      {/* Notes */}
      <View>
        <Text style={labelStyle}>{t('common.notes')}</Text>
        <TextInput style={{ ...inputStyle, height: 72, textAlignVertical: 'top' }} value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} multiline placeholderTextColor={colors.textMuted} />
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={mutation.isPending}
          style={{ flex: 2, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', opacity: mutation.isPending ? 0.7 : 1 }}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700' }}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
