import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiError } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Field, Input } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
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
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="text-sm text-slate-500">Start planning smarter today</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={update('name')} required autoComplete="name" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              autoComplete="new-password"
            />
          </Field>
          <p className="text-xs text-slate-400">
            At least 8 characters with upper, lower &amp; a number.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
