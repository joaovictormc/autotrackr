import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface PickerOption {
  code: string;
  name: string;
}

interface Props {
  label: string;
  value: string;            // código selecionado
  options: PickerOption[];
  onSelect: (opt: PickerOption) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchablePicker({
  label, value, options, onSelect, loading, disabled, placeholder, searchPlaceholder,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(o => o.code === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter(o => o.name.toLowerCase().includes(q)) : options;

  const inputStyle = {
    backgroundColor: colors.background,
    borderWidth: 1 as const,
    borderColor: value ? colors.primary : colors.border,
    borderRadius: 8,
    padding: 12,
  };

  return (
    <View style={{ zIndex: open ? 20 : 1 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: '500' }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => { if (!disabled && !loading) { setOpen(o => !o); setQuery(''); } }}
        disabled={disabled || loading}
        style={{ ...inputStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: disabled ? 0.5 : 1 }}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 15, flex: 1 }} numberOfLines={1}>
          {selected?.name ?? placeholder ?? '—'}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <ChevronDown size={18} color={colors.textMuted} />}
      </TouchableOpacity>

      {open && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' }}>
          <TextInput
            style={{ padding: 10, color: colors.text, fontSize: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder ?? 'Buscar...'}
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={{ color: colors.textMuted, padding: 12, fontSize: 13 }}>—</Text>
            ) : (
              filtered.map(o => (
                <TouchableOpacity
                  key={o.code}
                  onPress={() => { onSelect(o); setOpen(false); setQuery(''); }}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: o.code === value ? colors.primary + '20' : 'transparent' }}
                >
                  <Text style={{ color: colors.text }}>{o.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
