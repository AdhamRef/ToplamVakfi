"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle, MinbarPostCategory } from "@/lib/minbar/posts";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import { NoResults, ContentError, ContentSkeleton } from "@/components/minbar/states/ContentStates";
import { EdArrow, EdBanner } from "./Editorial";

/**
 * The blog  laid out after `ToplamVakfi-design/Toplum Vakfı Blog.dc.html`
 * (styles in `styles/minbar/pages/blog.css`, `ed-` classes).
 *
 * The design's photo banner with its wave, a section head, then the article
 * cards: a white card with the cover on top, the category as a pill badge over
 * it, the title, the lead and a "read" link. The first two articles of the
 * current list are the design's featured pair; the rest follow three-up. The
 * category filter is the design's pill tab row (`.pg-tabs`), with incremental
 * paging rather than one page of every article: loading 178 covers at once is
 * what makes a blog feel broken.
 *
 * Two departures from the original handoff, both consequences of wiring this
 * to the real CMS instead of a static data file:
 *  - the chips are the categories that actually have published articles, so
 *    adding one in the dashboard adds a filter with no code change;
 *  - filtering compares category **ids**, never displayed names  a name is
 *    translated, and comparing names detaches the filter from its own state the
 *    moment the site is read in another language.
 */

export interface BlogPageProps {
  initialArticles: MinbarArticle[];
  initialCursor: string | null;
  categories: MinbarPostCategory[];
}

export default function BlogPage({ initialArticles, initialCursor, categories }: BlogPageProps) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const tSystem = useTranslations("system");
  const tHome = useTranslations("homepage");

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  /* Set when a page or a category switch failed, so the reader is told rather
     than left looking at a grid that quietly did not change. */
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
      /* Keep the chip selected and offer the request again, rather than
         silently reverting to a category the reader did not choose. */
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
      /* The cursor is kept, so the same page can be asked for again. */
      setFailed(() => loadMore);
    } finally {
      setLoading(false);
    }
  };

  const chips: Array<{ id: string | null; label: string }> = [
    { id: null, label: tSystem("allFilter") },
    ...categories.map((category) => ({ id: category.id, label: category.name })),
  ];

  /* The design's featured pair, then the rest three-up. Both come from the
     same list, so paging and filtering keep working unchanged. */
  const featured = articles.slice(0, 2);
  const rest = articles.slice(2);

  const card = (article: MinbarArticle) => (
    <Link
      key={article.id}
      href={`${miaPath("blog", locale)}/${encodeURIComponent(article.slug)}`}
      className="ed-card"
    >
      <span className="ed-media">
        {article.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary CMS URLs, not a known-host set
          <img src={article.cover} alt="" loading="lazy" decoding="async" />
        ) : null}
        {article.category ? <span className="ed-badge">{article.category.name}</span> : null}
      </span>
      <span className="ed-body">
        <h3>{article.title}</h3>
        {article.excerpt ? <p className="ed-clamp">{article.excerpt}</p> : null}
        <span className="ed-cta">
          {tHome("readArticle")}
          <EdArrow />
        </span>
      </span>
    </Link>
  );

  return (
    <div className="blog-page ed-page">
      <EdBanner title={tCommon("blogTitle")} />

      <section className="ed-main">
        <div className="ed-wrap">
          <div className="ed-head">
            <h2>{tHome("allArticles")}</h2>
          </div>

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

          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .18s ease" }}>
            {featured.length ? <div className="ed-grid ed-grid--2">{featured.map(card)}</div> : null}
            {rest.length ? <div className="ed-grid">{rest.map(card)}</div> : null}
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

      <ZakatBanner />
      <TravelBanner />
    </div>
  );
}
