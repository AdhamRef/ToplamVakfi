import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { listProjects, listSlides } from "@/lib/minbar/projects";
import { miaPath, slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ProjectsPage from "@/components/minbar/projects/ProjectsPage";
import type { ProjectSlide } from "@/components/minbar/projects/ProjectsHero";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle (`projects` is in it). */
const NAMESPACES = [] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects.tv" });
  return buildPageMetadata(locale, {
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: `/${slugFor("projects", locale)}`,
  });
}

/**
 * Projects catalogue  `ToplamVakfi-design/Toplum Vakfı Projects.dc.html`.
 *
 * Rendered on the server so the full project list is in the first response
 * (the page and its detail pages are indexable).
 */
export default async function Projects({ params }: Props) {
  const { locale } = await params;
  const [projects, curated] = await Promise.all([listProjects(locale), listSlides(locale)]);

  /* The carousel is the one the dashboard curates. With none published it
     falls back to the first projects that have imagery, each slide leading to
     its project as in the design ("عرض المشروع"). */
  const slides: ProjectSlide[] = curated.length
    ? curated
        .filter((slide) => slide.image)
        .map((slide) => ({ title: slide.title, image: slide.image, href: slide.href || "#all" }))
    : projects
        .filter((p) => p.image)
        .slice(0, 3)
        .map((p) => ({ title: p.title, image: p.image, href: miaPath("projectDetail", locale, p.slug) }));

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <ProjectsPage projects={projects} slides={slides} />
    </MinbarMessages>
  );
}
