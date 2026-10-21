import type { CartFreqKey } from "@/lib/minbar/cart";
import { ENABLED_RECURRING_FREQUENCIES, isFrequencyEnabled } from "@/lib/minbar/frequencies";

/**
 * Which cadence a campaign's giving dialog recommends (the «نوصي به» badge;
 * nothing is preselected  the donor chooses).
 * Set per campaign on the dashboard edit page (`Campaign.recommendedFrequency`).
 *
 *   unset / unknown  → "monthly" (the default for every campaign)
 *   "none"           → nothing recommended
 *   "monthly" | "friday" | "daily" | "once" → that one
 *
 * A stored frequency the site no longer offers (`config/donation-frequencies.ts`)
 * falls back to the default, then to the first enabled recurring one.
 */

export const RECOMMENDED_FREQUENCY_VALUES = ["monthly", "friday", "daily", "once", "none"] as const;
export type RecommendedFrequencySetting = (typeof RECOMMENDED_FREQUENCY_VALUES)[number];

export const DEFAULT_RECOMMENDED_FREQUENCY: CartFreqKey = "monthly";

export function isRecommendedFrequencySetting(value: unknown): value is RecommendedFrequencySetting {
  return typeof value === "string" && (RECOMMENDED_FREQUENCY_VALUES as readonly string[]).includes(value);
}

/** The cadence to recommend for a stored value, or null for "none". */
export function parseRecommendedFrequency(raw: unknown): CartFreqKey | null {
  if (raw === "none") return null;
  const wanted = isRecommendedFrequencySetting(raw) ? (raw as CartFreqKey) : DEFAULT_RECOMMENDED_FREQUENCY;
  if (isFrequencyEnabled(wanted)) return wanted;
  if (isFrequencyEnabled(DEFAULT_RECOMMENDED_FREQUENCY)) return DEFAULT_RECOMMENDED_FREQUENCY;
  return ENABLED_RECURRING_FREQUENCIES[0] ?? null;
}
