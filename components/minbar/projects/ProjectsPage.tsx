"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { MinbarProject } from "@/lib/minbar/projects";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import { NoResults } from "@/components/minbar/states/ContentStates";
import ProjectsHero, { type ProjectSlide } from "./ProjectsHero";

/**
 * Projects catalogue  `ToplamVakfi-design/Toplum Vakfı Projects.dc.html`.
 *
 * The carousel card, the white pill bar of filter chips, and the grid of
 * project cards, all in one 1180px container on the page background. Layout:
 * `styles/minbar/pages/projects.css` (`tvp-*`); the card is `tvpc-*`.
 *
 * The chips are the categories the published campaigns are actually filed
 * under (the design's "حملة أمل / بناء الإنسان / …" are its sample
 * categories), in the order they first appear in the catalogue, so a chip
 * never returns nothing. Filters compare category ids, never translated
 * labels.
 *
 * The grid grows as the reader scrolls: a sentinel a screen below the grid
 * appends the next page; the "load more" button under it does the same for a
 * keyboard user or a browser without IntersectionObserver.
 */

const PAGE_SIZE = 9;

export interface ProjectsPageProps {
  projects: MinbarProject[];
  slides: ProjectSlide[];
}

export default function ProjectsPage({ projects, slides }: ProjectsPageProps) {
  const tCommon = useTranslations("common");
  const tCard = useTranslations("projects.tv");

  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const project of projects) {
      for (const c of project.categories) if (!seen.has(c.id)) seen.set(c.id, c.label);
    }
    return [
      { id: "all", label: tCard("filterAll") },
      ...[...seen.entries()].map(([id, label]) => ({ id, label })),
    ];
  }, [projects, tCard]);

  const filtered = useMemo(
    () => (category === "all" ? projects : projects.filter((p) => p.categories.some((c) => c.id === category))),
    [projects, category]
  );

  const visible = filtered.slice(0, limit);
  const remaining = Math.max(0, filtered.length - limit);
  const hasMore = remaining > 0;

  /* The next page arrives when the sentinel is a viewport away. The observer
     is rebuilt when the sentinel unmounts and remounts (a filter change). */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLimit((n) => n + PAGE_SIZE);
      },
      { rootMargin: "0px 0px 100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, category]);

  return (
    <div className="mia-projects-page" style={{ position: "relative" }}>
      <ProjectsHero slides={slides} />

      {categories.length > 1 ? (
        <section id="project-filters-section" className="tvp-filters-section">
          <div className="tvp-wrap">
            <div className="proj-filters-wrap">
              <div className="tvp-filters" id="tvp-filters" role="group" aria-label={tCard("filtersLabel")}>
                {categories.map((c) => (
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
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="all" className="tvp-list">
        <div className="tvp-wrap" style={{ display: "grid", gap: 24 }}>
          {visible.length ? (
            <div className="tvp-grid">
              {visible.map((project) => (
                <ProjectDonateCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            /* A reader who filtered their way here needs the filter cleared. */
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
    </div>
  );
}
