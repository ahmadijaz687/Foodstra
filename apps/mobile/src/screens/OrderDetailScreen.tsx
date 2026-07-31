import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrderStatus } from '@foodstra/shared';
import type { RootStackParamList } from '../navigation/types';
import { confirmOrderPayment } from '../api/client';
import { useOrder } from '../api/queries';
import { useOrderSocket } from '../realtime/useOrderSocket';
import { Money, PrimaryButton, Screen } from '../components/ui';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STEPS: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export function OrderDetailScreen({ route }: Props): JSX.Element {
  const { orderId } = route.params;
  const { data: order, isLoading } = useOrder(orderId);
  const live = useOrderSocket(orderId);
  const qc = useQueryClient();

  // Refresh the order whenever a realtime status arrives.
  useEffect(() => {
    if (live.status) void qc.invalidateQueries({ queryKey: ['order', orderId] });
  }, [live.status, orderId, qc]);

  if (isLoading || !order) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  const currentStatus = live.status ?? order.status;
  const currentIndex = STEPS.indexOf(currentStatus);

  const onConfirmPayment = (): void => {
    void confirmOrderPayment(orderId).then(() =>
      qc.invalidateQueries({ queryKey: ['order', orderId] }),
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>Order status</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {currentStatus.replace(/_/g, ' ')}
        </Text>
        <Text style={styles.conn}>{live.connected ? '● live' : '○ offline'}</Text>
      </View>

      <View style={styles.timeline}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.step}>
            <View
              style={[styles.dot, i <= currentIndex && styles.dotActive]}
            />
            <Text
              style={[styles.stepLabel, i <= currentIndex && styles.stepActive]}
            >
              {step.replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </View>

      {currentStatus === 'cancelled' ? (
        <Text style={styles.cancelled}>This order was cancelled.</Text>
      ) : null}

      {live.location ? (
        <Text style={styles.loc}>
          Driver: {live.location.latitude.toFixed(4)},{' '}
          {live.location.longitude.toFixed(4)}
        </Text>
      ) : null}

      <View style={styles.totals}>
        <Row label="Subtotal" minor={order.subtotalMinor} />
        <Row label="Delivery" minor={order.deliveryFeeMinor} />
        <Row label="Tax" minor={order.taxMinor} />
        <Row label="Total" minor={order.totalMinor} bold />
      </View>

      {order.status === 'placed' ? (
        <PrimaryButton
          testID="confirm-payment"
          label="Complete payment"
          onPress={onConfirmPayment}
        />
      ) : null}
    </Screen>
  );
}

function Row({
  label,
  minor,
  bold = false,
}: {
  label: string;
  minor: number;
  bold?: boolean;
}): JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Money minor={minor} />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  title: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
  badge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  badgeText: {
    ...typography.heading,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  conn: { ...typography.caption, color: colors.textSecondary },
  timeline: { marginVertical: spacing.lg, gap: spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  stepLabel: { color: colors.textSecondary, textTransform: 'capitalize' },
  stepActive: { color: colors.textPrimary, fontWeight: '700' },
  cancelled: { color: colors.danger, marginBottom: spacing.md },
  loc: { color: colors.textSecondary, marginBottom: spacing.md },
  totals: { marginVertical: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.textSecondary },
  bold: { color: colors.textPrimary, fontWeight: '700' },
});
