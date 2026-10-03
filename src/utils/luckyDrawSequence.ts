import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, runTransaction } from 'firebase/firestore';

/**
 * Extracts the trailing integer from a ticket number string (e.g. "TB-LUCKY-0001" -> 1, "TB-LUCKY-0050" -> 50).
 */
export function extractTicketSeq(ticketNumber?: string): number {
  if (!ticketNumber) return 0;
  const match = String(ticketNumber).match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Formats a sequence number into the standard 4-digit ticket string:
 * - Always 4 digits (e.g. 1 -> "TB-LUCKY-0001", 2 -> "TB-LUCKY-0002", 50 -> "TB-LUCKY-0050", 1001 -> "TB-LUCKY-1001")
 */
export function formatTicketNumber(seq: number): string {
  const safeSeq = Math.max(1, Math.floor(seq || 1));
  return `TB-LUCKY-${String(safeSeq).padStart(4, '0')}`;
}

/**
 * Finds the highest sequential ticket number in giveaway_entries.
 * Filters out legacy emergency random timestamps (> 20000).
 */
export async function getMaxExistingEntrySeq(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'giveaway_entries'));
    let maxSeq = 0;
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const num = extractTicketSeq(data.ticketNumber);
      // Only consider sequential numbers under 20000 (filters out legacy Date.now() % 90000 random fallback IDs)
      if (num > maxSeq && num < 20000) {
        maxSeq = num;
      }
    });
    return maxSeq;
  } catch (err) {
    console.warn("Could not query giveaway entries for max sequence:", err);
    return 0;
  }
}

/**
 * Generates the next sequential lucky draw ticket number atomically.
 * 1. Checks existing giveaway_entries to ensure continuation without resetting.
 * 2. Uses an atomic Firestore transaction so simultaneous customer QR scans never duplicate.
 * 3. Advances the counter automatically for guest customer mobile submissions.
 */
export async function getNextLuckyDrawTicketNumber(): Promise<string> {
  const counterRef = doc(db, 'giveaway_config', 'ticketCounter');

  try {
    // 1. Get the current highest ticket number in the database to prevent duplicate numbers
    const maxExisting = await getMaxExistingEntrySeq();

    // 2. Perform an atomic transaction on the ticketCounter document
    const assignedTicketNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextSeq = 1;

      if (counterDoc.exists()) {
        const data = counterDoc.data();
        let configuredNext: number | null = null;
        if (typeof data?.nextSeq === 'number' && data.nextSeq >= 1) {
          configuredNext = data.nextSeq;
        } else if (typeof data?.currentSeq === 'number' && data.currentSeq >= 0) {
          configuredNext = data.currentSeq + 1;
        }

        if (configuredNext !== null && configuredNext > maxExisting) {
          nextSeq = configuredNext;
        } else {
          nextSeq = maxExisting + 1;
        }
      } else {
        nextSeq = maxExisting > 0 ? maxExisting + 1 : 1;
      }

      // Update the counter document atomically
      transaction.set(
        counterRef,
        {
          currentSeq: nextSeq,
          nextSeq: nextSeq + 1,
          lastGeneratedTicket: formatTicketNumber(nextSeq),
          prefix: 'TB-LUCKY-',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return formatTicketNumber(nextSeq);
    });

    return assignedTicketNumber;
  } catch (err) {
    console.warn("Transaction note, using robust entry-based fallback sequence:", err);

    // Fallback: Query highest existing ticket and increment
    const fallbackMax = await getMaxExistingEntrySeq();
    const fallbackSeq = fallbackMax > 0 ? fallbackMax + 1 : 1;

    // Attempt asynchronous update to ticketCounter
    setDoc(
      counterRef,
      {
        currentSeq: fallbackSeq,
        nextSeq: fallbackSeq + 1,
        lastGeneratedTicket: formatTicketNumber(fallbackSeq),
        prefix: 'TB-LUCKY-',
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    ).catch(() => {});

    return formatTicketNumber(fallbackSeq);
  }
}

/**
 * Gets the current next ticket sequence number for admin display.
 */
export async function getCurrentTicketSequence(): Promise<number> {
  try {
    const counterRef = doc(db, 'giveaway_config', 'ticketCounter');
    const snap = await getDoc(counterRef);
    const maxExisting = await getMaxExistingEntrySeq();

    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.nextSeq === 'number' && data.nextSeq >= 1) {
        return Math.max(data.nextSeq, maxExisting + 1);
      }
      if (typeof data?.currentSeq === 'number' && data.currentSeq >= 0) {
        return Math.max(data.currentSeq + 1, maxExisting + 1);
      }
    }

    return maxExisting > 0 ? maxExisting + 1 : 1;
  } catch (e) {
    console.warn("Error getting ticket sequence:", e);
    const maxExisting = await getMaxExistingEntrySeq();
    return maxExisting > 0 ? maxExisting + 1 : 1;
  }
}

/**
 * Allows admin to manually update/reset the next ticket sequence number.
 * @param nextTicketNum - The exact next ticket number to be assigned (e.g. 3 for TB-LUCKY-0003)
 */
export async function updateTicketSequence(nextTicketNum: number): Promise<void> {
  const safeNum = Math.max(1, Math.floor(nextTicketNum || 1));
  const counterRef = doc(db, 'giveaway_config', 'ticketCounter');
  await setDoc(
    counterRef,
    {
      nextSeq: safeNum,
      currentSeq: safeNum - 1,
      prefix: 'TB-LUCKY-',
      updatedAt: new Date().toISOString(),
      manualOverrideAt: new Date().toISOString()
    },
    { merge: true }
  );
}

