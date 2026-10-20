"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarProject } from "@/lib/minbar/projects";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import { NoResults } from "@/components/minbar/states/ContentStates";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import CategoryIcon, { type CategoryIconName } from "./CategoryIcons";
import ProjectsHero, { type ProjectSlide } from "./ProjectsHero";

/**
 * Projects catalogue  ported from `Minbar/المشاريع.dc.html`.
 *
 * A hero carousel, a row of category filter chips, and a responsive grid of the
 * site's project card that grows as the reader scrolls: a sentinel below the
 * grid appends the next page when it comes within a screen of the viewport,
 * so the catalogue reads as one continuous list. A "load more" button stays
 * under the grid for whoever the observer does not reach  a keyboard user
 * tabbing past the cards, a browser without IntersectionObserver  and is the
 * accessible name of what the scroll is doing.
 *
 * Filters compare category **ids**, never displayed labels: comparing labels
 * detaches the filter from its state the moment the labels are translated (the
 * same trap the handoff calls out for the FAQ and frequency chips).
 *
 * The chip set is driven by the categories that actually exist in the CMS, so a
 * category with no published projects does not appear as a filter that returns
 * nothing.
 */

const PAGE_SIZE = 6;

/**
 * The projects page intentionally exposes only the eight destinations approved
 * for the public information architecture. Other CMS categories remain usable
 * internally, but never grow the public filter rail automatically.
 *
 * Three entries filter the project grid; two are direct site destinations
 * (zakat, Jerusalem-home restoration); "all" clears the filter.
 */
const PUBLIC_PROJECT_FILTERS = [
  { id: "all", icon: "layout-grid" as CategoryIconName, kind: "filter" as const },
  { id: "region-al-quds", icon: "landmark" as CategoryIconName, kind: "filter" as const },
  { id: "region-gaza", icon: "hand-heart" as CategoryIconName, kind: "filter" as const },
  { id: "region-al-aqsa", icon: "moon-star" as CategoryIconName, kind: "filter" as const },
  { id: "zakat", icon: "hand-coins" as CategoryIconName, kind: "link" as const, route: "zakat" as const },
  { id: "repair", icon: "home" as CategoryIconName, kind: "link" as const, route: "restoration" as const },
] as const;

export interface ProjectsPageProps {
  projects: MinbarProject[];
  slides: ProjectSlide[];
}

export default function ProjectsPage({ projects, slides }: ProjectsPageProps) {
  const locale = useLocale();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("homepage");
  const tNav = useTranslations("navigation");
  const tSystem = useTranslations("system");

  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const categories = useMemo(() => PUBLIC_PROJECT_FILTERS.map((item) => {
    if (item.id === "all") return { ...item, label: tSystem("allFilter") };
    if (item.id === "region-al-quds") return { ...item, label: tHome("regionQuds") };
    if (item.id === "region-gaza") return { ...item, label: tHome("storyGaza") };
    if (item.id === "region-al-aqsa") return { ...item, label: tNav("aqsa") };
    if (item.id === "zakat") return { ...item, label: locale === "ar" ? "زكاة" : tNav("zakat") };
    return { ...item, label: t("catHomeRepair") };
  }), [locale, t, tHome, tNav, tSystem]);

  const filtered = useMemo(
    () => (category === "all" ? projects : projects.filter((p) => p.categories.some((c) => c.slug === category))),
    [projects, category]
  );

  const visible = filtered.slice(0, limit);
  const remaining = Math.max(0, filtered.length - limit);
  const hasMore = remaining > 0;

  /* The next page arrives when the sentinel is a viewport away, before the
     reader reaches the end  the gap they would have scrolled into is already
     filled. The observer is rebuilt when the sentinel unmounts (nothing left)
     and remounts (a filter change resets the limit). */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLimit((n) => n + PAGE_SIZE); },
      { rootMargin: "0px 0px 100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, category]);

  return (
    /* Toplum Vakfı Projects.dc.html: on the plain page background, the
       carousel card, the filter pill bar and the card grid share one 1180px
       container. Layout lives in styles/minbar/pages/projects.css under the
       `tvp-*` classes; the ids and the classes below that the phone rules in
       minbar.css and the regression tests name are kept. */
    <div className="mia-projects-page" style={{ position: "relative" }}>
      <ProjectsHero slides={slides} />

      <section id="project-filters-section" className="tvp-filters-section">
        <div className="tvp-wrap">
          <div className="proj-filters-wrap">
            <div className="tvp-filters" id="tvp-filters">
            {categories.map((c) => {
              if (c.kind === "link") {
                const href = c.route === "zakat" ? miaPath("zakat", locale) : miaPath("restorationProject", locale);
                return (
                  <a key={c.id} href={href} className="tvp-chip">
                    <span className="tvp-chip-ico">
                      <CategoryIcon name={c.icon} />
                    </span>
                    {c.label}
                  </a>
                );
              }

              return (
                <button
                  key={c.id}
                  type="button"
                  data-cat={category === c.id ? "1" : ""}
                  aria-pressed={category === c.id}
                  aria-controls="all"
                  onClick={() => {
                    setCategory(c.id);
                    setLimit(PAGE_SIZE);
                  }}
                  className="tvp-chip"
                >
                  <span className="tvp-chip-ico">
                    <CategoryIcon name={c.icon} />
                  </span>
                  {c.label}
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      <section id="all" className="tvp-list">
        <div className="tvp-wrap" style={{ display: "grid", gap: 24 }}>
          {visible.length ? (
            <div className="tvp-grid">
              {visible.map((project) => (
                <ProjectDonateCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            /* The approved empty state, and the right one of the three: a
               reader who filtered their way here needs the filters cleared,
               not a link somewhere else. */
            <NoResults onReset={() => setCategory("all")} />
          )}

          {remaining > 0 ? (
            <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", paddingTop: 10 }} aria-live="polite">
              <button type="button" onClick={() => setLimit((n) => n + PAGE_SIZE)} className="tvp-more">
                {tCommon("loadMore", { count: remaining })}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <ZakatBanner />
      <TravelBanner />
    </div>
  );
}
