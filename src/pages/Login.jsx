import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      const user = data.data?.user;
      const token = data.data?.token;
      if (!user?.isAdmin) {
        toast.error('Access denied. Admin only.');
        setLoading(false);
        return;
      }
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      toast.success('Welcome back, Admin!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${DARK} 0%, #16213e 50%, ${DARK} 100%)`,
    }}>
      <div style={{
        width: 400, background: WHITE, borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px', textAlign: 'center',
          background: `linear-gradient(135deg, ${PRIMARY}, #e0004d)`,
        }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: WHITE, letterSpacing: -0.5 }}>
            FlatMate Admin
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
            Sign in to the admin panel
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: 32 }}>
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 8 }}>
              Email
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '0 12px', background: '#F8F9FB',
            }}>
              <Mail size={16} color={MUTED} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{
                  flex: 1, border: 'none', outline: 'none', padding: '14px 8px',
                  fontSize: 14, background: 'transparent', fontFamily: 'inherit',
                }}
              />
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 8, marginTop: 16 }}>
              Password
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '0 12px', background: '#F8F9FB',
            }}>
              <Lock size={16} color={MUTED} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  flex: 1, border: 'none', outline: 'none', padding: '14px 8px',
                  fontSize: 14, background: 'transparent', fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 24, padding: '14px 0',
                background: loading ? MUTED : PRIMARY, color: WHITE, border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
