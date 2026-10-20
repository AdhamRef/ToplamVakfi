import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { preload } from "react-dom";
import { LOCALE_SEO, buildPageMetadata, SITE_URL } from "@/lib/seo";
import type { Locale } from "@/lib/seo";
import { listProjects, type MinbarProject } from "@/lib/minbar/projects";
import { readQuickDonation } from "@/lib/minbar/quick-donation-read";
import { getCategoryPageByTemplate } from "@/lib/minbar/category-page";
import { readHomeLayout, resolveHomeLists, usedLists, visibleSections } from "@/lib/minbar/home-layout-read";
import type { HomeZakatTarget } from "@/lib/minbar/home-content";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import HomePage from "@/components/minbar/home/HomePage";

/**
 * Namespaces this page renders, on top of the shell bundle: the homepage
 * copy (`tvHome`) and `homepage`, which the quick-donation disc still reads
 * for its destination group labels.
 */
const NAMESPACES = ["tvHome", "homepage"] as const;

/**
 * Where the «الزكاة» tab gives: the zakat category's donation box, as the
 * zakat page resolves it (`ZakatPage.addZakat`). Null when the dashboard has
 * bound no zakat category, and the tab then sends the donor to the zakat page.
 */
async function readZakatTarget(locale: string): Promise<HomeZakatTarget> {
  try {
    const category = await getCategoryPageByTemplate("zakat", locale);
    if (!category) return null;
    if (category.donateTarget?.kind === "campaign") return { projectId: category.donateTarget.slug };
    if (category.donateTarget?.kind === "category") return { categoryId: category.donateTarget.id };
    return { categoryId: category.id };
  } catch (e) {
    console.error("home readZakatTarget:", e);
    return null;
  }
}

/**
 * Everything the homepage shows, read together and cached per locale for a
 * minute. Uncached, these MongoDB queries ran on every visit and kept the
 * server from sending the first byte (PageSpeed: LCP breakdown, "time to
 * first byte"). Dashboard edits, raised amounts and new campaigns show within
 * 60 s. All of it is plain JSON, which `unstable_cache` requires.
 */
const cachedHomeData = unstable_cache(
  async (locale: string) => {
    const layout = await readHomeLayout();
    const projectsRead = usedLists(layout).has("projects") ? listProjects(locale) : Promise.resolve([] as MinbarProject[]);
    const ways = visibleSections(layout).includes("ways");
    const [quick, lists, zakat] = await Promise.all([
      readQuickDonation(),
      resolveHomeLists(locale, layout, projectsRead),
      ways ? readZakatTarget(locale) : Promise.resolve(null),
    ]);
    return { quick, layout, lists, zakat };
  },
  ["tv-home-data"],
  { revalidate: 60, tags: ["minbar-home"] }
);

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const seo = LOCALE_SEO[locale as Locale] ?? LOCALE_SEO.en;
  return buildPageMetadata(locale, {
    title: seo.title,
    description: seo.description,
    path: "/",
    keywords: seo.keywords,
  });
}

/**
 * Homepage  `ToplamVakfi-design/Toplum Vakfı Homepage.dc.html`.
 *
 * Every section's content is read here, in parallel, so the whole homepage is
 * in the first HTML response rather than filled in by client fetches
 * (`PRODUCTION_SEO_CONTRACT.md` requires server-rendered content). Which
 * sections show, in what order, and which projects «طرق العطاء» lists are the
 * dashboard's homepage layout (`lib/minbar/home-layout.ts`); its defaults are
 * the design.
 */
export default async function Home({ params }: Props) {
  const { locale } = await params;
  const { quick, layout, lists, zakat } = await cachedHomeData(locale);
  /* The hero's first photograph is the Largest Contentful Paint. The sizes
     mirror `.th-slide--hero` in home.css: the 800px copy up to 760px wide
     (a 3× phone included), the full one above. */
  preload("/toplum/hero-bg.webp", { as: "image", fetchPriority: "high", imageSrcSet: "/toplum/hero-bg-800.webp 800w, /toplum/hero-bg.webp 1600w", imageSizes: "(max-width: 760px) 260px, 100vw" });

  const organisationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "NGO"],
    "@id": `${SITE_URL}/#organization`,
    url: `${SITE_URL}/${locale}`,
    name: LOCALE_SEO[locale as Locale]?.siteName ?? LOCALE_SEO.en.siteName,
    description: LOCALE_SEO[locale as Locale]?.description ?? LOCALE_SEO.en.description,
  };

  return (
    <>
      {/* `PRODUCTION_SEO_CONTRACT.md` § Structured Data: Organization on the
          homepage only, and nothing describing data the page does not show. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
      />
      <MinbarMessages locale={locale} namespaces={NAMESPACES}>
        <HomePage
          sections={visibleSections(layout)}
          lists={lists}
          /* The disc lists only the generic destinations unless the
             dashboard allows projects; every project serialized into the page
             for it cost ~90 KB of inline payload, so none is passed. */
          quick={{ config: quick, projects: [] }}
          zakat={zakat}
        />
      </MinbarMessages>
    </>
  );
}
