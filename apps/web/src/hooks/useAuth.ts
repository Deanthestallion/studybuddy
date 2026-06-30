import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput } from '@studybuddy/shared';
import { http } from '../lib/api';
import { useAuthStore } from '../store/auth';

/**
 * Auth actions + session bootstrap. On first mount it attempts a silent refresh
 * (using the httpOnly cookie) to restore the session across page reloads.
 */
export function useAuth() {
  const { user, status, setAuth, setStatus, clear } = useAuthStore();
  const qc = useQueryClient();

  async function login(input: LoginInput) {
    const res = await http.post('/auth/login', input);
    setAuth(res.data.data.user, res.data.data.accessToken);
  }

  async function register(input: RegisterInput) {
    const res = await http.post('/auth/register', input);
    setAuth(res.data.data.user, res.data.data.accessToken);
  }

  async function logout() {
    try {
      await http.post('/auth/logout');
    } finally {
      clear();
      qc.clear();
    }
  }

  return { user, status, login, register, logout, setStatus };
}

/** Run once near the root to restore an existing session. */
export function useBootstrapAuth() {
  const { setAuth, setStatus } = useAuthStore();
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await http.post('/auth/refresh');
        if (active) setAuth(res.data.data.user, res.data.data.accessToken);
      } catch {
        if (active) setStatus('anonymous');
      }
    })();
    return () => {
      active = false;
    };
  }, [setAuth, setStatus]);
}
