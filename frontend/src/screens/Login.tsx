import { useState } from 'react';
import type { UserRole } from '../types';

interface Props { onLogin: (email: string, password: string) => Promise<void>; }

const QUICK_ROLES: { role: UserRole; email: string; pass: string; desc: string }[] = [
  { role: 'Fleet Manager', email: 'fleet@transitops.in', pass: 'fleet123', desc: 'Fleet & Maintenance' },
  { role: 'Dispatcher', email: 'dispatch@transitops.in', pass: 'dispatch123', desc: 'Dashboard & Trips' },
  { role: 'Safety Officer', email: 'safety@transitops.in', pass: 'safety123', desc: 'Drivers & Compliance' },
  { role: 'Financial Analyst', email: 'finance@transitops.in', pass: 'finance123', desc: 'Fuel, Expenses & Analytics' },
];

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (q: typeof QUICK_ROLES[0]) => {
    setEmail(q.email);
    setPassword(q.pass);
    setError('');
    onLogin(q.email, q.pass).catch((err: any) => setError(err.message));
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1>TransitOps</h1>
        <p className="subtitle">Smart Transport Operations Platform</p>
        <div className="login-roles">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>One login, four roles:</p>
          {QUICK_ROLES.map(q => (
            <div key={q.role} className="login-role-item">
              <div className="login-role-dot" />
              <div>
                <div className="login-role-label">{q.role}</div>
                <div className="login-role-desc">{q.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 40, fontSize: 11, color: 'var(--text-dim)' }}>
          TRANSITOPS © 2026
        </div>
      </div>

      <div className="login-form-side">
        <h2>Sign in to your account</h2>
        <p className="sub">Enter your credentials to continue</p>

        <div className="quick-roles">
          {QUICK_ROLES.map(q => (
            <button key={q.role} className="quick-role-btn" onClick={() => quickLogin(q)}>
              {q.role}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@transitops.in" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="flex items-center justify-between mb-16">
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none' }}>Forgot password?</a>
          </div>
          {error && <div className="form-error mb-8">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
