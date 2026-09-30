import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('demo@mova.ai');
  const [password, setPassword] = useState('MovaDemo123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async (credentialOrData) => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credentialOrData || {
        email: 'operator.google@mova.ai',
        name: 'Google Fleet Operations',
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Google Authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4 border border-accent/30">
            <Activity className="w-9 h-9 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-mova-50 tracking-tight">MOVA</h1>
          <p className="text-sm text-mova-400 mt-1">AI Mobility Operations & Virtual Assistant</p>
          <p className="text-xs text-mova-500 mt-0.5 italic">"Predict the disruption. Simulate the impact. Optimize the movement."</p>
        </div>

        <div className="card p-6 border-border">
          <h2 className="text-lg font-semibold text-mova-100 mb-4">{isRegister ? 'Create Account' : 'Sign In'}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={googleLoading}
            className="w-full mb-4 flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.675-5.17 3.675-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.12C3.26 21.36 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.12z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.12c.95-2.85 3.6-4.98 6.73-4.98z" />
              </svg>
            )}
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mova-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-mova-800 px-2 text-mova-400 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs text-mova-400 mb-1">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2.5 text-sm text-mova-100 focus:outline-none focus:border-accent" required />
              </div>
            )}
            <div>
              <label className="block text-xs text-mova-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2.5 text-sm text-mova-100 focus:outline-none focus:border-accent" required />
            </div>
            <div>
              <label className="block text-xs text-mova-400 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-mova-700 border border-mova-600 rounded-lg px-3 py-2.5 text-sm text-mova-100 focus:outline-none focus:border-accent" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In with Email'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-xs text-accent hover:underline">
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-mova-700/50 rounded-lg">
            <p className="text-[10px] text-mova-400 font-medium mb-1">Enterprise Demo Credentials</p>
            <p className="text-xs text-mova-300">Email: demo@mova.ai</p>
            <p className="text-xs text-mova-300">Password: MovaDemo123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
