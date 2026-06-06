import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { getBrands, getModels, getYears } from '../lib/fipe';
import SearchablePicker, { PickerOption } from './SearchablePicker';
import type { CreateVehiclePayload, Vehicle } from '@autotrackr/shared';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddVehicleForm({ onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [brand, setBrand] = useState<PickerOption | null>(null);
  const [model, setModel] = useState<PickerOption | null>(null);
  const [yearOpt, setYearOpt] = useState<PickerOption | null>(null);
  const [manualYear, setManualYear] = useState(false);
  const [manualYearVal, setManualYearVal] = useState('');
  const [plate, setPlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  // FIPE encadeado via react-query (cache em AsyncStorage dentro de getX)
  const brandsQ = useQuery({ queryKey: ['fipe-brands'], queryFn: getBrands });
  const modelsQ = useQuery({
    queryKey: ['fipe-models', brand?.code],
    queryFn: () => getModels(brand!.code),
    enabled: !!brand,
  });
  const yearsQ = useQuery({
    queryKey: ['fipe-years', brand?.code, model?.code],
    queryFn: () => getYears(brand!.code, model!.code),
    enabled: !!brand && !!model,
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateVehiclePayload) =>
      api.post<Vehicle>('/vehicles', payload).then(r => r.data),
    onSuccess,
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    },
  });

  const handleSave = () => {
    const yearStr = manualYear ? manualYearVal : yearOpt?.name?.match(/\d{4}/)?.[0] ?? '';
    const yearInt = parseInt(yearStr, 10);
    const mileageInt = parseInt(mileage, 10);
    const maxYear = new Date().getFullYear() + 1;

    if (!brand || !model || !plate.trim() || (!yearOpt && !manualYearVal)) {
      return setError(t('vehicleForm.errRequired'));
    }
    if (isNaN(yearInt) || yearInt < 1950 || yearInt > maxYear) {
      return setError(t('vehicleForm.errYear'));
    }
    if (isNaN(mileageInt) || mileageInt < 0) {
      return setError(t('vehicleForm.errMileage'));
    }

    setError('');
    mutation.mutate({
      brandName: brand.name,
      brandApiCode: brand.code,
      modelName: model.name,
      modelApiCode: model.code,
      plate: plate.trim().toUpperCase(),
      year: yearInt,
      mileage: mileageInt,
      color: color || undefined,
      vin: vin || undefined,
      details: details || undefined,
      apiYearCode: manualYear ? undefined : yearOpt?.code,
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
        {t('vehicleForm.title')}
      </Text>

      {(error || brandsQ.isError) ? (
        <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>
            {error || t('vehicleForm.loadBrandsError')}
          </Text>
        </View>
      ) : null}

      {/* Marca */}
      <SearchablePicker
        label={t('vehicleForm.brand')}
        value={brand?.code ?? ''}
        options={brandsQ.data ?? []}
        loading={brandsQ.isLoading}
        placeholder={t('vehicleForm.selectBrand')}
        searchPlaceholder={t('vehicleForm.searchBrand')}
        onSelect={(o) => { setBrand(o); setModel(null); setYearOpt(null); }}
      />

      {/* Modelo */}
      <SearchablePicker
        label={t('vehicleForm.model')}
        value={model?.code ?? ''}
        options={modelsQ.data ?? []}
        loading={modelsQ.isLoading}
        disabled={!brand}
        placeholder={t('vehicleForm.selectModel')}
        searchPlaceholder={t('vehicleForm.searchModel')}
        onSelect={(o) => { setModel(o); setYearOpt(null); }}
      />

      {/* Ano + Placa */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          {manualYear ? (
            <View>
              <Text style={labelStyle}>{t('vehicleForm.year')}</Text>
              <TextInput
                style={inputStyle}
                value={manualYearVal}
                onChangeText={setManualYearVal}
                keyboardType="numeric"
                placeholder={`Ex: ${new Date().getFullYear() - 10}`}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => { setManualYear(false); setManualYearVal(''); }}>
                <Text style={{ color: colors.primary, fontSize: 11, marginTop: 4 }}>{t('vehicleForm.backToFipe')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <SearchablePicker
                label={t('vehicleForm.year')}
                value={yearOpt?.code ?? ''}
                options={yearsQ.data ?? []}
                loading={yearsQ.isLoading}
                disabled={!model}
                placeholder={t('vehicleForm.selectYear')}
                searchPlaceholder={t('vehicleForm.searchYear')}
                onSelect={setYearOpt}
              />
              {model && !yearsQ.isLoading && (
                <TouchableOpacity onPress={() => { setManualYear(true); setYearOpt(null); }}>
                  <Text style={{ color: colors.primary, fontSize: 11, marginTop: 4 }}>{t('vehicleForm.manualYear')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('vehicleForm.plate')}</Text>
          <TextInput
            style={inputStyle}
            value={plate}
            onChangeText={(v) => setPlate(v.toUpperCase())}
            autoCapitalize="characters"
            placeholder="ABC-1234"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Quilometragem + Cor */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('vehicleForm.mileage')}</Text>
          <TextInput style={inputStyle} value={mileage} onChangeText={setMileage} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{t('vehicleForm.color')}</Text>
          <TextInput style={inputStyle} value={color} onChangeText={setColor} placeholder="Branco, Prata..." placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      {/* VIN */}
      <View>
        <Text style={labelStyle}>{t('vehicleForm.vin')}</Text>
        <TextInput style={inputStyle} value={vin} onChangeText={setVin} autoCapitalize="characters" placeholderTextColor={colors.textMuted} />
      </View>

      {/* Detalhes */}
      <View>
        <Text style={labelStyle}>{t('vehicleForm.details')}</Text>
        <TextInput style={{ ...inputStyle, height: 64, textAlignVertical: 'top' }} value={details} onChangeText={setDetails} multiline placeholderTextColor={colors.textMuted} />
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
