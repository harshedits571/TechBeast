import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /admin/login page
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-4">
        <div className="bg-[#141415] border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-red-900/20">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6 text-sm">
            You do not have permission to access the admin portal. If you are an administrator, please log in with your admin account.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
