"use client";

import { decimalAmount, parseAmount } from "@/lib/minbar/numeric-input";
import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/minbar/ds";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type MinbarCartItem } from "@/lib/minbar/cart";
import { formatMoney } from "@/lib/minbar/money";
import { youtubeEmbed } from "@/lib/minbar/content/media";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import { ArrowGlyph } from "@/components/minbar/home/TopSections";
import type { CategoryPageContent } from "@/lib/minbar/category-page";

/**
 * Zakat landing page  ported from `Minbar/الزكاة.dc.html`.
 *
 * A quick-give hero, a collapsible four-field estimator, the case for directing
 * zakat to Palestine, the eight categories of recipients, two scholars'
 * testimonies on expediting zakat, two videos, and an FAQ.
 *
 * `[RELIGIOUS-REVIEW]`: the eight masārif and both testimonies are translated
 * content under religious review. The Qur'anic verse (At-Tawbah 60) is rendered
 * in Arabic in every language edition, as the handoff requires.
 *
 * Zakat is kept separate from every other kind of giving: items added here
 * carry `typeKey: "zakat"`, which is what keeps it separated in the cart, on the
 * receipt, and in how it is disbursed.
 */

/** The eight categories, with the icon each carries in the design. */
const MASARIF: ReadonlyArray<{ id: string; icon: string }> = [
  { id: "fuqara", icon: "hand-heart" },
  { id: "masakin", icon: "users" },
  { id: "amilin", icon: "briefcase" },
  { id: "muallafa", icon: "heart-handshake" },
  { id: "riqab", icon: "unlock" },
  { id: "gharimin", icon: "scale" },
  { id: "sabilillah", icon: "flag" },
  { id: "ibnsabil", icon: "route" },
];

const MASARIF_ICONS: Record<string, ReactElement> = {
  "hand-heart": <path d="M12 20s-6.5-4-8.5-7.5C2 10 3 7 6 7c1.6 0 2.9.8 3.5 2 .6-1.2 1.9-2 3.5-2 3 0 4.5 3 3.5 6.5C15.7 16.5 12 20 12 20Z" />,
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  "heart-handshake": (
    <>
      <path d="M12 20s-6.5-4-8.5-7.5C2 10 3 7 6 7c1.6 0 2.9.8 3.5 2 .6-1.2 1.9-2 3.5-2 3 0 4.5 3 3.5 6.5C15.7 16.5 12 20 12 20Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  unlock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M5 7h5l-2.5 6.5a3 3 0 0 0 5 0L10 7" />
      <path d="M14 7h5l-2.5 6.5a3 3 0 0 0 5 0L19 7" />
      <path d="M5 7l7-2 7 2" />
    </>
  ),
  flag: (
    <>
      <path d="M4 22V4" />
      <path d="M4 4h14l-2.5 4L18 12H4" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M18 7v6a4 4 0 0 1-4 4H8" />
    </>
  ),
};

/** Quick-estimator fields: three asset groups minus liabilities. */
const QUICK_FIELDS = [
  { id: "cash", labelKey: "qcCash", icon: "wallet", color: "var(--deep)" },
  { id: "gold", labelKey: "qcGold", icon: "gem", color: "var(--gold)" },
  { id: "trade", labelKey: "qcTrade", icon: "trending-up", color: "var(--deep)" },
  { id: "debts", labelKey: "qcDebts", icon: "receipt", color: "var(--red)" },
] as const;

const FIELD_ICONS: Record<string, ReactElement> = {
  wallet: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l3 5-9 13L3 8Z" />
      <path d="M3 8h18" />
    </>
  ),
  "trending-up": (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M15 6h5v5" />
    </>
  ),
  receipt: (
    <>
      <path d="M7 3h10l2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5l2-2Z" />
      <path d="M9 9h6M9 13h6" />
    </>
  ),
};

/**
 * The zakat FAQ. These are the foundation's own reviewed answers, already
 * translated ×19 in the `zakat` bundle and shared with the detailed calculator.
 * The handoff's page took them from `props.faqs` with no fallback so no
 * placeholder could ship; reusing the reviewed set keeps the section real
 * without inventing anything, and the dashboard can still override it.
 */
const FAQS = ["hawl", "metal", "salary", "jewelry", "early", "channels"] as const;

const QUICK_AMOUNTS = [1000, 2000, 3000, 5000];
const ZAKAT_RATE = 0.025;

export interface ZakatPageProps {
  videoUrl1?: string;
  videoUrl2?: string;
  /**
   * The zakat category, when the dashboard has bound one to this page. Its
   * amounts drive the hero's quick chips, its film takes the first video slot,
   * its hero picture and lead join the hero, and the campaigns section below
   * the eight categories carries its figures, values, all its campaigns, its
   * donation box, cards and achievements. A gift from the hero then goes where
   * the category's donation box points  the category itself or a campaign 
   * instead of to the generic zakat intention.
   */
  category?: CategoryPageContent | null;
}

export default function ZakatPage({
  videoUrl1 = "https://www.youtube.com/embed/kBXI352bX-g",
  videoUrl2 = "https://www.youtube.com/embed/4b5FMrMn0MM",
  category = null,
}: ZakatPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("zakat");
  const tCommon = useTranslations("common");
  const { format, formatLocal, code: visitorCode } = useMinbarMoney();

  /* The hero's chips: the category's amounts when one is bound, under the
     same currency contract as its donation box  USD converted for display,
     unless the visitor's currency has a list of its own. */
  const override = category && visitorCode !== "USD" ? category.suggestedByCurrency[visitorCode] : undefined;
  const quickAmounts = override?.length ? override : category?.suggestedAmounts.length ? category.suggestedAmounts : QUICK_AMOUNTS;
  const chipCurrency = override?.length ? visitorCode : "USD";
  const showMoney = (value: number, code: string) => (code === "USD" ? format(value) : formatMoney(value, code, locale));

  const [amount, setAmount] = useState(quickAmounts[0]);
  const [heroCustom, setHeroCustom] = useState("");
  const [added, setAdded] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState(-1);

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
  const due = base * ZAKAT_RATE;
  const dueRounded = Math.round(due * 100) / 100;
  const heroAmount = heroCustom ? num(heroCustom) : amount;
  const heroCurrency = heroCustom ? visitorCode : chipCurrency;

  /**
   * Every add from this page is zakat  that is what keeps it ring-fenced.
   * With a bound category the gift goes where its donation box points, and to
   * the category itself when the box has no target (the zakat category holds
   * no campaigns, so there is no campaign to fall back to). The bare
   * `zakatToPalestine` intention has no destination the order can carry; it
   * is only left for a site with no zakat category at all.
   */
  const addZakat = (value: number, currency = "USD") => {
    const target: Partial<MinbarCartItem> =
      category?.donateTarget?.kind === "category"
        ? { categoryId: category.donateTarget.id }
        : category?.donateTarget?.kind === "campaign"
          ? { projectId: category.donateTarget.slug }
          : category
            ? { categoryId: category.id }
            : { titleKey: "zakatToPalestine" };
    addToCart({ ...target, typeKey: "zakat", freqKey: "once", amount: value, currency });
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

  return (
    <div className="mia-zakat-page" style={{ position: "relative" }}>
      <div className="gv-page">
        {/* ── Banner: the calculator's template (in-banner) ────────────────── */}
        <section className="gv-banner">
          <div className="gv-wrap">
            <h1>{t("heroTitle")}</h1>
            {category?.heroLead ? <p>{category.heroLead}</p> : null}
          </div>
        </section>

        {/* ── Estimator beside the giving card ─────────────────────────────── */}
        <section id="calculator" className="gv-plain">
          <div className="gv-wrap zp-wrap">
            <div className="gv-card zp-calc">
              <div className="zp-calc-head">
                <span className="gv-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="18" height="12" rx="2.4" />
                    <path d="M3 10.5h18M8 15h2.4" />
                    <circle cx="16" cy="15" r="1.3" />
                  </svg>
                </span>
                <div>
                  <h2>{tCommon("zakatCalculator")}</h2>
                  <p>{t("calcIntroText")}</p>
                </div>
                <div className="zp-calc-tools">
                  <button type="button" onClick={() => setValues({})} className="gv-link" style={{ minHeight: 44 }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                    </svg>
                    {t("reset")}
                  </button>
                  <button type="button" onClick={() => setCalcOpen((v) => !v)} aria-expanded={calcOpen} className="gv-ghost">
                    {calcOpen ? t("collapseCalculator") : t("openCalculator")}
                    <span aria-hidden="true" style={{ display: "inline-flex", transition: "transform .25s ease", transform: calcOpen ? "rotate(180deg)" : undefined }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              {calcOpen ? (
                <>
                  <div className="zc-fields">
                    {QUICK_FIELDS.map((field) => (
                      <label key={field.id} className="zc-field">
                        <span className="gv-label">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={field.id === "debts" ? "#b34732" : "#0077b3"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {FIELD_ICONS[field.icon]}
                          </svg>
                          {t(field.labelKey)}
                        </span>
                        <span className="gv-affix" dir="ltr" data-tone={field.id === "debts" ? "subtract" : undefined}>
                          <span>{visitorCode}</span>
                          <input
                            value={values[field.id] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [field.id]: decimalAmount(e.target.value, 12) }))}
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={t(field.labelKey)}
                          />
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="zp-result" aria-live="polite">
                    <span>
                      <span className="zp-micro">{t("netZakatWealth")}</span>
                      <b dir="ltr">{format(base)}</b>
                    </span>
                    <span>
                      <span className="zp-micro" style={{ color: "#0077b3" }}>
                        {t("zakatDueLabel")}
                      </span>
                      <b dir="ltr">{formatLocal(dueRounded)}</b>
                    </span>
                    <button type="button" onClick={onDonateCalculated} disabled={!(base > 0)} className="gv-cta">
                      {t("donateZakatNowArrow")}
                      <ArrowGlyph />
                    </button>
                  </div>

                  <p className="gv-hint" style={{ margin: 0 }}>
                    {t("calcFootnote")}
                  </p>
                </>
              ) : null}
            </div>

            <div className="gv-card zp-give">
              {/* The category's hero picture takes the coins' slot, shown the same
                  way  the seed gives the bound category the coins themselves. */}
              <img src={category?.heroImage || "/minbar/assets/zakat-hero-coins.png"} alt={t("heroTitle")} className="zp-give-art" />

              <div className="zp-amounts">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-pick={amount === value && !heroCustom ? "1" : ""}
                    aria-pressed={amount === value && !heroCustom}
                    onClick={() => {
                      setAmount(value);
                      setHeroCustom("");
                    }}
                    className="gv-chip"
                  >
                    <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                      {showMoney(value, chipCurrency)}
                    </span>
                  </button>
                ))}
                <input
                  value={heroCustom}
                  onChange={(e) => setHeroCustom(decimalAmount(e.target.value))}
                  inputMode="decimal"
                  placeholder={tCommon("customAmount")}
                  aria-label={tCommon("customAmount")}
                  className="gv-input"
                />
              </div>

              <div className="zp-ctas">
                <button type="button" onClick={onDonateNow} className="gv-cta">
                  {tCommon("donateNow")}
                </button>
                <button type="button" onClick={onAddToCart} className="gv-ghost" data-done={added ? "1" : undefined}>
                  <span aria-hidden="true" style={{ display: "inline-flex" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="20" r="1.4" />
                      <circle cx="17" cy="20" r="1.4" />
                      <path d="M3 4h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.2L20 8H6" />
                    </svg>
                  </span>
                  {added ? tCommon("addedToCart") : tCommon("addToCart")}
                </button>
                <button type="button" onClick={onShare} title={tCommon("sharePage")} aria-label={tCommon("sharePage")} className="zp-share">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.6 10.6 6.8-3.8M8.6 13.4l6.8 3.8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── The reward ───────────────────────────────────────────────────── */}
        <TwoColumn id="reward" image="/minbar/assets/zakat-tree.png" heading={t("rewardTitle")} text={t("rewardText")} />

        {/* ── The eight categories ─────────────────────────────────────────── */}
        <section id="masarif" className="gv-sec">
          <div className="gv-wrap">
            <div className="zp-masarif-head">
              <div>
                <h2 className="gv-h2">{t("masarifTitle")}</h2>
                <p className="gv-intro">{t("masarifSubtext")}</p>
              </div>
              <img src="/minbar/assets/zakat-eight-masarif.png" alt={t("masarifTitle")} />
            </div>

            <p className="zp-verse">
              {t("masarifIntro")}{" "}
              {/* At-Tawbah 60. Arabic in every language edition, isolated so bidi
                  cannot reorder it inside a left-to-right paragraph. */}
              <span dir="rtl" lang="ar">
                ﴿إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ﴾
              </span>{" "}
               {t("masarifAyahRef")}.
            </p>

            <div className="zp-masarif">
              {MASARIF.map((item, i) => (
                <div key={item.id} className="gv-card gv-lift zp-masraf">
                  <span aria-hidden="true" className="zp-masraf-n">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="gv-ico">
                    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {MASARIF_ICONS[item.icon]}
                    </svg>
                  </span>
                  <span style={{ display: "block", minWidth: 0 }}>
                    <b className="gv-h3" style={{ display: "block" }}>
                      {t(`masraf_${item.id}`)}
                    </b>
                    <span className="gv-text" style={{ display: "block", fontSize: 12.5, lineHeight: 1.75 }}>
                      {t(`masrafDesc_${item.id}`)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Expediting zakat, and the two testimonies ────────────────────── */}
        <section id="taajil" className="gv-sec">
          <div className="gv-wrap zp-taajil">
            <div className="gv-card zp-taajil-main">
              <img src="/minbar/assets/zakat-hourglass.png" alt={t("expediteTitle")} />
              <div style={{ minWidth: 0 }}>
                <h2 className="gv-h2" style={{ marginBottom: 10 }}>
                  {t("expediteTitle")}
                </h2>
                <p className="gv-text" style={{ fontSize: 14.5, lineHeight: 2 }}>
                  {t("expediteText")}
                </p>
              </div>
            </div>

            <Testimony quote={t("testimonial1Quote")} name={t("testimonial1Name")} title={t("scholarTitle")} image="/minbar/assets/sheikh-ali-qaradaghi.jpg" />
            <Testimony heading={t("expediteNeed")} quote={t("testimonial2Quote")} name={t("testimonial2Name")} title={t("muftiTitle")} image="/minbar/assets/sheikh-ikrima-sabri.jpg" />
          </div>
        </section>

        {/* ── Videos ───────────────────────────────────────────────────────── */}
        <section className="gv-sec">
          <div className="gv-wrap zp-videos">
            {/* The category's film, when it has one, takes the first slot; the
                programme section above does not repeat it. */}
            {[category?.heroVideoId ? youtubeEmbed(category.heroVideoId) : videoUrl1, videoUrl2].map((url) => (
              <div key={url} className="gv-video">
                <iframe
                  src={url}
                  title={t("heroTitle")}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2" style={{ marginBottom: 18 }}>
              {t("faqTitle")}
            </h2>
            <div className="gv-faq" style={{ maxWidth: 900 }}>
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
                    <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, padding: open ? "0 18px 16px" : "0 18px", overflow: "hidden", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.9, transition: "all .3s cubic-bezier(.22,.61,.36,1)" }}>
                      {t(`faq_${id}_a`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────────────── */}
        <section className="gv-sec">
          <div className="gv-wrap">
            <div className="gv-band">
              <div className="gv-band-copy">
                <h2>{t("ctaTitle")}</h2>
                <p>{t("ctaText")}</p>
              </div>
              <div className="gv-band-actions">
                <Button variant="primary" size="lg" href="#calculator" style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {t("donateZakatNowArrow")}
                </Button>
                <Button variant="outline" size="lg" href={miaPath("waqf", locale)} style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {t("allWaqfProjects")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}

/** Picture-and-copy card (the inner pages' `ab-intro` split). */
function TwoColumn({ id, image, heading, text }: { id: string; image: string; heading: string; text: string }) {
  return (
    <section id={id} className="gv-sec">
      <div className="gv-wrap">
        <div className="gv-card zp-split">
          <span className="zp-split-art">
            <img src={image} alt="" />
          </span>
          <div className="zp-split-text">
            <h2 className="gv-h2" style={{ marginBottom: 12 }}>
              {heading}
            </h2>
            <p>{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A scholar's testimony with attribution. */
function Testimony({ heading, quote, name, title, image }: { heading?: string; quote: string; name: string; title: string; image: string }) {
  return (
    <blockquote className="gv-card zp-quote">
      {heading ? <h3 className="gv-h3" style={{ fontSize: 17 }}>{heading}</h3> : null}
      <p>{quote}</p>
      <footer>
        <img src={image} alt="" />
        <span style={{ display: "grid", gap: 2 }}>
          <b>{name}</b>
          <span>{title}</span>
        </span>
      </footer>
    </blockquote>
  );
}
