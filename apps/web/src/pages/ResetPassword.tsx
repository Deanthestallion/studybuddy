import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiError, http } from '../lib/api';
import { Button, Card, Field, Input } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await http.post('/auth/password/reset', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
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
          <h1 className="text-xl font-bold">Choose a new password</h1>
        </div>

        {!token ? (
          <p className="text-center text-sm text-red-500">
            Missing or invalid reset link. Request a new one.
          </p>
        ) : done ? (
          <p className="rounded-lg bg-green-500/10 p-4 text-center text-sm text-green-600">
            Password updated! Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="New password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <p className="text-xs text-slate-400">At least 8 characters with upper, lower &amp; a number.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
