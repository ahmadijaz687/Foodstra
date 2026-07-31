import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { searchMenu } from '../api/client';
import { useAddToCart } from '../api/queries';
import { Card, Money, PrimaryButton, Screen } from '../components/ui';
import { ApiError } from '../api/client';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Restaurant'>;

export function RestaurantScreen({ route }: Props): JSX.Element {
  const { restaurantId } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => searchMenu({ restaurantId, pageSize: 100 }),
  });
  const addToCart = useAddToCart();

  const onAdd = (menuItemId: string): void => {
    addToCart.mutate(
      { menuItemId, quantity: 1 },
      {
        onError: (err) => {
          const msg =
            err instanceof ApiError ? err.message : 'Could not add to cart';
          Alert.alert('Cart', msg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.desc}>{item.description}</Text>
                ) : null}
                <Money minor={item.priceMinor} />
              </View>
            </View>
            <PrimaryButton
              label={item.isAvailable ? 'Add to cart' : 'Unavailable'}
              disabled={!item.isAvailable}
              loading={addToCart.isPending}
              onPress={() => onAdd(item.id)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  info: { flex: 1, gap: spacing.xs },
  name: { ...typography.heading, color: colors.textPrimary },
  desc: { ...typography.caption, color: colors.textSecondary },
});
