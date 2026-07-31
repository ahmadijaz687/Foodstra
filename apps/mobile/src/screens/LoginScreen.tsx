import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuthStore } from '../auth/store';
import { PrimaryButton, Screen } from '../components/ui';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);

  const onSubmit = (): void => {
    setLoading(true);
    login(email.trim(), password)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to FoodStra</Text>

      <TextInput
        testID="login-email"
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        testID="login-password"
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        testID="login-submit"
        label="Sign in"
        loading={loading}
        onPress={onSubmit}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>New here? </Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Register')}
        >
          Create an account
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  error: { color: colors.danger, ...typography.caption },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  footerText: { color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '700' },
});
