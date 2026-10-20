"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/minbar/ds";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { WAQF_MAX_COUNT, WAQF_UNIT_PRICE_USD } from "@/lib/minbar/waqf";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import WaqfCertificatePreview from "./WaqfCertificatePreview";

/**
 * Al-Quds Waqf  ported from `Minbar/الأوقاف.dc.html`.
 *
 * Pricing is two fixed units and nothing else  no free amount:
 *   • a waqf **share** (سهم وقفي) = $100
 *   • a waqf **metre** (متر وقفي) = $1,500  fifteen shares
 * That is a product decision in the handoff, not a UI convenience, so the
 * amount field is a counter rather than an input.
 *
 * The donor names the endower and who the waqf is made on behalf of; both go on
 * the certificate. The certificate preview updates live, but the real document
 *  and its serial  is issued server-side after payment is confirmed
 * (`DONATION_LOGIC_SPEC §2`). The number shown here is a preview, never an
 * allocated serial.
 *
 * `[RELIGIOUS-REVIEW]`: the project's aims, the definition of waqf, and the
 * certificate's legal text are reviewed translated content.
 */

const SHARE_PRICE = WAQF_UNIT_PRICE_USD.share;
const METER_PRICE = WAQF_UNIT_PRICE_USD.meter;

type WaqfUnit = "share" | "meter";

/** Areas of benefit, keyed to the same `homepage.waqfArea*` copy the homepage uses. */
const AID_TYPES: ReadonlyArray<{ key: string; icon: "book" | "water" | "bowl" | "home" | "heart" }> = [
  { key: "waqfArea3", icon: "book" },
  { key: "waqfArea4", icon: "book" },
  { key: "waqfArea5", icon: "book" },
  { key: "waqfArea6", icon: "water" },
  { key: "waqfArea9", icon: "bowl" },
  { key: "waqfArea1", icon: "home" },
  { key: "waqfArea2", icon: "heart" },
  { key: "waqfArea8", icon: "heart" },
];

const AID_ICONS: Record<string, ReactElement> = {
  book: (
    <>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13" />
      <path d="M8 7h9M8 11h9" />
    </>
  ),
  water: <path d="M12 3s6.5 7.1 6.5 12A6.5 6.5 0 0 1 5.5 15C5.5 10.1 12 3 12 3Z" />,
  bowl: (
    <>
      <path d="M3 12h18a9 9 0 0 1-18 0Z" />
      <path d="M8 12V7a4 4 0 0 1 8 0v5" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  heart: <path d="M20.8 8.6c0 4.3-8.8 10.4-8.8 10.4S3.2 12.9 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" />,
};

/** The option cards: a stack of coins for a share, a grid of squares for a metre. */
const UNIT_ICONS: Record<"share" | "meter", ReactElement> = {
  share: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  meter: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
};

const FACTS = ["ongoing", "irrevocable", "dedicated", "certificate"] as const;
const GOALS = ["goal1", "goal2", "goal3", "goal4", "goal5", "goal6"] as const;
const PARTS = ["waqf-part-1", "waqf-part-2", "waqf-part-3", "waqf-part-4", "waqf-part-5", "waqf-part-6"] as const;
const FAQS = ["q1", "q2", "q3", "q4", "q5"] as const;

/** The introductory film is a separate recording per language edition. */
function waqfVideoSrc(locale: string): string {
  if (locale === "ar") return "https://www.youtube.com/embed/kdsphkfqq6Q";
  if (locale === "tr") return "https://www.youtube.com/embed/35aS9lTFsXs";
  return "https://www.youtube.com/embed/yPXKyaiNKU4";
}

export interface WaqfPageProps {
  /** Donor's name, when signed in, for the "use my name" shortcut. */
  donorName?: string | null;
}

export default function WaqfPage({ donorName }: WaqfPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("waqf");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("homepage");
  const tZakat = useTranslations("zakat");
  const tValidation = useTranslations("validation");
  const tCert = useTranslations("certificates");
  const { format, formatNumber } = useMinbarMoney();

  const [unit, setUnit] = useState<WaqfUnit>("share");
  const [count, setCount] = useState(1);
  const [name, setName] = useState("");
  const [onBehalf, setOnBehalf] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);
  /* On a phone the certificate sits behind a button (`#waqf-cert-toggle`);
     on wider screens it is always beside the picker. */
  const [certPreviewOpen, setCertPreviewOpen] = useState(false);

  const unitPrice = unit === "meter" ? METER_PRICE : SHARE_PRICE;
  const total = unitPrice * count;

  /** Both names go on the certificate, so both are required before adding. */
  const validate = () => {
    const ok = name.trim().length > 0 && onBehalf.trim().length > 0;
    setError(!ok);
    return ok;
  };

  /* The row carries the unit, the count and both names; the server prices it
     again from the unit price and mints the certificate number after payment.
     The stored title is only the fallback label the basket shows. */
  const buildItem = () => ({
    titleKey: unit === "meter" ? "unitMeter" : "unitShare",
    title: `${unit === "meter" ? t("unitMeter") : t("unitShare")} × ${count}  ${tCert("inNameOf")} ${name.trim()}`,
    typeKey: "waqf" as const,
    freqKey: monthly ? ("monthly" as const) : ("once" as const),
    amount: total,
    currency: "USD",
    waqf: { unit, count, donorName: name.trim(), onBehalf: onBehalf.trim() },
  });

  const onAdd = () => {
    if (!validate()) return;
    addToCart(buildItem());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const onDonate = () => {
    if (!validate()) return;
    addToCart(buildItem());
    router.push(miaPath("cart", locale));
  };

  const onShare = async () => {
    const url = window.location.href.split("#")[0];
    if (navigator.share) await navigator.share({ title: t("qudsWaqfProjects"), url }).catch(() => {});
    else if (navigator.clipboard) await navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="mia-waqf-page" style={{ position: "relative" }}>
      <div className="gv-page">
        {/* ── Banner (in-banner) ───────────────────────────────────────────── */}
        <section id="about" className="gv-banner">
          <div className="gv-wrap">
            <h1>{t("qudsWaqfProjects")}</h1>
            <p>{t("meterIntro")}</p>
          </div>
        </section>

        {/* ── Unit picker: two option cards, then the details card with the
            live certificate beside it (Sadaqah Jariyah). ─────────────────── */}
        <div id="meter-picker" className="gv-wrap">
          <div className="wq2-intro">
            <b>{t("legacyEyebrow")}</b>
            <p>{t("chooseUnit")}</p>
          </div>

          <div className="wq2-options" role="group" aria-label={t("chooseUnit")}>
            {(["share", "meter"] as WaqfUnit[]).map((u) => (
              <button key={u} type="button" data-pick={unit === u ? "1" : ""} aria-pressed={unit === u} onClick={() => setUnit(u)} className="wq2-option">
                <span className="wq2-media">
                  <span>
                    <small>{u === "meter" ? t("meterPrice") : t("sharePrice")}</small>
                    <b dir="ltr">{format(u === "meter" ? METER_PRICE : SHARE_PRICE)}</b>
                  </span>
                  <span className="gv-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {UNIT_ICONS[u]}
                    </svg>
                  </span>
                </span>
                <span className="wq2-body">
                  <b>{u === "share" ? t("unitShare") : t("unitMeter")}</b>
                  <span>{u === "meter" ? t("meterCount") : t("shareCount")}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="gv-card wq2-form">
            <div className="wq2-fields">
              <div className="wq2-row wq2-price">
                <span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0077b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v10M9.5 9.5c0-1.2 1-2 2.5-2s2.5.9 2.5 2c0 2.5-5 1.8-5 4.2 0 1.1 1 2.1 2.5 2.1s2.5-.8 2.5-2" />
                  </svg>
                  {unit === "meter" ? t("meterPrice") : t("sharePrice")}
                </span>
                <b dir="ltr">{format(unitPrice)}</b>
              </div>

              <div className="wq2-row">
                <span className="gv-label" style={{ margin: 0 }}>
                  {unit === "meter" ? t("meterCount") : t("shareCount")}
                </span>
                {/* A counter, not a free amount  the unit price is fixed. */}
                <span dir="ltr" className="wq2-stepper">
                  <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="−" className="wq-step">
                    −
                  </button>
                  <b>{formatNumber(count)}</b>
                  <button type="button" onClick={() => setCount((c) => Math.min(WAQF_MAX_COUNT, c + 1))} aria-label="+" className="wq-step">
                    +
                  </button>
                </span>
              </div>

              <label style={{ display: "grid" }}>
                <span className="gv-label">{t("certName")}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="wq-input gv-input" aria-invalid={error && !name.trim() ? true : undefined} />
                {donorName && !name ? (
                  <button type="button" onClick={() => setName(donorName)} className="wq-link gv-link" style={{ justifySelf: "start" }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {tCommon("add")}
                  </button>
                ) : null}
              </label>

              <label style={{ display: "grid" }}>
                <span className="gv-label">{t("endowedOnBehalfOf")}</span>
                <input value={onBehalf} onChange={(e) => setOnBehalf(e.target.value)} placeholder={t("onBehalfPlaceholder")} className="wq-input gv-input" aria-invalid={error && !onBehalf.trim() ? true : undefined} />
                <button type="button" onClick={() => setOnBehalf(name || donorName || "")} className="wq-link gv-link" style={{ justifySelf: "start" }}>
                  {t("suggestSelf")}
                </button>
              </label>

              {error ? (
                <div className="wq-error wq2-error" role="alert">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v5M12 16h.01" />
                  </svg>
                  {tValidation("required")}
                </div>
              ) : null}

              <div className="wq2-row wq2-total">
                <span>{tCommon("total")}</span>
                <b dir="ltr">{format(total)}</b>
              </div>

              <button type="button" onClick={() => setMonthly((v) => !v)} aria-pressed={monthly} className="wq-monthly wq2-toggle">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 2v4H7a4 4 0 0 0-4 4M7 22v-4h10a4 4 0 0 0 4-4" />
                  </svg>
                  {tCommon("monthly")}
                </span>
                <span aria-hidden="true" className="wq2-switch">
                  <span />
                </span>
              </button>

              <div className="wq2-actions">
                <button type="button" onClick={onAdd} className="gv-ghost" data-done={added ? "1" : undefined}>
                  {added ? (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      <path d="M12 8v4M10 10h4" />
                    </svg>
                  )}
                  {added ? tCommon("addedToCart") : tCommon("addToCart")}
                </button>
                <button type="button" onClick={onDonate} className="gv-cta mia-card-cta">
                  {tCommon("donateNow")}
                </button>
              </div>

              <button type="button" onClick={onShare} className="wq-link gv-link" style={{ justifySelf: "center" }}>
                {tCommon("sharePage")}
              </button>
            </div>

            <div className="wq2-cert">
              <button
                id="waqf-cert-toggle"
                type="button"
                onClick={() => setCertPreviewOpen((open) => !open)}
                aria-expanded={certPreviewOpen}
                aria-controls="waqf-cert-preview"
                style={{ display: "none", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", height: 48, border: "1.5px solid #00a2e0", borderRadius: 999, background: "#fff", color: "#0077b3", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
                {certPreviewOpen ? t("hideCertPreview") : t("showCertPreview")}
              </button>
              <WaqfCertificatePreview unit={unit} count={count} total={format(total)} name={name} onBehalf={onBehalf} open={certPreviewOpen} />
            </div>
          </div>
        </div>

        {/* ── Introductory film ────────────────────────────────────────────── */}
        <section id="video" className="gv-sec">
          <div className="gv-wrap">
            <div id="waqf-video-card" className="wq2-film">
              <div className="wq2-film-copy">
                <h2>{t("videoTitle")}</h2>
              </div>
              <div className="gv-video">
                <iframe
                  src={waqfVideoSrc(locale)}
                  title={t("videoTitle")}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── What waqf is ─────────────────────────────────────────────────── */}
        <section id="what-is-waqf" className="gv-sec">
          <div className="gv-wrap wq2-what">
            <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
              <h2 className="gv-h2" style={{ margin: 0 }}>
                {t("whatIsWaqf")}
              </h2>
              <p className="gv-text" style={{ fontSize: 14.5, lineHeight: 2.05 }}>
                {t("whatIsWaqfText")}
              </p>
              <span style={{ marginTop: 4 }}>
                <Button variant="gold" href="#about-detail" style={{ whiteSpace: "nowrap", borderRadius: 999, fontWeight: 800 }}>
                  {t("learnMore")}
                </Button>
              </span>
            </div>
            <div className="wq2-facts">
              {FACTS.map((id) => (
                <div key={id} className="gv-card gv-lift wq2-fact">
                  <h3 className="gv-h3" style={{ color: "#0077b3", fontSize: 17 }}>
                    {t(`fact_${id}`)}
                  </h3>
                  <p className="gv-text">{t(`factDesc_${id}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The project in detail ────────────────────────────────────────── */}
        <section id="about-detail" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2" style={{ marginBottom: 22 }}>
              {t("aboutMeter")}
            </h2>
            <div className="wq2-trio">
              <article className="gv-card">
                <h3 className="gv-h3" style={{ fontSize: 17 }}>
                  {t("aboutIdea")}
                </h3>
                <p className="gv-text" style={{ fontSize: 14 }}>
                  {t("meterText1")}
                </p>
              </article>
              <article className="gv-card">
                <h3 className="gv-h3" style={{ fontSize: 17 }}>
                  {t("aboutCost")}
                </h3>
                <p className="gv-text" style={{ fontSize: 14 }}>
                  {t("meterText2")}
                </p>
              </article>
              <article className="gv-card" data-tone="brand">
                <span className="gv-eyebrow" style={{ margin: 0, color: "#062442" }}>
                  {t("unitShare")}
                </span>
                <p className="gv-text" style={{ fontSize: 14, color: "#062442" }}>
                  {t("meterText3")}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Areas of benefit ─────────────────────────────────────────────── */}
        <section id="aid-types" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2">{t("aidTypes")}</h2>
            <p className="gv-intro">{t("aidTypesText")}</p>
            <div className="wq2-aid">
              {AID_TYPES.map((aid) => (
                <div key={aid.key} className="gv-card gv-lift">
                  <span className="gv-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {AID_ICONS[aid.icon]}
                    </svg>
                  </span>
                  <b>{tHome(aid.key)}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Aims ─────────────────────────────────────────────────────────── */}
        <section id="goals" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2" style={{ marginBottom: 22 }}>
              {t("projectGoals")}
            </h2>
            <div className="wq2-goals">
              {GOALS.map((id, i) => (
                <div key={id} className="gv-card gv-lift">
                  <span className="gv-num">{formatNumber(i + 1)}</span>
                  <p>{t(id)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Where the yield goes ─────────────────────────────────────────── */}
        <section id="parts" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2">{t("projectParts")}</h2>
            <p className="gv-intro">{t("partsText")}</p>
            <div className="wq2-parts">
              {PARTS.map((id) => (
                <div key={id} className="gv-card gv-lift">
                  <span className="gv-ico" aria-hidden="true" style={{ width: 38, height: 38 }}>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b>{t(`part_${id}`)}</b>
                    <span>{t(`partDesc_${id}`)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="gv-sec">
          <div className="gv-wrap wq2-faq">
            <h2 className="gv-h2" style={{ marginBottom: 18 }}>
              {t("waqfFaq")}
            </h2>
            <div className="gv-faq">
              {FAQS.map((id, i) => {
                const open = openFaq === i;
                return (
                  <div key={id} className="gv-faq-item">
                    <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open} className="gv-faq-q">
                      {t(`faq_${id}`)}
                      <span aria-hidden="true" className="gv-faq-sign">
                        {open ? "−" : "+"}
                      </span>
                    </button>
                    <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, padding: open ? "0 18px 16px" : "0 18px", overflow: "hidden", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.9, transition: "all .3s cubic-bezier(.22,.61,.36,1)" }}>
                      {t(`faqA_${id}`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────────────── */}
        <section id="waqf-cta" className="gv-sec">
          <div className="gv-wrap">
            <div className="gv-band">
              <div className="gv-band-copy">
                <h2>{t("legacyEyebrow")}</h2>
                <p>{t("meterIntro")}</p>
              </div>
              <div className="gv-band-actions">
                <Button variant="primary" size="lg" href="#meter-picker" style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {t("donateWaqf")}
                </Button>
                <Button variant="outline" size="lg" href={miaPath("zakat", locale)} style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {tZakat("zakatPage")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}
