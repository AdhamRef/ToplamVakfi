"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { decimalAmount, parseAmount } from "@/lib/minbar/numeric-input";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { formatMoney } from "@/lib/minbar/money";
import { zakatCartTarget } from "@/lib/minbar/programs-zakat";
import { TV_FALLBACK_IMAGE } from "@/lib/minbar/programs-match";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import type { CategoryPageContent } from "@/lib/minbar/category-page";
import GivingBanner from "@/components/minbar/giving/GivingBanner";

/**
 * Pay zakat — laid out on the template of
 * `ToplamVakfi-design/Toplum Vakfı Zakat Calculator.dc.html` (the design has no
 * page of its own for it): the inner banner, a quick estimator beside the
 * giving card, the eight categories of recipients, the zakat category's
 * campaigns, "about zakat" with the not-a-fatwa note, and the FAQ.
 *
 * Zakat is kept separate from every other kind of giving: items added here
 * carry `typeKey: "zakat"`, which keeps it separated in the cart, on the
 * receipt and in how it is disbursed. With a zakat category bound to this page
 * its amounts drive the chips and the gift goes where its donation box points
 * (`lib/minbar/programs-zakat.ts`).
 *
 * `[RELIGIOUS-REVIEW]`: the eight masārif and the FAQ are translated content
 * under religious review. The verse (At-Tawbah 60) is Arabic in every edition.
 */

const MASARIF: ReadonlyArray<{ id: string; icon: ReactElement }> = [
  { id: "fuqara", icon: <path d="M12 20s-6.5-4-8.5-7.5C2 10 3 7 6 7c1.6 0 2.9.8 3.5 2 .6-1.2 1.9-2 3.5-2 3 0 4.5 3 3.5 6.5C15.7 16.5 12 20 12 20Z" /> },
  {
    id: "masakin",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    id: "amilin",
    icon: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),
  },
  {
    id: "muallafa",
    icon: (
      <>
        <path d="M12 20s-6.5-4-8.5-7.5C2 10 3 7 6 7c1.6 0 2.9.8 3.5 2 .6-1.2 1.9-2 3.5-2 3 0 4.5 3 3.5 6.5C15.7 16.5 12 20 12 20Z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    id: "riqab",
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
  },
  { id: "gharimin", icon: <path d="M12 3v18M5 7l7-2 7 2M5 7l-2.5 6.5a3 3 0 0 0 5 0L5 7M19 7l-2.5 6.5a3 3 0 0 0 5 0L19 7" /> },
  {
    id: "sabilillah",
    icon: (
      <>
        <path d="M4 22V4" />
        <path d="M4 4h14l-2.5 4L18 12H4" />
      </>
    ),
  },
  {
    id: "ibnsabil",
    icon: (
      <>
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="5" r="2" />
        <path d="M18 7v6a4 4 0 0 1-4 4H8" />
      </>
    ),
  },
];

/** Quick-estimator fields: three asset groups minus the debts due. */
const QUICK_FIELDS = [
  { id: "cash", labelKey: "zp.fCash", tone: undefined },
  { id: "gold", labelKey: "zp.fGold", tone: undefined },
  { id: "trade", labelKey: "zp.fTrade", tone: undefined },
  { id: "debts", labelKey: "zp.fDebts", tone: "due" },
] as const;

/** The foundation's reviewed zakat answers (also emitted as FAQPage JSON-LD by the route). */
const FAQS = ["hawl", "metal", "salary", "jewelry", "early", "channels"] as const;

const QUICK_AMOUNTS = [1000, 2000, 3000, 5000];
const ZAKAT_RATE = 0.025;

export interface ZakatPageProps {
  /**
   * The zakat category, when the dashboard has bound one to this page. Its
   * amounts drive the giving card's chips, its lead joins the banner, its
   * campaigns are listed, and a gift goes where its donation box points.
   */
  category?: CategoryPageContent | null;
}

export default function ZakatPage({ category = null }: ZakatPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("zakat");
  const { format, formatLocal, code: visitorCode, symbol } = useMinbarMoney();

  /* The chips: the category's amounts when one is bound, under the same
     currency contract as its donation box — USD converted for display, unless
     the visitor's currency has a list of its own. */
  const override = category && visitorCode !== "USD" ? category.suggestedByCurrency[visitorCode] : undefined;
  const quickAmounts = override?.length ? override : category?.suggestedAmounts.length ? category.suggestedAmounts : QUICK_AMOUNTS;
  const chipCurrency = override?.length ? visitorCode : "USD";
  const showMoney = (value: number, code: string) => (code === "USD" ? format(value) : formatMoney(value, code, locale));

  const [amount, setAmount] = useState(quickAmounts[0]);
  const [heroCustom, setHeroCustom] = useState("");
  const [added, setAdded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  /* Switching to a currency with its own list can orphan the chosen chip. */
  useEffect(() => {
    if (!heroCustom && !quickAmounts.includes(amount)) setAmount(quickAmounts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipCurrency]);

  const num = (x: string | undefined) => {
    const v = parseAmount(x);
    return Number.isFinite(v) ? v : 0;
  };
  const base = Math.max(0, num(values.cash) + num(values.gold) + num(values.trade) - num(values.debts));
  const dueRounded = Math.round(base * ZAKAT_RATE * 100) / 100;
  const heroAmount = heroCustom ? num(heroCustom) : amount;
  const heroCurrency = heroCustom ? visitorCode : chipCurrency;

  const addZakat = (value: number, currency = "USD") => {
    addToCart({ ...zakatCartTarget(category), typeKey: "zakat", freqKey: "once", amount: value, currency });
  };

  const onDonateNow = () => {
    if (!(heroAmount > 0)) return;
    addZakat(heroAmount, heroCurrency);
    router.push(miaPath("cart", locale));
  };

  const onAddToCart = () => {
    if (!(heroAmount > 0)) return;
    addZakat(heroAmount, heroCurrency);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const onDonateCalculated = () => {
    if (!(base > 0) || !(dueRounded > 0)) return;
    addZakat(dueRounded, visitorCode);
    router.push(miaPath("cart", locale));
  };

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: t("heroTitle"), url }).catch(() => {});
    else if (navigator.clipboard) await navigator.clipboard.writeText(url).catch(() => {});
  };

  const campaigns = category?.projects.slice(0, 6) ?? [];
  const bannerImage = campaigns.find((p) => p.image)?.image ?? null;

  return (
    <div className="tvg-page mia-zakat-page">
      <GivingBanner image={bannerImage} title={t("heroTitle")} lead={category?.heroLead || t("whyText")} />

      {/* ── Estimator beside the giving card ─────────────────────────────── */}
      <div id="calculator" className="tvg-container tvg-zk-wrap">
        <div className="tvg-zk-form">
          <h2>{t("zp.estTitle")}</h2>
          <p>{t("zp.estText")}</p>
          {QUICK_FIELDS.map((field) => (
            <label key={field.id} className="tvg-zk-field" data-tone={field.tone}>
              <span>{t(field.labelKey)}</span>
              <span className="tvg-zk-input">
                <span>{symbol}</span>
                <input
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: decimalAmount(e.target.value, 12) }))}
                  inputMode="decimal"
                  placeholder="0"
                />
              </span>
            </label>
          ))}
          <div className="tvg-zp-calc-out" aria-live="polite">
            <div>
              <small>{t("zp.net")}</small>
              <b>{formatLocal(base)}</b>
            </div>
            <div>
              <small>{t("zp.dueLabel")}</small>
              <b>{formatLocal(dueRounded)}</b>
            </div>
          </div>
          <button type="button" className="tvg-cta" onClick={onDonateCalculated} disabled={!(dueRounded > 0)}>
            {t("zp.donateCalc")}
          </button>
          <div className="tvg-zp-tools">
            <button type="button" className="tvg-zp-link" onClick={() => setValues({})}>
              {t("zp.reset")}
            </button>
            <Link className="tvg-zp-link" href={miaPath("zakatCalculator", locale)}>
              {t("zp.fullCalc")}
            </Link>
          </div>
        </div>

        <div className="tvg-zk-result">
          <div className="tvg-zk-rl" style={{ fontSize: 16, fontWeight: 800, color: "#062442" }}>
            {t("zp.giveTitle")}
          </div>
          <p className="tvg-zk-formula" style={{ marginBottom: 16 }}>
            {t("zp.giveText")}
          </p>
          <div className="tvg-zp-amounts">
            <div className="tvg-chips" role="group" aria-label={t("zp.amountsAria")}>
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={amount === value && !heroCustom}
                  onClick={() => {
                    setAmount(value);
                    setHeroCustom("");
                  }}
                  style={{ margin: 0 }}
                >
                  <span>{showMoney(value, chipCurrency)}</span>
                </button>
              ))}
            </div>
            <label className="tvg-mg-custom">
              <span>{symbol}</span>
              <input value={heroCustom} onChange={(e) => setHeroCustom(decimalAmount(e.target.value))} inputMode="decimal" placeholder={t("zp.other")} aria-label={t("zp.other")} />
            </label>
          </div>
          <button type="button" className="tvg-cta" onClick={onDonateNow} disabled={!(heroAmount > 0)}>
            {t("zp.donateNow")}
          </button>
          <div className="tvg-zp-row">
            <button type="button" className="tvg-ghost" onClick={onAddToCart} aria-live="polite">
              {added ? t("zp.added") : t("zp.addToCart")}
            </button>
            <button type="button" className="tvg-zp-share" onClick={onShare} title={t("zp.share")} aria-label={t("zp.share")}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 10.6 6.8-3.8M8.6 13.4l6.8 3.8" />
              </svg>
            </button>
          </div>
          <div className="tvg-zk-note">{t("zp.giveNote")}</div>
        </div>
      </div>

      {/* ── The eight categories ─────────────────────────────────────────── */}
      <div id="masarif" className="tvg-zp-sec">
        <div className="tvg-container">
          <h2>{t("zp.masarifTitle")}</h2>
          <p className="tvg-zp-verse">
            {t("zp.masarifIntro")}{" "}
            <span dir="rtl" lang="ar">
              ﴿إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ﴾
            </span>{" "}
            ({t("masarifAyahRef")})
          </p>
          <div className="tvg-areas tvg-zp-masarif">
            {MASARIF.map((item) => (
              <div key={item.id} className="tvg-area">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
                <div style={{ minWidth: 0 }}>
                  <h3>{t(`masraf_${item.id}`)}</h3>
                  <p>{t(`masrafDesc_${item.id}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── The zakat category's campaigns ───────────────────────────────── */}
      {campaigns.length ? (
        <div className="tvg-prog-sec tvg-prog-linked" style={{ marginBottom: 56 }}>
          <div className="tvg-container">
            <h2>{category?.projectsTitle || t("zp.projectsTitle")}</h2>
            <div className="tvg-lp-grid">
              {campaigns.map((project) => (
                <Link key={project.slug} className="tvg-lp-card" href={miaPath("projectDetail", locale, project.slug)}>
                  <div className="tvg-lp-image" style={{ backgroundImage: `url("${project.image || TV_FALLBACK_IMAGE}")` }} />
                  <div className="tvg-lp-body">
                    <h4>{project.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── About zakat ──────────────────────────────────────────────────── */}
      <div className="tvg-zk-explain">
        <h3>{t("zp.explainTitle")}</h3>
        <p>{t("zp.explainText")}</p>
        <p className="tvg-disclaimer">{t("zk.disclaimer")}</p>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div id="faq" className="tvg-zp-sec" style={{ paddingBottom: 70 }}>
        <div className="tvg-container tvg-zp-faq">
          <h2 style={{ marginBottom: 18 }}>{t("zp.faqTitle")}</h2>
          <div className="tvg-faq">
            {FAQS.map((id, i) => (
              <details key={id} open={i === 0}>
                <summary>{t(`faq_${id}_q`)}</summary>
                <p>{t(`faq_${id}_a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
