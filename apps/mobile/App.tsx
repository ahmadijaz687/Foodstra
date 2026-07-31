import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setSessionExpiredHandler } from './src/api/client';
import { useAuthStore } from './src/auth/store';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { colors, spacing, typography } from './src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const navTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

function Splash(): JSX.Element {
  return (
    <View style={styles.splash} testID="app-root">
      <StatusBar style="light" />
      <View style={styles.monogram}>
        <Text style={styles.monogramText}>FS</Text>
      </View>
      <Text style={styles.title}>FoodStra</Text>
      <Text style={styles.subtitle}>Great food, delivered.</Text>
    </View>
  );
}

function Root(): JSX.Element {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setSessionExpiredHandler(() => void logout());
    void bootstrap();
  }, [bootstrap, logout]);

  if (status === 'bootstrapping') return <Splash />;

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'authenticated' ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Root />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  monogram: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { color: colors.primaryText, fontSize: 44, fontWeight: '800' },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
});
