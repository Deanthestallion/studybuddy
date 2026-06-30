import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiError } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth';
import { Button, Card, Field, Input } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const [email, setEmail] = useState('demo@studybuddy.app');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    navigate(location.state?.from?.pathname ?? '/', { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-600 to-indigo-800 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white">
            <BookOpen size={22} />
          </div>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to continue studying</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-3 text-center text-sm">
          <Link to="/forgot" className="text-slate-500 hover:text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          Demo: demo@studybuddy.app / Password123!
        </p>
      </Card>
    </div>
  );
}
