import { doc, getDoc, setDoc, updateDoc, collection, addDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ViewedProductInfo {
  id: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  condition?: string;
  brand?: string;
  sku?: string;
  modelNumber?: string;
}

export interface CustomerViewItem {
  productId: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  condition?: string;
  brand?: string;
  sku?: string;
  viewedAt: string;
  viewCount: number;
}

export interface CustomerLeadInfo {
  id?: string;
  name: string;
  phone: string;
  email: string;
  uid?: string;
}

/**
 * Gets currently stored customer info from localStorage or Firebase Auth
 */
export function getActiveCustomerInfo(user?: any): CustomerLeadInfo | null {
  let name = '';
  let phone = '';
  let email = '';
  let uid = user?.uid || '';
  let id = '';

  try {
    const stored = localStorage.getItem('customerAccountInfo');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        name = parsed.name || '';
        phone = parsed.phone || '';
        email = parsed.email || '';
        uid = parsed.uid || uid;
        id = parsed.id || '';
      }
    }
  } catch (err) {
    console.error("Error reading stored customer account:", err);
  }

  if (user) {
    name = name || user.displayName || 'Customer';
    email = email || user.email || '';
    phone = phone || user.phoneNumber || '';
    uid = user.uid || uid;
  }

  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const effectiveId = cleanPhone || id || uid || cleanEmail;

  if (effectiveId || cleanPhone || cleanEmail || uid) {
    return {
      id: effectiveId,
      name: name || 'Customer',
      phone: cleanPhone || phone,
      email: cleanEmail,
      uid: uid
    };
  }

  return null;
}

/**
 * Tracks a product view for a registered user or customer.
 * Also caches in localStorage so guest views can be synced upon login/registration.
 */
export async function trackProductView(product: ViewedProductInfo, authUser?: any) {
  if (!product || !product.id) return;

  const nowIso = new Date().toISOString();
  const customer = getActiveCustomerInfo(authUser);

  // Always save to guest browsing history in localStorage as immediate resilient fallback
  try {
    const guestHistory: ViewedProductInfo[] = JSON.parse(localStorage.getItem('guestViewedProducts') || '[]');
    const filtered = guestHistory.filter(p => p.id !== product.id);
    filtered.unshift({
      id: product.id,
      title: product.title,
      category: product.category || 'General',
      price: Number(product.price || 0),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
      imageUrl: product.imageUrl || '',
      condition: product.condition || '',
      brand: product.brand || '',
      sku: product.sku || '',
      modelNumber: product.modelNumber || ''
    });
    localStorage.setItem('guestViewedProducts', JSON.stringify(filtered.slice(0, 30)));
  } catch (e) {
    // ignore
  }

  // If customer is identified (via phone, email, or auth user UID), save directly to Firestore
  if (customer && (customer.id || customer.phone || customer.email || customer.uid)) {
    const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '';
    const customerId = cleanPhone || customer.id || customer.uid || customer.email;

    try {
      // 1. Write/Update dedicated view record in `customer_views` collection
      // Document ID combines customerId and productId for easy deduplication
      const viewDocId = `${customerId}_${product.id}`.replace(/[\/\s]/g, '_');
      const viewDocRef = doc(db, 'customer_views', viewDocId);
      
      const existingSnap = await getDoc(viewDocRef).catch(() => null);
      const existingCount = existingSnap && existingSnap.exists() ? (existingSnap.data().viewCount || 1) : 0;
      const firstViewedAt = existingSnap && existingSnap.exists() ? (existingSnap.data().firstViewedAt || nowIso) : nowIso;

      const viewPayload = {
        customerId: customerId,
        customerName: customer.name || 'Customer',
        customerPhone: cleanPhone || customer.phone || '',
        customerEmail: customer.email || '',
        userId: customer.uid || authUser?.uid || '',
        productId: product.id,
        productTitle: product.title,
        productCategory: product.category || 'General',
        productPrice: Number(product.price || 0),
        productOldPrice: product.oldPrice ? Number(product.oldPrice) : null,
        productImage: product.imageUrl || '',
        productCondition: product.condition || '',
        productBrand: product.brand || '',
        productSku: product.sku || '',
        viewCount: existingCount + 1,
        firstViewedAt: firstViewedAt,
        lastViewedAt: nowIso,
        updatedAt: nowIso
      };

      await setDoc(viewDocRef, viewPayload, { merge: true }).catch(err => {
        console.warn("View record setDoc warning:", err);
      });

      // If user has a separate UID view record, also update that
      if (customer.uid && customer.uid !== customerId) {
        const uidViewDocId = `${customer.uid}_${product.id}`.replace(/[\/\s]/g, '_');
        setDoc(doc(db, 'customer_views', uidViewDocId), viewPayload, { merge: true }).catch(() => {});
      }

      // 2. Update customer document in `customers` collection with an updated array of viewedProducts
      const customerDocRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerDocRef).catch(() => null);
      
      let viewedList: CustomerViewItem[] = [];
      if (customerSnap && customerSnap.exists() && Array.isArray(customerSnap.data().viewedProducts)) {
        viewedList = [...customerSnap.data().viewedProducts];
      }

      // Filter out existing entry for this product and prepend new one
      const existingIndex = viewedList.findIndex(v => v.productId === product.id);
      let count = 1;
      if (existingIndex >= 0) {
        count = (viewedList[existingIndex].viewCount || 1) + 1;
        viewedList.splice(existingIndex, 1);
      }

      const newViewItem: CustomerViewItem = {
        productId: product.id,
        title: product.title,
        category: product.category || 'General',
        price: Number(product.price || 0),
        oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
        imageUrl: product.imageUrl || '',
        condition: product.condition || '',
        brand: product.brand || '',
        sku: product.sku || '',
        viewedAt: nowIso,
        viewCount: count
      };

      // Keep up to latest 50 viewed products
      viewedList.unshift(newViewItem);
      if (viewedList.length > 50) {
        viewedList = viewedList.slice(0, 50);
      }

      await setDoc(customerDocRef, {
        name: customer.name,
        phone: cleanPhone || customer.phone,
        email: customer.email,
        uid: customer.uid || authUser?.uid || '',
        lastActive: nowIso,
        lastViewedProduct: product.title,
        lastViewedCategory: product.category || 'General',
        viewedProducts: viewedList,
        registeredOnline: true
      }, { merge: true }).catch(err => console.log("Customer doc update notice:", err));

    } catch (err) {
      console.error("Error tracking product view to Firestore:", err);
    }
  }
}

/**
 * Flushes and syncs guest viewed products to Firestore once the user logs in or creates an account
 */
export async function syncGuestViewedProducts(customer: CustomerLeadInfo) {
  if (!customer || (!customer.id && !customer.phone && !customer.email && !customer.uid)) return;
  
  try {
    const raw = localStorage.getItem('guestViewedProducts');
    const guestHistory: ViewedProductInfo[] = raw ? JSON.parse(raw) : [];

    if (Array.isArray(guestHistory) && guestHistory.length > 0) {
      for (const prod of guestHistory) {
        await trackProductView(prod, {
          uid: customer.uid,
          displayName: customer.name,
          email: customer.email,
          phoneNumber: customer.phone
        });
      }
    }
  } catch (err) {
    console.error("Error syncing guest viewed products:", err);
  }
}

/**
 * Generates a direct WhatsApp inquiry message link for sales follow-up
 */
export function generateWhatsAppInquiryUrl(
  customerPhone: string,
  customerName: string,
  productTitle: string,
  productPrice?: number,
  productCategory?: string
): string {
  const cleanPhone = (customerPhone || '').replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  
  const priceText = productPrice ? ` (₹${Number(productPrice).toLocaleString('en-IN')})` : '';
  const categoryText = productCategory ? ` [${productCategory}]` : '';

  const message = [
    `Hello ${customerName || 'Sir/Madam'}! 👋`,
    ``,
    `Greetings from *Tech Beast Hubli*! 🚀`,
    `We noticed you were checking out *${productTitle}*${categoryText}${priceText} on our website.`,
    ``,
    `Would you like to know more about the available deals, warranty, or schedule an in-store inspection/delivery?`,
    ``,
    `Please let us know, our tech team is ready to assist you! 😊`
  ].join('\n');

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
