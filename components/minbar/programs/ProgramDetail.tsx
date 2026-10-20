"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PROGRAMS, PROGRAM_ICONS, type ProgramSlug } from "@/lib/minbar/programs-content";
import { TV_FALLBACK_IMAGE } from "@/lib/minbar/programs-match";

/**
 * One programme — `ToplamVakfi-design/Toplum Vakfı Program - <name>.dc.html`.
 *
 * The six design pages share one layout: a photo hero with the programme's
 * badge and name, a heading and intro over four field-of-work cards, the
 * projects linked to the programme, and a closing call to give (plus the
 * design's sticky donate bar on phones). The copy is the programme's entry in
 * `tvPrograms.detail`; the linked projects are real campaigns matched to the
 * programme's theme, and every "donate" goes to a real destination.
 */

export interface ProgramLinkedProject {
  title: string;
  href: string;
  image: string | null;
}

export default function ProgramDetail({
  slug,
  heroImage,
  linked,
  donateHref,
}: {
  slug: ProgramSlug;
  heroImage: string | null;
  linked: ProgramLinkedProject[];
  /** The programme's category page, its first campaign, or the projects list. */
  donateHref: string;
}) {
  const t = useTranslations("tvPrograms");
  const entry = PROGRAMS[slug];
  const k = (key: string) => t(`detail.${slug}.${key}`);

  return (
    <div className="tvg-page tvg-prog-page">
      <div className="tvg-sticky-donate">
        <Link href={donateHref}>{t("donateNow")}</Link>
      </div>

      <div className="tvg-prog-hero" style={{ ["--tvg-img" as string]: `url("${heroImage || TV_FALLBACK_IMAGE}")` }}>
        <div className="tvg-container tvg-prog-hero-in">
          <span>{t("detail.badge")}</span>
          <h1>{k("title")}</h1>
        </div>
      </div>

      <div className="tvg-prog-sec">
        <div className="tvg-container">
          <h2>{k("heading")}</h2>
          <p className="tvg-prog-intro">{k("intro")}</p>
          <div className="tvg-areas">
            {entry.areas.map((icon, i) => (
              <div key={`${icon}-${i}`} className="tvg-area">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PROGRAM_ICONS[icon] }} />
                <h3>{k(`a${i + 1}`)}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {linked.length ? (
        <div className="tvg-prog-sec tvg-prog-linked">
          <div className="tvg-container">
            <h2>{t("detail.linkedTitle")}</h2>
            <div className="tvg-lp-grid">
              {linked.map((project) => (
                <Link key={project.href} className="tvg-lp-card" href={project.href}>
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

      <div className="tvg-prog-cta">
        <div className="tvg-container">
          <h2>{t("detail.ctaTitle")}</h2>
          <Link href={donateHref}>{t("donateNow")}</Link>
        </div>
      </div>
    </div>
  );
}
