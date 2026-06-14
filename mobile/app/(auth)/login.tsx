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
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const serverMsg = e?.response?.data?.message;
      // Loga o erro real no console do Expo para diagnóstico
      console.error('[Login]', status, serverMsg ?? e?.message ?? e);
      if (status === 401) {
        setError(t('auth.invalidCredentials'));
      } else if (!e?.response) {
        setError('Não foi possível conectar ao servidor. Verifique a URL da API.');
      } else {
        setError(`${t('auth.signInError')} (${status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1 as const,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    flex: 1,
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
              style={{ ...inputStyle, flex: undefined }}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}>
              <TextInput
                style={{ ...inputStyle, borderWidth: 0, borderRadius: 0 }}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={{ paddingHorizontal: 14 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword
                  ? <EyeOff size={20} color={colors.textMuted} />
                  : <Eye size={20} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>
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
