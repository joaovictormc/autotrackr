import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Star } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';

const BENEFITS = [
  'Sem anúncios',
  'Relatórios exportáveis (PDF e CSV)',
  'Lembretes inteligentes de manutenção',
  'Acesso antecipado a novos recursos',
  'Suporte prioritário',
];

export default function UpgradeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: colors.primary + '20',
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <Star size={32} color={colors.primary} fill={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' }}>
            Plano Pro
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6 }}>
            Desbloqueie todos os recursos do AutoTrackr
          </Text>
        </View>

        {/* Benefits card */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.primary + '40',
          marginBottom: 24,
          gap: 14,
        }}>
          {BENEFITS.map(benefit => (
            <View key={benefit} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={14} color="#fff" strokeWidth={2.5} />
              </View>
              <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* How to upgrade */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 10,
        }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
            Como fazer upgrade?
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
            O Plano Pro é gerenciado pelo administrador da sua conta. Entre em contato para solicitar o upgrade.
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            suporte@labapp.com.br
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
