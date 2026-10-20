"use client";

import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { imageForSlug, galleryFor, youtubeEmbed } from "@/lib/minbar/content/media";
import type { MinbarProject } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { Button } from "@/components/minbar/ds";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import Rail from "@/components/minbar/Rail";
import { NoProjects } from "@/components/minbar/states/ContentStates";

/**
 * Restoring the homes of Al-Quds  ported from
 * `Minbar/مشروع ترميم منازل القدس.dc.html`, laid out on the Toplum project
 * template (`ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`): a
 * full-bleed photo hero, then the story beside a sticky programme sidebar.
 *
 * The programme page for the foundation's largest Al-Quds commitment: what it
 * is, why it matters, the five values it works to, the homes currently open for
 * support, and photographs of completed work.
 *
 * The handoff's grid of individual homes is marked `[DASHBOARD-INTEGRATION]`
 * with a comment saying its names and totals are illustrative and stand in
 * "until the official figures arrive". So they are not carried over: the grid
 * reads the live catalogue instead, and where nothing is published it says so
 * rather than showing invented houses with invented amounts raised.
 */

/** The project's stated slug in the catalogue. */
export const RESTORATION_SLUG = "al-quds-home-restoration";

/** Project film, from the handoff's hero embed. */
const VIDEO_ID = "P_EiC5RUOpA";

/** The five values the programme works to, from the foundation's own file. */
const VALUES = ["restValue1", "restValue2", "restValue3", "restValue4", "restValue5"];

/** The three explanatory cards, each with its own drawn glyph. */
const CARDS: ReadonlyArray<{ title: string; body: string; icon: "alert" | "home" | "heart" }> = [
  { title: "restWhyTitle", body: "restWhyBody", icon: "alert" },
  { title: "restWhatTitle", body: "restWhatBody", icon: "home" },
  { title: "restImpactTitle", body: "restImpactBody", icon: "heart" },
];

const ICONS = {
  alert: (
    <>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 2.5 18a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />
    </>
  ),
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  heart: <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />,
} as const;

export interface RestorationPageProps {
  /** Homes and restoration campaigns open for support, from the catalogue. */
  projects: MinbarProject[];
  /**
   * Homes restored so far and the programme's target, as published by the
   * foundation. Carried from the handoff, which prints them as figures beside
   * the reviewed `restStatHomes` / `restStatGoal` labels.
   */
  restored: number;
  goal: number;
}

export default function RestorationPage({ projects, restored, goal }: RestorationPageProps) {
  const locale = useLocale();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const { formatNumber } = useMinbarMoney();

  const hero = imageForSlug(RESTORATION_SLUG, 1600);
  const gallery = galleryFor("al-quds", 8, 700);
  const pct = goal > 0 ? Math.min(Math.round((restored / goal) * 100), 100) : 0;

  return (
    <div className="rest-page pd-page">
      {/* ── Hero: the programme photo full-bleed, the title over its foot ──
          The project template's hero, starting under the app's solid header
          rather than behind it. */}
      <section className="pd-hero" style={{ position: "relative", display: "flex", alignItems: "flex-end", background: "#031a36", overflow: "hidden" }}>
        {hero ? (
          <span
            role="img"
            aria-label={t("restHeroTitle")}
            style={{ position: "absolute", inset: 0, backgroundImage: `url('${hero}')`, backgroundSize: "cover", backgroundPosition: "center 30%" }}
          />
        ) : null}
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(2,20,38,.84) 0%, rgba(2,20,38,.5) 45%, rgba(2,20,38,.18) 100%)", pointerEvents: "none" }}
        />
        <div className="pd-container pd-hero-inner rest-in" style={{ position: "relative", display: "grid", gap: 14, justifyItems: "start", color: "#fff" }}>
          <h1 style={{ margin: 0, maxWidth: "30ch", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.4, fontWeight: 800, color: "#fff" }}>{t("restHeroTitle")}</h1>
          <p style={{ margin: 0, maxWidth: "62ch", fontSize: 15, lineHeight: 1.9, color: "#cfe3f1" }}>{t("restHeroLead")}</p>
          <a href="#current-projects" className="rest-jump pd-ghost-btn">
            {t("currentRestorationsTitle")}
          </a>
        </div>
      </section>

      {/* ── Story beside the programme sidebar ───────────────────────────── */}
      <div className="pd-container pd-layout" style={{ position: "relative", zIndex: 1 }}>
        <div className="pd-project-main" style={{ display: "grid", gap: 34, minWidth: 0, alignContent: "start" }}>
          {/* Project film, from the handoff's hero embed. */}
          <div className="rest-in" style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: "#031a36", border: "1px solid #e6eef3", boxShadow: "0 12px 28px rgba(2,52,88,.07)" }}>
            <iframe
              src={youtubeEmbed(VIDEO_ID)}
              title={t("restHeroTitle")}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {/* Why, what, and the impact  the template's story sections. */}
          {CARDS.map((card) => (
            <div key={card.title} style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 12, fontSize: 19, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" }}>
                <span aria-hidden="true" className="pd-icon-chip">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[card.icon]}
                  </svg>
                </span>
                {t(card.title)}
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.95, color: "#33495e" }}>{t(card.body)}</p>
            </div>
          ))}

          {/* The five values, as the template's fact tiles. */}
          <div className="pd-facts pd-facts--values">
            {VALUES.map((value) => (
              <div key={value} className="pd-fact rest-value">
                <span aria-hidden="true" className="pd-fact-dot" />
                <span>{t(value)}</span>
              </div>
            ))}
          </div>

          {/* ── The homes open now ──────────────────────────────────────── */}
          <div id="current-projects" style={{ display: "grid", gap: 16, scrollMarginTop: 100 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 19, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" }}>{t("currentRestorationsTitle")}</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.85 }}>{t("currentRestorationsLead")}</p>
            </div>
            {projects.length ? (
              <div className="rest-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
                {projects.map((project) => (
                  <ProjectDonateCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              /* The handoff's own cards are illustrative placeholders. Rather than
                 ship invented houses with invented totals, an empty catalogue says
                 so and offers the way to every other project. */
              <NoProjects />
            )}
          </div>

          {/* ── Completed work ──────────────────────────────────────────── */}
          {/* minmax(0,1fr): a grid track sizes to its widest child by default, and
              the rail is a long strip of photos, so it stretched the page sideways. */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 19, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" }}>{t("restAchievements")}</h2>
            <Rail step={300} prevLabel={t("restAchievements")} nextLabel={t("restAchievements")}>
              {gallery.map((photo, index) => (
                <span
                  key={`${index}-${photo}`}
                  style={{ flex: "0 0 min(280px, 78vw)", position: "relative", display: "block", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", background: "#eaf1f6", border: "1px solid #e6eef3" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Drive-hosted, outside the configured image domains */}
                  <img
                    src={photo}
                    alt=""
                    loading={index < 2 ? undefined : "lazy"}
                    decoding="async"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </span>
              ))}
            </Rail>
          </div>
        </div>

        {/* ── Programme sidebar: progress, and the way to give ────────────── */}
        <aside className="pd-aside-col" style={{ minWidth: 0 }}>
          <div
            id="donate"
            className="pd-aside-sticky pd-donate rest-in rest-in-1"
            style={{ display: "grid", gap: 16, padding: 26, background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 16px 34px rgba(2,52,88,.1)" }}
          >
            <b style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" }}>{t("restDonateTitle")}</b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
              <div className="pd-fact">
                <b dir="ltr" style={{ unicodeBidi: "isolate" }}>
                  {formatNumber(restored)}
                </b>
                <span>{t("restStatHomes")}</span>
              </div>
              <div className="pd-fact">
                <b dir="ltr" style={{ unicodeBidi: "isolate" }}>
                  {formatNumber(goal)}
                </b>
                <span>{t("restStatGoal")}</span>
              </div>
            </div>
            <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 8, borderRadius: 999, background: "#eef3f7", overflow: "hidden" }}>
              <span className="rest-bar pd-fill" style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 12.5, lineHeight: 1.8, color: "var(--muted)" }}>{t("restDonateNote")}</span>
            {/* Each home above carries its own amounts; this is the way to give
               to the programme rather than to one house. */}
            <Button variant="primary" size="lg" href={miaPath("projects", locale)} style={{ width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}>
              {tCommon("donate")}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
