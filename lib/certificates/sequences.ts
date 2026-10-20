import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The counters behind every serial the site prints.
 *
 * `DONATION_LOGIC_SPEC §2`: a serial is minted by the server, once, after
 * payment is confirmed. The counter is a single MongoDB document per sequence
 * advanced with an atomic `$inc`, so two confirmations landing in the same
 * millisecond get two different numbers  never the same one twice.
 *
 * The thank-you and receipt counters run per calendar year.
 */

export type SequenceKey = `thanks-${number}` | `receipt-${number}`;

/**
 * Claim the next number in a sequence.
 *
 * The row is created on first use holding 1; every
 * later call increments it in place. A concurrent first use is caught by the
 * primary key and retried as a plain increment, so no number is skipped or
 * handed out twice.
 */
export async function nextSequenceNumber(key: SequenceKey): Promise<number> {
  const existing = await prisma.documentSequence.findUnique({ where: { id: key } });
  if (!existing) {
    try {
      const created = await prisma.documentSequence.create({ data: { id: key, value: 1 } });
      return created.value;
    } catch {
      /* Someone else created it between the read and the write  fall through
         to the atomic increment, which is the ordinary path from here on. */
    }
  }
  const updated = await prisma.documentSequence.update({
    where: { id: key },
    data: { value: { increment: 1 } },
  });
  return updated.value;
}

/** Zero-padded, e.g. `000123`. */
export function padSerial(n: number, width = 6): string {
  return String(n).padStart(width, "0");
}
