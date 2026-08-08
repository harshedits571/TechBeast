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
  promoBannerText: string;
  promoBannerEnabled: boolean;
  heroBanners: { imageUrl: string; link: string }[];
  flashSaleEnabled: boolean;
  flashSaleTitle: string;
  flashSaleSubtitle: string;
  flashSaleEndTime: string;
  flashSaleProductIds: string[];
  bestSellerIds: string[];
  newArrivalIds: string[];
  accessoryCombos: { id: string; name: string; items: string[] }[];
  promoCards: {
    card1: { subtitle: string; title: string; link: string; bgColor: string };
    card2: { subtitle: string; title: string; link: string; bgColor: string };
  };
}

const defaultSettings: StoreSettings = {
  supportPhone: '+91-9248071734',
  estimatedDispatch: '24 - 48hrs',
  bankOfferText: '7.5% Instant Discount Up To Rs.2000/- with HDFC Bank',
  warrantyText: '6 Months TechBeast Certified Warranty',
  storeName: 'TechBeast',
  contactEmail: 'techbeasthubli@gmail.com',
  promoBannerText: 'Get 10% Off on all Laptops! Use code TECH10',
  promoBannerEnabled: true,
  heroBanners: [],
  flashSaleEnabled: false,
  flashSaleTitle: 'Flash Sale',
  flashSaleSubtitle: "Today's Special Deals",
  flashSaleEndTime: new Date(Date.now() + 86400000).toISOString(),
  flashSaleProductIds: [],
  bestSellerIds: [],
  newArrivalIds: [],
  accessoryCombos: [],
  promoCards: {
    card1: { subtitle: 'Weekend Deals', title: 'Next-gen gaming console', link: '/products', bgColor: 'blue' },
    card2: { subtitle: 'Back to school', title: 'Special discount for students', link: '/products', bgColor: 'red' }
  }
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
