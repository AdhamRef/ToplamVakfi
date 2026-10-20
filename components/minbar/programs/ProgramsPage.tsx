"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import { TV_FALLBACK_IMAGE } from "@/lib/minbar/programs-match";

/**
 * Programmes index — `ToplamVakfi-design/Toplum Vakfı Programs.dc.html`.
 *
 * The design's page is a full-bleed campaign hero over a filter row and the
 * grid of projects open for giving. The hero, the tabs and the card are the
 * design's; what they show is real: the tabs are the dashboard's categories
 * that hold at least one published campaign, and the grid is the published
 * campaigns themselves. "All" carries the design's own Hope-campaign hero;
 * a category tab swaps in the category's name, description and picture, and
 * its button opens the category's own page. The selected tab is kept in the
 * URL hash (`#<category slug>`) as the design does.
 *
 * A card's "add to cart" puts that campaign in the basket at the amount typed
 * on the card, exactly like the project cards elsewhere; a shares campaign
 * (which takes a share count, not an amount) links to its page instead.
 */

export interface ProgramsProject {
  slug: string;
  title: string;
  image: string | null;
  raised: number;
  goal: number | null;
  tag: string | null;
  categoryIds: string[];
  /** Shares campaigns take a share count on their page, not a free amount. */
  shares: boolean;
}

export interface ProgramsCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  href: string;
}

const HEART = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 20s-7.2-4.6-9.4-9.2C1.2 7.8 3 5 6 5c2 0 3.3 1.1 4 2.3.7-1.2 2-2.3 4-2.3 3 0 4.8 2.8 3.4 5.8C19.2 15.4 12 20 12 20z" />
  </svg>
);

const DEFAULT_CARD_AMOUNT = "50";

export default function ProgramsPage({
  projects,
  categories,
  hopeHref,
}: {
  projects: ProgramsProject[];
  categories: ProgramsCategory[];
  /** Where the Hope-campaign hero's button goes: its category when one matches, else the projects list. */
  hopeHref: string;
}) {
  const locale = useLocale();
  const t = useTranslations("tvPrograms");
  const [tab, setTab] = useState<string>("all");

  const valid = useMemo(() => new Set(["all", ...categories.map((c) => c.slug)]), [categories]);

  /* The design keeps the tab in the hash, so a link to `#<slug>` opens it. */
  useEffect(() => {
    const fromHash = () => {
      let key = "all";
      try {
        key = decodeURIComponent(window.location.hash.slice(1)) || "all";
      } catch {
        key = "all";
      }
      setTab(valid.has(key) ? key : "all");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [valid]);

  const choose = useCallback((key: string) => {
    window.history.replaceState(null, "", `#${encodeURIComponent(key)}`);
    setTab(key);
  }, []);

  const category = tab === "all" ? null : categories.find((c) => c.slug === tab) ?? null;
  const shown = category ? projects.filter((p) => p.categoryIds.includes(category.id)) : projects;

  const heroImage = category?.image || TV_FALLBACK_IMAGE;

  return (
    <div className="tvg-page">
      {/* ── Hero: the campaign banner (all) or the chosen category ─────── */}
      <div className="tvg-pg-hero">
        <div className="tvg-pg-hero-img" role="img" aria-label={category ? category.name : t("hopeImgAlt")} style={{ backgroundImage: `url("${heroImage}")` }} />
        <div className="tvg-wrap tvg-pg-hero-in">
          <h1 className="tvg-sr">{category ? category.name : t("title")}</h1>
          {category ? null : <p className="tvg-sr">{t("intro")}</p>}
          <article className="tvg-pg-feature">
            {category ? (
              <>
                <h2>{category.name}</h2>
                {category.description ? <p>{category.description}</p> : null}
                <Link className="tvg-pill" href={category.href}>
                  <i>{HEART}</i>
                  {t("pathCta")}
                </Link>
              </>
            ) : (
              <>
                <h2>{t("hopeTitle")}</h2>
                <span className="tvg-pg-script">{t("hopeScript")}</span>
                <p>{t("hopeText")}</p>
                <Link className="tvg-pill" href={hopeHref}>
                  <i>{HEART}</i>
                  {t("hopeCta")}
                </Link>
              </>
            )}
          </article>
        </div>
      </div>

      <main className="tvg-pg-main">
        <div className="tvg-wrap">
          <div className="tvg-tabs" role="tablist" aria-label={t("tabsAria")}>
            <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => choose("all")}>
              {t("all")}
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={tab === c.slug} onClick={() => choose(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {shown.length ? (
              <div className="tvg-pj-grid">
                {shown.map((project) => (
                  <ProjectCard key={project.slug} project={project} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="tvg-card tvg-empty">
                <b>{t("emptyTitle")}</b>
                <a
                  href="#all"
                  onClick={(e) => {
                    e.preventDefault();
                    choose("all");
                  }}
                >
                  {t("emptyLink")}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project, locale }: { project: ProgramsProject; locale: string }) {
  const t = useTranslations("tvPrograms");
  const { format, symbol } = useMinbarMoney();
  const { fromLocal } = useDonationAmount();
  const [value, setValue] = useState(DEFAULT_CARD_AMOUNT);
  const [added, setAdded] = useState(false);
  const href = miaPath("projectDetail", locale, project.slug);
  const pct = project.goal ? Math.round((project.raised / project.goal) * 100) : 0;

  const add = () => {
    /* The figure is typed in the visitor's currency; `fromLocal` gives the USD
       value plus the exact local figure, as every amount field on the site. */
    const given = fromLocal(Math.max(1, Number(value) || 0));
    if (!(given.usd > 0)) return;
    addToCart({
      projectId: project.slug,
      title: project.title,
      typeKey: "project",
      freqKey: "once",
      amount: given.usd,
      currency: "USD",
      ...(given.local ? { local: given.local } : {}),
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="tvg-card tvg-pj-card">
      <Link className="tvg-pj-img" href={href} tabIndex={-1} aria-hidden="true" style={{ backgroundImage: `url("${project.image || TV_FALLBACK_IMAGE}")` }}>
        {project.tag ? <span className="tvg-pj-tag">{project.tag}</span> : null}
      </Link>
      <div className="tvg-pj-body">
        <h3>
          <Link href={href}>{project.title}</Link>
        </h3>
        {project.goal ? (
          <>
            <div className="tvg-pj-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(pct, 3))}%` }} />
            </div>
            <div className="tvg-pj-meta">
              <span>{t.rich("raised", { amount: format(project.raised), b: (chunks) => <b className="tvg-ltr">{chunks}</b> })}</span>
              <span>{t.rich("goal", { amount: format(project.goal), b: (chunks) => <b className="tvg-ltr">{chunks}</b> })}</span>
            </div>
          </>
        ) : (
          <p className="tvg-pj-note">{t("directNote")}</p>
        )}
        {project.shares ? null : (
          <label className="tvg-pj-amt">
            <span>{symbol}</span>
            <input value={value} onChange={(e) => setValue(decimalAmount(e.target.value))} inputMode="decimal" aria-label={t("amountAria")} />
          </label>
        )}
        <div className="tvg-pj-btns">
          {project.shares ? (
            <Link className="tvg-pill" href={href}>
              {t("donateNow")}
            </Link>
          ) : (
            <button type="button" className="tvg-pill" onClick={add} aria-live="polite">
              {added ? t("added") : t("addToCart")}
            </button>
          )}
          <Link className="tvg-ghost" href={href}>
            {t("readMore")}
          </Link>
        </div>
      </div>
    </article>
  );
}
