"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { formatMoney } from "@/lib/minbar/money";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import type { MinbarDonationSummary } from "@/lib/minbar/donation";
import { Button } from "@/components/minbar/ds";
import { CheckoutSteps, type CheckoutStep } from "@/components/minbar/cart/CheckoutSteps";
import type { SuccessDocuments } from "@/lib/certificates/documents";
import Confetti from "./Confetti";
import DocumentsPanel from "./DocumentsPanel";
import type { VerseBlock } from "@/lib/minbar/quran";

/**
 * Donation received  ported from `Minbar/نجاح التبرع.dc.html`.
 *
 * Four things in order: the confirmation  with the verse on spending in the
 * way of Allah, and confetti, once  then what was given, line by line, with
 * the team support and fees shown separately so the total is the total the
 * card was charged; then the documents to keep; then an invitation to make
 * the gift recurring.
 *
 * The documents  receipt and thank-you certificate  are the download
 * surface of `CERTIFICATES_DOWNLOADS_HANDOFF §5`,
 * in `DocumentsPanel`: live previews of the real sheets, downloads of the
 * server's PDFs of the records issued at confirmation.
 *
 * One departure from the handoff, because this one has a server behind it:
 *
 *  - The handoff's recurring step ends in "confirm", implying a plan starts
 *    there. A recurring plan needs a payment method, which this page has not
 *    collected  so the choice is added to the basket and the donor is taken to
 *    checkout, which is how every other recurring plan on this site begins.
 *    Telling someone a plan is active when nothing was authorised would be a
 *    promise the site cannot keep.
 */

/** The frequencies the upsell offers, in the handoff's order. */
const FREQUENCIES: ReadonlyArray<{ key: Exclude<CartFreqKey, "once">; labelKey: string; ns: "common" }> = [
  { key: "daily", labelKey: "daily", ns: "common" },
  { key: "friday", labelKey: "everyFriday", ns: "common" },
  { key: "monthly", labelKey: "monthly", ns: "common" },
];

/** The quick-pick amounts, in USD, carried from the handoff. */
const SUGGESTED = [50, 100, 200, 500];

/** `Recurring.*` key naming a plan's cadence in a sentence ("every Friday"). */
const cadenceKey = (frequency: "DAILY" | "FRIDAY" | "MONTHLY") =>
  frequency === "DAILY" ? "cadenceDaily" : frequency === "FRIDAY" ? "cadenceFriday" : "cadenceMonthly";

export default function SuccessPage({
  donation,
  verse,
  documents,
  accessToken,
}: {
  donation: MinbarDonationSummary;
  verse: VerseBlock;
  documents: SuccessDocuments | null;
  /** The `?t=` this page was opened with; threaded onto the document links for a guest. */
  accessToken: string | null;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("system");
  const tCommon = useTranslations("common");
  const tCart = useTranslations("cart");
  const tRecurring = useTranslations("Recurring");

  const { data: session } = useSession();
  const linked = useRef(false);

  /* The plan's next (or first) charge, in the visitor's language. */
  const nextChargeText = (() => {
    if (!donation.nextChargeAt) return null;
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date(donation.nextChargeAt));
    } catch {
      return donation.nextChargeAt.slice(0, 10);
    }
  })();

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

  const [copied, setCopied] = useState(false);

  const [freq, setFreq] = useState<Exclude<CartFreqKey, "once"> | null>(null);
  const [amountMode, setAmountMode] = useState<"same" | "other" | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const projectTitle = donation.titles.length ? donation.titles.join("، ") : tCart("typeProject");
  const amountText = money(locale, donation.amount, donation.currency);

  const dateText = (() => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(donation.date));
    } catch {
      return donation.date.slice(0, 10);
    }
  })();
  const methodText = donation.paymentMethod === "PAYPAL" ? t("successPaypal") : donation.paymentMethod === "CARD" ? tCart("card") : "";
  /* First name only: a greeting is warmer with it and the surname adds nothing. */
  const firstName = (donation.donorName ?? "").trim().split(/\s+/)[0] ?? "";

  /* The whole breakdown is shown only when there is something beyond the gift
     itself; a plain gift reads as one line and one total. */
  const hasExtras = donation.teamSupport > 0 || donation.fees > 0;

  const share = async () => {
    const url = window.location.origin + miaPath("projects", locale);
    const text = t("successShareText");
    try {
      if (navigator.share) {
        await navigator.share({ title: tCommon("orgOfficialName"), text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Dismissed share sheet or a clipboard that refused  nothing to report. */
    }
  };

  const chosenAmount =
    amountMode === "same" ? donation.amount : picked ?? (Number(custom) > 0 ? Number(custom) : null);
  const canProceed = Boolean(freq && chosenAmount && chosenAmount > 0);

  const freqLabel = (key: Exclude<CartFreqKey, "once">) =>
    key === "daily" ? tCommon("daily") : key === "friday" ? tCommon("everyFriday") : tCommon("monthly");

  const startPlan = () => {
    if (!freq || !chosenAmount) return;
    /* The plan enters the basket under the same contract as every other item,
       so checkout treats it exactly like a recurring gift started anywhere
       else on the site. */
    addToCart({
      titleKey: donation.titles.length ? undefined : "whereNeedGreatest",
      title: donation.titles[0],
      freqKey: freq,
      amount: chosenAmount,
      currency: donation.currency,
    });
    router.push(miaPath("cart", locale));
  };

  const stepBadge = (active: boolean) =>
    ({
      flex: "0 0 auto",
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: active ? "var(--cta-gradient)" : "#e9eff3",
      color: active ? "#fff" : "var(--muted)",
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 900,
    }) as const;

  /* A picked chip on a light surface: brand-ink fill, white text. */
  const chip = (active: boolean) =>
    ({
      flex: "1 1 0",
      height: 44,
      borderRadius: 999,
      border: `1.5px solid ${active ? "#0077b3" : "#e2eaf0"}`,
      background: active ? "#0077b3" : "#fff",
      color: active ? "#fff" : "var(--ink)",
      fontFamily: "inherit",
      fontWeight: 800,
      fontSize: 13.5,
      cursor: "pointer",
    }) as const;

  /* The basket → payment → confirmation rail, every step passed. */
  const steps: CheckoutStep[] = [
    { n: 1, label: tCart("stepCart"), current: false, enabled: false, done: true },
    { n: 2, label: tCart("stepDetails"), current: false, enabled: false, done: true },
    { n: 3, label: tCart("stepConfirm"), current: true, enabled: true, done: true },
  ];

  /* Toplum Vakfı thank-you (`Thank You.dc.html`): the completed checkout bar,
     then one white card  the green check, the thanks, the receipt rows on the
     page background, the documents in a dashed certificate box, the
     invitation to give again, and the two ways on. */
  return (
    <div className="succ-page gf-success" style={{ padding: "30px 0 70px" }}>
      <Confetti />

      <section style={{ padding: "0 0 18px" }}>
        <CheckoutSteps id="succ-steps" steps={steps} maxWidth={768} />
      </section>

      <section>
        <div className="gf-success-panel" style={{ width: "min(720px, calc(100% - 32px))", margin: "0 auto", display: "grid", justifyItems: "center", gap: 20, padding: 34, background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 16px 34px rgba(2,52,88,.08)", textAlign: "center", boxSizing: "border-box" }}>
          {/* ── The confirmation ──────────────────────────────────────────── */}
          <span className="succ-mark" aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 68, height: 68, borderRadius: "50%", background: "#e6f9ee", color: "#1a9d5c" }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 6" />
            </svg>
          </span>

          <div className="succ-in succ-in-1" style={{ display: "grid", gap: 6, marginTop: -6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-ink)" }}>{t("paymentSuccess")}</span>
            <h1 style={{ margin: 0, fontSize: "clamp(20px,2.6vw,26px)", lineHeight: 1.4, fontWeight: 800, color: "var(--ink)" }}>
              {firstName ? t("successThanksName", { name: firstName }) : t("successThanks")}
            </h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "var(--muted)" }}>{t("successAccepted")}</p>
          </div>

          {/* Al-Baqarah 261  the verse on spending in the way of Allah. Always
              in Arabic and the Qur'anic face; the meaning follows in the
              visitor's language outside Arabic sessions. */}
          <figure className="succ-in succ-in-2" style={{ position: "relative", overflow: "hidden", margin: 0, width: "100%", display: "grid", gap: 10, padding: "18px 22px", background: "linear-gradient(135deg, #f2fbff, #fff)", border: "1px solid #d7ecf8", borderRadius: 14, boxSizing: "border-box" }}>
            <div aria-hidden="true" data-aqsa-pattern="" style={{ position: "absolute", inset: 0, backgroundImage: "url('/toplum/pattern.svg')", backgroundRepeat: "repeat", backgroundSize: "320px 320px", opacity: 0.05, pointerEvents: "none" }} />
            <blockquote dir="rtl" style={{ position: "relative", margin: 0, fontFamily: "var(--font-quran)", fontSize: "clamp(18px,2.1vw,23px)", lineHeight: 1.95, color: "var(--ink)", fontWeight: 700, textWrap: "balance" }}>
              {verse.arabic}
            </blockquote>
            {verse.translation ? (
              <p style={{ position: "relative", margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "var(--muted)", textWrap: "pretty" }}>{verse.translation}</p>
            ) : null}
            <figcaption dir="rtl" style={{ position: "relative", fontSize: 12, fontWeight: 900, color: "var(--brand-ink)", unicodeBidi: "isolate" }}>{verse.label}</figcaption>
          </figure>

          <p className="succ-in succ-in-3" style={{ margin: 0, display: "grid", gap: 2, fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>
            <span style={{ fontWeight: 800 }}>{t("successHadith")}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("successHadithSource")}</span>
          </p>

          <p className="succ-in succ-in-3" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--muted)" }}>
            {t("successLead")}
          </p>

          {/* ── What was given, line by line (the design's receipt box) ──── */}
          <div className="succ-in succ-in-3" style={{ width: "100%", display: "grid", padding: "6px 18px", background: "var(--page-bg)", borderRadius: 12, textAlign: "start", boxSizing: "border-box" }}>
            <b style={{ padding: "12px 0 6px", fontSize: 14.5, fontWeight: 900, color: "var(--ink)" }}>{t("successDetails")}</b>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid" }}>
              {(donation.lines.length ? donation.lines : [{ title: tCart("typeProject"), amount: donation.donationAmount, image: null, shares: null }]).map((line, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #e6eef3" }}>
                  <span aria-hidden="true" style={{ flex: "0 0 auto", width: 42, height: 42, borderRadius: 10, background: line.image ? `url('${line.image}') center/cover` : "#eaf5fc", display: "grid", placeItems: "center", color: "var(--brand-ink)" }}>
                    {line.image ? null : (
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" /></svg>
                    )}
                  </span>
                  <span style={{ minWidth: 0, flex: "1 1 auto", display: "grid", gap: 2 }}>
                    <b style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 800, color: "var(--ink)" }}>{line.title}</b>
                    {line.shares ? <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("successShares", { count: line.shares })}</span> : null}
                  </span>
                  <b dir="ltr" style={{ flex: "0 0 auto", unicodeBidi: "isolate", fontSize: 14, fontWeight: 900, color: "var(--ink)" }}>{money(locale, line.amount, donation.currency)}</b>
                </li>
              ))}
            </ul>

            {hasExtras ? (
              <div style={{ display: "grid" }}>
                <SummaryRow label={t("successGift")} value={money(locale, donation.donationAmount, donation.currency)} ltr />
                {donation.teamSupport > 0 ? <SummaryRow label={t("successTeam")} value={money(locale, donation.teamSupport, donation.currency)} ltr /> : null}
                {donation.fees > 0 ? <SummaryRow label={t("successFees")} value={money(locale, donation.fees, donation.currency)} ltr /> : null}
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "14px 0", borderBottom: "1px solid #e6eef3" }}>
              <b style={{ fontSize: 14.5, fontWeight: 900, color: "var(--ink)" }}>{t("successPaid")}</b>
              <b dir="ltr" style={{ unicodeBidi: "isolate", fontSize: 22, fontWeight: 900, color: "var(--brand-ink)" }}>{amountText}</b>
            </div>

            <div style={{ display: "grid" }}>
              {/* The official number once issued; until the webhook lands, the
                  handoff's "being issued". The internal id is never shown as a
                  receipt number. */}
              <SummaryRow label={t("receiptNo")} value={documents?.receiptNo ?? t("issuing")} ltr={Boolean(documents?.receiptNo)} />
              <SummaryRow label={t("successDate")} value={dateText} />
              {methodText ? <SummaryRow label={tCart("paymentMethod")} value={methodText} /> : null}
            </div>
          </div>

          {/* ── The documents, and sharing the good (the dashed certificate box) ── */}
          <div className="gf-cert-box" style={{ width: "100%", display: "grid", justifyItems: "center", gap: 14, padding: "22px 18px", border: "1.5px dashed rgba(0,162,224,.4)", borderRadius: 14, background: "linear-gradient(135deg, #f2fbff, #fff)", boxSizing: "border-box" }}>
            <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%", background: "#eaf6fd", color: "var(--brand)" }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 13 7 21l5-3 5 3-1.5-8" />
              </svg>
            </span>
            <DocumentsPanel
              documents={documents}
              donationId={donation.id}
              accessToken={accessToken}
              donorName={donation.donorName ?? ""}
              extraButtons={
                <button
                  type="button"
                  onClick={share}
                  className="succ-link"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 46, padding: "0 20px", borderRadius: 999, border: "1.5px solid #e2eaf0", background: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: 13.5, color: copied ? "var(--green)" : "var(--ink)", cursor: "pointer" }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="M8.8 13.4l6.4 3.9M15.2 6.7l-6.4 3.9" /></svg>
                  {copied ? t("successCopied") : t("successShare")}
                </button>
              }
            />
          </div>

          {donation.recurring ? (
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "#f0fbf4", border: "1px solid rgba(26,157,92,.3)", borderRadius: 14, textAlign: "start", boxSizing: "border-box" }}>
              <span aria-hidden="true" style={{ flex: "0 0 auto", width: 44, height: 44, borderRadius: "50%", background: "#e6f9ee", color: "#1a9d5c", display: "grid", placeItems: "center" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div style={{ display: "grid", gap: 2 }}>
                {/* This donation was the plan's first instalment; what the
                    donor needs now is the cadence and the next date. */}
                <b style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>{t("recurringActivated")}</b>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {donation.frequency && nextChargeText
                    ? tRecurring("planActiveLead", { cadence: tRecurring(cadenceKey(donation.frequency)), date: nextChargeText })
                    : t("recurringManageNote")}
                </span>
              </div>
            </div>
          ) : reviewing ? (
            <div style={{ width: "100%", display: "grid", gap: 16, padding: "20px 22px", background: "#fff", border: "1px solid #e3edf4", borderRadius: 14, textAlign: "start", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={stepBadge(true)}>3</span>
                <b style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>{t("reviewBeforeConfirm")}</b>
              </div>
              <div style={{ display: "grid", padding: "4px 16px", background: "var(--page-bg)", borderRadius: 12 }}>
                <SummaryRow label={t("frequencyLabel")} value={freq ? freqLabel(freq) : ""} />
                <SummaryRow label={tCommon("amount")} value={money(locale, chosenAmount ?? 0, donation.currency)} ltr />
                <SummaryRow label={tCart("typeProject")} value={projectTitle} />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={startPlan} className="succ-confirm" style={{ flex: "1 1 160px", height: 50, border: 0, borderRadius: 999, background: "var(--cta-gradient)", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(0,162,224,.3)" }}>
                  {t("confirmRecurring")}
                </button>
                <button type="button" onClick={() => setReviewing(false)} style={{ flex: "0 0 auto", height: 50, padding: "0 22px", border: "1.5px solid #e2eaf0", borderRadius: 999, background: "none", color: "var(--muted)", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  {t("goBack")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ width: "100%", display: "grid", gap: 18, padding: "20px 22px", background: "#fff", border: "1px solid #e3edf4", borderRadius: 14, textAlign: "start", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span aria-hidden="true" style={{ flex: "0 0 auto", width: 42, height: 42, borderRadius: "50%", background: "#eaf5fc", color: "var(--brand-ink)", display: "grid", placeItems: "center" }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-3-6.7" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </span>
                <div style={{ display: "grid", gap: 1 }}>
                  <b style={{ fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>{t("makeImpactLast")}</b>
                  <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{t("makeImpactLastNote")}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden="true" style={stepBadge(true)}>1</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{t("chooseFrequency")}</span>
                  {freq ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFreq(null);
                        setAmountMode(null);
                        setPicked(null);
                      }}
                      style={{ marginInlineStart: "auto", minHeight: 44, border: 0, background: "none", color: "var(--brand-ink)", fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {t("changeChoice")}
                    </button>
                  ) : null}
                </div>

                {freq ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", padding: "8px 16px", borderRadius: 999, background: "#0077b3", border: "1px solid #0077b3", color: "#fff", fontWeight: 800, fontSize: 13.5 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {freqLabel(freq)}
                  </span>
                ) : (
                  <div className="succ-freq" style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
                    {FREQUENCIES.map((option) => (
                      <button key={option.key} type="button" onClick={() => setFreq(option.key)} style={chip(false)}>
                        {freqLabel(option.key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {freq ? (
                <>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden="true" style={stepBadge(Boolean(amountMode))}>2</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{t("chooseAmountStep")}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => { setAmountMode("same"); setPicked(null); setCustom(""); }} style={chip(amountMode === "same")}>
                        {t("sameAmount")}
                      </button>
                      <button type="button" onClick={() => setAmountMode("other")} style={chip(amountMode === "other")}>
                        {t("otherAmount")}
                      </button>
                    </div>

                    {amountMode === "other" ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {SUGGESTED.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => { setPicked(value); setCustom(""); }}
                            style={{ ...chip(picked === value), flex: "0 0 auto", padding: "0 16px" }}
                          >
                            {money(locale, value, donation.currency)}
                          </button>
                        ))}
                        <input
                          value={custom}
                          onChange={(event) => { setCustom(event.target.value); setPicked(null); }}
                          inputMode="decimal"
                          placeholder={tCommon("freeAmount")}
                          style={{ height: 44, padding: "0 14px", borderRadius: 999, border: "1.5px dashed rgba(0,162,224,.55)", background: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "var(--ink)", width: 120 }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewing(true)}
                    disabled={!canProceed}
                    className="succ-confirm"
                    style={{ height: 50, border: 0, borderRadius: 999, background: canProceed ? "var(--cta-gradient)" : "#e9eff3", color: canProceed ? "#fff" : "var(--muted)", fontWeight: 800, fontSize: 14.5, cursor: canProceed ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: canProceed ? "0 8px 20px rgba(0,162,224,.3)" : "none" }}
                  >
                    {t("proceedToReview")}
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* The design's `.btn-row`: two equal pills. */}
          <div className="gf-success-actions" style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            <Button variant="primary" href={miaPath("projects", locale)} style={{ flex: "1 1 auto", minWidth: 130, minHeight: 50, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,162,224,.3)" }}>
              {t("browseMoreProjects")}
            </Button>
            <Button variant="light" href={miaPath("home", locale)} style={{ flex: "1 1 auto", minWidth: 130, minHeight: 50, whiteSpace: "nowrap", background: "transparent", color: "var(--muted)" }}>
              {t("backHomeCta")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* The design's `.review-row`: label at the start, value at the end, hairline between. */
function SummaryRow({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <span className="gf-review-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #e6eef3", fontSize: 13.5 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      {ltr ? (
        <b dir="ltr" style={{ unicodeBidi: "isolate", color: "var(--ink)" }}>{value}</b>
      ) : (
        <b style={{ color: "var(--ink)" }}>{value}</b>
      )}
    </span>
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
