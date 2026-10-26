import { runAfterResponse } from "@/lib/events/after-response";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "@/lib/events/dispatch";
import { sendDonationFailedConversions } from "@/lib/tracking/donation-conversion-server";
import { mergePayForProviderRaw, payForErrorMessage, redactPayForResponse, stripeFallbackPath, wantsStripeFallback } from "@/lib/payfor";

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const donationId = searchParams.get("donationId") || "";
  const locale = (searchParams.get("locale") || "en").toLowerCase();

  if (!donationId) {
    return NextResponse.redirect(new URL(`/${locale}/donation-failed`, origin));
  }

  const form = await req.formData();
  const raw = Object.fromEntries(form.entries());

  console.error("[PayFor FAIL] Bank response:", JSON.stringify(redactPayForResponse(raw), null, 2));

  const orderId = String(raw.OrderId || raw.orderId || "");
  const procReturnCode = String(raw.ProcReturnCode || raw.procReturnCode || "");
  const txnResult = String(raw.TxnResult || raw.txnResult || "");
  const errorMessage = payForErrorMessage(raw) || "Payment failed";
  let fallbackToStripe = false;

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    fallbackToStripe = Boolean(donation && donation.paidAt === null && wantsStripeFallback(donation.providerRaw));
    if (donation && donation.paidAt === null) {
      await prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "FAILED",
          provider: "PAYFOR",
          providerOrderId: donation.providerOrderId ?? orderId ?? null,
          providerProcReturnCode: procReturnCode || null,
          providerTxnResult: txnResult || null,
          providerErrorMessage: errorMessage || null,
          providerRaw: mergePayForProviderRaw(donation.providerRaw, raw) as Prisma.InputJsonValue,
        },
      });
      /* No "your donation failed" message when the donor is being taken
         straight to the Stripe step to finish the same gift. */
      if (!fallbackToStripe) runAfterResponse(() => dispatchEvent("DONATION_FAILED", { donationId }));
      // Seed Meta with the failed attempt so lookalike audiences can include
      // donors-who-tried. Browser pixel fires the matching DonateFailed hit
      // with event_id `${donationId}_failed`  same id here for dedup.
      void sendDonationFailedConversions(donationId);
    }
  } catch (e) {
    console.error("[PayFor FAIL] Callback error:", e);
  }

  /* 3D was the donor's choice, not the only way to pay: back to the checkout,
     which restores the basket kept under this order and finishes it in 2D. */
  if (fallbackToStripe) {
    return NextResponse.redirect(
      new URL(stripeFallbackPath(locale, donationId), origin),
      303
    );
  }

  return NextResponse.redirect(
    new URL(
      `/${locale}/donation-failed?donationId=${encodeURIComponent(donationId)}`,
      origin
    )
  );
}
