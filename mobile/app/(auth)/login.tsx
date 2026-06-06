import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const status = e?.response?.status;
      setError(status === 401 ? t('auth.invalidCredentials') : t('auth.signInError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Title */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>
            AutoTrackr
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
            Controle total do seu veículo
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
            <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
              {t('auth.email')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.text,
                fontSize: 15,
              }}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6, fontWeight: '500' }}>
              {t('auth.password')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.text,
                fontSize: 15,
              }}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {t('auth.signIn')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('auth.noAccount')}</Text>
          <Link href="/(auth)/register">
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
              {t('auth.signUp')}
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
