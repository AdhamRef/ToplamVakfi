"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { localeDirection } from "@/lib/locales";
import type { MinbarArticleDetail } from "@/lib/minbar/posts";
import { contentToBlocks } from "@/lib/blog/rich-text";
import ArticleCta from "./ArticleCta";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";

/**
 * An article  laid out after `ToplamVakfi-design/Toplum Vakfı Blog Article -
 * Values.dc.html` (and its twin `News Article - Saudi Visit`); styles in
 * `styles/minbar/pages/blog.css`, `ed-` classes.
 *
 * On the page background: the category and the blog as a small meta line, the
 * title, the byline with the share button, the wide rounded cover, then the
 * body in a 720px reading column. The closing call follows.
 *
 * CMS content may arrive as:
 * - clean HTML (<h2>, <p>, lists)
 * - Markdown (## headings + paragraphs)
 * - legacy plain text
 *
 * We normalize all three into the same safe React blocks. We intentionally do
 * not use dangerouslySetInnerHTML; seeded editorial HTML is parsed into text
 * blocks first, so presentation remains consistent and scriptable markup is
 * never injected into the page.
 */

export interface ArticleDetailProps {
  article: MinbarArticleDetail;
  /** Which of the eleven closing calls this article's category selects. */
  ctaKey: string;
}

export default function ArticleDetail({ article, ctaKey }: ArticleDetailProps) {
  const locale = useLocale();
  const dir = localeDirection(locale);
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");

  const blocks = useMemo(() => contentToBlocks(article.content), [article.content]);
  const body = blocks.length
    ? blocks
    : article.excerpt
      ? [{ kind: "p", text: article.excerpt }]
      : [];

  const author = t("byTeam");
  const authorInitial = author.trim().charAt(0);
  const backArrow = dir === "rtl" ? "→" : "←";

  const share = () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    if (!url) return;

    if (navigator.share) {
      navigator.share({ title: article.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="art-page ed-page">
      <article>
        <section className="ed-article-hero">
          <div className="ed-wrap">
            <div className="ed-meta-top art-in">
              {article.category ? (
                <>
                  <span className="ed-cat">{article.category.name}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <Link href={miaPath("blog", locale)}>{tCommon("blogTitle")}</Link>
            </div>

            <h1 className="art-in">{article.title}</h1>

            <div className="ed-byline art-in art-in-1">
              <span aria-hidden="true" className="ed-avatar">
                {authorInitial}
              </span>
              <b style={{ fontSize: 13.5, fontWeight: 800, color: "var(--deep)", minWidth: 0 }}>{author}</b>
              <button
                type="button"
                onClick={share}
                aria-label={t("shareArticle")}
                title={t("shareArticle")}
                className="ed-share"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              </button>
            </div>

            {article.cover ? (
              <span className="ed-cover art-in art-in-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary CMS URLs, not a known-host set */}
                <img src={article.cover} alt={article.imageAlt || article.title} />
              </span>
            ) : null}
          </div>
        </section>

        <div className="ed-wrap">
          <div className="ed-prose art-in art-in-3">
            {body.map((block, index) => {
              if (block.kind === "h2") {
                return <h2 key={index}>{block.text}</h2>;
              }

              if (block.kind === "li") {
                return (
                  <p key={index} className="ed-li">
                    <span aria-hidden="true">• </span>
                    {block.text}
                  </p>
                );
              }

              return (
                <p key={index} style={{ whiteSpace: "pre-line" }}>
                  {block.text}
                </p>
              );
            })}

            <div className="ed-tags">
              {article.category ? <span className="ed-chip">{article.category.name}</span> : null}
              <Link href={miaPath("blog", locale)} className="ed-back" style={{ marginInlineStart: "auto" }}>
                <span aria-hidden="true">{backArrow}</span> {t("backToBlog")}
              </Link>
            </div>
          </div>
        </div>

      </article>

      <ArticleCta ctaKey={ctaKey} />

      <ZakatBanner />
      <TravelBanner />
    </div>
  );
}
