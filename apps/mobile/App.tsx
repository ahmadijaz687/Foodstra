import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from './src/theme/tokens';

export default function App(): JSX.Element {
  return (
    <View style={styles.container} testID="app-root">
      <StatusBar style="light" />
      <View style={styles.monogram}>
        <Text style={styles.monogramText}>FS</Text>
      </View>
      <Text style={styles.title}>FoodStra</Text>
      <Text style={styles.subtitle}>Great food, delivered.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  monogramText: {
    color: colors.primaryText,
    fontSize: 44,
    fontWeight: '800',
  },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
});
