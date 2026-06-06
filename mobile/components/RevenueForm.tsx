import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { REVENUE_CATEGORIES } from '@autotrackr/shared';
import type { RevenueRecord, CreateRevenuePayload } from '@autotrackr/shared';

interface Props {
  vehicleId: string;
  record: RevenueRecord | null;
  onSuccess: () => void;
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function RevenueForm({ vehicleId, record, onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    if (record) {
      setDate(record.date.slice(0, 10));
      setCategory(record.category);
      setAmount(String(parseFloat(record.amount)));
      setNotes(record.notes ?? '');
    }
  }, [record]);

  const mutation = useMutation({
    mutationFn: (payload: CreateRevenuePayload) =>
      record
        ? api.put(`/vehicles/${vehicleId}/revenue/${record.id}`, payload)
        : api.post(`/vehicles/${vehicleId}/revenue`, payload),
    onSuccess,
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    },
  });

  const handleSave = () => {
    if (!category) return setError(t('revenue.errCategory'));
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError(t('revenue.errAmount'));
    setError('');
    mutation.mutate({ date, category, amount: amt, notes: notes || undefined });
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
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>
        {record ? t('revenue.editTitle') : t('revenue.newTitle')}
      </Text>

      {error ? (
        <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {/* Date & Amount */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('common.date')}</Text>
          <TextInput
            style={inputStyle}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('revenue.amount')}</Text>
          <TextInput
            style={inputStyle}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Category */}
      <View>
        <Text style={labelStyle}>{t('revenue.category')}</Text>
        <TouchableOpacity
          onPress={() => setCategoryOpen(v => !v)}
          style={{ ...inputStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={{ color: category ? colors.text : colors.textMuted, fontSize: 15 }}>
            {category || t('revenue.category')}
          </Text>
          <Text style={{ color: colors.textMuted }}>▾</Text>
        </TouchableOpacity>
        {categoryOpen && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' }}>
            {REVENUE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => { setCategory(cat); setCategoryOpen(false); }}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: cat === category ? colors.primary + '20' : 'transparent' }}
              >
                <Text style={{ color: colors.text }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Notes */}
      <View>
        <Text style={labelStyle}>{t('common.notes')}</Text>
        <TextInput
          style={{ ...inputStyle, height: 72, textAlignVertical: 'top' }}
          value={notes}
          onChangeText={setNotes}
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
