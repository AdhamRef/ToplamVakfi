"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Rail from "@/components/minbar/Rail";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import { miaPath } from "@/lib/minbar/routes";
import ViewAllLink from "./ViewAllLink";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import type { MinbarProject } from "@/lib/minbar/projects";
import { cssImage } from "@/lib/minbar/image-url";

/**
 * "How your donation arrives", the impact figures, and the urgent-projects rail.
 * Ported from `Minbar/الصفحة الرئيسية.dc.html`.
 */

/* ── How it works ───────────────────────────────────────────────────────────
 * The step numbers are formatted for the locale (١٢٣ in Arabic and Urdu, 123
 * elsewhere) so a French or Swedish session does not show Arabic-Indic digits. */
export function PathSection() {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const { formatNumber } = useMinbarMoney();

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    num: formatNumber(n),
    title: t(`pathStep${n}Title`),
    text: t(`pathStep${n}Text`),
  }));

  /* The Toplum design's «لماذا تثق بنا» panel: one white sheet, the heading
     with its pill link, and a numbered card per step. */
  return (
    <section id="path" className="tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div className="tv-wrap">
        <div className="tv-panel">
          <div className="tv-sec-head">
            <h2 className="tv-h2">{t("howItWorksTitle")}</h2>
            <ViewAllLink href={miaPath("reports", locale)} variant="pill">{t("viewReports")}</ViewAllLink>
          </div>
          <div id="path-steps" className="tv-steps">
            {steps.map((step) => (
              <div key={step.title} className="tv-step">
                <span className="tv-step-head">
                  <i className="tv-step-num">{step.num}</i>
                  <b>{step.title}</b>
                </span>
                <span className="tv-step-text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Impact figures ─────────────────────────────────────────────────────────
 * The official totals from the foundation's achievements record; the labels come
 * from the translated `achievements` bundle. Figures are rendered `dir="ltr"`
 * and isolated so bidi cannot reorder a grouped number.
 *
 * Laid out as the Toplum design's figures strip (`.hs-stats`): an icon chip,
 * the figure and its label per column between hairlines, then the sectors as
 * small white cards. The icons are decoration only. */
const SECTORS = [
  { key: "secWaqf", projects: 37, beneficiaries: 436_529 },
  { key: "secHoly", projects: 201, beneficiaries: 1_208_675 },
  { key: "secEdu", projects: 380, beneficiaries: 369_371 },
  { key: "secSocial", projects: 146, beneficiaries: 369_931 },
  { key: "secEcon", projects: 145, beneficiaries: 331_850 },
  { key: "secHealth", projects: 27, beneficiaries: 309_732 },
] as const;

const METRIC_ICONS = [
  /* services: a heart in an open hand */
  "M12 13.5s-3.6-2.2-4.6-4.4C6.7 7.6 7.6 6 9.2 6c1 0 1.7.5 2 1.1h1.6C13.1 6.5 13.8 6 14.8 6c1.6 0 2.5 1.6 1.8 3.1-1 2.2-4.6 4.4-4.6 4.4ZM3.5 15.5l3.2-.9c.9-.2 1.8 0 2.5.5l2.3 1.6h3.3a1.2 1.2 0 0 1 0 2.4h-4.3M3.5 20.5l2.8-.8c.6-.2 1.3-.1 1.9.2l2.4 1.1c.7.3 1.5.4 2.2.1l6.9-3.1a1.3 1.3 0 0 0-1-2.4l-3.4 1.2",
  /* projects: a building */
  "M12 3v2.5M8 10a4 4 0 0 1 8 0M5 20V12h14v8M9.5 20v-4a2.5 2.5 0 0 1 5 0v4M3.5 20h17",
  /* sectors: the globe */
  "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM3.5 12h17M12 3.5c2.4 2.4 3.5 5.4 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.4-3.5-8.5S9.6 5.9 12 3.5Z",
];

export function ImpactSection() {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const tAch = useTranslations("achievements");
  const { formatNumber } = useMinbarMoney();

  const metrics = [
    { value: formatNumber(3_026_088), label: tAch("bigServices"), note: tAch("noteServices"), featured: true },
    { value: formatNumber(936), label: tAch("bigProjects"), note: tAch("yearsTitle"), featured: false },
    {
      value: formatNumber(6),
      label: tAch("sectorsLabel"),
      note: SECTORS.map((s) => tAch(s.key)).join(" · "),
      featured: false,
    },
  ];

  return (
    <section id="stats" className="mia-impact-section tv-sec" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div className="tv-wrap">
        <div className="tv-sec-head">
          <h2 className="tv-h2">{t("ourImpact")}</h2>
          <ViewAllLink href={miaPath("reports", locale)}>{t("reportsPage")}</ViewAllLink>
        </div>

        <div id="impact-metrics" className="mia-impact-summary tv-stats">
          {metrics.map((metric, i) => (
            <div key={metric.label} className={metric.featured ? "mia-impact-stat mia-impact-stat--featured tv-stat" : "mia-impact-stat tv-stat"}>
              <i className="tv-stat-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={METRIC_ICONS[i]} />
                </svg>
              </i>
              <b dir="ltr" className="tv-stat-value">{metric.value}</b>
              <span className="tv-stat-label">{metric.label}</span>
              <span className="tv-stat-note">{metric.note}</span>
            </div>
          ))}
        </div>

        <div id="sector-metrics" className="mia-impact-sectors tv-sectors">
          {SECTORS.map((sector) => (
            <div key={sector.key} className="mia-impact-sector tv-sector">
              <span className="tv-sector-name">{tAch(sector.key)}</span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                <b className="mia-impact-sector-value tv-sector-value" dir="ltr">
                  {formatNumber(sector.beneficiaries)}
                </b>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>{tAch("unitBeneficiaries")}</span>
              </span>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                <b dir="ltr" style={{ unicodeBidi: "isolate", color: "var(--deep)" }}>
                  {formatNumber(sector.projects)}
                </b>{" "}
                {tAch("unitProjects")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Urgent projects ────────────────────────────────────────────────────────
 * Live from the campaigns CMS. The section is omitted entirely when there is
 * nothing to show rather than rendering an empty rail. */
export function UrgentProjectsSection({ projects }: { projects: MinbarProject[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const tCommon = useTranslations("common");
  const tProjects = useTranslations("projects");

  if (!projects.length) return null;

  return (
    <section id="urgent" className="tv-sec tv-sec--urgent" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <Rail
          id="urgent-rail"
          step={348}
          prevLabel={tCommon("prev")}
          nextLabel={tCommon("next")}
          heading={<h2 className="tv-h2">{t("urgentProjects")}</h2>}
          action={<ViewAllLink href={miaPath("projects", locale)}>{tProjects("allProjects")}</ViewAllLink>}
        >
          {projects.map((project) => (
            <ProjectDonateCard key={project.slug} project={project} width={340} />
          ))}
        </Rail>
      </div>
    </section>
  );
}

/* ── Region cards ───────────────────────────────────────────────────────────
 * Three doors into the work: Al-Quds, Al-Aqsa, and emergency relief. */
export function RegionCards({ images }: { images: { quds: string; aqsa: string; relief: string } }) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  const cards = [
    {
      title: t("qudsProjectsTitle"),
      cta: t("qudsProjectsTitle"),
      text: t("qudsProjectsText"),
      href: miaPath("projects", locale),
      image: images.quds,
      overlay: "linear-gradient(-90deg, rgba(6,36,66,.9) 8%, rgba(6,36,66,.45) 70%, rgba(6,36,66,.25))",
      ctaBackground: "var(--cta-gradient)",
      ctaColor: "#fff",
    },
    {
      title: t("aqsaProjectsTitle"),
      cta: t("aqsaProjectsCta"),
      text: t("aqsaProjectsText"),
      href: miaPath("aqsa", locale),
      image: images.aqsa,
      overlay: "linear-gradient(-90deg, rgba(6,36,66,.9) 8%, rgba(6,36,66,.45) 70%, rgba(6,36,66,.25))",
      ctaBackground: "var(--cta-gradient)",
      ctaColor: "#fff",
    },
    {
      title: t("urgentProjectsTitle"),
      cta: t("urgentProjectsCta"),
      text: t("urgentProjectsText"),
      href: miaPath("projects", locale),
      image: images.relief,
      overlay: "linear-gradient(-90deg, rgba(8,44,80,.92) 8%, rgba(8,44,80,.5) 70%, rgba(6,36,66,.3))",
      ctaBackground: "var(--cta-gradient)",
      ctaColor: "#fff",
    },
  ];

  return (
    <section id="regions-section" className="mia-regions-section tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div id="regions" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
        {cards.map((card) => (
          /* The card is a column the full height of the row: title and copy at
             the top, the button pinned to the foot  so the three buttons sit
             on one line however long each card's copy runs. */
          <Link key={card.title} href={card.href} className="mia-region-card" style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 260, overflow: "hidden", background: "var(--deep)", borderRadius: 16, boxShadow: "0 12px 28px rgba(2,52,88,.12)" }}>
            <span role="img" aria-label={card.title} style={{ position: "absolute", inset: 0, display: "block", backgroundImage: cssImage(card.image, 420), backgroundSize: "cover", backgroundPosition: "center" }} />
            <span style={{ position: "absolute", inset: 0, background: card.overlay }} />
            <span className="mia-region-card__body" style={{ position: "relative", flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: 32 }}>
              <b style={{ color: "#fff", fontSize: "clamp(24px,2.4vw,32px)", fontWeight: 900, lineHeight: 1.25 }}>{card.title}</b>
              <span style={{ color: "rgba(255,255,255,.82)", fontSize: 15, lineHeight: 1.8, maxWidth: "44ch" }}>{card.text}</span>
              <span className="mia-region-card__cta" style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 46, padding: "0 20px", marginTop: "auto", background: card.ctaBackground, color: card.ctaColor, fontWeight: 800, fontSize: 15, borderRadius: 999, boxShadow: "0 10px 24px rgba(0,162,224,.35)" }}>
                {card.cta}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mia-arrow-next">
                  <path d="M14 6l-6 6 6 6" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
