import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import DateField from './DateField';
import type { MaintenanceRecord, MaintenanceType, CreateMaintenancePayload, Vehicle } from '@autotrackr/shared';

interface Props {
  vehicleId: string;
  vehicle: Vehicle;
  record: MaintenanceRecord | null;
  onSuccess: () => void;
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function MaintenanceForm({ vehicleId, vehicle, record, onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const [typeId, setTypeId] = useState('');
  const [typeQuery, setTypeQuery] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [mileage, setMileage] = useState(vehicle ? String(vehicle.mileage) : '');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMileage, setReminderMileage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: types = [] } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: () => api.get<MaintenanceType[]>('/maintenance/types').then(r => r.data),
  });

  const selectedType = types.find(tp => tp.id === typeId);

  useEffect(() => {
    if (record) {
      setTypeId(record.maintenanceTypeId);
      setTypeQuery(record.maintenanceType.name);
      setDate(record.date.slice(0, 10));
      setMileage(String(record.mileage));
      setCost(record.cost ? String(parseFloat(record.cost)) : '');
      setLocation(record.location ?? '');
      setReminderDate(record.reminderDate?.slice(0, 10) ?? '');
      setReminderMileage(record.reminderMileage ? String(record.reminderMileage) : '');
      setIsCompleted(record.isCompleted);
      setNotes(record.notes ?? '');
    }
  }, [record]);

  // Sugere lembretes quando um tipo com intervalo padrão é escolhido (apenas em criação)
  useEffect(() => {
    if (!selectedType || record) return;
    if (selectedType.defaultIntervalKm && vehicle) {
      setReminderMileage(String(vehicle.mileage + selectedType.defaultIntervalKm));
    }
    if (selectedType.defaultIntervalMonths) {
      const d = new Date();
      d.setMonth(d.getMonth() + selectedType.defaultIntervalMonths);
      setReminderDate(d.toISOString().split('T')[0]);
    }
  }, [typeId]);

  // Filtra tipos pelo texto digitado
  const q = typeQuery.trim().toLowerCase();
  const filteredTypes = q
    ? types.filter(tp => tp.name.toLowerCase().includes(q))
    : types;
  const exactMatch = types.some(tp => tp.name.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactMatch;

  const createTypeMutation = useMutation({
    mutationFn: (name: string) =>
      api.post<MaintenanceType>('/maintenance/types', { name }).then(r => r.data),
    onSuccess: (newType) => {
      qc.invalidateQueries({ queryKey: ['maintenance-types'] });
      setTypeId(newType.id);
      setTypeQuery(newType.name);
      setTypeOpen(false);
    },
    onError: () => setError(t('common.saveError')),
  });

  const selectType = (tp: MaintenanceType) => {
    setTypeId(tp.id);
    setTypeQuery(tp.name);
    setTypeOpen(false);
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateMaintenancePayload) =>
      record
        ? api.put(`/vehicles/${vehicleId}/maintenance/${record.id}`, payload)
        : api.post(`/vehicles/${vehicleId}/maintenance`, payload),
    onSuccess,
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    },
  });

  const handleSave = () => {
    if (!typeId) return setError(t('maintenance.errType'));
    if (!date) return setError(t('maintenance.errDate'));
    const mil = parseInt(mileage, 10);
    if (isNaN(mil)) return setError(t('maintenance.errMileage'));

    setError('');
    mutation.mutate({
      maintenanceTypeId: typeId,
      date,
      mileage: mil,
      cost: cost ? parseFloat(cost) : undefined,
      location: location || undefined,
      reminderDate: reminderDate || undefined,
      reminderMileage: reminderMileage ? parseInt(reminderMileage, 10) : undefined,
      isCompleted,
      notes: notes || undefined,
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
        {record ? t('maintenance.editTitle') : t('maintenance.newTitle')}
      </Text>

      {error ? (
        <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {/* Type — pesquisável / criável */}
      <View style={{ zIndex: 10 }}>
        <Text style={labelStyle}>{t('maintenance.type')}</Text>
        <TextInput
          style={{ ...inputStyle, borderColor: typeId ? colors.primary : colors.border }}
          value={typeQuery}
          onChangeText={(txt) => { setTypeQuery(txt); setTypeId(''); setTypeOpen(true); }}
          onFocus={() => setTypeOpen(true)}
          placeholder={t('maintenance.typeSearch')}
          placeholderTextColor={colors.textMuted}
        />
        {typeOpen && (filteredTypes.length > 0 || canCreate) && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden', maxHeight: 180 }}>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {filteredTypes.map(tp => (
                <TouchableOpacity
                  key={tp.id}
                  onPress={() => selectType(tp)}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: tp.id === typeId ? colors.primary + '20' : 'transparent' }}
                >
                  <Text style={{ color: colors.text }}>{tp.name}</Text>
                </TouchableOpacity>
              ))}
              {canCreate && (
                <TouchableOpacity
                  onPress={() => createTypeMutation.mutate(typeQuery.trim())}
                  disabled={createTypeMutation.isPending}
                  style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  {createTypeMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Plus size={16} color={colors.primary} />
                  )}
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>
                    {t('maintenance.createType', { name: typeQuery.trim() })}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Date & Mileage */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <DateField label={t('common.date')} value={date} onChange={setDate} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('maintenance.mileage')}</Text>
          <TextInput style={inputStyle} value={mileage} onChangeText={setMileage} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      {/* Cost & Location */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('maintenance.cost')}</Text>
          <TextInput style={inputStyle} value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} placeholder="0,00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('maintenance.location')}</Text>
          <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      {/* Reminders */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <DateField
            label={t('maintenance.nextDate')}
            value={reminderDate}
            onChange={setReminderDate}
            clearable
            placeholder="—"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('maintenance.nextTitle')}</Text>
          <TextInput style={inputStyle} value={reminderMileage} onChangeText={setReminderMileage} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      {/* Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 15 }}>{t('maintenance.status.completed')}</Text>
        <Switch value={isCompleted} onValueChange={setIsCompleted} trackColor={{ true: colors.success }} />
      </View>

      {/* Notes */}
      <View>
        <Text style={labelStyle}>{t('common.notes')}</Text>
        <TextInput style={{ ...inputStyle, height: 72, textAlignVertical: 'top' }} value={notes} onChangeText={setNotes} multiline placeholderTextColor={colors.textMuted} />
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
