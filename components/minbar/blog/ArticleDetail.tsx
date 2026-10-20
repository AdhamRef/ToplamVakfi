"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle, MinbarArticleDetail } from "@/lib/minbar/posts";
import { contentToBlocks } from "@/lib/blog/rich-text";
import { EdRelated } from "./Editorial";

/**
 * An article  `ToplamVakfi-design/Toplum Vakfı Blog Article - Values.dc.html`
 * and its twin `News Article - Saudi Visit.dc.html`; styles in
 * `styles/minbar/pages/blog.css`, `ed-` classes.
 *
 * On the page background: the meta line (the category, then "مدونة الوقف" for
 * an article or the publication date for a news item), the title, the wide
 * rounded cover, the body in a 720px reading column; then the white band of
 * related pieces ("مقالات ذات صلة" / "أخبار ذات صلة") from the same category.
 *
 * CMS content may arrive as clean HTML, Markdown or legacy plain text; all
 * three are normalised into the same safe React blocks (no
 * dangerouslySetInnerHTML).
 */

export interface ArticleDetailProps {
  article: MinbarArticleDetail;
  related: MinbarArticle[];
  /** Filed under the newsroom: dated meta line and "related news". */
  isNews: boolean;
}

export default function ArticleDetail({ article, related, isNews }: ArticleDetailProps) {
  const locale = useLocale();
  const t = useTranslations("tvBlog");

  const blocks = useMemo(() => contentToBlocks(article.content), [article.content]);
  const body = blocks.length ? blocks : article.excerpt ? [{ kind: "p" as const, text: article.excerpt }] : [];
  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(article.createdAt));
  const listHref = isNews ? miaPath("news", locale) : miaPath("blog", locale);

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
              {isNews ? (
                <time dateTime={article.createdAt}>{date}</time>
              ) : (
                <Link href={listHref}>{t("blogName")}</Link>
              )}
            </div>

            <h1 className="art-in">{article.title}</h1>

            <span className="ed-cover art-in art-in-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary CMS URLs, not a known-host set */}
              <img src={article.cover || "/toplum/hero-bg.webp"} alt={article.imageAlt || article.title} />
            </span>
          </div>
        </section>

        <div className="ed-wrap">
          <div className="ed-prose art-in art-in-3">
            {body.map((block, index) => {
              if (block.kind === "h2") return <h2 key={index}>{block.text}</h2>;
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
          </div>
        </div>
      </article>

      <EdRelated
        title={isNews ? t("relatedNews") : t("relatedArticles")}
        items={related.map((item) => ({
          id: item.id,
          href: `${miaPath("blog", locale)}/${encodeURIComponent(item.slug)}`,
          label: item.category?.name,
          title: item.title,
        }))}
      />
    </div>
  );
}
