import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AccountModal from './AccountModal';
import { Lock, LogIn } from 'lucide-react';

interface RequireAccountProps {
  children: React.ReactNode;
}

export default function RequireAccount({ children }: RequireAccountProps) {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setProfileComplete(false);
        return;
      }

      // Fast check via local storage
      const storedAccount = localStorage.getItem('customerAccountInfo');
      if (storedAccount) {
        setProfileComplete(true);
        return;
      }

      // Fallback: Check Firestore to see if they completed it on another device
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().phone) {
          setProfileComplete(true);
          // Sync to local storage
          localStorage.setItem('customerAccountInfo', JSON.stringify(userDoc.data()));
        } else {
          setProfileComplete(false);
          const timer = setTimeout(() => {
            setShowModal(true);
          }, 500);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Error checking profile status:", err);
        setProfileComplete(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  const handleSuccess = (data: any) => {
    setProfileComplete(true);
    setShowModal(false);
  };

  if (authLoading || (user && profileComplete === null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 1. If not authenticated at all, completely block access
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-500 mb-8">
            You must be signed in to view detailed product specifications, pricing, and availability.
          </p>
          <button
            onClick={openAuthModal}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign In to View Product
          </button>
        </div>
      </div>
    );
  }

  // 2. If authenticated but profile is incomplete, render the modal on top
  return (
    <div className="relative min-h-screen">
      {/* If profile is incomplete, completely hide children to enforce filling the form */}
      {profileComplete ? children : (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
          Preparing product details...
        </div>
      )}
      
      {!profileComplete && (
        <AccountModal isOpen={showModal} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
