"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { CartFreqKey } from "@/lib/minbar/cart";
import { offeredFrequencies } from "@/lib/minbar/frequencies";

/**
 * "How often should this gift reach people?" asked between a card's amount and
 * the basket. A drawer from the inline end on wide screens, a bottom sheet on
 * phones (styles: `styles/minbar/pages/give-sheet.css`, all under `.tg-`).
 *
 * Each rhythm is a tile carrying how many times a year the same amount arrives
 * (×1, ×12, ×52, ×365), so the choice reads as reach, not as a commitment. The
 * campaign's recommended rhythm (`MinbarProject.recommendedFrequency`) carries
 * the badge, but nothing is preselected: the two actions stay disabled until
 * the donor picks.
 *
 * Rendered into `.mia-scope` rather than `body`: the design tokens live on that
 * element, and the cards it opens from sit in rails whose transforms would trap
 * a `position: fixed` child.
 */

export type GiveIntent = "donate" | "cart";

/* Only the frequencies enabled in `config/donation-frequencies.ts`. */
const RHYTHMS = offeredFrequencies<{ id: CartFreqKey; times: number; key: string }>([
  { id: "once", times: 1, key: "Once" },
  { id: "monthly", times: 12, key: "Monthly" },
  { id: "friday", times: 52, key: "Weekly" },
  { id: "daily", times: 365, key: "Daily" },
]);

export default function GiveFrequencyDialog({
  open,
  projectTitle,
  amountLabel,
  recommended,
  onConfirm,
  onClose,
}: {
  open: boolean;
  projectTitle: string;
  amountLabel: string;
  /** The campaign's recommended rhythm: badged, not preselected. Null: none. */
  recommended: CartFreqKey | null;
  /** `origin` is the button pressed, for the fly-to-basket animation. */
  onConfirm: (freq: CartFreqKey, intent: GiveIntent, origin: HTMLElement) => void;
  onClose: () => void;
}) {
  const t = useTranslations("CardGive");
  const tCommon = useTranslations("common");
  const titleId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [selected, setSelected] = useState<CartFreqKey | null>(null);

  useEffect(() => {
    setHost(document.querySelector(".mia-scope") ?? document.body);
  }, []);

  /* Each opening starts with nothing chosen. */
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  /* Escape closes and the page behind stays put, as in the other overlays. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    window.requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !host) return null;

  const chosen = RHYTHMS.find((r) => r.id === selected) ?? null;
  const confirm = (intent: GiveIntent, origin: HTMLElement) => {
    if (selected) onConfirm(selected, intent, origin);
  };

  return createPortal(
    <div className="tg-scrim" onClick={onClose}>
      <aside
        className="tg-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="tg-grip" aria-hidden="true" />

        <header className="tg-head">
          <div className="tg-head-row">
            <span className="tg-kicker">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="9" r="2.4" />
                <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6-3.4" />
              </svg>
              {t("sheetKicker")}
            </span>
            <button type="button" className="tg-close" onClick={onClose} aria-label={tCommon("close")}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <h2 id={titleId} className="tg-title">
            {t("sheetTitle")}
          </h2>
          <p className="tg-lead">{t("sheetLead")}</p>

          <div className="tg-receipt">
            <span className="tg-receipt-label">{t("sheetYourGift")}</span>
            <b className="tg-receipt-amount" dir="ltr">
              {amountLabel}
            </b>
            <span className="tg-receipt-project">{projectTitle}</span>
          </div>
        </header>

        <div className="tg-body">
          <p className="tg-step">
            <span aria-hidden="true">1</span>
            {t("sheetStep")}
          </p>
          <div ref={gridRef} role="radiogroup" aria-labelledby={titleId} className="tg-grid" data-count={RHYTHMS.length}>
            {RHYTHMS.map((rhythm) => {
              const isRecommended = rhythm.id === recommended;
              const isSelected = rhythm.id === selected;
              return (
                <button
                  key={rhythm.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`tg-tile${isSelected ? " is-on" : ""}${isRecommended ? " is-pick" : ""}`}
                  onClick={() => setSelected(rhythm.id)}
                >
                  {isRecommended ? <span className="tg-pick">{t("sheetPick")}</span> : null}
                  <span className="tg-times" dir="ltr">
                    {t(`sheet${rhythm.key}`)}
                  </span>
                  <small className="tg-desc">{t(`sheet${rhythm.key}Desc`)}</small>
                  <span className="tg-tick" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          {/* The reach line keeps its space before a choice so the actions do not jump. */}
          <p className="tg-reach" aria-live="polite" data-on={chosen ? "1" : "0"}>
            {chosen ? (
              t.rich("sheetReach", {
                count: chosen.times,
                amount: () => <b dir="ltr">{amountLabel}</b>,
              })
            ) : (
              t("sheetChoose")
            )}
          </p>
        </div>

        <footer className="tg-foot">
          <div className="tg-actions">
            <button type="button" className="tg-go" disabled={!selected} onClick={(e) => confirm("donate", e.currentTarget)}>
              {tCommon("donateNow")}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tg-go-arrow">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button type="button" className="tg-basket" disabled={!selected} onClick={(e) => confirm("cart", e.currentTarget)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4 8 2 11h12l2-11H4Z" />
                <path d="m9 8 3-4 3 4" />
              </svg>
              {tCommon("addToCart")}
            </button>
          </div>
          <ul className="tg-trust">
            <li>{t("sheetTrustLicensed")}</li>
            <li>{t("sheetTrustCancel")}</li>
          </ul>
        </footer>
      </aside>
    </div>,
    host
  );
}
