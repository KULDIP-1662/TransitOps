import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import axios from 'axios';

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleet@transitops.com' },
  { role: 'Driver', email: 'driver@transitops.com' },
  { role: 'Safety Officer', email: 'safety@transitops.com' },
  { role: 'Financial Analyst', email: 'finance@transitops.com' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('fleet@transitops.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Truck size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              TransitOps
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Smart Transport Operations Platform
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Demo accounts (password: password123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('password123');
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
