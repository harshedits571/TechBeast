import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Mail, Lock, Chrome, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithGoogle, user } = useAuth();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // If user is already logged in, we shouldn't really see this modal,
  // but if we do, just close it or show a success message.
  if (user) {
    onClose();
    return null;
  }

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose(); // Auto close on success
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google authentication is not enabled in your Firebase Console.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome to Tech Beast
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Sign in to track orders and checkout faster
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <Chrome className="w-5 h-5 text-blue-500" />
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
