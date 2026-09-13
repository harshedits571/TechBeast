import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Extracts the trailing integer from a ticket number string (e.g. "TB-LUCKY-001" -> 1, "TB-LUCKY-1002" -> 1002).
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
 * - Always 4 digits (e.g. 1 -> "TB-LUCKY-0001", 5 -> "TB-LUCKY-0005", 50 -> "TB-LUCKY-0050", 1001 -> "TB-LUCKY-1001")
 */
export function formatTicketNumber(seq: number): string {
  const safeSeq = Math.max(1, Math.floor(seq || 1));
  return `TB-LUCKY-${String(safeSeq).padStart(4, '0')}`;
}

/**
 * Finds the highest sequential ticket number in giveaway_entries.
 * Ignores old emergency random timestamps (> 20000).
 */
async function getMaxExistingEntrySeq(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'giveaway_entries'));
    let maxSeq = 0;
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const num = extractTicketSeq(data.ticketNumber);
      // Only consider sequential numbers under 20000 (filters out legacy Date.now() % 90000 bugs)
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
 * Generates the next sequential lucky draw ticket number (e.g. TB-LUCKY-001, TB-LUCKY-002, TB-LUCKY-051).
 * 1. Checks configured starting sequence from admin.
 * 2. Compares against existing database tickets to prevent duplicates and ensure continuation.
 * 3. Never returns random numbers.
 */
export async function getNextLuckyDrawTicketNumber(): Promise<string> {
  const counterRef = doc(db, 'giveaway_config', 'ticketCounter');

  try {
    let configuredSeq: number | null = null;
    let manualOverrideTime = 0;

    // 1. Check if admin configured a sequence
    try {
      const snap = await getDoc(counterRef);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data?.nextSeq === 'number' && data.nextSeq >= 1) {
          configuredSeq = data.nextSeq;
        } else if (typeof data?.currentSeq === 'number' && data.currentSeq >= 0) {
          configuredSeq = data.currentSeq + 1;
        }
        if (data?.manualOverrideAt) {
          manualOverrideTime = new Date(data.manualOverrideAt).getTime();
        }
      }
    } catch (e) {
      // Ignore permission warnings on customer device
    }

    // 2. Read the maximum sequence already used in giveaway_entries
    const maxExisting = await getMaxExistingEntrySeq();

    // 3. Determine next sequence
    let nextSeq = 1;
    if (configuredSeq !== null && configuredSeq > 0) {
      if (configuredSeq > maxExisting) {
        nextSeq = configuredSeq;
      } else if (manualOverrideTime > Date.now() - 5 * 60 * 1000 && maxExisting === 0) {
        nextSeq = configuredSeq;
      } else {
        nextSeq = maxExisting + 1;
      }
    } else {
      nextSeq = maxExisting > 0 ? maxExisting + 1 : 1;
    }

    // 4. Update the counter document for next time (non-blocking)
    try {
      await setDoc(counterRef, {
        nextSeq: nextSeq + 1,
        currentSeq: nextSeq,
        lastGeneratedTicket: formatTicketNumber(nextSeq),
        prefix: 'TB-LUCKY-',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      // If customer cannot write to giveaway_config, the next entry read will base it on giveaway_entries
    }

    return formatTicketNumber(nextSeq);
  } catch (err) {
    console.error("Error generating ticket sequence:", err);
    const fallbackMax = await getMaxExistingEntrySeq();
    return formatTicketNumber(fallbackMax > 0 ? fallbackMax + 1 : 1);
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
    return 1;
  }
}

/**
 * Allows admin to manually update/reset the next ticket sequence number.
 * @param nextTicketNum - The exact next ticket number to be assigned (e.g. 1 for 001, 1001 for 1001)
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

