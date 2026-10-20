"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarProject, MinbarProjectComment, MinbarProjectUpdate } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import { ArrowGlyph } from "@/components/minbar/home/TopSections";
import DonationPanel from "./DonationPanel";
import ProjectHeroMedia from "./ProjectHeroMedia";
import ProjectVideo from "./ProjectVideo";
import ProjectComments from "./ProjectComments";
import ProjectUpdatePost from "./ProjectUpdatePost";

/**
 * Project detail  laid out on `ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`.
 *
 * A full-bleed photo hero (the campaign's photos, swipeable when there are
 * several) carrying the breadcrumb, the category tags, the title and the
 * opening of the description; under it the design's two columns: the story
 * (video, key facts, the tabbed body  about / field updates / gallery /
 * donors' messages  the project FAQ and the zakat cross-link)
 * beside the sticky donation sidebar; then related projects.
 *
 * The design draws its hero behind a glass header. The app's header is a
 * solid fixed bar with its own spacer, so the hero starts under it instead.
 *
 * Every campaign field the page can show is shown: the whole formatted
 * description, the campaign's own video and photos, each category it is filed
 * under, how many donors it has, and donors' messages.
 *
 * The Updates and Gallery tabs only appear when there is something in them.
 * The handoff is firm that reports and photographs are shown once approved and
 * linked to the project  an empty tab implies content that does not exist.
 */

export interface ProjectDetailProps {
  project: MinbarProject;
  updates: MinbarProjectUpdate[];
  gallery: string[];
  related: MinbarProject[];
  /** Settled donations to this campaign. */
  donorCount: number;
  comments: MinbarProjectComment[];
}

/** The hero shows the opening of the description; the About tab has all of it. */
const HERO_SUMMARY_MAX = 280;

/** The design's body copy and section headings inside the story column. */
const BODY_P = { margin: 0, fontSize: 15, lineHeight: 1.95, color: "#33495e" } as const;
const SECTION_H2 = { margin: 0, fontSize: 19, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" } as const;

export default function ProjectDetail({ project, updates, gallery, related, donorCount, comments }: ProjectDetailProps) {
  const locale = useLocale();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tHome = useTranslations("homepage");
  const tExtras = useTranslations("ProjectExtras");
  const { format } = useMinbarMoney();
  const summary = project.text.length > HERO_SUMMARY_MAX ? `${project.text.slice(0, HERO_SUMMARY_MAX - 1).trimEnd()}…` : project.text;

  const tabs = [
    { id: "about", label: t("tabAbout"), available: true },
    { id: "updates", label: t("tabUpdates"), available: updates.length > 0 },
    { id: "gallery", label: t("tabField"), available: gallery.length > 0 },
    /* Always offered: an empty list still invites the first message. */
    { id: "comments", label: comments.length ? `${tExtras("tabComments")} (${comments.length})` : tExtras("tabComments"), available: true },
  ].filter((tab) => tab.available);

  const [tab, setTab] = useState("about");

  /* A link to #updates (the update emails use one) or #comments opens that
     tab and brings the section into view. */
  useEffect(() => {
    const wanted = window.location.hash.replace("#", "");
    if (!wanted || !tabs.some((item) => item.id === wanted)) return;
    setTab(wanted);
    window.requestAnimationFrame(() => document.getElementById("pd-body")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The design's fact tiles, from the campaign's own figures only: where it
     works, what it has raised, and its target when it has one. */
  const hasFinancials = project.goal != null && project.goal > 0;
  const facts: Array<{ key: string; value: string; label: string; figure?: boolean }> = [
    ...(project.regionLabel ? [{ key: "region", value: project.regionLabel, label: t("factRegion") }] : []),
    ...(hasFinancials || project.raised > 0
      ? [{ key: "raised", value: format(project.raised), label: hasFinancials ? tCommon("raised") : t("raisedSoFar"), figure: true }]
      : []),
    ...(hasFinancials ? [{ key: "goal", value: format(project.goal as number), label: tCommon("goal"), figure: true }] : []),
  ];

  /* The region is normally the first category too; it is only drawn as its
     own tag when no category link already says it. */
  const regionTag = project.regionLabel && !project.categories.some((category) => category.label === project.regionLabel) ? project.regionLabel : null;

  return (
    <div className="pd-page" style={{ position: "relative" }}>
      <div
        aria-hidden="true"
        data-aqsa-pattern=""
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/toplum/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "620px 620px",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Hero: the photo full-bleed, the title over its foot ─────────── */}
      <section className="pd-hero" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", overflow: "hidden", background: "#031a36" }}>
        <ProjectHeroMedia images={project.images.length ? project.images : project.image ? [project.image] : []} title={project.title} banner />

        {/* Click-through except for its links, so the photos still swipe. */}
        <div className="pd-container pd-hero-inner" style={{ position: "relative", zIndex: 1, display: "grid", gap: 12, justifyItems: "start", color: "#fff", pointerEvents: "none" }}>
          {/* Breadcrumb  `PRODUCTION_SEO_CONTRACT.md` asks for BreadcrumbList
              structured data on detail pages; it is emitted by the route. */}
          <nav aria-label={tNav("home")} className="pd-crumbs" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#cfe3f1", flexWrap: "wrap", pointerEvents: "auto" }}>
            <Link href={miaPath("home", locale)}>{tNav("home")}</Link>
            <span aria-hidden="true" style={{ display: "inline-flex", color: "#7fd6f5" }}>
              <ArrowGlyph size={11} />
            </span>
            <Link href={miaPath("projects", locale)}>{tNav("projects")}</Link>
            <span aria-hidden="true" style={{ display: "inline-flex", color: "#7fd6f5" }}>
              <ArrowGlyph size={11} />
            </span>
            <span style={{ color: "#fff" }}>{project.title}</span>
          </nav>

          {regionTag || project.categories.length ? (
            <nav aria-label={tExtras("categories")} style={{ display: "flex", flexWrap: "wrap", gap: 8, pointerEvents: "auto" }}>
              {regionTag ? <span className="pd-tag-lg">{regionTag}</span> : null}
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

          <h1 style={{ margin: 0, maxWidth: "30ch", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.4, fontWeight: 800, color: "#fff" }}>{project.title}</h1>
          {summary ? <p style={{ margin: 0, maxWidth: "70ch", fontSize: 15, lineHeight: 1.9, color: "#cfe3f1" }}>{summary}</p> : null}
        </div>
      </section>

      {/* ── Story beside the donation sidebar ────────────────────────────── */}
      {/* No `overflow: hidden` here: it would make this grid the sidebar's
          sticky container and the sidebar would never stick. */}
      <div id="pd-layout" className="pd-container pd-layout" style={{ position: "relative", zIndex: 1 }}>
        <div className="pd-project-main" style={{ display: "grid", gap: 30, minWidth: 0, alignContent: "start" }}>
          {project.videoUrl ? (
            <div className="pd-project-video" style={{ display: "grid", gap: 14 }}>
              <h2 style={SECTION_H2}>{tExtras("video")}</h2>
              <ProjectVideo url={project.videoUrl} title={project.title} />
            </div>
          ) : null}

          {facts.length ? (
            <div className="pd-facts">
              {facts.map((fact) => (
                <div key={fact.key} className="pd-fact">
                  {fact.figure ? (
                    <b dir="ltr" style={{ unicodeBidi: "isolate" }}>
                      {fact.value}
                    </b>
                  ) : (
                    <b>{fact.value}</b>
                  )}
                  <span>{fact.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div id="pd-body" style={{ display: "grid", gap: 20, minWidth: 0, scrollMarginTop: 100 }}>
            <div className="pd-tabs" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-tab={tab === item.id ? "1" : ""}
                  onClick={() => setTab(item.id)}
                  className="pd-tab"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "about" ? (
              <div style={{ display: "grid", gap: 14 }}>
                {/* The description as written in the dashboard's editor
                    headings, paragraphs and list items. */}
                {project.body.map((block, index) =>
                  block.kind === "h2" ? (
                    <h2 key={index} style={{ ...SECTION_H2, marginTop: index === 0 ? 0 : 18 }}>{block.text}</h2>
                  ) : block.kind === "li" ? (
                    <p key={index} style={{ ...BODY_P, display: "flex", gap: 10 }}>
                      <span aria-hidden="true" style={{ flex: "0 0 auto", width: 6, height: 6, marginTop: 12, borderRadius: 999, background: "var(--gold)" }} />
                      <span>{block.text}</span>
                    </p>
                  ) : (
                    <p key={index} style={BODY_P}>{block.text}</p>
                  )
                )}
                {/* Two standing paragraphs the handoff shows on every project:
                    how the work is executed, and how it is verified. */}
                <p style={BODY_P}>{t("execParagraph", { region: project.regionLabel ?? tCommon("regionGeneral") })}</p>
                <p style={BODY_P}>{t("verifyParagraph")}</p>
              </div>
            ) : null}

            {tab === "updates" ? (
              /* Updates read as a feed of posts from the field  newest first. */
              <div style={{ display: "grid", gap: 14 }}>
                {updates.map((update) => (
                  <ProjectUpdatePost key={update.id} update={update} projectTitle={project.title} />
                ))}
              </div>
            ) : null}

            {tab === "comments" ? <ProjectComments projectId={project.id} initial={comments} /> : null}

            {tab === "gallery" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
                {gallery.map((src, i) => (
                  <span
                    key={src}
                    role="img"
                    aria-label={`${project.title}  ${i + 1}`}
                    style={{ display: "block", aspectRatio: "4/3", borderRadius: 12, backgroundImage: `url('${src}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid #e6eef3" }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Project FAQ ─────────────────────────────────────────────── */}
          <div style={{ display: "grid", gap: 14 }}>
            <h2 style={SECTION_H2}>{t("projectFaq")}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { q: t("faqZakatQ"), a: t("faqZakatYes") },
                { q: t("faqTrackQ"), a: t("faqTrackA") },
                { q: t("faqRecurringQ"), a: t("faqRecurringA") },
              ].map((faq) => (
                <div key={faq.q} className="pd-card" style={{ display: "grid", gap: 6, padding: "16px 18px" }}>
                  <b style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--deep)" }}>{faq.q}</b>
                  <span style={{ fontSize: 13.5, lineHeight: 1.85, color: "var(--muted)" }}>{faq.a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Zakat cross-link ────────────────────────────────────────── */}
          <div className="pd-cross-row">
            <Link href={miaPath("zakat", locale)} className="pd-cross pd-cross--zakat">
              <span className="pd-eyebrow" style={{ color: "#cfe3f1" }}>
                {tNav("zakat")}
              </span>
              <b style={{ color: "#fff", fontSize: 17, lineHeight: 1.5 }}>{tHome("zakatBannerTitle")}</b>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 800, color: "#7fd6f5" }}>
                {tCommon("zakatToPalestine")}
                <ArrowGlyph />
              </span>
            </Link>
          </div>
        </div>

        {/* The sidebar column runs the full height of the row so its content
            can stick beside the story. */}
        <aside className="pd-aside-col" style={{ minWidth: 0 }}>
          <div className="pd-aside-sticky" style={{ display: "grid", gap: 14 }}>
            <DonationPanel project={project} donorCount={donorCount} />
          </div>
        </aside>
      </div>

      {related.length ? (
        <section style={{ position: "relative", zIndex: 1, padding: "0 0 70px" }}>
          <div className="pd-container" style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "clamp(22px,2.3vw,28px)", fontWeight: 800, color: "var(--deep)" }}>{t("relatedProjects")}</h2>
              <Link href={miaPath("projects", locale)} style={{ fontSize: 14, fontWeight: 800, color: "#0077b3", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t("allProjects")}
                <ArrowGlyph />
              </Link>
            </div>
            <div id="pd-related" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={miaPath("projectDetail", locale, item.slug)}
                  className="mia-lift pd-related-card"
                  style={{ position: "relative", display: "flex", flexDirection: "column", minHeight: 260, borderRadius: 16, overflow: "hidden", background: "#031a36", border: "1px solid #e6eef3", boxShadow: "0 12px 28px rgba(2,52,88,.07)" }}
                >
                  {item.image ? (
                    <span role="img" aria-label={item.title} style={{ position: "absolute", inset: 0, display: "block", backgroundImage: `url('${item.image}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  ) : null}
                  <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(2,20,38,.9) 22%, rgba(2,20,38,.15) 74%)" }} />
                  <span style={{ position: "relative", marginTop: "auto", display: "grid", gap: 8, justifyItems: "start", padding: 18 }}>
                    {item.regionLabel ? <span className="pd-tag-lg">{item.regionLabel}</span> : null}
                    <b style={{ color: "#fff", fontSize: 17, lineHeight: 1.45, fontWeight: 800 }}>{item.title}</b>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ZakatBanner />
      <TravelBanner />
    </div>
  );
}
