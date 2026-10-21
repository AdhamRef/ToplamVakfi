/**
 * Which ways of giving the site offers.
 *
 * Edit the list below to turn a frequency on or off; every picker on the site
 * and in the dashboard reads it, and checkout refuses the ones left out:
 *
 *   "once"     one-time donation
 *   "monthly"  every month
 *   "friday"   every week (charged on Fridays)
 *   "daily"    every day
 *
 * Keep "once" unless the site should only take recurring gifts. The order of
 * the list is the order the options are shown in.
 *
 * Turning a frequency off does not touch existing subscriptions: they keep
 * charging, and the dashboard still reports and manages them.
 */
export const ENABLED_DONATION_FREQUENCIES = ["once", "monthly"] as const satisfies ReadonlyArray<
  "once" | "monthly" | "friday" | "daily"
>;
