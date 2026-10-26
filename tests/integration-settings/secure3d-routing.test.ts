import test from "node:test";
import assert from "node:assert/strict";
import { resolveGateway } from "../../lib/payment-gateway";
import { stripeFallbackPath, wantsStripeFallback } from "../../lib/payfor";

/**
 * The checkout's "Donate with 3D (optional)" box: unticked, a one-time gift
 * runs in 2D on Stripe; ticked, on PayFor's 3D page, with a decline handed back
 * to the checkout to finish on Stripe. A plan never reaches PayFor.
 */

const base = { mainGateway: "STRIPE" as const, payforEnabled: true };

test("3D choice: a one-time gift runs on PayFor only when the box is ticked, in any currency", () => {
  for (const currency of ["TRY", "USD", "EUR"]) {
    assert.equal(resolveGateway({ ...base, currency, donationType: "ONE_TIME", secure3d: true }), "PAYFOR");
    assert.equal(resolveGateway({ ...base, currency, donationType: "ONE_TIME", secure3d: false }), "STRIPE");
  }
});

test("3D choice: the admin switch still wins, and a plan always runs in 2D", () => {
  assert.equal(resolveGateway({ ...base, payforEnabled: false, currency: "TRY", donationType: "ONE_TIME", secure3d: true }), "STRIPE");
  for (const donationType of ["DAILY", "FRIDAY", "MONTHLY"] as const) {
    assert.equal(resolveGateway({ ...base, currency: "TRY", donationType, secure3d: true }), "STRIPE");
  }
});

test("3D choice: without one, the currency rule is unchanged for the other callers", () => {
  assert.equal(resolveGateway({ ...base, currency: "TRY", donationType: "ONE_TIME" }), "PAYFOR");
  assert.equal(resolveGateway({ ...base, currency: "USD", donationType: "ONE_TIME" }), "STRIPE");
});

test("fallback: only an attempt that asked for it returns to the checkout", () => {
  assert.equal(wantsStripeFallback({ payforRequest: { fallbackToStripe: true } }), true);
  assert.equal(wantsStripeFallback({ payforRequest: { fallbackToStripe: false } }), false);
  assert.equal(wantsStripeFallback({ payforRequest: {} }), false);
  assert.equal(wantsStripeFallback(null), false);
  assert.equal(stripeFallbackPath("en", "abc123"), "/en/checkout?fallback=abc123");
});
