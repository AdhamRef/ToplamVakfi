import "server-only";

import { prisma } from "@/lib/prisma";
import type { MinbarProject } from "./projects";
import { listCategories, type MinbarCategory } from "./categories";
import { listArticles, listNews, type MinbarArticle } from "./posts";
import { applyHomeList, listNeedsFullPool, parseHomeLayout, type HomeLayoutConfig, type HomeSectionId } from "./home-layout";

/** The layout as the homepage reads it  server only. A missing or broken row is the default layout. */
export async function readHomeLayout(): Promise<HomeLayoutConfig> {
  try {
    const row = await prisma.globalSettings.findFirst({
      orderBy: { createdAt: "asc" },
      select: { homeLayout: true },
    });
    return parseHomeLayout(row?.homeLayout ?? null);
  } catch (e) {
    console.error("readHomeLayout:", e);
    return parseHomeLayout(null);
  }
}

/** How many posts to read when a list needs more than its newest slice. */
const POST_POOL = 100;

export interface HomeLists {
  projects: MinbarProject[];
  categories: MinbarCategory[];
  articles: MinbarArticle[];
  news: MinbarArticle[];
}

const postTime = (a: MinbarArticle) => ({ id: a.id, createdAt: Date.parse(a.createdAt) || undefined });

/**
 * Every list the homepage renders, already picked and ranked by the layout.
 * The projects are passed in, as the read in flight, because the page reads
 * them anyway for the quick-donation select.
 */
export async function resolveHomeLists(locale: string, layout: HomeLayoutConfig, projectsRead: Promise<MinbarProject[]>): Promise<HomeLists> {
  const { lists } = layout;
  const postTake = (id: "articles" | "news") => {
    const cfg = lists[id];
    return listNeedsFullPool(cfg) ? POST_POOL : Math.max(cfg.limit, 1);
  };

  const [allProjects, categories, articlesPage, news] = await Promise.all([
    projectsRead,
    listCategories(locale),
    listArticles({ locale, take: postTake("articles") }),
    listNews(locale, postTake("news")),
  ]);

  return {
    projects: applyHomeList(allProjects, lists.projects, (p) => ({
      id: p.id,
      raised: p.raised,
      progress: p.goal && p.goal > 0 ? p.raised / p.goal : undefined,
    })),
    categories: applyHomeList(categories, lists.categories, (c) => ({ id: c.id, projectCount: c.projectCount })),
    articles: applyHomeList(articlesPage.items, lists.articles, postTime),
    news: applyHomeList(news, lists.news, postTime),
  };
}

/** The sections to render, in order, with the hidden ones left out. */
export function visibleSections(layout: HomeLayoutConfig): HomeSectionId[] {
  return layout.sections.filter((s) => s.enabled).map((s) => s.id);
}
