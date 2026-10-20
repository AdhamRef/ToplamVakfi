"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/minbar/ds";
import { miaPath } from "@/lib/minbar/routes";

/**
 * The recurring-giving and donor-account sections of the homepage.
 * Ported from `Minbar/الصفحة الرئيسية.dc.html`, laid out in the Toplum Vakfı
 * design's language (`ToplamVakfi-design/Toplum Vakfı Homepage.dc.html`):
 * recurring giving as the closing call-to-action band (`.cf-card`), and the
 * account as a white panel of numbered cards (`.wt`).
 */

/* ── Recurring giving ───────────────────────────────────────────────────────── */
export function RecurringSection() {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const tCommon = useTranslations("common");

  return (
    <section id="monthly" className="tv-sec" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div className="tv-wrap">
        <div id="monthly-grid" className="tv-cta-card">
          <span aria-hidden="true" className="tv-cta-ring" />
          <div className="tv-cta-body">
            <h2 className="tv-h2">{t("recurringTitle")}</h2>
            <p className="tv-dark-lede">{t("recurringLead")}</p>
          </div>
          <Link href={miaPath("recurring", locale)} className="mia-recurring-cta tv-cta-donate">
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
              </svg>
            </i>
            {tCommon("startRecurring")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Donor account ──────────────────────────────────────────────────────────
 * Mirrors the account page's four sections: donation log, impact wallet,
 * document library, giving plans. */
const ACCOUNT_FEATURES = [
  { titleKey: "donationLog", textKey: "donationLogText", path: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6" },
  { titleKey: "impactWallet", textKey: "impactWalletText", path: "M12 21v-8m0 0C12 9 9 6 5 6c0 4 3 7 7 7Zm0 0c0-4 3-7 7-7 0 4-3 7-7 7Z" },
  { titleKey: "docsLibrary", textKey: "docsLibraryText", path: "M4 6h5l2 2h9v10a2 2 0 0 1-2 2H4V6Z" },
  { titleKey: "givingPlans", textKey: "givingPlansText", path: "M8 3v3M16 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13H4V7a1 1 0 0 1 1-1ZM12 12v3l2 1" },
] as const;

export function AccountSection({ signedIn }: { signedIn: boolean }) {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const accountHref = miaPath("account", locale);
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(accountHref)}`;

  return (
    <section id="account" className="tv-sec" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div className="tv-wrap">
        <div id="account-grid" className="tv-panel">
          <div className="tv-sec-head">
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <span className="tv-eyebrow">{t("accountEyebrow")}</span>
              <h2 className="tv-h2">{t("accountTitle")}</h2>
              <p className="tv-lead">{t("accountLead")}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* A signed-in donor is sent straight to their account; the pair of
                  CTAs is only meaningful for a visitor without a session. */}
              {signedIn ? (
                <Button variant="primary" href={accountHref} className="tv-pill-cta" style={{ whiteSpace: "nowrap" }}>
                  {t("accountTitle")}
                </Button>
              ) : (
                <>
                  <Button variant="primary" href={signInHref} className="tv-pill-cta" style={{ whiteSpace: "nowrap" }}>
                    {t("createAccount")}
                  </Button>
                  <Button variant="light" href={signInHref} style={{ whiteSpace: "nowrap" }}>
                    {t("signIn")}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div id="account-features" className="tv-feature-grid">
            {ACCOUNT_FEATURES.map((feature) => (
              <Link key={feature.titleKey} href={signedIn ? accountHref : signInHref} className="mia-lift tv-feature">
                <span className="tv-feature-head">
                  <i aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d={feature.path} />
                    </svg>
                  </i>
                  <b>{t(feature.titleKey)}</b>
                </span>
                <span className="tv-feature-text">{t(feature.textKey)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
