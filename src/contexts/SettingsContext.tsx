import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface StoreSettings {
  supportPhone: string;
  estimatedDispatch: string;
  bankOfferText: string;
  warrantyText: string;
  storeName: string;
  contactEmail: string;
}

const defaultSettings: StoreSettings = {
  supportPhone: '+91-9248071734',
  estimatedDispatch: '24 - 48hrs',
  bankOfferText: '7.5% Instant Discount Up To Rs.2000/- with HDFC Bank',
  warrantyText: '6 Months TechBeast Certified Warranty',
  storeName: 'TechBeast',
  contactEmail: 'support@techbeast.com'
};

interface SettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  loading: true
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'storeSettings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() });
        } else {
          // Initialize with defaults if it doesn't exist
          await setDoc(docRef, defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const docRef = doc(db, 'settings', 'storeSettings');
      await setDoc(docRef, { ...settings, ...newSettings }, { merge: true });
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
