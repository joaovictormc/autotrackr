import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Crown, Megaphone, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const COUNTDOWN_SECONDS = 5;

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
}

export default function AdInterstitial({ visible, onDismiss, onUpgrade }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const canClose = countdown === 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={canClose ? onDismiss : undefined}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Top bar */}
          <View
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontWeight: '600',
              }}
            >
              {t('plan.adLabel')}
            </Text>

            {canClose ? (
              <TouchableOpacity
                onPress={onDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {t('plan.adCloseIn', { n: countdown })}
              </Text>
            )}
          </View>

          {/* Ad body */}
          <View style={{ padding: 28, alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Megaphone size={32} color={colors.textMuted} />
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {t('plan.adInterstitialTitle')}
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t('plan.adInterstitialBody')}
            </Text>
          </View>

          {/* CTA */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
            <TouchableOpacity
              onPress={onUpgrade}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Crown size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {t('plan.adInterstitialCta')}
              </Text>
            </TouchableOpacity>

            {canClose && (
              <TouchableOpacity
                onPress={onDismiss}
                style={{ alignItems: 'center', padding: 10 }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {t('plan.adCloseNow')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
