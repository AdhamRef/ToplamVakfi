"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { MinbarProject, MinbarProjectComment, MinbarProjectDonations, MinbarProjectUpdate } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { miaPath } from "@/lib/minbar/routes";
import { imageUrl } from "@/lib/minbar/image-url";
import { ORG } from "@/lib/minbar/org";
import DonationPanel from "./DonationPanel";
import ProjectHeroMedia from "./ProjectHeroMedia";
import ProjectVideo from "./ProjectVideo";
import ProjectComments from "./ProjectComments";
import ProjectUpdatePost from "./ProjectUpdatePost";
import { SHARE_SECTION_ID, ShareButton, ShareLinks } from "./ProjectShare";

/**
 * Project detail, laid out like a GoFundMe campaign in the Toplum Vakfı
 * identity. Styles: `styles/minbar/pages/project-detail.css` (`pd-gf-*`).
 *
 * The title and the campaign's categories on top; then the photos beside the
 * sticky donation card (ring, giving controls, share, latest donations).
 * Under the photos: who runs it and the protected-giving badge, the story
 * (folded with «اقرأ المزيد» when long), donate / share buttons, and every
 * section the campaign has data for  its film, the fact tiles, الميزانية,
 * its further photos, آخر التحديثات, then the share card, the organiser and
 * the donors' messages (posting stays available).
 *
 * On a phone the donation card comes straight after the photos, then the
 * story. Nothing the previous layout showed is dropped.
 */

export interface ProjectDetailProps {
  project: MinbarProject;
  updates: MinbarProjectUpdate[];
  gallery: string[];
  /** Settled donations to this campaign. */
  donorCount: number;
  comments: MinbarProjectComment[];
  donations?: MinbarProjectDonations;
}

/** The story is folded past this height (px) and opens on «اقرأ المزيد». */
const STORY_FOLD = 360;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function ProjectStory({ project }: { project: MinbarProject }) {
  const tExtras = useTranslations("ProjectExtras");
  const body = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);

  useIsoLayoutEffect(() => {
    const node = body.current;
    if (node) setLong(node.scrollHeight > STORY_FOLD + 80);
  }, [project.body]);

  return (
    <div className={`pd-story${long && !open ? " is-folded" : ""}`}>
      <div ref={body} className="pd-story-body" id="pd-story-body">
        {project.body.map((block, index) =>
          block.kind === "h2" ? (
            <h3 key={index}>{block.text}</h3>
          ) : block.kind === "li" ? (
            <p key={index} className="pd-li">
              <span aria-hidden="true" />
              {block.text}
            </p>
          ) : (
            <p key={index}>{block.text}</p>
          )
        )}
      </div>
      {long ? (
        <button type="button" className="pd-story-more" aria-expanded={open} aria-controls="pd-story-body" onClick={() => setOpen((v) => !v)}>
          {open ? tExtras("showLess") : tExtras("readMore")}
        </button>
      ) : null}
    </div>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  const { formatNumber } = useMinbarMoney();
  return (
    <h2 className="pd-gf-h2">
      {children}
      {count ? <span className="pd-gf-count">{formatNumber(count)}</span> : null}
    </h2>
  );
}

export default function ProjectDetail({ project, updates, gallery, donorCount, comments, donations }: ProjectDetailProps) {
  const locale = useLocale();
  const t = useTranslations("projects.tv");
  const tExtras = useTranslations("ProjectExtras");
  const { format, formatNumber } = useMinbarMoney();

  /* A link to #updates (the update emails use one) or #comments brings that
     section into view once the page has laid out. */
  useEffect(() => {
    const wanted = window.location.hash.replace("#", "");
    if (wanted !== "updates" && wanted !== "comments") return;
    window.requestAnimationFrame(() => document.getElementById(wanted)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const hasFinancials = project.goal != null && project.goal > 0;
  const pct = hasFinancials ? Math.min((project.raised / (project.goal as number)) * 100, 100) : 0;
  const remaining = hasFinancials ? Math.max((project.goal as number) - project.raised, 0) : 0;

  /* The design's fact tiles, from the campaign's own figures only. */
  const facts: Array<{ key: string; value: string; label: string; figure: boolean }> = [
    ...(hasFinancials ? [{ key: "goal", value: format(project.goal as number), label: t("factGoal"), figure: true }] : []),
    ...(project.raised > 0 ? [{ key: "raised", value: format(project.raised), label: t("factRaised"), figure: true }] : []),
    ...(donorCount > 0 ? [{ key: "donors", value: formatNumber(donorCount), label: t("factDonors"), figure: true }] : []),
    ...(!hasFinancials ? [{ key: "duration", value: t("ongoing"), label: t("factDuration"), figure: false }] : []),
  ];

  const heroImages = project.images.length ? project.images : project.image ? [project.image] : [];

  /* The inline «تبرع» brings the donation card into view and onto its first amount. */
  const toDonate = () => {
    const card = document.getElementById("pd-aside");
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.querySelector<HTMLElement>(".pd-ds-amounts button, .pd-custom")?.focus({ preventScroll: true });
  };

  const logo = imageUrl("/toplum/logo-mark.png", 96);

  return (
    <div className="pd-page pd-gf">
      <div className="pd-container">
        {/* ── Title and categories ─────────────────────────────────────── */}
        <header className="pd-gf-head">
          {project.categories.length ? (
            <nav aria-label={tExtras("categories")} className="pd-gf-tags">
              {project.categories.map((category) => (
                <Link
                  key={category.id}
                  /* By id: the category route resolves it to the canonical, localised page. */
                  href={`/${locale}/category/${category.id}`}
                  className="pd-gf-tag"
                >
                  {category.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <h1>{project.title}</h1>
        </header>

        {/* No `overflow: hidden` here: it would make this grid the card's
            sticky container and the card would never stick. */}
        <div id="pd-layout" className="pd-gf-grid">
          <div className="pd-gf-media">
            <ProjectHeroMedia images={heroImages} title={project.title} />
          </div>

          {/* The card's column runs the full height of the page so it sticks. */}
          <aside className="pd-aside-col pd-gf-aside">
            <div className="pd-aside-sticky">
              <DonationPanel project={project} donorCount={donorCount} donations={donations} />
            </div>
          </aside>

          <div className="pd-gf-body pd-project-main">
            {/* ── Who runs it, and the protected-giving badge ──────────── */}
            <div className="pd-gf-org">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pd-gf-org-logo" src={logo} alt="" width={40} height={40} />
              <p>{t("organizedBy", { name: ORG.legalName })}</p>
            </div>
            <span className="pd-gf-protected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {t("protected")}
            </span>

            {/* ── Story ─────────────────────────────────────────────────── */}
            <section className="pd-gf-section pd-gf-section--story" aria-label={t("story")}>
              <ProjectStory project={project} />
              <div className="pd-gf-actions">
                <button type="button" className="pd-gf-btn pd-gf-btn--donate" onClick={toDonate}>
                  {t("donateNow")}
                </button>
                <ShareButton title={project.title} className="pd-gf-btn" />
              </div>
            </section>

            {project.videoUrl ? (
              <section className="pd-gf-section pd-project-video">
                <SectionTitle>{tExtras("video")}</SectionTitle>
                <ProjectVideo url={project.videoUrl} title={project.title} />
              </section>
            ) : null}

            {facts.length || hasFinancials ? (
              <section className="pd-gf-section">
                {hasFinancials ? <SectionTitle>{t("budget")}</SectionTitle> : null}
                {facts.length ? (
                  <div className="pd-facts">
                    {facts.map((fact) => (
                      <div key={fact.key} className="pd-fact">
                        {fact.figure ? <b dir="ltr">{fact.value}</b> : <b>{fact.value}</b>}
                        <span>{fact.label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {hasFinancials ? (
                  <div className="pd-budget">
                    <div className="pd-budget-bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="pd-budget-row">
                      <span>
                        {t("goalLabel")} <b dir="ltr">{format(project.goal as number)}</b>
                      </span>
                      <span>
                        {t("raisedLabel")} <b dir="ltr">{format(project.raised)}</b>
                      </span>
                      <span>{t("complete", { pct: formatNumber(Math.round(pct)) })}</span>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {gallery.length ? (
              <section className="pd-gf-section">
                <SectionTitle count={gallery.length}>{t("gallery")}</SectionTitle>
                <div className="pd-gallery">
                  {gallery.map((src, i) => (
                    <span key={src} role="img" aria-label={`${project.title}  ${i + 1}`} style={{ backgroundImage: `url('${src.replace(/'/g, "%27")}')` }} />
                  ))}
                </div>
              </section>
            ) : null}

            {updates.length ? (
              <section id="updates" className="pd-gf-section pd-anchor">
                <SectionTitle count={updates.length}>{t("updates")}</SectionTitle>
                <div className="pd-updates">
                  {updates.map((update) => (
                    <ProjectUpdatePost key={update.id} update={update} projectTitle={project.title} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── Sharing makes a difference ─────────────────────────────── */}
            <section id={SHARE_SECTION_ID} className="pd-gf-section pd-anchor">
              <SectionTitle>{t("shareTitle")}</SectionTitle>
              <p className="pd-gf-lead">{t("shareLead")}</p>
              <div className="pd-share-card">
                <div className="pd-share-preview">
                  <div className="pd-share-preview-text">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" width={28} height={28} />
                    <b>{project.title}</b>
                    <span>{t("organizedBy", { name: ORG.legalName })}</span>
                  </div>
                  <div className="pd-share-preview-img" style={project.image ? { backgroundImage: `url('${project.image.replace(/'/g, "%27")}')` } : undefined}>
                    {hasFinancials && remaining > 0 ? (
                      <span className="pd-share-chip">{t("toGoal", { amount: format(remaining) })}</span>
                    ) : null}
                    <span className="pd-share-chip pd-share-chip--cta">{t("donateNow")}</span>
                  </div>
                </div>
                <ShareLinks title={project.title} />
              </div>
            </section>

            {/* ── The organiser ──────────────────────────────────────────── */}
            <section className="pd-gf-section">
              <SectionTitle>{t("organizer")}</SectionTitle>
              <div className="pd-gf-organizer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pd-gf-org-logo" src={logo} alt="" width={48} height={48} />
                <div>
                  <b>{ORG.legalName}</b>
                  <span>{t("organizerRole")}</span>
                  <span dir="ltr" className="pd-gf-organizer-place">{ORG.address}</span>
                  <Link href={miaPath("contact", locale)} className="pd-gf-btn pd-gf-btn--sm">
                    {t("contactOrganizer")}
                  </Link>
                </div>
              </div>
            </section>

            {/* ── Donors' messages ───────────────────────────────────────── */}
            <section id="comments" className="pd-gf-section pd-anchor">
              <SectionTitle count={comments.length}>{tExtras("tabComments")}</SectionTitle>
              <ProjectComments projectId={project.id} initial={comments} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
