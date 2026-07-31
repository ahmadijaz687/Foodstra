import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { fetchAddresses } from '../api/client';
import { useCart, useClearCart, usePlaceOrder } from '../api/queries';
import { Money, PrimaryButton, Screen } from '../components/ui';
import { uuidv4 } from '../lib/uuid';
import { colors, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'CartTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function CartScreen({ navigation }: Props): JSX.Element {
  const { data: cart, isLoading } = useCart();
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
  const placeOrder = usePlaceOrder();
  const clearCart = useClearCart();

  const isEmpty = !cart || cart.items.length === 0;

  const onCheckout = (): void => {
    const address = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
    if (!address) {
      Alert.alert('Address needed', 'Add a delivery address in your profile first.');
      return;
    }
    placeOrder.mutate(
      { addressId: address.id, idempotencyKey: uuidv4() },
      {
        onSuccess: (res) =>
          navigation.navigate('OrderDetail', { orderId: res.order.id }),
        onError: () => Alert.alert('Checkout', 'Could not place order.'),
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
      <Text style={styles.title}>Your cart</Text>
      {isEmpty ? (
        <Text style={styles.empty}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.line}>
                <Text style={styles.lineName}>
                  {item.quantity}× {item.name}
                </Text>
                <Money minor={item.unitPriceMinor * item.quantity} />
              </View>
            )}
          />
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Money minor={cart.subtotalMinor} />
          </View>
          <PrimaryButton
            testID="checkout"
            label="Place order"
            loading={placeOrder.isPending}
            onPress={onCheckout}
          />
          <Text
            style={styles.clear}
            onPress={() => clearCart.mutate()}
          >
            Clear cart
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  empty: { color: colors.textSecondary, marginTop: spacing.xl, textAlign: 'center' },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  lineName: { color: colors.textPrimary, flex: 1 },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  subtotalLabel: { ...typography.heading, color: colors.textPrimary },
  clear: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
