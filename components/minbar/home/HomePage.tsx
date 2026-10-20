"use client";

import { Suspense, useMemo, type ReactNode } from "react";
import type { MinbarProject } from "@/lib/minbar/projects";
import type { QuickDonationConfig } from "@/lib/minbar/quick-donation";
import type { HomeSectionId } from "@/lib/minbar/home-layout";
import type { HomeLists } from "@/lib/minbar/home-layout-read";
import { photoPool, type HomeZakatTarget } from "@/lib/minbar/home-content";
import QuickDonateBar from "./QuickDonateBar";
import HomeHero from "./HomeHero";
import { ImpactStrip, ProgramsRow } from "./HomeIntro";
import WorldSection from "./WorldSection";
import WaysSection from "./WaysSection";
import { ClosingCta, FaqSection, PartnersSection, StoriesSection, TrustSection } from "./LowerSections";

/**
 * The homepage  `ToplamVakfi-design/Toplum Vakfı Homepage.dc.html`, top to
 * bottom (styles: `styles/minbar/pages/home.css`, all under `.tv-home`).
 *
 * The hero always opens the page, with the quick donation as its disc
 * («دائرة الخير»); switched off in the dashboard, the hero shows its copy
 * alone. Every section after it renders in the order the dashboard's homepage
 * layout sets (`/dashboard/homepage-layout`), hidden ones left out; the
 * layout's defaults are the design's order. The projects list arrives already
 * picked and ranked by the same layout.
 *
 * The design's photo slots take the listed campaigns' own pictures first, then
 * the foundation's photographs in /public (`photoPool`).
 */
export default function HomePage({
  sections,
  lists,
  quick,
  zakat,
}: {
  /** The visible sections after the hero, in display order. */
  sections: HomeSectionId[];
  lists: HomeLists;
  /** The quick-donation disc as the dashboard configured it, with the projects it may list. */
  quick: { config: QuickDonationConfig; projects: MinbarProject[] };
  /** Where the zakat tab's gift goes; null sends the donor to the zakat page. */
  zakat: HomeZakatTarget;
}) {
  const projectImages = useMemo(() => lists.projects.map((p) => p.image), [lists.projects]);
  const images = useMemo(() => photoPool(projectImages), [projectImages]);
  /* The hero's first slide is the design's own photograph (the LCP image,
     preloaded by the page); the campaigns' pictures follow. */
  const slides = useMemo(() => photoPool(["/toplum/hero-bg.webp", ...projectImages]).slice(0, 3), [projectImages]);

  const render: Record<HomeSectionId, () => ReactNode> = {
    impact: () => <ImpactStrip />,
    programs: () => <ProgramsRow images={images} />,
    world: () => <WorldSection />,
    ways: () => <WaysSection projects={lists.projects} images={images} zakat={zakat} />,
    stories: () => <StoriesSection images={images} />,
    trust: () => <TrustSection />,
    partners: () => <PartnersSection />,
    faq: () => <FaqSection />,
    cta: () => <ClosingCta />,
  };

  return (
    <div className="tv-home">
      <HomeHero
        slides={slides}
        donate={quick.config.enabled ? <QuickDonateBar config={quick.config} projects={quick.projects} /> : undefined}
      />
      {sections.map((id) => (
        /* Each section is its own Suspense boundary, so React hydrates it in
           its own task and yields to the browser in between (PageSpeed: TBT).
           Nothing suspends: the server HTML shows as-is, no fallback. */
        <Suspense key={id} fallback={null}>
          {render[id]()}
        </Suspense>
      ))}
    </div>
  );
}
