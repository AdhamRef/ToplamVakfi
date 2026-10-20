import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { requireAdminOrDashboardPermission } from "@/lib/dashboard/api-auth";
import { listProjects } from "@/lib/minbar/projects";
import { listCategories } from "@/lib/minbar/categories";
import { listArticles, listNews, type MinbarArticle } from "@/lib/minbar/posts";
import type { HomeListOption, HomeListOptions } from "@/lib/minbar/home-layout";

/**
 * GET /api/home-layout/options  every item each homepage list can pick from,
 * in that list's dashboard order (the order "ترتيب لوحة التحكم" ranks by), with
 * the facts the other rankings use. Arabic titles.
 *
 * Only live items: an inactive project or an unpublished post can be neither
 * picked nor previewed, because the homepage would skip it anyway.
 */

const POOL = 100;

function postOption(a: MinbarArticle): HomeListOption {
  const date = new Date(a.createdAt);
  return {
    id: a.id,
    title: a.title,
    subtitle: [a.category?.name, Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })].filter(Boolean).join(" · "),
    image: a.cover,
    createdAt: Date.parse(a.createdAt) || undefined,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const denied = requireAdminOrDashboardPermission(session, "siteContent");
    if (denied) return denied;

    const [projects, categories, articles, news] = await Promise.all([
      listProjects("ar"),
      listCategories("ar"),
      listArticles({ locale: "ar", take: POOL }),
      listNews("ar", POOL),
    ]);

    const options: HomeListOptions = {
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: [p.regionLabel, p.goal ? `${Math.round((p.raised / p.goal) * 100)}% من الهدف` : `$${Math.round(p.raised).toLocaleString("en")} مجموعة`].filter(Boolean).join(" · "),
        image: p.image,
        raised: p.raised,
        progress: p.goal && p.goal > 0 ? p.raised / p.goal : undefined,
      })),
      categories: categories.map((c) => ({ id: c.id, title: c.name, subtitle: `${c.projectCount} مشروع`, image: c.image, projectCount: c.projectCount })),
      articles: articles.items.map(postOption),
      news: news.map(postOption),
    };

    return NextResponse.json({ options });
  } catch (e) {
    console.error("GET /api/home-layout/options:", e);
    return NextResponse.json({ error: "Failed to read the homepage items" }, { status: 500 });
  }
}
