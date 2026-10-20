import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import StoriesPage from "@/components/minbar/foundation/StoriesPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about", "tvStories"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvStories" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("metaDescription"),
    path: `/${slugFor("stories", locale)}`,
  });
}

/**
 * The live school-restoration project the design's story card points at
 * (`Project - Schools Restoration`), looked up among the published projects so
 * the card links to it and shows its own photograph. A Syrian one is preferred,
 * as in the story. `null` (no such project, or the database is unreachable)
 * makes the card link to the projects list instead.
 */
async function findStoryProject(locale: string): Promise<{ slug: string; image: string | null } | null> {
  try {
    /* Matched on the English slugs (`syria-hama-schools-restoration`): the
       visitor's locale may slug the same campaign in Arabic or Turkish. */
    const [english, local] = await Promise.all([listProjects("en"), locale === "en" ? null : listProjects(locale)]);
    const schools = english.filter((p) => /school/i.test(p.slug) && /restor/i.test(p.slug));
    const pick = schools.find((p) => /syria/i.test(p.slug) && p.image) ?? schools.find((p) => p.image) ?? schools[0];
    if (!pick) return null;
    const own = local ? local.find((p) => p.id === pick.id) : pick;
    return own ? { slug: own.slug, image: own.image ?? pick.image } : null;
  } catch {
    return null;
  }
}

/** Stories  `ToplamVakfi-design/Toplum Vakfı Stories.dc.html`. */
export default async function Stories({ params }: Props) {
  const { locale } = await params;
  const project = await findStoryProject(locale);

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <StoriesPage project={project} />
    </MinbarMessages>
  );
}
