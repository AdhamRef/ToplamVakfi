"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { drive } from "@/lib/minbar/content/media";
import { ORG_WHATSAPP } from "@/lib/minbar/org";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useMinbarReveal, useMinbarCountUp } from "@/hooks/useMinbarReveal";
import { Button } from "@/components/minbar/ds";
import Rail from "@/components/minbar/Rail";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import { ProgramIcon } from "./ProgramIcons";
import { NoReports } from "@/components/minbar/states/ContentStates";
import {
  BIG_STATS,
  CLOSING_IMAGE,
  HERO_IMAGE,
  MILESTONES,
  PROGRAMS,
  QUDS_METRICS,
  SCENES,
  SECTOR_STATS,
  VOICES,
} from "@/lib/minbar/achievements";
import type { CmsDocument } from "@/lib/minbar/cms";

/**
 * Achievements and reports  first ported from
 * `Minbar/إنجازات وتقارير المؤسسة.dc.html`, now laid out on the Toplum inner
 * page system of `ToplamVakfi-design/Toplum Vakfı Impact.dc.html` and
 * `… Transparency.dc.html`: a photographic navy banner closing on the wave,
 * then the light page with white figure cards, rounded field-photo panels,
 * giving-path cards, and the documents as a list of white rows.
 *
 * Every figure comes from `lib/minbar/achievements.ts`, which carries the
 * handoff's rule with it: these are approved published numbers, replaced only
 * by newer approved ones.
 *
 * The handoff drives its testimonies with Swiper. This uses the site's own
 * `Rail`, which already handles the RTL scroll arithmetic  one carousel
 * behaviour across the site, and one less library on a page that already loads
 * eleven photographs.
 */

/** Glyph for each sector card, matched to what the sector funds. */
const SECTOR_ICONS: Record<string, string> = {
  secWaqf: "home",
  secHoly: "landmark",
  secEdu: "graduation-cap",
  secSocial: "users",
  secEcon: "trend",
  secHealth: "heart-pulse",
};
const BIG_STAT_ICONS = ["layers", "hands"] as const;

/** A block that fades and lifts into place the first time it is scrolled to. */
function Rise({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  const { ref, shown } = useMinbarReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`rp-rise${shown ? " in" : ""}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}

/** A reported figure that counts up when it comes into view. */
function Figure({ value, style, className, dir = "ltr" }: { value: number; style?: React.CSSProperties; className?: string; dir?: "ltr" }) {
  const { format } = useMinbarNumber();
  const { ref, value: shown } = useMinbarCountUp(value);
  return (
    <b ref={ref as React.Ref<HTMLElement>} dir={dir} className={className} style={{ unicodeBidi: "isolate", ...style }}>
      {format(shown)}
    </b>
  );
}

/** Grouping separators for the reader's locale, applied to every figure. */
function useMinbarNumber() {
  const { formatNumber } = useMinbarMoney();
  return { format: formatNumber } as const;
}

/** The design's section head: a small brand eyebrow, the title, its lead. */
function Head({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <Rise className="rpx-head">
      {eyebrow ? <span className="rpx-eyebrow">{eyebrow}</span> : null}
      <h2 className="rpx-h2">{title}</h2>
      {lead ? <p className="rpx-sub">{lead}</p> : null}
    </Rise>
  );
}

export default function ReportsPage({ reports }: { reports: CmsDocument[] }) {
  const locale = useLocale();
  const t = useTranslations("achievements");
  const tCommon = useTranslations("common");
  const { formatNumber } = useMinbarMoney();

  const fieldScenes = SCENES.filter((scene) => !scene.gold);
  const featureScenes = SCENES.filter((scene) => scene.gold);

  return (
    <div className="rp-page rpx-page">
      {/* ── Banner ────────────────────────────────────────────────────────────
          The inner-page banner: a field photograph under the directional navy
          fade, closing on the wave into the page background. */}
      <section className="rpx-banner">
        {/* eslint-disable-next-line @next/next/no-img-element -- Drive-hosted, outside the configured image domains */}
        <img src={drive(HERO_IMAGE, 2000)} alt="" className="rpx-banner-img" />
        <span aria-hidden="true" className="rpx-banner-fade" />
        <div className="rpx-wrap rp-hero-copy rpx-banner-in">
          <span className="rpx-banner-eyebrow">{t("hero.eyebrow")}</span>
          {/* The title carries a `<br>` in every language's translation  it is
              the one place the report chooses where the headline breaks. */}
          <h1
            className="rpx-banner-h1"
            // Reviewed translation copy whose only markup is a line break.
            dangerouslySetInnerHTML={{ __html: t.raw("hero.title") as string }}
          />
          <p className="rpx-banner-lead">{t("hero.lead")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 6 }}>
            <Button variant="primary" size="lg" href="#gaza" style={{ whiteSpace: "nowrap" }}>
              {t("hero.cta")}
            </Button>
            <span className="rp-scroll" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#cfe3f1", fontSize: 13, fontWeight: 700 }}>
              {t("hero.scroll")}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </section>

      <div className="rpx-main">
        <div className="rpx-wrap">
          {/* ── Totals ────────────────────────────────────────────────────── */}
          <section id="totals" className="rpx-sec rpx-sec--first">
            <Head title={t("yearsTitle")} />
            <div className="rpx-bigstats">
              {BIG_STATS.map((stat, index) => (
                <Rise key={stat.labelKey} className="rpx-card rpx-stat">
                  <span className="rpx-ico" aria-hidden="true">
                    <ProgramIcon name={BIG_STAT_ICONS[index % BIG_STAT_ICONS.length]} />
                  </span>
                  <Figure value={stat.count} className="rpx-stat-num" />
                  <span className="rpx-stat-label">{t(stat.labelKey)}</span>
                </Rise>
              ))}
            </div>

            <h3 className="rpx-h3">{t("sectorsTitle")}</h3>
            <div className="rpx-sectors">
              {SECTOR_STATS.map((sector) => (
                <Rise key={sector.labelKey} className="rpx-card rpx-sector">
                  <span className="rpx-ico" aria-hidden="true">
                    <ProgramIcon name={SECTOR_ICONS[sector.labelKey] ?? "layers"} />
                  </span>
                  <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
                    <b className="rpx-sector-label">{t(sector.labelKey)}</b>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                      <Figure value={sector.beneficiaries} className="rpx-sector-num" />
                      <span className="rpx-muted" style={{ fontSize: 12.5, fontWeight: 700 }}>{t("unitBeneficiaries")}</span>
                    </span>
                    <span className="rpx-pill">
                      <b dir="ltr" style={{ unicodeBidi: "isolate" }}>{formatNumber(sector.projects)}</b> {t("unitProjects")}
                    </span>
                  </span>
                </Rise>
              ))}
            </div>
          </section>

          {/* ── The three scenes ──────────────────────────────────────────────
              The field panels: rounded photographs with the figure, its label
              and its source set on the lower fade. */}
          <div className="rpx-scenes">
            {fieldScenes.map((scene) => (
              <section key={scene.id} id={scene.id} data-scene className="rpx-scene">
                <SceneImage id={scene.image} />
                <span aria-hidden="true" className="rpx-scene-fade" />
                <div className="rpx-scene-copy">
                  <span className="rpx-scene-eyebrow">{t(`${scene.prefix}.eyebrow`)}</span>
                  <Figure value={scene.count} className="rpx-scene-num" />
                  <b className="rpx-scene-label">{t(`${scene.prefix}.label`)}</b>
                  <p className="rpx-scene-text">{t(`${scene.prefix}.text`)}</p>
                  <SceneChip>{t(`${scene.prefix}.chip`)}</SceneChip>
                </div>
              </section>
            ))}
          </div>

          {featureScenes.map((scene) => (
            <section key={scene.id} id={scene.id} data-scene className="rpx-sec rpx-feature">
              <div className="rpx-scene rpx-scene--feature" data-side={scene.side}>
                <SceneImage id={scene.image} />
                <span aria-hidden="true" className="rpx-scene-fade" />
                <div className="rpx-scene-copy">
                  <span className="rpx-scene-eyebrow">{t(`${scene.prefix}.eyebrow`)}</span>
                  <Figure value={scene.count} className="rpx-scene-num rpx-scene-num--accent" />
                  <b className="rpx-scene-label">{t(`${scene.prefix}.label`)}</b>
                  <p className="rpx-scene-text">{t(`${scene.prefix}.text`)}</p>
                  <SceneChip>{t(`${scene.prefix}.chip`)}</SceneChip>
                </div>
              </div>
              <div className="rpx-qudsmetrics">
                {QUDS_METRICS.map((metric) => (
                  <Rise key={metric.labelKey} className="rpx-card rpx-metric">
                    <Figure value={metric.count} className="rpx-stat-num" />
                    <b style={{ color: "var(--ink, #062442)", fontSize: 15.5, lineHeight: 1.5 }}>{t(metric.labelKey)}</b>
                    <span className="rpx-muted" style={{ fontSize: 13, lineHeight: 1.8 }}>{t(metric.noteKey)}</span>
                  </Rise>
                ))}
              </div>
            </section>
          ))}

          {/* ── Voices ────────────────────────────────────────────────────── */}
          <section id="voices" className="rpx-sec">
            <Head eyebrow={t("voices.eyebrow")} title={t("voices.title")} lead={t("voices.lead")} />
            <Rail step={360} prevLabel={tCommon("previous")} nextLabel={tCommon("next")} controlStyle="rounded">
              {VOICES.map((voice) => (
                <figure key={voice.whoKey} className="rp-voice rpx-card rpx-voice" style={{ margin: 0, flex: "0 0 320px" }}>
                  <span className="rpx-voice-img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Drive-hosted, outside the configured image domains */}
                    <img src={drive(voice.image, 1200)} alt="" loading="lazy" decoding="async" />
                  </span>
                  <figcaption style={{ display: "grid", gap: 12, padding: "18px 20px 20px" }}>
                    <span style={{ color: "#33495e", fontSize: 14.5, lineHeight: 1.95 }}>{t(voice.quoteKey)}</span>
                    <span style={{ display: "grid", gap: 2, paddingTop: 12, borderTop: "1px solid #e3edf4" }}>
                      <b style={{ color: "#0077b3", fontSize: 14 }}>{t(voice.whoKey)}</b>
                      <span className="rpx-muted" style={{ fontSize: 12.5 }}>{t(voice.whereKey)}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </Rail>
          </section>

          {/* ── Programmes ────────────────────────────────────────────────────
              The design's giving-path cards: a navy head that curves into the
              card, the programme's glyph on the seam, then its copy and share. */}
          <section id="programs" className="rpx-sec">
            <Head eyebrow={t("programs.eyebrow")} title={t("programs.title")} lead={t("programs.lead")} />
            <div className="rpx-programs">
              {PROGRAMS.map((program) => (
                <Rise key={program.titleKey} className="rpx-card rpx-program">
                  <span className="rpx-program-head" aria-hidden="true">
                    <span className="rpx-program-badge">
                      <ProgramIcon name={program.icon} />
                    </span>
                  </span>
                  <span className="rpx-program-body">
                    <small className="rpx-program-kpi">
                      {t("programs.kpiPrefix")} {t(program.kpiKey)}
                    </small>
                    <b className="rpx-program-title">{t(program.titleKey)}</b>
                    <span className="rpx-program-text">{t(program.textKey)}</span>
                    <span className="rpx-program-foot">
                      <span className="rpx-bar" aria-hidden="true">
                        <span style={{ width: `${program.share}%` }} />
                      </span>
                      <b dir="ltr" style={{ unicodeBidi: "isolate", color: "#0077b3", fontSize: 15, fontWeight: 900 }}>
                        {formatNumber(program.share)}%
                      </b>
                    </span>
                  </span>
                </Rise>
              ))}
            </div>
          </section>

          {/* ── Timeline ──────────────────────────────────────────────────── */}
          <section id="timeline" className="rpx-sec">
            <Head eyebrow={t("timeline.eyebrow")} title={t("timeline.title")} />
            <div className="rpx-card rpx-timeline">
              {MILESTONES.map((milestone, index) => (
                <Rise key={milestone.titleKey} className="rpx-milestone">
                  {/* Latin digits, matched to every other figure on the page. */}
                  <span dir="ltr" className="rpx-milestone-n">{index + 1}</span>
                  <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
                    <small className="rpx-eyebrow" style={{ marginBottom: 0 }}>{t(milestone.whenKey)}</small>
                    <b style={{ color: "#062442", fontSize: 18, lineHeight: 1.45, fontWeight: 900 }}>{t(milestone.titleKey)}</b>
                    <span style={{ color: "#3d5468", fontSize: 14, lineHeight: 1.95, maxWidth: "72ch" }}>{t(milestone.textKey)}</span>
                  </span>
                </Rise>
              ))}
            </div>
          </section>

          {/* ── Documents ─────────────────────────────────────────────────────
              The Transparency page's document list: one white row per
              published report, opening its file. */}
          <section id="reports" className="rpx-sec">
            <div className="rpx-reports">
              <Rise className="rpx-reports-side">
                <span className="rpx-eyebrow">{t("reports.eyebrow")}</span>
                <h2 className="rpx-h2">{t("reports.title")}</h2>
                <p className="rpx-sub" style={{ lineHeight: 1.9 }}>{t("reports.lead")}</p>
                <a href={ORG_WHATSAPP} target="_blank" rel="noopener noreferrer" className="rpx-ghost">
                  {t("reports.cta")}
                </a>
              </Rise>

              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                {reports.length === 0 ? (
                  /* The empty state sits in the design's dashed placeholder card. */
                  <div className="rpx-empty">
                    <NoReports />
                  </div>
                ) : null}
                {reports.map((report) => (
                  <a key={report.id} href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="rp-report rpx-report">
                    <span className="rpx-report-ico" aria-hidden="true">
                      <ProgramIcon name="document" size={18} />
                    </span>
                    <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <b className="rpx-report-title">{report.title}</b>
                      <span className="rpx-muted" style={{ fontSize: 12.5 }}>
                        PDF{report.year ? ` · ${report.year}` : ""}{report.description ? ` · ${report.description}` : ""}
                      </span>
                    </span>
                    <span className="rpx-report-status">{t("reportStatusAvailable")}</span>
                    <span className="rpx-report-arrow" aria-hidden="true">
                      <ProgramIcon name="arrow" size={15} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* ── Closing call ──────────────────────────────────────────────────
              The design's dark band: the closing photograph under the navy
              gradient, rounded like the page's other large panels. */}
          <section className="rpx-sec rpx-closing">
            {/* eslint-disable-next-line @next/next/no-img-element -- Drive-hosted, outside the configured image domains */}
            <img src={drive(CLOSING_IMAGE, 2000)} alt="" loading="lazy" className="rpx-closing-img" />
            <span aria-hidden="true" className="rpx-closing-fade" />
            <div style={{ position: "relative", display: "grid", gap: 16, justifyItems: "center", textAlign: "center", padding: "56px 24px" }}>
              <h2 style={{ margin: 0, fontSize: "clamp(24px,3vw,38px)", lineHeight: 1.3, fontWeight: 900, color: "#fff", letterSpacing: "-.02em" }}>
                {t("closing.title")}
              </h2>
              <p style={{ margin: 0, maxWidth: "52ch", color: "#b9d3e6", fontSize: 15.5, lineHeight: 1.9 }}>{t("closing.lead")}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
                <Button variant="primary" size="lg" href={miaPath("projects", locale)} style={{ whiteSpace: "nowrap" }}>
                  {t("closing.cta1")}
                </Button>
                <Button variant="outline" size="lg" href={miaPath("waqf", locale)} style={{ whiteSpace: "nowrap" }}>
                  {t("closing.cta2")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}

/** The source line of a field panel, as the design's place caption. */
function SceneChip({ children }: { children: ReactNode }) {
  return (
    <span className="rpx-scene-chip">
      <ProgramIcon name="pin" size={13} />
      {children}
    </span>
  );
}

/** A scene photograph with the handoff's slow Ken Burns push, on reveal. */
function SceneImage({ id }: { id: string }) {
  const { ref, shown } = useMinbarReveal<HTMLImageElement>(0.2);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Drive-hosted, outside the configured image domains
    <img
      ref={ref}
      src={drive(id, 2000)}
      alt=""
      loading="lazy"
      decoding="async"
      className={`rp-kenburns${shown ? " in" : ""}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
