import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  label: string;
  /** valor ISO (YYYY-MM-DD) ou string vazia */
  value: string;
  onChange: (iso: string) => void;
  /** permite limpar o valor (para lembretes opcionais) */
  clearable?: boolean;
  placeholder?: string;
}

function toISO(d: Date) {
  // Formata como YYYY-MM-DD sem deslocamento de fuso
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(iso: string): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function DateField({ label, value, onChange, clearable, placeholder }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const display = value
    ? parseISO(value).toLocaleDateString('pt-BR')
    : (placeholder ?? 'Selecionar data');

  const handleChange = (_event: unknown, selected?: Date) => {
    // No Android o picker é um diálogo modal — fecha sempre após a escolha
    if (Platform.OS !== 'ios') setShow(false);
    if (selected) onChange(toISO(selected));
  };

  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: '500' }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => setShow(true)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }}
        >
          <Calendar size={16} color={colors.textMuted} />
          <Text style={{ color: value ? colors.text : colors.textMuted, fontSize: 15 }}>
            {display}
          </Text>
        </TouchableOpacity>
        {clearable && value ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            style={{ paddingHorizontal: 12 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {show && (
        <DateTimePicker
          value={parseISO(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          themeVariant={colors.background === '#0f172a' ? 'dark' : 'light'}
        />
      )}

      {/* No iOS o picker inline precisa de um botão para fechar */}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 10 }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>OK</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
