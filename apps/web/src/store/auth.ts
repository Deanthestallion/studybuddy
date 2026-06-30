import { create } from 'zustand';
import type { PublicUser } from '@studybuddy/shared';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (user: PublicUser, accessToken: string) => void;
  setUser: (user: PublicUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

/**
 * Auth lives in memory only — the access token is never persisted to
 * localStorage (XSS-safe). Session continuity comes from the httpOnly refresh
 * cookie + the silent-refresh bootstrap in <AuthProvider>.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, accessToken: null, status: 'anonymous' }),
}));

// Non-React accessors for the axios layer.
export const authStore = {
  getToken: () => useAuthStore.getState().accessToken,
  setAuth: useAuthStore.getState().setAuth,
  clear: useAuthStore.getState().clear,
};
