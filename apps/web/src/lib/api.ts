import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { authStore } from '../store/auth';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export const http = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly refresh cookie
});

// Attach the in-memory access token to every request.
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Transparent refresh on 401 ───────────────────────────────────────────────
// A single in-flight refresh is shared by all queued requests so a burst of
// 401s triggers exactly one /auth/refresh call.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const { user, accessToken } = res.data.data;
    authStore.setAuth(user, accessToken);
    return accessToken;
  } catch {
    authStore.clear();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Normalize API errors to a readable message for toasts/inline errors. */
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
      err.message
    );
  }
  return err instanceof Error ? err.message : 'Unexpected error';
}

/** Thin typed unwrappers around the `{ data, meta }` envelope. */
export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get(url, config);
  return res.data.data as T;
}
export async function getList<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ data: T; meta: { page: number; pageSize: number; total: number } }> {
  const res = await http.get(url, config);
  return { data: res.data.data as T, meta: res.data.meta };
}
