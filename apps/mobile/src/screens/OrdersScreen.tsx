import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useOrders } from '../api/queries';
import { Card, Money, Screen } from '../components/ui';
import { colors, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'OrdersTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function OrdersScreen({ navigation }: Props): JSX.Element {
  const { data, isLoading, refetch, isRefetching } = useOrders();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(o) => o.id}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>
              {item.items.length} item(s) •{' '}
              {new Date(item.placedAt).toLocaleString()}
            </Text>
            <Money minor={item.totalMinor} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  status: {
    ...typography.heading,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  meta: { ...typography.caption, color: colors.textSecondary, marginVertical: spacing.xs },
});
