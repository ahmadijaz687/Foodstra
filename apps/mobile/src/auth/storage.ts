import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@foodstra/shared';

const ACCESS_KEY = 'foodstra.accessToken';
const REFRESH_KEY = 'foodstra.refreshToken';
const EXPIRES_KEY = 'foodstra.accessExpiresAt';

/**
 * Tokens live ONLY in the device secure enclave (Keychain / Keystore) via
 * expo-secure-store — never AsyncStorage, plain files, or unencrypted SQLite.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EXPIRES_KEY, tokens.accessTokenExpiresAt),
  ]);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken, accessTokenExpiresAt] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
    SecureStore.getItemAsync(EXPIRES_KEY),
  ]);
  if (!accessToken || !refreshToken || !accessTokenExpiresAt) return null;
  return { accessToken, refreshToken, accessTokenExpiresAt };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(EXPIRES_KEY),
  ]);
}
