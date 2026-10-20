"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { cssImage } from "@/lib/minbar/image-url";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Stories  `ToplamVakfi-design/Toplum Vakfı Stories.dc.html`: photo banner, a
 * feature card pointing to the foundation's YouTube channel beside a video
 * thumbnail, then "stories from our projects" with one project story card.
 *
 * The story card links to the live project when the route found it in the
 * database (`project`), using that project's own photograph; otherwise it
 * links to the projects list. Styles: `.fd-sr-*` in `styles/minbar/pages/about.css`.
 */

const PLAY = <path d="M8 5.5v13l10.5-6.5z" />;

export default function StoriesPage({ project }: { project: { slug: string; image: string | null } | null }) {
  const locale = useLocale();
  const t = useTranslations("tvStories");
  const tAbout = useTranslations("about");
  const youtube = ORG.social.youtube;

  const projectHref = project ? miaPath("projectDetail", locale, project.slug) : miaPath("projects", locale);
  const projectImage = project?.image ? cssImage(project.image, 1000) : "url('/toplum/hero-bg-800.webp')";

  return (
    <div className="fd-page fd-p-stories">
      <InnerBanner crumbs={[{ label: tAbout("home"), href: miaPath("home", locale) }, { label: t("title") }]} crumbLabel={tAbout("crumbLabel")} title={t("title")} />

      <div className="fd-main">
        <div className="fd-wrap">
          <article className="fd-card fd-sr-hero">
            <div>
              <span className="fd-script">{t("script")}</span>
              <h2>{t("heading")}</h2>
              <p>{t("text")}</p>
              <a className="fd-pill" href={youtube} target="_blank" rel="noopener noreferrer">
                <span className="fd-pill-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {PLAY}
                  </svg>
                </span>
                {t("youtubeCta")}
              </a>
            </div>
            <a
              className="fd-sr-video"
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("videoLabel")}
              style={{ backgroundImage: "url('/toplum/hero-bg-800.webp')" }}
            >
              <span className="fd-sr-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  {PLAY}
                </svg>
              </span>
            </a>
          </article>

          <section className="fd-sec" aria-labelledby="fd-sr-projects">
            <h2 id="fd-sr-projects" className="fd-h2">
              {t("projectsTitle")}
            </h2>
            <p className="fd-sub">{t("projectsSub")}</p>
            <article className="fd-card fd-sr-proj">
              <div className="fd-sr-proj-text">
                <h3>{t("story1.title")}</h3>
                <p>{t("story1.text")}</p>
                <Link className="fd-pill" href={projectHref}>
                  <span className="fd-pill-ico" aria-hidden="true">
                    <span className="fd-arrow">←</span>
                  </span>
                  {t("story1.cta")}
                </Link>
              </div>
              <div className="fd-sr-proj-img" role="img" aria-label={t("story1.imgAlt")} style={{ backgroundImage: projectImage }}>
                <span className="fd-tag">{t("story1.tag")}</span>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
