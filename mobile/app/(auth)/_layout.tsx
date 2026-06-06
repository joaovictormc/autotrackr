import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (!loading && isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
