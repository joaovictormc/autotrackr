import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), phone.trim() || undefined);
    } catch {
      setError(t('auth.signUpError'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1 as const,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 15,
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
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>AutoTrackr</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>{t('auth.signUp')}</Text>
        </View>

        {error ? (
          <View style={{ backgroundColor: '#450a0a', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
            <Text style={{ color: '#fca5a5', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          {[
            { label: t('auth.name'), value: name, setter: setName, type: 'default' as const },
            { label: t('auth.email'), value: email, setter: setEmail, type: 'email-address' as const },
            { label: t('auth.phone'), value: phone, setter: setPhone, type: 'phone-pad' as const },
          ].map(({ label, value, setter, type }) => (
            <View key={label}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6, fontWeight: '500' }}>{label}</Text>
              <TextInput
                style={inputStyle}
                placeholder={label}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={setter}
                autoCapitalize={type === 'default' ? 'words' : 'none'}
                keyboardType={type}
              />
            </View>
          ))}
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6, fontWeight: '500' }}>{t('auth.password')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10 }}>
              <TextInput
                style={{ ...inputStyle, flex: 1, borderWidth: 0, borderRadius: 0 }}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('auth.signUp')}</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('auth.hasAccount')}</Text>
          <Link href="/(auth)/login">
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>{t('auth.signIn')}</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
