import { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAddress, fetchAddresses } from '../api/client';
import { useAuthStore } from '../auth/store';
import { PrimaryButton, Screen } from '../components/ui';
import { colors, radii, spacing, typography } from '../theme/tokens';

export function ProfileScreen(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');

  const addAddress = useMutation({
    mutationFn: () =>
      createAddress({
        label,
        line1,
        city,
        region: 'CA',
        postalCode: '94103',
        country: 'US',
        latitude: 37.7749,
        longitude: -122.4194,
        isDefault: false,
      }),
    onSuccess: () => {
      setLine1('');
      setCity('');
      void qc.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: () => Alert.alert('Address', 'Could not save address.'),
  });

  return (
    <Screen>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View style={styles.userCard}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Delivery addresses</Text>
      <FlatList
        data={addresses ?? []}
        keyExtractor={(a) => a.id}
        ListEmptyComponent={<Text style={styles.empty}>No addresses yet.</Text>}
        renderItem={({ item }) => (
          <Text style={styles.addr}>
            {item.isDefault ? '★ ' : ''}
            {item.label} — {item.line1}, {item.city}
          </Text>
        )}
      />

      <TextInput
        style={styles.input}
        placeholder="Label"
        placeholderTextColor={colors.textSecondary}
        value={label}
        onChangeText={setLabel}
      />
      <TextInput
        style={styles.input}
        placeholder="Street address"
        placeholderTextColor={colors.textSecondary}
        value={line1}
        onChangeText={setLine1}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor={colors.textSecondary}
        value={city}
        onChangeText={setCity}
      />
      <PrimaryButton
        label="Add address"
        loading={addAddress.isPending}
        disabled={!line1.trim() || !city.trim()}
        onPress={() => addAddress.mutate()}
      />

      <Text style={styles.logout} onPress={() => void logout()}>
        Sign out
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  name: { ...typography.heading, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary },
  section: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  empty: { color: colors.textSecondary },
  addr: { color: colors.textPrimary, paddingVertical: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  logout: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontWeight: '700',
  },
});
