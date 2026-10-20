"use client";

import { decimalAmount, parseAmount } from "@/lib/minbar/numeric-input";
import { useMemo, useState, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/minbar/ds";
import { miaPath } from "@/lib/minbar/routes";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import TravelBanner from "@/components/minbar/banners/TravelBanner";

/**
 * Zakat calculator  ported from `Minbar/حاسبة الزكاة.dc.html`.
 *
 * The calculation, exactly as the handoff specifies:
 *   assets = cash + metals + investments + trade goods
 *   net    = max(0, assets − liabilities)
 *   nisāb  = 85g gold, or 595g silver, at the rate the donor enters
 *   due    = net ≥ nisāb ? net × 2.5% : 0
 *
 * Karat is weighted by purity (21/24, 18/24) rather than counted at the 24k
 * rate, which would overstate the holding.
 *
 * `[RELIGIOUS-REVIEW]`: the fiqh copy  what is and is not zakatable, and the
 * FAQ  is translated content under religious review, not text this component
 * composes. Nothing here is a fatwa, and the page says so.
 *
 * `[BACKEND-INTEGRATION]`: the gold and silver rates are entered by the donor
 * today. `DEVELOPER_HANDOFF` lists a daily gold-price API as a required
 * integration; `rates` is the seam for it, and a supplied rate pre-fills the
 * field rather than replacing the donor's ability to override it.
 */

type NisabMode = "gold" | "silver";

/** Nisāb thresholds in grams. */
const GOLD_GRAMS = 85;
const SILVER_GRAMS = 595;
/** The zakat rate on wealth. */
const ZAKAT_RATE = 0.025;

/** Field ids, grouped as the design groups them. */
const FIELDS = {
  cash: ["cash", "bank", "savings", "loansOut"],
  gem: ["gold24", "gold21", "gold18", "silver"],
  invest: ["shares", "funds", "pension", "rentIncome"],
  trade: ["stock", "receivables", "cashBiz"],
  liabilities: ["debts", "bills", "salaries"],
} as const;


const GROUP_ICONS: Record<string, ReactElement> = {
  wallet: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 10h18M16 14h2" />
      <path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h7A1.5 1.5 0 0 1 17 5.5V7" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l3 5-9 13L3 8Z" />
      <path d="M3 8h18M9 3l3 5-3 13M15 3l-3 5 3 13" />
    </>
  ),
  "trending-up": (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M15 6h5v5" />
    </>
  ),
  store: (
    <>
      <path d="M4 9V6l2-3h12l2 3v3" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10h14V9" />
    </>
  ),
  receipt: (
    <>
      <path d="M7 3h10l2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5l2-2Z" />
      <path d="M9 9h6M9 13h6" />
    </>
  ),
};

/** Copy blocks that are lists of title + text pairs in the `zakat` bundle. */
const ZAKATABLE = ["cash", "metal", "trade", "shares", "loans", "bizProp"] as const;
const EXEMPT = ["home", "tools", "furniture", "badDebt", "rentedProp"] as const;
const FAQS = ["hawl", "metal", "salary", "jewelry", "early", "channels"] as const;
const TARGETS = ["mostNeeded", "zakatPalestine", "reliefQuds", "hotMealsGaza", "parcelsGaza", "qudsEducation"] as const;

export interface ZakatCalculatorProps {
  /** Optional daily rates per gram, in USD. */
  rates?: { gold?: number; silver?: number };
  /** Zakat guide PDF, when one is published. */
  guidePdfHref?: string;
  whatsappNumber?: string;
}

export default function ZakatCalculator({ rates, guidePdfHref, whatsappNumber = "905398436050" }: ZakatCalculatorProps) {
  const locale = useLocale();
  const t = useTranslations("zakat");
  const tCommon = useTranslations("common");
  const { format } = useMinbarMoney();

  const [mode, setMode] = useState<NisabMode>("gold");
  const [goldRate, setGoldRate] = useState(rates?.gold ? String(rates.gold) : "");
  const [silverRate, setSilverRate] = useState(rates?.silver ? String(rates.silver) : "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<string>(TARGETS[0]);
  const [openFaq, setOpenFaq] = useState(0);

  /** Tolerant parse: an empty or malformed field contributes zero, not NaN. */
  const num = (x: string | undefined) => {
    const v = parseAmount(x);
    return Number.isFinite(v) ? v : 0;
  };
  const n = (key: string) => num(values[key]);

  const totals = useMemo(() => {
    const gold = num(goldRate);
    const silver = num(silverRate);

    const cash = n("cash") + n("bank") + n("savings") + n("loansOut");
    // Karat weighted by purity  21k is 21/24 fine, 18k is 18/24.
    const metals = (n("gold24") + n("gold21") * (21 / 24) + n("gold18") * (18 / 24)) * gold + n("silver") * silver;
    const invest = n("shares") + n("funds") + n("pension") + n("rentIncome");
    const trade = n("stock") + n("receivables") + n("cashBiz");
    const liabilities = n("debts") + n("bills") + n("salaries");

    const assets = cash + metals + invest + trade;
    const net = Math.max(0, assets - liabilities);
    const nisab = mode === "gold" ? gold * GOLD_GRAMS : silver * SILVER_GRAMS;
    // Zero nisāb means no rate has been entered  not "everything is due".
    const due = nisab > 0 && net >= nisab ? net * ZAKAT_RATE : 0;

    return { cash, metals, invest, trade, liabilities, net, nisab, due };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, goldRate, silverRate, mode]);

  const aboveNisab = totals.nisab > 0 && totals.net >= totals.nisab;

  const setField = (key: string, raw: string) =>
    setValues((v) => ({ ...v, [key]: decimalAmount(raw, 12) }));

  const groups: Array<{ id: string; icon: keyof typeof GROUP_ICONS; titleKey: string; hintKey: string; subtract?: boolean; total: number; fields: readonly string[]; unitKey?: string }> = [
    { id: "wallet", icon: "wallet", titleKey: "grpWallet", hintKey: "grpWalletSub", total: totals.cash, fields: FIELDS.cash },
    { id: "gem", icon: "gem", titleKey: "grpGem", hintKey: "grpGemSub", total: totals.metals, fields: FIELDS.gem, unitKey: "unitGram" },
    { id: "invest", icon: "trending-up", titleKey: "grpInvest", hintKey: "grpInvestSub", total: totals.invest, fields: FIELDS.invest },
    { id: "trade", icon: "store", titleKey: "grpTrade", hintKey: "grpTradeSub", total: totals.trade, fields: FIELDS.trade },
    { id: "liab", icon: "receipt", titleKey: "grpLiab", hintKey: "grpLiabSub", subtract: true, total: totals.liabilities, fields: FIELDS.liabilities },
  ];

  const summary = [
    { label: t("grpWallet"), value: format(totals.cash) },
    { label: t("grpGem"), value: format(totals.metals) },
    { label: t("grpInvest"), value: format(totals.invest) },
    { label: t("grpTrade"), value: format(totals.trade) },
    { label: t("liabDeducted"), value: `− ${format(totals.liabilities)}`, subtract: true },
  ];

  return (
    <div style={{ position: "relative" }}>
      <div className="gv-page">
        {/* ── Banner (in-banner) ───────────────────────────────────────────── */}
        <section className="gv-banner">
          <div className="gv-wrap">
            <h1>{t("calcTitle")}</h1>
            <p>{t("calcLead")}</p>
          </div>
        </section>

        {/* ── Calculator: the inputs beside the sticky result ──────────────── */}
        <section id="calc" className="gv-plain">
          <div className="gv-wrap zc-wrap">
            <div className="zc-forms">
              {/* Nisāb standard and today's gram price. */}
              <div id="nisab" className="gv-card zc-form">
                <div className="zc-nisab">
                  <div>
                    <span className="gv-label">{t("nisabCriteriaLabel")}</span>
                    <span className="zc-nisab-modes">
                      {(["gold", "silver"] as NisabMode[]).map((m) => (
                        <button key={m} type="button" data-pick={mode === m ? "1" : ""} aria-pressed={mode === m} onClick={() => setMode(m)} className="gv-chip">
                          {m === "gold" ? t("nisabModeGold") : t("nisabModeSilver")}
                        </button>
                      ))}
                    </span>
                  </div>

                  <label style={{ display: "block", minWidth: 0 }}>
                    <span className="gv-label">{mode === "gold" ? t("rateLabelGold") : t("rateLabelSilver")}</span>
                    <input
                      value={mode === "gold" ? goldRate : silverRate}
                      onChange={(e) => {
                        const val = decimalAmount(e.target.value, 12);
                        if (mode === "gold") setGoldRate(val);
                        else setSilverRate(val);
                      }}
                      inputMode="decimal"
                      className="gv-input"
                      dir="ltr"
                      style={{ fontSize: 15, fontWeight: 800 }}
                    />
                  </label>

                  <span className="zc-nisab-value">
                    <span className="gv-label" style={{ margin: 0 }}>
                      {t("nisabValue")}
                    </span>
                    <b dir="ltr">{format(totals.nisab)}</b>
                  </span>
                </div>
                <p className="zc-nisab-note">{t("nisabNote")}</p>
              </div>

              {groups.map((group) => (
                <div key={group.id} className="gv-card zc-form" data-tone={group.subtract ? "subtract" : undefined}>
                  <div className="zc-form-head">
                    <span className="gv-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {GROUP_ICONS[group.icon]}
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h2>{t(group.titleKey)}</h2>
                      <p>{t(group.hintKey)}</p>
                    </div>
                    <b dir="ltr">{format(group.total)}</b>
                  </div>

                  <div className="zc-fields">
                    {group.fields.map((field) => (
                      <label key={field} className="zc-field">
                        <span className="gv-label">{t(`fld_${field}_label`)}</span>
                        <span className="gv-affix" dir="ltr" data-tone={group.subtract ? "subtract" : undefined}>
                          <span>{group.unitKey ? t(group.unitKey) : "$"}</span>
                          <input
                            value={values[field] ?? ""}
                            onChange={(e) => setField(field, e.target.value)}
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={t(`fld_${field}_label`)}
                          />
                        </span>
                        <span className="gv-hint">{t(`fld_${field}_note`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="zc-disclaimer">
                {/* Not a fatwa  this is stated on the page, not just in a comment. */}
                <span>{t("calcDisclaimer")}</span>
                <button type="button" onClick={() => setValues({})} className="gv-ghost">
                  {t("resetFieldsBtn")}
                </button>
              </div>
            </div>

            <div id="result" className="gv-card zc-result" aria-live="polite">
              <span className="zc-rl">{t("zakatDueRate")}</span>
              <b dir="ltr" className="zc-rv">
                {format(totals.due)}
              </b>
              <div className="zc-verdict" data-above={aboveNisab ? "1" : "0"}>
                {totals.nisab <= 0 ? t("verdictNoRate") : aboveNisab ? t("verdictAboveNisab") : t("verdictBelowNisab")}
              </div>

              <div className="zc-rows">
                <b style={{ fontSize: 15, fontWeight: 900, color: "#062442" }}>{t("calcSummary")}</b>
                {summary.map((row) => (
                  <span key={row.label} data-tone={row.subtract ? "subtract" : undefined}>
                    <span>{row.label}</span>
                    <b dir="ltr">{row.value}</b>
                  </span>
                ))}
              </div>

              <span className="zc-net">
                <span className="zc-rl">{t("netZakatable")}</span>
                <b dir="ltr">{format(totals.net)}</b>
              </span>

              <label className="zc-target">
                <span className="gv-label">{t("directZakatTo")}</span>
                <select value={target} onChange={(e) => setTarget(e.target.value)} className="gv-input">
                  {TARGETS.map((id) => (
                    <option key={id} value={id}>
                      {t(`target_${id}`)}
                    </option>
                  ))}
                </select>
              </label>

              <Button variant="primary" href={miaPath("projects", locale)} full style={{ minHeight: 50, borderRadius: 999, fontWeight: 800 }}>
                {tCommon("donateNow")}
              </Button>
              <p className="zc-note">{t("spendNote")}</p>
            </div>
          </div>
        </section>

        {/* ── What is and is not zakatable (zk-explain) ────────────────────── */}
        <section id="guide" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2">{t("whatIsDue")}</h2>
            <p className="gv-intro">{t("dueNote")}</p>
            <div className="zc-explain">
              <div className="gv-card zc-list">
                <h3>{t("zakatableFunds")}</h3>
                {ZAKATABLE.map((id) => (
                  <p key={id}>
                    <span>
                      <b style={{ color: "#062442" }}>{t(`zak_${id}_title`)}</b> {t(`zak_${id}_text`)}
                    </span>
                  </p>
                ))}
              </div>
              <div className="gv-card zc-list" data-tone="subtract">
                <h3>{t("notZakatableFunds")}</h3>
                {EXEMPT.map((id) => (
                  <p key={id}>
                    <span>
                      <b style={{ color: "#062442" }}>{t(`ex_${id}_title`)}</b> {t(`ex_${id}_text`)}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ beside the review card ───────────────────────────────────── */}
        <section id="faq" className="gv-sec">
          <div className="gv-wrap zc-faq-grid">
            <div>
              <h2 className="gv-h2" style={{ marginBottom: 18 }}>
                {t("calcFaq")}
              </h2>
              <div className="gv-faq">
                {FAQS.map((id, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={id} className="gv-faq-item">
                      <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open} className="gv-faq-q">
                        {t(`faq_${id}_q`)}
                        <span aria-hidden="true" className="gv-faq-sign">
                          {open ? "−" : "+"}
                        </span>
                      </button>
                      {/* Height, not display  the answer opens smoothly instead of
                          snapping into place. */}
                      <div
                        style={{
                          maxHeight: open ? 500 : 0,
                          opacity: open ? 1 : 0,
                          padding: open ? "0 18px 16px" : "0 18px",
                          overflow: "hidden",
                          color: "var(--muted)",
                          fontSize: 13.5,
                          lineHeight: 1.9,
                          transition: "all .3s cubic-bezier(.22,.61,.36,1)",
                        }}
                      >
                        {t(`faq_${id}_a`)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="gv-card zc-help">
              <span className="gv-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />
                </svg>
              </span>
              <h3 className="gv-h3" style={{ fontSize: 17 }}>
                {t("needReview")}
              </h3>
              <p className="gv-text">{t("teamHelp")}</p>
              <Button variant="support" href={`https://wa.me/${whatsappNumber}`} full style={{ minHeight: 46, borderRadius: 999, fontWeight: 800 }}>
                {tCommon("contactWhatsApp")}
              </Button>
              <Button variant="light" href={miaPath("zakat", locale)} full style={{ minHeight: 46, borderRadius: 999, fontWeight: 800 }}>
                {t("zakatPage")}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Share / guide ────────────────────────────────────────────────── */}
        <section className="gv-sec">
          <div className="gv-wrap">
            <div className="gv-card zc-share">
              <span>
                {t("shareCalculator")}
                <a href={`https://wa.me/?text=${encodeURIComponent(t("calcTitle"))}`} target="_blank" rel="noopener noreferrer" className="zc-wa" aria-label={tCommon("contactWhatsApp")}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M20.5 3.5A11 11 0 0 0 3.6 17L2 22l5.2-1.6A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.2l-.3-.2-3 .9.9-2.9-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-1.5-.7-2.4-1.3-3.4-2.9-.3-.4.3-.4.7-1.3.1-.2 0-.4 0-.5L9.6 7.2c-.1-.3-.3-.2-.5-.2h-.4c-.2 0-.5.1-.7.3-.2.3-.9 1-.9 2.3 0 1.3 1 2.7 1.1 2.9.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
                  </svg>
                </a>
              </span>
              {guidePdfHref ? (
                <a href={guidePdfHref} target="_blank" rel="noopener noreferrer" className="gv-ghost" style={{ minHeight: 44, fontSize: 13.5 }}>
                  {t("guidePdf")}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <TravelBanner />
    </div>
  );
}
