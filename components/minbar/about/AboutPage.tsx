"use client";

import { type ReactElement, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import InnerBanner from "./InnerBanner";

/**
 * About us  ported from `Minbar/من نحن.dc.html`, laid out on the Toplum
 * inner-page template (`ToplamVakfi-design/Toplum Vakfı About.dc.html`): photo
 * banner, a sticky section menu beside the content, an intro card with a
 * photograph, three icon cards, list cards, and a dark closing band.
 *
 * The one page on the site that states who the foundation legally is, so the
 * licence number, address and phone come from `lib/minbar/org.ts` rather than
 * being retyped: the Footer prints the same three facts, and two copies drift.
 *
 * Every block of the handoff is kept, in its order  legal status (the
 * design's registration intro), mission, vision and method, the five
 * objectives, the four departments, the four areas of work, the address and
 * contact, and the closing call. Styles: `styles/minbar/pages/about.css`.
 */

/** Objective keys, in the order the handoff lists them. */
const OBJECTIVES = ["objective1", "objective2", "objective3", "objective4", "objective5"] as const;

/**
 * The four departments. Each carries only the points it actually has  the
 * finance department has one, and padding it out to match the others would be
 * inventing work the foundation does not claim.
 */
const DEPARTMENTS: ReadonlyArray<{ title: string; points: readonly string[] }> = [
  { title: "dept1Title", points: ["dept1P1", "dept1P2", "dept1P3", "dept1P4"] },
  { title: "dept2Title", points: ["dept2P1", "dept2P2", "dept2P3"] },
  { title: "dept3Title", points: ["dept3P1"] },
  { title: "dept4Title", points: ["dept4P1", "dept4P2", "dept4P3"] },
];

/** The four areas of work, as title/body key pairs. */
const PILLARS: ReadonlyArray<{ title: string; text: string }> = [
  { title: "pillar1Title", text: "pillar1Text" },
  { title: "pillar2Title", text: "pillar2Text" },
  { title: "pillar3Title", text: "pillar3Text" },
  { title: "pillar4Title", text: "pillar4Text" },
];

/** The in-page sections the side menu points at, in page order. */
const SECTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "legal", label: "heroTitle" },
  { id: "mission", label: "sectionMission" },
  { id: "vision", label: "sectionVision" },
  { id: "how-we-work", label: "sectionHowWeWork" },
  { id: "objectives", label: "sectionObjectives" },
  { id: "departments", label: "sectionDepartments" },
  { id: "pillars", label: "sectionPillars" },
];

const ICONS: Record<string, ReactElement> = {
  mission: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  vision: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  method: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <span aria-hidden="true" className="fd-ico">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

export default function AboutPage() {
  const locale = useLocale();
  const t = useTranslations("about");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");

  /* The side menu marks the section being read. Purely visual: the links are
     ordinary anchors and work without it. */
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter((n): n is HTMLElement => Boolean(n));
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-110px 0px -60% 0px" },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ab-page fd-page">
      <InnerBanner
        id="hero"
        crumbs={[{ label: tNav("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        title={t("heroTitle")}
        lead={t("heroSubtitle")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-side">
          <nav className="fd-nav" aria-label={t("heroTitle")}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} data-on={active === s.id ? "1" : undefined} aria-current={active === s.id ? "location" : undefined} onClick={() => setActive(s.id)}>
                {t(s.label)}
              </a>
            ))}
            <span aria-hidden="true" className="fd-nav-sep" />
            <a href={miaPath("partner", locale)}>{tNav("partner")}</a>
            <a href={miaPath("volunteer", locale)}>{tNav("volunteer")}</a>
          </nav>

          <div className="fd-stack">
            {/* Legal status  the design's registration intro beside a photograph. */}
            <article id="legal" className="fd-card fd-intro fd-anchor fd-in" aria-labelledby="ab-legal-title">
              <div className="fd-intro-text">
                <span className="fd-eyebrow">{t("sectionLegal")}</span>
                <h2 id="ab-legal-title">{t("legalText")}</h2>
                <div className="fd-seal">
                  <span>
                    <small>{t("licenseNumberLabel")}</small>
                    {/* A licence number is Latin digits and a slash: isolated so an
                        RTL paragraph cannot reorder it into a different number. */}
                    <span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>
                      {ORG.licenseNumber}
                    </span>
                  </span>
                  <span>{t("licenseDate")}</span>
                </div>
              </div>
              <div aria-hidden="true" className="fd-intro-img" />
            </article>

            <div className="fd-trio">
              <article id="mission" className="fd-card fd-anchor fd-in fd-in-1">
                <Icon name="mission" />
                <h2>{t("sectionMission")}</h2>
                <p>{t("mission")}</p>
              </article>
              <article id="vision" className="fd-card fd-anchor fd-in fd-in-1">
                <Icon name="vision" />
                <h2>{t("sectionVision")}</h2>
                <p className="fd-strong">{t("vision")}</p>
                <p>{t("visionDetail")}</p>
              </article>
              <article id="how-we-work" className="fd-card fd-anchor fd-in fd-in-2">
                <Icon name="method" />
                <h2>{t("sectionHowWeWork")}</h2>
                <p>{t("howWeWork")}</p>
              </article>
            </div>

            <article id="objectives" className="fd-card fd-pad fd-anchor">
              <h2 className="fd-h2">{t("sectionObjectives")}</h2>
              <ol className="fd-list">
                {OBJECTIVES.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
            </article>

            <article id="departments" className="fd-card fd-pad fd-anchor">
              <h2 className="fd-h2">{t("sectionDepartments")}</h2>
              <div className="fd-tiles">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept.title}>
                    <b>{t(dept.title)}</b>
                    <ul>
                      {dept.points.map((point) => (
                        <li key={point}>{t(point)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>

            <article id="pillars" className="fd-card fd-pad fd-anchor">
              <h2 className="fd-h2">{t("sectionPillars")}</h2>
              <div className="fd-tiles">
                {PILLARS.map((pillar) => (
                  <div key={pillar.title}>
                    <b>{t(pillar.title)}</b>
                    <span>{t(pillar.text)}</span>
                  </div>
                ))}
              </div>
            </article>

            <div className="fd-pair">
              <div className="fd-card fd-item">
                <Icon name="pin" />
                <span className="fd-item-text">
                  <small>{t("addressLabel")}</small>
                  <b>{ORG.address}</b>
                </span>
              </div>
              <div className="fd-card fd-item">
                <Icon name="mail" />
                <span className="fd-item-text">
                  <small>{t("contactLabel")}</small>
                  <b dir="ltr">{ORG.email}</b>
                  <b dir="ltr">{ORG.phone}</b>
                </span>
              </div>
            </div>

            <div className="fd-join">
              <h2>{t("ctaTagline")}</h2>
              <div className="fd-join-actions">
                <a href={miaPath("projects", locale)} className="fd-pill">
                  <span aria-hidden="true" className="fd-pill-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />
                    </svg>
                  </span>
                  {tCommon("donate")}
                </a>
                <a href={miaPath("contact", locale)} className="fd-ghost fd-ghost-dark">
                  {tNav("contact")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}
