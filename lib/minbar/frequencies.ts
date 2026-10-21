import { ENABLED_DONATION_FREQUENCIES } from "@/config/donation-frequencies";
import type { CartFreqKey } from "@/lib/minbar/cart";

/**
 * The frequencies the site offers (`config/donation-frequencies.ts`), in the
 * configured order. Pickers filter their options through `offeredFrequencies`
 * so their own order and labels stay as they are.
 */
export const ENABLED_FREQUENCIES: readonly CartFreqKey[] = ENABLED_DONATION_FREQUENCIES.length
  ? ENABLED_DONATION_FREQUENCIES
  : ["once"];

export function isFrequencyEnabled(freq: unknown): freq is CartFreqKey {
  return typeof freq === "string" && (ENABLED_FREQUENCIES as readonly string[]).includes(freq);
}

/** The enabled recurring frequencies (everything but "once"). */
export const ENABLED_RECURRING_FREQUENCIES: readonly CartFreqKey[] = ENABLED_FREQUENCIES.filter((f) => f !== "once");

/** Keep only the options whose `id` is enabled. */
export function offeredFrequencies<T extends { id: CartFreqKey }>(options: ReadonlyArray<T>): T[] {
  return options.filter((o) => isFrequencyEnabled(o.id));
}
