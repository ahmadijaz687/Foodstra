import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useMenuSearch } from '../api/queries';
import { Card, Screen } from '../components/ui';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props): JSX.Element {
  const [q, setQ] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useMenuSearch(q);

  return (
    <Screen>
      <Text style={styles.title}>FoodStra</Text>
      <TextInput
        testID="home-search"
        style={styles.input}
        placeholder="Search restaurants or cuisines"
        placeholderTextColor={colors.textSecondary}
        value={q}
        onChangeText={setQ}
      />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : isError ? (
        <Text style={styles.error}>Couldn&apos;t load restaurants.</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(r) => r.id}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                navigation.navigate('Restaurant', {
                  restaurantId: item.id,
                  name: item.name,
                })
              }
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.cuisines.join(' • ')}</Text>
              <View style={styles.row}>
                <Text style={styles.rating}>
                  ★ {item.ratingCount > 0 ? item.ratingAvg.toFixed(1) : 'New'}
                </Text>
                <Text style={item.isOpen ? styles.open : styles.closed}>
                  {item.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loader: { marginTop: spacing.xl },
  error: { color: colors.danger, marginTop: spacing.md },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  name: { ...typography.heading, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  rating: { color: colors.primary, fontWeight: '700' },
  open: { color: colors.success },
  closed: { color: colors.textSecondary },
});
