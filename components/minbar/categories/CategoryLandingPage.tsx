"use client";

import { useTranslations } from "next-intl";
import { ArrowGlyph } from "@/components/minbar/home/TopSections";
import type { CategoryPageContent } from "@/lib/minbar/category-page";
import { CategoryDonateBox, CategoryHeroFilm, CategoryProjectsGrid, CategoryStatsBand } from "./CategorySections";

/**
 * A category's landing page  ported from
 * `Minbar/مشروع ترميم منازل القدس.dc.html`.
 *
 * Every category is published this way: a hero with the programme's film, a
 * navy band of figures over a progress bar, its campaigns as the site's own
 * donate cards, and a donation box scoped to the category.
 *
 * Nothing here is hard-coded: `lib/minbar/category-page.ts` resolves every
 * string for the visitor's locale, and each section is skipped when its data is
 * empty  so a category with only a name still renders as a hero and its
 * campaigns rather than as a page of blank frames. The sections themselves live
 * in `CategorySections`, because a category bound to one of the site's own
 * pages (the mosque, zakat) shows the same parts inside that page instead.
 */

export default function CategoryLandingPage({ page }: { page: CategoryPageContent }) {
  const t = useTranslations("common");
  const tCampaigns = useTranslations("CampaignsPage");

  return (
    /* Laid out as `ToplamVakfi-design/Toplum Vakfı Program - Aytam.dc.html`:
       a photograph hero with the name at its foot, the campaigns on a white
       band under a centred heading, then the donation box on the dark "be part
       of it" band. Layout: styles/minbar/pages/projects.css (`tvc-*`). */
    <div className="cat-page tvc-page">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="tvc-hero">
        {page.heroImage ? (
          /* eslint-disable-next-line @next/next/no-img-element -- fills the section; not a fixed-size image */
          <img
            src={page.heroImage}
            alt=""
            className="tvc-hero-img"
          />
        ) : null}
        <div aria-hidden="true" className="tvc-hero-fade" />
        <div
          className="cat-hero tvc-hero-in"
          style={{ gridTemplateColumns: page.heroVideoId ? "minmax(0,1.05fr) minmax(0,.95fr)" : "minmax(0,1fr)" }}
        >
          <div
            className="cat-hero-box tvc-hero-copy"
            /* Without a film beside it the copy would run the full width and the
               lead would reach 120 characters; it is sized to its content instead. */
            style={{ maxWidth: page.heroVideoId ? "none" : "min(100%, 720px)" }}
          >
            <h1>{page.name}</h1>
            {page.heroLead ? <p>{page.heroLead}</p> : null}
            <div className="tvc-hero-ctas">
              <a href="#category-donate" className="tv-pill">
                <i aria-hidden="true"><ArrowGlyph size={13} /></i>
                {t("donateNow")}
              </a>
              <a href="#category-projects" className="cat-ghost tv-ghost-dark">
                {page.ctaLabel || page.projectsTitle || tCampaigns("allCampaigns")}
              </a>
            </div>
          </div>

          <CategoryHeroFilm page={page} />
        </div>
      </section>

      {/* ── The figures ────────────────────────────────────────────────── */}
      {page.stats ? (
        <section className="tvc-stats-wrap">
          <div className="tvc-wrap">
            <CategoryStatsBand stats={page.stats} contained />
          </div>
        </section>
      ) : null}


      {/* ── The campaigns ──────────────────────────────────────────────── */}
      <section id="category-projects" className="tvc-sec tvc-sec--white">
        <div className="tvc-wrap" style={{ display: "grid", gap: 22 }}>
          {page.projectsTitle ? <h2 className="tv-h2 tvc-center">{page.projectsTitle}</h2> : null}
          <CategoryProjectsGrid page={page} />
        </div>
      </section>

      {/* ── The donation box, on the dark band ─────────────────────────── */}
      {page.donateTarget ? (
        <section id="category-donate" className="tvc-cta">
          <div className="tvc-wrap tvc-cta-in">
            <CategoryDonateBox page={page} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
