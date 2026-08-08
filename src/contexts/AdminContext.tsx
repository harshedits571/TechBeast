import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, startAfter, onSnapshot } from 'firebase/firestore';

function useAdminCollection(collectionName: string, orderByField?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q;
    const currentCursor = cursors[currentPage];
    
    if (currentCursor) {
      q = orderByField 
        ? query(collection(db, collectionName), orderBy(orderByField, 'desc'), startAfter(currentCursor), limit(pageSize))
        : query(collection(db, collectionName), startAfter(currentCursor), limit(pageSize));
    } else {
      q = orderByField
        ? query(collection(db, collectionName), orderBy(orderByField, 'desc'), limit(pageSize))
        : query(collection(db, collectionName), limit(pageSize));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setData(docs);
      setHasNextPage(snap.docs.length === pageSize);
      
      if (snap.docs.length > 0) {
        const lastDoc = snap.docs[snap.docs.length - 1];
        setCursors(prev => {
          const newCursors = [...prev];
          newCursors[currentPage + 1] = lastDoc;
          return newCursors;
        });
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error syncing ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, orderByField, pageSize, currentPage]);

  return {
    data, 
    loading, 
    pageSize, 
    setPageSize, 
    currentPage, 
    setCurrentPage, 
    hasNextPage,
    setCursors
  };
}

interface AdminContextType {
  ordersState: ReturnType<typeof useAdminCollection>;
  productsState: ReturnType<typeof useAdminCollection>;
  customersState: ReturnType<typeof useAdminCollection>;
  repairsState: ReturnType<typeof useAdminCollection>;
  inventoryState: ReturnType<typeof useAdminCollection>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ordersState = useAdminCollection('orders', 'createdAt');
  const productsState = useAdminCollection('products', 'createdAt');
  const customersState = useAdminCollection('customers', 'createdAt');
  const repairsState = useAdminCollection('repairs', 'createdAt');
  const inventoryState = useAdminCollection('inventory');

  return (
    <AdminContext.Provider value={{
      ordersState,
      productsState,
      customersState,
      repairsState,
      inventoryState
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
