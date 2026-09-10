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
  try {
    const stored = localStorage.getItem('customerAccountInfo');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.phone || parsed.email || parsed.id)) {
        return {
          id: parsed.id || (parsed.phone ? parsed.phone.replace(/\D/g, '') : user?.uid),
          name: parsed.name || user?.displayName || 'Customer',
          phone: parsed.phone || '',
          email: parsed.email || user?.email || '',
          uid: user?.uid
        };
      }
    }
  } catch (err) {
    console.error("Error reading stored customer account:", err);
  }

  if (user && (user.email || user.displayName || user.phoneNumber)) {
    return {
      id: user.uid,
      name: user.displayName || 'Customer',
      phone: user.phoneNumber || '',
      email: user.email || '',
      uid: user.uid
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

  // If customer is identified, save to Firestore
  if (customer && (customer.id || customer.phone || customer.email)) {
    const customerId = customer.id || (customer.phone ? customer.phone.replace(/\D/g, '') : customer.email);

    try {
      // 1. Write/Update dedicated view record in `customer_views` collection
      // Document ID combines customerId and productId for easy deduplication
      const viewDocId = `${customerId}_${product.id}`.replace(/[\/\s]/g, '_');
      const viewDocRef = doc(db, 'customer_views', viewDocId);
      
      const existingSnap = await getDoc(viewDocRef);
      const existingCount = existingSnap.exists() ? (existingSnap.data().viewCount || 1) : 0;
      const firstViewedAt = existingSnap.exists() ? (existingSnap.data().firstViewedAt || nowIso) : nowIso;

      await setDoc(viewDocRef, {
        customerId: customerId,
        customerName: customer.name || 'Customer',
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        userId: customer.uid || '',
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
      }, { merge: true });

      // 2. Update customer document in `customers` collection with an updated array of viewedProducts
      const customerDocRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerDocRef);
      
      let viewedList: CustomerViewItem[] = [];
      if (customerSnap.exists() && Array.isArray(customerSnap.data().viewedProducts)) {
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
        phone: customer.phone,
        email: customer.email,
        lastActive: nowIso,
        lastViewedProduct: product.title,
        lastViewedCategory: product.category || 'General',
        viewedProducts: viewedList,
        registeredOnline: true
      }, { merge: true }).catch(err => console.log("Customer doc update notice:", err));

    } catch (err) {
      console.error("Error tracking product view to Firestore:", err);
    }
  } else {
    // Save to guest browsing history in localStorage
    try {
      const guestHistory: ViewedProductInfo[] = JSON.parse(localStorage.getItem('guestViewedProducts') || '[]');
      const filtered = guestHistory.filter(p => p.id !== product.id);
      filtered.unshift(product);
      localStorage.setItem('guestViewedProducts', JSON.stringify(filtered.slice(0, 20)));
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Flushes and syncs guest viewed products to Firestore once the user logs in or creates an account
 */
export async function syncGuestViewedProducts(customer: CustomerLeadInfo) {
  if (!customer || (!customer.id && !customer.phone && !customer.email)) return;
  
  try {
    const raw = localStorage.getItem('guestViewedProducts');
    if (!raw) return;
    const guestHistory: ViewedProductInfo[] = JSON.parse(raw);
    if (!Array.isArray(guestHistory) || guestHistory.length === 0) return;

    for (const prod of guestHistory) {
      await trackProductView(prod, {
        uid: customer.uid,
        displayName: customer.name,
        email: customer.email,
        phoneNumber: customer.phone
      });
    }

    localStorage.removeItem('guestViewedProducts');
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
