import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'customer';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            // Default to customer if no record exists
            await setDoc(doc(db, 'users', currentUser.uid), {
              email: currentUser.email,
              role: 'customer',
              createdAt: new Date().toISOString()
            });
            setRole('customer');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('customer'); // fallback
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    // If it's a customer and they aren't verified, we could throw an error here,
    // but we'll let the UI handle checking user.emailVerified.
  };

  const signupWithEmail = async (email: string, password: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCred.user);
    await setDoc(doc(db, 'users', userCred.user.uid), {
      email,
      role: 'customer',
      createdAt: new Date().toISOString()
    });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    
    // Ensure they have a user document
    const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email: userCred.user.email,
        role: 'customer',
        createdAt: new Date().toISOString()
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const value = {
    user,
    role,
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    resendVerificationEmail,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
