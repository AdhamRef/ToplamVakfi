"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle, MinbarPostCategory } from "@/lib/minbar/posts";
import { NoResults, ContentError, ContentSkeleton } from "@/components/minbar/states/ContentStates";
import { EdBanner, EdFeatureCard } from "./Editorial";

/**
 * The blog  `ToplamVakfi-design/Toplum Vakfı Blog.dc.html` (styles in
 * `styles/minbar/pages/blog.css`, `ed-` classes).
 *
 * The photo banner with its wave (المدونة and its lead), the section head
 * (مقالات المدونة / its note), then the articles as the design's
 * `.feature-card`s two-up: the navy-to-blue band carrying the category pill,
 * the title, the lead and "اقرأ المزيد ←".
 *
 * The articles are the real `Post` CMS. Two things the static design cannot
 * show are kept: the category filter (the categories that have published
 * articles, compared by id  never by translated name) and incremental
 * paging through `/api/minbar/posts`.
 */

export interface BlogPageProps {
  initialArticles: MinbarArticle[];
  initialCursor: string | null;
  categories: MinbarPostCategory[];
}

export default function BlogPage({ initialArticles, initialCursor, categories }: BlogPageProps) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const tv = useTranslations("tvBlog");

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  /* Set when a page or a category switch failed, so the reader is told. */
  const [failed, setFailed] = useState<null | (() => void)>(null);

  const fetchPage = useCallback(
    async (nextCategoryId: string | null, nextCursor: string | null) => {
      const params = new URLSearchParams({ locale });
      if (nextCategoryId) params.set("categoryId", nextCategoryId);
      if (nextCursor) params.set("cursor", nextCursor);

      const res = await fetch(`/api/minbar/posts?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      return (await res.json()) as { items: MinbarArticle[]; nextCursor: string | null };
    },
    [locale]
  );

  const selectCategory = async (nextCategoryId: string | null) => {
    if (nextCategoryId === categoryId || loading) return;
    setCategoryId(nextCategoryId);
    setLoading(true);
    setFailed(null);
    try {
      const page = await fetchPage(nextCategoryId, null);
      setArticles(page.items);
      setCursor(page.nextCursor);
    } catch {
      setFailed(() => () => selectCategory(nextCategoryId));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(null);
    try {
      const page = await fetchPage(categoryId, cursor);
      setArticles((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setFailed(() => loadMore);
    } finally {
      setLoading(false);
    }
  };

  const chips: Array<{ id: string | null; label: string }> = [
    { id: null, label: tv("filterAll") },
    ...categories.map((category) => ({ id: category.id, label: category.name })),
  ];

  return (
    <div className="blog-page ed-page">
      <EdBanner title={tv("title")} lead={tv("lead")} />

      <section className="ed-main">
        <div className="ed-wrap">
          <div className="ed-head">
            <h2>{tv("sectionTitle")}</h2>
            <span>{tv("sectionNote")}</span>
          </div>

          {chips.length > 2 ? (
            <div className="ed-tabs" role="group" aria-label={t("categoriesTitle")}>
              {chips.map((chip) => (
                <button
                  key={chip.id ?? "all"}
                  type="button"
                  className="ed-tab"
                  onClick={() => selectCategory(chip.id)}
                  aria-pressed={chip.id === categoryId}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .18s ease" }}>
            {articles.length ? (
              <div className="ed-featured">
                {articles.map((article) => (
                  <EdFeatureCard
                    key={article.id}
                    href={`${miaPath("blog", locale)}/${encodeURIComponent(article.slug)}`}
                    badge={article.category?.name}
                    title={article.title}
                    text={article.excerpt}
                    cta={tv("readMore")}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {failed || (loading && articles.length === 0) || (articles.length === 0 && !loading) ? (
            <div className="ed-status">
              {failed ? <ContentError onRetry={failed} /> : null}
              {loading && articles.length === 0 ? <ContentSkeleton count={6} /> : null}
              {articles.length === 0 && !loading && !failed ? (
                <NoResults onReset={categoryId ? () => selectCategory(null) : undefined} />
              ) : null}
            </div>
          ) : null}

          {cursor ? (
            <div className="ed-more-row">
              <button type="button" onClick={loadMore} disabled={loading} className="ed-ghost">
                {t("loadMore")}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
