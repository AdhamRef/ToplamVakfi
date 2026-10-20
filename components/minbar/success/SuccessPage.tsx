"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { formatMoney } from "@/lib/minbar/money";
import { ORG } from "@/lib/minbar/org";
import type { MinbarDonationSummary } from "@/lib/minbar/donation";
import { CheckoutSteps, type CheckoutStep } from "@/components/minbar/cart/CheckoutSteps";
import type { SuccessDocuments } from "@/lib/certificates/documents";
import Confetti from "./Confetti";
import DocumentsPanel from "./DocumentsPanel";

/**
 * Donation received  `ToplamVakfi-design/Toplum Vakfı Thank You.dc.html`.
 *
 * The completed checkout bar, then one white panel: the green check, the
 * thanks, the receipt rows on the page background (donor, reference, total,
 * the recurring amount when there is one, method), the certificate box with a
 * miniature of the real sheet, and the two ways on.
 *
 * Every figure is the donation's own, in the currency it was charged in. The
 * documents  receipt and thank-you certificate  are the download surface of
 * `CERTIFICATES_DOWNLOADS_HANDOFF §5`, in `DocumentsPanel`: live previews of
 * the real sheets, downloads of the server's PDFs of the records issued at
 * confirmation.
 */

/** `Recurring.*` key naming a plan's cadence in a sentence ("every Friday"). */
const cadenceKey = (frequency: "DAILY" | "FRIDAY" | "MONTHLY") =>
  frequency === "DAILY" ? "cadenceDaily" : frequency === "FRIDAY" ? "cadenceFriday" : "cadenceMonthly";

export default function SuccessPage({
  donation,
  documents,
  accessToken,
}: {
  donation: MinbarDonationSummary;
  documents: SuccessDocuments | null;
  /** The `?t=` this page was opened with; threaded onto the document links for a guest. */
  accessToken: string | null;
}) {
  const locale = useLocale();
  const tv = useTranslations("tvPayment.success");
  const tSteps = useTranslations("tvPayment.checkout");
  const tRecurring = useTranslations("Recurring");

  const { data: session } = useSession();
  const linked = useRef(false);

  /* A donor who gave as a guest and then signed in still owns this donation.
     Claiming it here attaches it  and every other donation under the same
     anonymous record  to their account, so it appears in their history and
     their receipts are theirs. The route refuses to merge anything already
     claimed by a real account, so this is safe to fire once on arrival. */
  useEffect(() => {
    if (!session?.user?.id || linked.current) return;
    linked.current = true;
    fetch("/api/users/link-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId: donation.id }),
    }).catch(() => {
      /* Best effort: the donation is recorded either way, and an admin can
         attach it later. Nothing on this page depends on it. */
    });
  }, [session?.user?.id, donation.id]);

  /* The plan's next (or first) charge, in the visitor's language. */
  const nextChargeText = (() => {
    if (!donation.nextChargeAt) return null;
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date(donation.nextChargeAt));
    } catch {
      return donation.nextChargeAt.slice(0, 10);
    }
  })();

  const methodText =
    donation.paymentMethod === "PAYPAL" ? "PayPal" : donation.paymentMethod === "CARD" ? tv("methodCard") : donation.paymentMethod === "BANK_TRANSFER" ? tv("methodBank") : "";
  const donorName = (documents?.thanks.donorName || donation.donorName || "").trim();

  /* The breakdown appears only when there is something beyond the gift itself;
     a plain gift reads as one total. */
  const hasExtras = donation.teamSupport > 0 || donation.fees > 0;

  /* The basket → payment → confirmation rail, every step passed. */
  const steps: CheckoutStep[] = [
    { n: 1, label: tSteps("stepCart"), current: false, enabled: false, done: true },
    { n: 2, label: tSteps("stepPay"), current: false, enabled: false, done: true },
    { n: 3, label: tSteps("stepConfirm"), current: true, enabled: true, done: true },
  ];

  return (
    <div className="succ-page gf-success">
      <Confetti />

      <CheckoutSteps
        id="succ-steps"
        steps={steps}
        maxWidth={768}
        trailing={
          <>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            {tv("badge")}
          </>
        }
      />

      <div className="gf-success-panel">
        <span className="gf-success-icon succ-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </span>
        <h1>{tv("title")}</h1>
        <p className="gf-success-lead">{tv("lead")}</p>

        {/* ── The receipt box (`.receipt-box`) ──────────────────────────── */}
        <div className="gf-receipt-box">
          <Row label={tv("donor")} value={donorName || "—"} />
          {/* The official number once issued; until the webhook lands, "being
              issued". The internal id is never shown as a receipt number. */}
          <Row label={tv("ref")} value={documents?.receiptNo ?? tv("issuing")} ltr={Boolean(documents?.receiptNo)} />
          {hasExtras ? (
            <>
              <Row label={tv("gift")} value={money(locale, donation.donationAmount, donation.currency)} ltr />
              {donation.teamSupport > 0 ? <Row label={tv("team")} value={money(locale, donation.teamSupport, donation.currency)} ltr /> : null}
              {donation.fees > 0 ? <Row label={tv("fees")} value={money(locale, donation.fees, donation.currency)} ltr /> : null}
            </>
          ) : null}
          <Row label={tv("total")} value={money(locale, donation.amount, donation.currency)} ltr />
          {donation.recurring ? (
            <Row
              label={tv(donation.frequency === "MONTHLY" ? "recurringMonthly" : "recurring")}
              value={
                donation.frequency
                  ? `${money(locale, donation.amount, donation.currency)} · ${tRecurring(cadenceKey(donation.frequency))}`
                  : money(locale, donation.amount, donation.currency)
              }
            />
          ) : null}
          {donation.recurring && donation.frequency && nextChargeText ? <Row label={tv("nextCharge")} value={nextChargeText} /> : null}
          {methodText ? <Row label={tv("method")} value={methodText} /> : null}
        </div>

        {/* ── The certificate box (`.certificate`) ──────────────────────── */}
        <div className="gf-cert-box">
          <span className="gf-cert-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="5" />
              <path d="M8.5 13 7 21l5-3 5 3-1.5-8" />
            </svg>
          </span>
          <h3>{tv("certTitle")}</h3>
          <p className="gf-cert-text">{tv("certText")}</p>
          {/* A miniature of the real certificate sheet, so the page shows what it offers. */}
          <div className="gf-cert-mini" aria-hidden="true">
            <span className="gf-cm-rule" />
            {/* eslint-disable-next-line @next/next/no-img-element -- a 30px mark */}
            <img className="gf-cm-logo" src="/toplum/logo-mark.png" alt="" />
            <b>{documents?.thanks.copy.title || tv("certTitle")}</b>
            <i>{donorName || "—"}</i>
            <span className="gf-cm-seal">{ORG.licenseNumber}</span>
          </div>
          <DocumentsPanel documents={documents} donationId={donation.id} accessToken={accessToken} donorName={donation.donorName ?? ""} />
        </div>

        {/* The design's `.btn-row`: two equal pills. */}
        <div className="gf-success-actions">
          <Link className="gf-btn-pill" href={miaPath("home", locale)}>
            {tv("home")}
          </Link>
          <Link className="gf-btn-pill is-outline" href={miaPath("projects", locale)}>
            {tv("browse")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* The design's `.review-row`: label at the start, value at the end, hairline between. */
function Row({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="gf-review-row">
      <span>{label}</span>
      {ltr ? <b dir="ltr">{value}</b> : <b>{value}</b>}
    </div>
  );
}

/**
 * The amount as charged, in the currency it was charged in  never converted
 * into today's selected currency. The receipt says one number, and this page
 * has to say the same one.
 */
function money(locale: string, amount: number, currency: string) {
  try {
    return formatMoney(amount, currency, locale);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
