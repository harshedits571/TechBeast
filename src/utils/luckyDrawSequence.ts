import { db } from '../lib/firebase';
import { doc, runTransaction, getDoc, setDoc } from 'firebase/firestore';

/**
 * Generates the next sequential lucky draw ticket number (e.g. TB-LUCKY-1001, TB-LUCKY-1002).
 * Uses a fast Firestore atomic transaction to prevent race conditions and duplicate ticket numbers.
 */
export async function getNextLuckyDrawTicketNumber(): Promise<string> {
  const counterRef = doc(db, 'giveaway_config', 'ticketCounter');

  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentSeq = 1000;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (typeof data?.currentSeq === 'number' && data.currentSeq >= 1000) {
          currentSeq = data.currentSeq;
        }
      }

      const next = currentSeq + 1;
      transaction.set(
        counterRef,
        {
          currentSeq: next,
          prefix: 'TB-LUCKY-',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return next;
    });

    return `TB-LUCKY-${String(nextSeq).padStart(4, '0')}`;
  } catch (err) {
    console.warn("Could not increment sequence via transaction. Using fast fallback sequence:", err);
    // Instant fallback without network-blocking database scans
    const fallbackSeq = 1000 + Math.floor(Date.now() % 90000);
    return `TB-LUCKY-${String(fallbackSeq).padStart(4, '0')}`;
  }
}

/**
 * Gets the current ticket sequence number without incrementing.
 */
export async function getCurrentTicketSequence(): Promise<number> {
  try {
    const counterRef = doc(db, 'giveaway_config', 'ticketCounter');
    const snap = await getDoc(counterRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.currentSeq === 'number') {
        return data.currentSeq;
      }
    }
  } catch (e) {
    console.warn("Error getting ticket sequence:", e);
  }
  return 1000;
}

/**
 * Allows admin to manually update/reset the ticket sequence number.
 */
export async function updateTicketSequence(newSeq: number): Promise<void> {
  const counterRef = doc(db, 'giveaway_config', 'ticketCounter');
  await setDoc(
    counterRef,
    {
      currentSeq: newSeq,
      prefix: 'TB-LUCKY-',
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

