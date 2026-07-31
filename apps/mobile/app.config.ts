import type { ExpoConfig } from 'expo/config';

/**
 * FoodStra app configuration. Branding is final from the first commit.
 * Secrets are never inlined here — EXPO_TOKEN etc. come from the environment.
 */
const config: ExpoConfig = {
  name: 'FoodStra',
  slug: 'foodstra',
  scheme: 'foodstra',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'ai.foodstra.app',
    buildNumber: '1',
    supportsTablet: true,
  },
  android: {
    package: 'ai.foodstra.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
  },
  plugins: ['expo-secure-store'],
};

export default config;
