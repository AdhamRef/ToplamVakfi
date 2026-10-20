import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { miaPath, slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import { listCategories } from "@/lib/minbar/categories";
import { PROGRAMS, isProgramSlug } from "@/lib/minbar/programs-content";
import { imageForTheme, projectsForTheme, textMatchesTheme } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ProgramDetail from "@/components/minbar/programs/ProgramDetail";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvPrograms"] as const;

/* Six static entries; any other slug is a 404 (see `isProgramSlug`). */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isProgramSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: "tvPrograms" });
  return buildPageMetadata(locale, {
    title: t(`detail.${slug}.title`),
    description: t(`detail.${slug}.intro`),
    path: `/${slugFor("programDetail", locale)}/${slug}`,
  });
}

/**
 * One programme — `ToplamVakfi-design/Toplum Vakfı Program - <name>.dc.html`.
 *
 * Linked projects: the published campaigns matching the programme's theme
 * (by title, slug and category), else the three most urgent/recent ones.
 * "Donate now" opens the matching category's page, else the first matching
 * campaign, else the projects list.
 */
export default async function Programme({ params }: Props) {
  const { locale, slug } = await params;
  if (!isProgramSlug(slug)) notFound();
  const entry = PROGRAMS[slug];

  const [projects, categories] = await Promise.all([listProjects(locale), listCategories(locale)]);
  const matched = projectsForTheme(projects, entry.theme);
  const linked = (matched.length ? matched : projects).slice(0, 3).map((p) => ({
    title: p.title,
    href: miaPath("projectDetail", locale, p.slug),
    image: p.image,
  }));

  const category = categories.find((c) => c.projectCount > 0 && textMatchesTheme(`${c.name} ${c.slug}`, entry.theme));
  const donateHref = category ? category.href : matched[0] ? miaPath("projectDetail", locale, matched[0].slug) : miaPath("projects", locale);

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <ProgramDetail slug={slug} heroImage={imageForTheme(projects, entry.theme)} linked={linked} donateHref={donateHref} />
    </MinbarMessages>
  );
}
