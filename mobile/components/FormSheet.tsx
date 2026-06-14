import React from 'react';
import { Modal, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bottom sheet baseado em Modal nativo do React Native.
 * Evita os conflitos de gesto/toque do @gorhom/bottom-sheet no Android
 * (onde TouchableOpacity dentro do sheet às vezes não dispara).
 */
export default function FormSheet({ visible, onClose, children }: Props) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop — toque fora fecha */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onClose}
        />
        {/* Conteúdo */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '92%',
            paddingBottom: Platform.OS === 'ios' ? 12 : 0,
          }}
        >
          {/* Grab handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
