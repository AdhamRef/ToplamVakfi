import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { miaPath, slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import { listCategories } from "@/lib/minbar/categories";
import { textMatchesTheme } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ProgramsPage, { type ProgramsCategory, type ProgramsProject } from "@/components/minbar/programs/ProgramsPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvPrograms"] as const;

/** Campaign figures change on donation, not per request. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvPrograms" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("intro"),
    path: `/${slugFor("programs", locale)}`,
  });
}

/**
 * Our programmes — `ToplamVakfi-design/Toplum Vakfı Programs.dc.html`.
 *
 * The tabs are the dashboard's categories that hold a published campaign; the
 * grid is the published campaigns (priority first, then newest).
 */
export default async function Programmes({ params }: Props) {
  const { locale } = await params;
  const [projects, categories] = await Promise.all([listProjects(locale), listCategories(locale)]);

  const slim: ProgramsProject[] = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    image: p.image,
    raised: p.raised,
    goal: p.goal,
    tag: p.categories[0]?.label ?? null,
    categoryIds: p.categories.map((c) => c.id),
    shares: !!p.shares,
  }));

  const used = new Set(slim.flatMap((p) => p.categoryIds));
  const tabs: ProgramsCategory[] = categories
    .filter((c) => used.has(c.id))
    .map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, image: c.image, href: c.href }));

  /* The Hope campaign hero's button: its category's page when the dashboard
     has one, otherwise every project. */
  const hope = categories.find((c) => textMatchesTheme(`${c.name} ${c.slug}`, "hope"));
  const hopeHref = hope ? hope.href : miaPath("projects", locale);

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <ProgramsPage projects={slim} categories={tabs} hopeHref={hopeHref} />
    </MinbarMessages>
  );
}
