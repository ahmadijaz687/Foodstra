import { create } from 'zustand';
import type { User } from '@foodstra/shared';
import * as api from '../api/client';
import { clearTokens, loadTokens } from './storage';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Single source of truth for auth. On boot it restores tokens from secure
 * storage and silently refreshes; a failed refresh drops to unauthenticated.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'bootstrapping',
  user: null,
  error: null,

  bootstrap: async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    const expired = new Date(tokens.accessTokenExpiresAt).getTime() < Date.now();
    if (expired) {
      const refreshed = await api.refreshSession();
      if (!refreshed) {
        await clearTokens();
        set({ status: 'unauthenticated', user: null });
        return;
      }
    }
    set({ status: 'authenticated' });
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const res = await api.login({ email, password });
      set({ status: 'authenticated', user: res.user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed' });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ error: null });
    try {
      const res = await api.register({ email, password, displayName });
      set({ status: 'authenticated', user: res.user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign up failed' });
      throw err;
    }
  },

  logout: async () => {
    await api.logout();
    set({ status: 'unauthenticated', user: null });
  },

  clearError: () => set({ error: null }),
}));
