import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import DateField from './DateField';
import LocationPicker from './LocationPicker';
import type { Trip, TripPurpose, CreateTripPayload, Vehicle } from '@autotrackr/shared';

const TRIP_PURPOSES: TripPurpose[] = ['PERSONAL', 'WORK', 'BUSINESS', 'OTHER'];

interface Props {
  vehicleId: string;
  vehicle: Vehicle;
  record: Trip | null;
  onSuccess: () => void;
  onClose: () => void;
}

interface FormState {
  date: string;
  origin: string;
  destination: string;
  distanceKm: string;
  mileageStart: string;
  mileageEnd: string;
  durationMin: string;
  purpose: TripPurpose;
  passengers: string;
  notes: string;
}

const today = () => new Date().toISOString().split('T')[0];

export default function TripForm({ vehicleId, vehicle, record, onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [form, setForm] = useState<FormState>({
    date: today(),
    origin: '',
    destination: '',
    distanceKm: '',
    mileageStart: vehicle ? String(vehicle.mileage) : '',
    mileageEnd: '',
    durationMin: '',
    purpose: 'PERSONAL',
    passengers: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [purposeOpen, setPurposeOpen] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        date: record.date.slice(0, 10),
        origin: record.origin,
        destination: record.destination,
        distanceKm: String(record.distanceKm),
        mileageStart: record.mileageStart != null ? String(record.mileageStart) : '',
        mileageEnd: record.mileageEnd != null ? String(record.mileageEnd) : '',
        durationMin: record.durationMin != null ? String(record.durationMin) : '',
        purpose: record.purpose,
        passengers: record.passengers != null ? String(record.passengers) : '',
        notes: record.notes ?? '',
      });
    }
  }, [record]);

  // Auto-calc distanceKm when both mileage fields are filled
  const autoCalcDistance = (() => {
    const start = parseInt(form.mileageStart, 10);
    const end = parseInt(form.mileageEnd, 10);
    if (!isNaN(start) && !isNaN(end) && end > start) return end - start;
    return null;
  })();

  const onMileageEnd = (val: string) => {
    setForm(p => {
      const start = parseInt(p.mileageStart, 10);
      const end = parseInt(val, 10);
      const next = { ...p, mileageEnd: val };
      if (!isNaN(start) && !isNaN(end) && end > start) {
        next.distanceKm = String(end - start);
      }
      return next;
    });
  };

  const onMileageStart = (val: string) => {
    setForm(p => {
      const start = parseInt(val, 10);
      const end = parseInt(p.mileageEnd, 10);
      const next = { ...p, mileageStart: val };
      if (!isNaN(start) && !isNaN(end) && end > start) {
        next.distanceKm = String(end - start);
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateTripPayload) =>
      record
        ? api.put(`/vehicles/${vehicleId}/trips/${record.id}`, payload)
        : api.post(`/vehicles/${vehicleId}/trips`, payload),
    onSuccess: () => onSuccess(),
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    },
  });

  const handleSave = () => {
    if (!form.origin.trim()) return setError(t('trips.errOrigin'));
    if (!form.destination.trim()) return setError(t('trips.errDestination'));
    if (!form.date) return setError(t('trips.errDate'));

    const distanceKm = parseInt(form.distanceKm, 10);
    if (isNaN(distanceKm) || distanceKm <= 0) return setError(t('trips.errDistance'));

    setError('');
    const mileageStart = form.mileageStart ? parseInt(form.mileageStart, 10) : undefined;
    const mileageEnd = form.mileageEnd ? parseInt(form.mileageEnd, 10) : undefined;
    mutation.mutate({
      date: form.date,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      distanceKm,
      mileageStart: !isNaN(mileageStart!) ? mileageStart : undefined,
      mileageEnd: !isNaN(mileageEnd!) ? mileageEnd : undefined,
      durationMin: form.durationMin ? parseInt(form.durationMin, 10) || undefined : undefined,
      purpose: form.purpose,
      passengers: form.passengers ? parseInt(form.passengers, 10) || undefined : undefined,
      notes: form.notes || undefined,
    });
  };

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
        {record ? t('trips.editTitle') : t('trips.newTitle')}
      </Text>

      {error ? (
        <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {/* Date & Purpose */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <DateField label={t('common.date')} value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('trips.purpose')}</Text>
          <TouchableOpacity
            onPress={() => setPurposeOpen(!purposeOpen)}
            style={{ ...inputStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{t(`trips.purposes.${form.purpose}`)}</Text>
            <Text style={{ color: colors.textMuted }}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Purpose dropdown */}
      {purposeOpen && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginTop: -8 }}>
          {TRIP_PURPOSES.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => { setForm(prev => ({ ...prev, purpose: p })); setPurposeOpen(false); }}
              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: p === form.purpose ? colors.primary + '20' : 'transparent' }}
            >
              <Text style={{ color: colors.text }}>{t(`trips.purposes.${p}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Origin */}
      <LocationPicker
        label={t('trips.origin')}
        value={form.origin}
        onChange={v => setForm(p => ({ ...p, origin: v }))}
      />

      {/* Destination */}
      <LocationPicker
        label={t('trips.destination')}
        value={form.destination}
        onChange={v => setForm(p => ({ ...p, destination: v }))}
      />

      {/* Mileage Start & End */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('trips.mileageStart')}</Text>
          <TextInput
            style={inputStyle}
            value={form.mileageStart}
            onChangeText={onMileageStart}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('trips.mileageEnd')}</Text>
          <TextInput
            style={inputStyle}
            value={form.mileageEnd}
            onChangeText={onMileageEnd}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            placeholder="0"
          />
        </View>
      </View>

      {/* Auto-calc hint */}
      {autoCalcDistance !== null && (
        <View style={{ backgroundColor: colors.primary + '15', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15 }}>🗺️</Text>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
            {t('trips.distanceAutoCalc')}: {autoCalcDistance.toLocaleString('pt-BR')} km
          </Text>
        </View>
      )}

      {/* Distance & Duration */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('trips.distanceKm')}</Text>
          <TextInput
            style={{ ...inputStyle, borderColor: form.distanceKm ? colors.primary : colors.border, color: form.distanceKm ? colors.primary : colors.text }}
            value={form.distanceKm}
            onChangeText={v => setForm(p => ({ ...p, distanceKm: v }))}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('trips.durationMin')}</Text>
          <TextInput
            style={inputStyle}
            value={form.durationMin}
            onChangeText={v => setForm(p => ({ ...p, durationMin: v }))}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            placeholder="0"
          />
        </View>
      </View>

      {/* Passengers */}
      <View>
        <Text style={labelStyle}>{t('trips.passengers')}</Text>
        <TextInput
          style={inputStyle}
          value={form.passengers}
          onChangeText={v => setForm(p => ({ ...p, passengers: v }))}
          keyboardType="numeric"
          placeholderTextColor={colors.textMuted}
          placeholder="0"
        />
      </View>

      {/* Notes */}
      <View>
        <Text style={labelStyle}>{t('common.notes')}</Text>
        <TextInput
          style={{ ...inputStyle, height: 72, textAlignVertical: 'top' }}
          value={form.notes}
          onChangeText={v => setForm(p => ({ ...p, notes: v }))}
          multiline
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
        >
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
