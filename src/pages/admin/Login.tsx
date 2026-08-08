import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithEmail, loginWithGoogle, role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Watch for role updates to redirect seamlessly
  React.useEffect(() => {
    if (user && role === 'admin') {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } else if (user && role === 'customer') {
      setError('Your account does not have administrator privileges.');
      logout();
    }
  }, [user, role, navigate, location, logout]);

  const from = location.state?.from?.pathname || '/admin';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await loginWithEmail(email, password);
      // Let the useEffect handle the navigation once role loads
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else {
        setError('Failed to log in. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      // Let the useEffect handle the navigation once role loads
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google authentication is not enabled in Firebase.');
      } else {
        setError('Failed to log in with Google.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-300">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#141415]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to access the Tech Beast ecosystem.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="admin@techbeast.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 mt-6"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-[#141415] px-4 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
        >
          <Chrome className="w-5 h-5 text-slate-300" />
          Google Account
        </button>
        
        <div className="mt-8 text-center text-xs text-slate-600">
          Tech Beast Ecosystem v1.0.0 &copy; 2026
        </div>
      </div>
    </div>
  );
}
