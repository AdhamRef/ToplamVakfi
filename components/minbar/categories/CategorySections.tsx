"use client";

import { offeredFrequencies } from "@/lib/minbar/frequencies";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { youtubeEmbed } from "@/lib/minbar/content/media";
import { addToCart, type CartFreqKey, type CartTypeKey } from "@/lib/minbar/cart";
import { formatMoney } from "@/lib/minbar/money";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useMinbarCountUp } from "@/hooks/useMinbarReveal";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import { NoProjects } from "@/components/minbar/states/ContentStates";
import type { CategoryPageContent } from "@/lib/minbar/category-page";

/**
 * The parts of a category's page, as separate pieces.
 *
 * A category is normally published as its own landing page
 * (`CategoryLandingPage`), but two of them  the mosque and zakat  already
 * had a page of their own on the site before categories learned to publish
 * themselves, and those pages say far more than a category page could. Rather
 * than throw that away, a category can be bound to one of those pages
 * (`Category.pageTemplate`), and the page then folds the category's editable
 * parts into itself: the figures, the campaigns and the donation box, each in
 * the place it belongs.
 *
 * Every piece here renders only its own content  no full-bleed section, no
 * page background  so the landing page can wrap each in a band of its own
 * while a host page keeps them inside its container. `CategoryProgramme` is
 * the contained composition the host pages use.
 */

const DEFAULT_AMOUNTS = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];

/* Only the frequencies enabled in `config/donation-frequencies.ts`. */
const FREQUENCIES = offeredFrequencies<{ id: CartFreqKey; key: string }>([
  { id: "once", key: "oneTime" },
  { id: "daily", key: "daily" },
  { id: "friday", key: "everyFriday" },
  { id: "monthly", key: "monthly" },
]);

/* ── The figures ─────────────────────────────────────────────────────────── */

/** One figure of the band, counting up as it comes into view. */
function StatFigure({ value, label }: { value: number; label: string }) {
  const locale = useLocale();
  const { ref, value: shown } = useMinbarCountUp(value, 1400);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} style={{ display: "grid", gap: 4 }}>
      <b dir="ltr" style={{ unicodeBidi: "isolate", fontSize: "clamp(24px,2.4vw,34px)", fontWeight: 900, color: "#7fd6f5" }}>
        {new Intl.NumberFormat(locale).format(shown)}
      </b>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#b9d3e6" }}>{label}</span>
    </div>
  );
}

/**
 * The navy band: done of goal, over a progress bar. `contained` rounds it for
 * use inside another page's container; the landing page runs it edge to edge.
 */
export function CategoryStatsBand({ stats, contained = false }: { stats: NonNullable<CategoryPageContent["stats"]>; contained?: boolean }) {
  return (
    <div className="tv-dark" style={{ background: "linear-gradient(120deg, #021428 0%, #082b50 60%, #04172e 100%)", padding: contained ? "26px 24px" : "26px 0", borderRadius: contained ? 18 : 0 }}>
      <div
        className="cat-stats"
        style={{ maxWidth: 1240, margin: "0 auto", padding: contained ? 0 : "0 24px", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18, textAlign: "center" }}
      >
        <StatFigure value={stats.done} label={stats.doneLabel} />
        <StatFigure value={stats.goal} label={stats.goalLabel} />
      </div>
      <div style={{ maxWidth: 1240, margin: "18px auto 0", padding: contained ? 0 : "0 24px" }}>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
          <span className="cat-bar tv-bar" style={{ display: "block", height: "100%", width: `${stats.percent}%`, borderRadius: 999, background: "linear-gradient(90deg, #1b6fe0, #27b8f2)" }} />
        </div>
      </div>
    </div>
  );
}

/* ── The campaigns ───────────────────────────────────────────────────────── */

export function CategoryProjectsGrid({ page, columns = 3 }: { page: CategoryPageContent; columns?: number }) {
  if (!page.projects.length) return <NoProjects />;
  return (
    <div id="cat-projects-grid" className="qd-work" style={{ display: "grid", gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`, gap: 20 }}>
      {page.projects.map((project) => (
        <ProjectDonateCard key={project.id} project={project} />
      ))}
    </div>
  );
}

/* ── The donation box ────────────────────────────────────────────────────── */

/**
 * Money, the same contract as the homepage's quick-donation card: the chips
 * are USD, shown converted to the visitor's currency  UNLESS the dashboard
 * gave that currency its own list, in which case those are shown as they are
 * and go to the cart in that currency. The free field is always in the
 * visitor's currency: the symbol beside the total is what they see, so that
 * is what they give.
 *
 * `typeKey` is what the cart files the gift under; the zakat page passes
 * `"zakat"` so a gift made there stays ring-fenced as zakat.
 */
export function CategoryDonateBox({ page, typeKey = "project" }: { page: CategoryPageContent; typeKey?: CartTypeKey }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const { format, currency: selectedCurrency } = useMinbarMoney();

  const visitorCode = selectedCurrency && selectedCurrency !== "DEFAULT" ? selectedCurrency : "USD";
  const override = visitorCode !== "USD" ? page.suggestedByCurrency[visitorCode] : undefined;
  const amounts = override?.length ? override : page.suggestedAmounts.length ? page.suggestedAmounts : DEFAULT_AMOUNTS;
  const chipCurrency = override?.length ? visitorCode : "USD";
  const suggested = amounts[Math.min(2, amounts.length - 1)];

  const [picked, setPicked] = useState(suggested);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<CartFreqKey>(FREQUENCIES[0]?.id ?? "once");
  const [added, setAdded] = useState(false);

  /* Switching to a currency with its own list can orphan the chosen chip. */
  useEffect(() => {
    if (!custom && !amounts.includes(picked)) setPicked(suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipCurrency]);

  const total = custom ? Number(custom) : picked;
  const totalCurrency = custom ? visitorCode : chipCurrency;
  const showMoney = (value: number, code: string) => (code === "USD" ? format(value) : formatMoney(value, code, locale));

  /* Only identifiers reach the cart  a campaign slug or a category id, a
     numeric amount and an ISO currency  because the cart resolves titles live
     from the active locale. A category row carries the category's id (its
     slugs differ per locale) and becomes a category line of the order. */
  const addCategoryDonation = () => {
    if (!(total > 0) || !page.donateTarget) return;
    const target =
      page.donateTarget.kind === "category"
        ? { categoryId: page.donateTarget.id }
        : { projectId: page.donateTarget.slug };
    addToCart({ ...target, typeKey, freqKey: freq, amount: total, currency: totalCurrency });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const pill = (active: boolean): CSSProperties => ({
    height: 38,
    padding: "0 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
    whiteSpace: "nowrap",
    border: `1.5px solid ${active ? "#0077b3" : "#e2eaf0"}`,
    background: active ? "#0077b3" : "#f2f6f9",
    color: active ? "#fff" : "var(--deep)",
    boxShadow: active ? "0 6px 14px -6px rgba(0,119,179,.55)" : "none",
    transition: "all .18s cubic-bezier(.22,.61,.36,1)",
  });

  if (!page.donateTarget) return null;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <b className="cat-donate-title" style={{ fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 900 }}>{page.donateTitle || `${t("donateNow")}  ${page.name}`}</b>
        <span className="cat-donate-note" style={{ color: "var(--muted)", fontSize: 13.5 }}>{page.donateNote || page.donateTarget.title}</span>
      </div>

      <div
        id="cat-donate-box"
        style={{ position: "relative", display: "grid", gap: 18, padding: "24px 26px", background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 18px 44px rgba(2,52,88,.14)", overflow: "hidden" }}
      >
        <span aria-hidden="true" style={{ position: "absolute", insetBlock: 0, insetInlineStart: 0, width: 5, background: "linear-gradient(180deg, #1b6fe0, #27b8f2)", pointerEvents: "none" }} />

        <div style={{ display: "grid", gap: 12 }}>
          <div id="cat-freqs" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: 4, background: "#f2f6f9", border: "1px solid #e6eef3", borderRadius: 999, width: "fit-content", maxWidth: "100%" }}>
            {FREQUENCIES.map((f) => {
              const active = freq === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFreq(f.id)}
                  aria-pressed={active}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: 0,
                    background: active ? "#0077b3" : "transparent",
                    color: active ? "#fff" : "var(--muted)",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    boxShadow: active ? "0 6px 14px -6px rgba(0,119,179,.55)" : "none",
                    transition: "all .2s cubic-bezier(.22,.61,.36,1)",
                  }}
                >
                  {t(f.key)}
                </button>
              );
            })}
          </div>

          <div id="cat-amounts" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8 }}>
            {amounts.map((value) => (
              <button key={value} type="button" onClick={() => { setPicked(value); setCustom(""); }} aria-pressed={picked === value && !custom} style={pill(picked === value && !custom)}>
                <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{showMoney(value, chipCurrency)}</span>
              </button>
            ))}
            <input
              value={custom}
              onChange={(e) => setCustom(decimalAmount(e.target.value))}
              inputMode="decimal"
              placeholder={t("customAmount")}
              aria-label={t("customAmount")}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 999,
                boxSizing: "border-box",
                border: `1.5px solid ${custom ? "var(--gold)" : "#e2eaf0"}`,
                background: custom ? "#fff" : "#f2f6f9",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                width: "100%",
              }}
            />
          </div>
        </div>

        <div style={{ height: 1, background: "#e6eef3" }} />

        <div id="cat-donate-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <b dir="ltr" style={{ fontSize: 22, color: "var(--deep)", unicodeBidi: "isolate", whiteSpace: "nowrap" }}>{showMoney(total || 0, totalCurrency)}</b>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={addCategoryDonation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 20px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 800,
                whiteSpace: "nowrap",
                border: `1.5px solid ${added ? "var(--green)" : "#e2eaf0"}`,
                background: added ? "rgba(31,122,77,.08)" : "#f2f6f9",
                color: added ? "var(--green)" : "var(--deep)",
                transition: "all .18s cubic-bezier(.22,.61,.36,1)",
              }}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4 8 2 11h12l2-11H4Z" />
                <path d="m9 8 3-4 3 4M9 12v3M15 12v3" />
              </svg>
              {added ? t("added") : t("addToCart")}
            </button>
            <a
              href={miaPath("cart", locale)}
              onClick={addCategoryDonation}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 28px", borderRadius: 999, background: "var(--cta-gradient)", color: "#fff", fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", boxShadow: "0 10px 24px rgba(0,162,224,.36)" }}
            >
              {t("donateNow")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The film ────────────────────────────────────────────────────────────── */

export function CategoryHeroFilm({ page, style }: { page: CategoryPageContent; style?: CSSProperties }) {
  if (!page.heroVideoId) return null;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", background: "#062442", boxShadow: "0 24px 60px rgba(3,26,54,.45)", border: "1px solid rgba(255,255,255,.22)", ...style }}>
      <iframe
        src={youtubeEmbed(page.heroVideoId)}
        title={page.name}
        loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/* ── The contained composition ───────────────────────────────────────────── */

/**
 * Everything editable about a category, inside a host page's own container:
 * the film, the figures, the campaigns and the donation box. The host supplies
 * the heading and the band around it; `children`, when given, replaces the
 * default campaign grid so a host can lay the cards out its own way.
 */
export function CategoryProgramme({
  page,
  typeKey = "project",
  columns = 3,
  film = true,
  projects = true,
  children,
}: {
  page: CategoryPageContent;
  typeKey?: CartTypeKey;
  columns?: number;
  /** Off when the host shows the film somewhere of its own. */
  film?: boolean;
  /** Off for pages that never list campaigns  drops the grid and its empty state. */
  projects?: boolean;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 28 }}>
      {film && page.heroVideoId ? <CategoryHeroFilm page={page} style={{ boxShadow: "0 18px 50px rgba(6,36,66,.14)", border: "1px solid var(--border)" }} /> : null}
      {page.stats ? <CategoryStatsBand stats={page.stats} contained /> : null}
      {projects ? (children ?? <CategoryProjectsGrid page={page} columns={columns} />) : null}
      {page.donateTarget ? (
        <div id="category-donate">
          <CategoryDonateBox page={page} typeKey={typeKey} />
        </div>
      ) : null}
    </div>
  );
}
