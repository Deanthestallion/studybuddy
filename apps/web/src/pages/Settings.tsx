import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { Button, Card, PageHeader } from '../components/ui';

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const { theme, set } = useThemeStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <Card>
        <h2 className="mb-4 font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-xl font-bold text-white">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Level {user?.level} · {user?.xp} XP · {user?.streak}-day streak
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Appearance</h2>
        <div className="flex gap-3">
          <button
            onClick={() => set('light')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 ${
              theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/15' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sun size={18} /> Light
          </button>
          <button
            onClick={() => set('dark')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 ${
              theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/15' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <Moon size={18} /> Dark
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Account</h2>
        <p className="mb-4 text-sm text-slate-500">Sign out of this device.</p>
        <Button
          variant="danger"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          <LogOut size={16} /> Log out
        </Button>
      </Card>
    </div>
  );
}
