/**
 * Which gateway a given donation should be charged through.
 *
 * Two rails take new payments:
 *   - PAYFOR    Ziraat Katılım 3D Secure. Unchanged, opt-out only: it keeps
 *                exactly the case it always had (one-time TRY donations) as long
 *                as the admin leaves its switch on.
 *   - STRIPE    the main gateway: every other case, one-time and recurring at
 *                any cadence (daily, every Friday, monthly).
 *
 * Albaraka used to be selectable as the main gateway; Stripe has replaced it.
 * A stored `mainGateway: "ALBARAKA"` now reads as Stripe. Plans already billed
 * by Albaraka keep their own rail (`planRail`) and are not moved.
 */

import { railForFrequency } from "./donations/recurring-schedule";

/** Gateway an admin can nominate as the main one in the dashboard. */
export type MainGateway = "STRIPE" | "ALBARAKA";

/** Gateway actually used to charge a specific donation. */
export type ResolvedGateway = "STRIPE" | "ALBARAKA" | "PAYFOR";

export const MAIN_GATEWAYS: readonly MainGateway[] = ["STRIPE"] as const;

export function isMainGateway(value: unknown): value is MainGateway {
  return value === "STRIPE" || value === "ALBARAKA";
}

/** The main gateway for new payments: always Stripe, whatever was stored (an old "ALBARAKA" included). */
export function parseMainGateway(value: unknown): MainGateway {
  return isMainGateway(value) && MAIN_GATEWAYS.includes(value) ? value : "STRIPE";
}

export type GatewayResolutionInput = {
  mainGateway: MainGateway;
  payforEnabled: boolean;
  /** ISO currency the donor is giving in, e.g. "TRY". */
  currency: string;
  /**
   * Recurring donations  daily, every Friday or monthly  create a
   * subscription on the main gateway. `ONE_TIME` is the only value
   * that reaches a bank rail.
   */
  donationType?: "ONE_TIME" | "DAILY" | "FRIDAY" | "MONTHLY" | null;
  /**
   * Set once a gateway has already failed and the donor was handed a Stripe
   * PaymentIntent to retry with  that forces Stripe for the rest of the attempt.
   */
  forceStripe?: boolean;
  /**
   * The donor's own 3D Secure choice, from the checkout's checkbox. When it is
   * given, a one-time donation runs on PayFor (3D) only if it is true, and on
   * the main gateway (2D) otherwise, whatever the currency. Left out, the
   * currency rule below decides, as it always has.
   */
  secure3d?: boolean;
};

export function resolveGateway({
  mainGateway,
  payforEnabled,
  currency,
  donationType = "ONE_TIME",
  forceStripe = false,
  secure3d,
}: GatewayResolutionInput): ResolvedGateway {
  if (forceStripe) return "STRIPE";
  // A plan runs on the main gateway at every cadence (`railForFrequency`).
  if (donationType && donationType !== "ONE_TIME") {
    return railForFrequency(donationType, mainGateway);
  }
  if (secure3d !== undefined && donationType === "ONE_TIME") {
    return secure3d && payforEnabled ? "PAYFOR" : mainGateway;
  }
  // Without a choice, PayFor keeps its case: an explicitly one-time TRY
  // donation, with the admin switch on.
  if (
    payforEnabled &&
    donationType === "ONE_TIME" &&
    String(currency || "").toUpperCase() === "TRY"
  ) {
    return "PAYFOR";
  }
  return mainGateway;
}

/** Lower-case name used by the analytics/pixel layer. */
export function gatewayAnalyticsName(
  gateway: ResolvedGateway
): "stripe" | "albaraka" | "payfor" {
  return gateway.toLowerCase() as "stripe" | "albaraka" | "payfor";
}

/** True when the gateway needs raw card inputs rendered on our own checkout step. */
export function gatewayUsesOwnCardForm(gateway: ResolvedGateway): boolean {
  return gateway === "PAYFOR" || gateway === "ALBARAKA";
}
