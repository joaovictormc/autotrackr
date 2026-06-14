import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export function useAdInterstitial() {
  const { isPro } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const triggerAd = () => { if (!isPro) setVisible(true); };
  const dismissAd = () => setVisible(false);
  const goToUpgrade = () => {
    setVisible(false);
    router.push('/(tabs)/profile/upgrade');
  };

  return { adVisible: visible, triggerAd, dismissAd, goToUpgrade };
}
