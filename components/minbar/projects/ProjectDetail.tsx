"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { MinbarProject, MinbarProjectComment, MinbarProjectUpdate } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import DonationPanel from "./DonationPanel";
import ProjectHeroMedia from "./ProjectHeroMedia";
import ProjectVideo from "./ProjectVideo";
import ProjectComments from "./ProjectComments";
import ProjectUpdatePost from "./ProjectUpdatePost";

/**
 * Project detail  `ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`
 * (the six project files share one template). Styles:
 * `styles/minbar/pages/project-detail.css`.
 *
 * The photo hero with the category tag and the title at its foot, then the
 * two columns: the story beside the sticky donation sidebar. The story
 * column follows the design's sections  القصة (the description as written in
 * the dashboard), the fact tiles, الميزانية (goal / raised / complete) and
 * آخر التحديثات (the campaign's published updates)  and only draws a section
 * when the campaign has the data for it: no fixed goal, no budget; no update,
 * no updates list. The design's الاحتياج / الأثر paragraphs have no campaign
 * field of their own; an editor writes them as headings in the description.
 *
 * Three things the template does not draw are kept because they are the
 * campaign's own content: its film (after the story), its further photos, and
 * donors' messages (posting stays available). The breadcrumb is in the route's
 * JSON-LD only, as the design shows none.
 */

export interface ProjectDetailProps {
  project: MinbarProject;
  updates: MinbarProjectUpdate[];
  gallery: string[];
  /** Settled donations to this campaign. */
  donorCount: number;
  comments: MinbarProjectComment[];
}

export default function ProjectDetail({ project, updates, gallery, donorCount, comments }: ProjectDetailProps) {
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

  /* The design's three fact tiles, from the campaign's own figures only. */
  const facts: Array<{ key: string; value: string; label: string; figure: boolean }> = [
    ...(hasFinancials ? [{ key: "goal", value: format(project.goal as number), label: t("factGoal"), figure: true }] : []),
    ...(project.raised > 0 ? [{ key: "raised", value: format(project.raised), label: t("factRaised"), figure: true }] : []),
    ...(donorCount > 0 ? [{ key: "donors", value: formatNumber(donorCount), label: t("factDonors"), figure: true }] : []),
    ...(!hasFinancials ? [{ key: "duration", value: t("ongoing"), label: t("factDuration"), figure: false }] : []),
  ];

  const heroImages = project.images.length ? project.images : project.image ? [project.image] : [];

  return (
    <div className="pd-page">
      {/* ── Hero (`.proj-hero-img`): the photo, the tag and title at its foot ── */}
      <section className="pd-hero">
        <ProjectHeroMedia images={heroImages} title={project.title} banner />
        {/* Click-through except for its links, so the photos still swipe. */}
        <div className="pd-container pd-hero-inner">
          {project.categories.length ? (
            <nav aria-label={tExtras("categories")} className="pd-hero-tags">
              {project.categories.map((category) => (
                <Link
                  key={category.id}
                  /* By id: the category route resolves it to the canonical, localised page. */
                  href={`/${locale}/category/${category.id}`}
                  className="pd-tag-lg"
                >
                  {category.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <h1>{project.title}</h1>
        </div>
      </section>

      {/* ── Story beside the donation sidebar (`.proj-layout`) ──────────────── */}
      {/* No `overflow: hidden` here: it would make this grid the sidebar's
          sticky container and the sidebar would never stick. */}
      <div id="pd-layout" className="pd-container pd-layout">
        <div className="pd-project-main pd-main">
          <h2>{t("story")}</h2>
          {project.body.map((block, index) =>
            block.kind === "h2" ? (
              <h2 key={index}>{block.text}</h2>
            ) : block.kind === "li" ? (
              <p key={index} className="pd-li">
                <span aria-hidden="true" />
                {block.text}
              </p>
            ) : (
              <p key={index}>{block.text}</p>
            )
          )}

          {project.videoUrl ? (
            <div className="pd-project-video">
              <h2>{tExtras("video")}</h2>
              <ProjectVideo url={project.videoUrl} title={project.title} />
            </div>
          ) : null}

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
            <>
              <h2>{t("budget")}</h2>
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
            </>
          ) : null}

          {gallery.length ? (
            <>
              <h2>{t("gallery")}</h2>
              <div className="pd-gallery">
                {gallery.map((src, i) => (
                  <span key={src} role="img" aria-label={`${project.title}  ${i + 1}`} style={{ backgroundImage: `url('${src.replace(/'/g, "%27")}')` }} />
                ))}
              </div>
            </>
          ) : null}

          {updates.length ? (
            <section id="updates" className="pd-anchor">
              <h2>{t("updates")}</h2>
              <div className="pd-updates">
                {updates.map((update) => (
                  <ProjectUpdatePost key={update.id} update={update} projectTitle={project.title} />
                ))}
              </div>
            </section>
          ) : null}

          <section id="comments" className="pd-anchor">
            <h2>{comments.length ? `${tExtras("tabComments")} (${formatNumber(comments.length)})` : tExtras("tabComments")}</h2>
            <ProjectComments projectId={project.id} initial={comments} />
          </section>
        </div>

        {/* The sidebar column runs the full height of the row so its content
            can stick beside the story. */}
        <aside className="pd-aside-col">
          <div className="pd-aside-sticky">
            <DonationPanel project={project} donorCount={donorCount} />
          </div>
        </aside>
      </div>
    </div>
  );
}
