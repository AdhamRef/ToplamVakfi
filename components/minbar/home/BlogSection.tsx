"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { cssImage } from "@/lib/minbar/image-url";
import type { MinbarArticle } from "@/lib/minbar/posts";

/**
 * The homepage's blog section: the newest articles as picture cards, picked and
 * ranked by the homepage layout's «المقالات» list, and the way to the blog.
 * Before anything is published it still points to the blog, with one line
 * saying more is coming, rather than leaving a hole in the page.
 */

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export default function BlogSection({ articles }: { articles: MinbarArticle[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.blog");
  const blog = miaPath("blog", locale);
  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    <section className="hb" id="blog" aria-labelledby="hb-title">
      <div className="container">
        <div className="hb-head">
          <div>
            <h2 id="hb-title">{t("title")}</h2>
            <p>{t("lead")}</p>
          </div>
          <Link className="hb-all" href={blog}>
            {t("more")}
            {ARROW}
          </Link>
        </div>

        {articles.length ? (
          <div className="hb-grid">
            {articles.map((article) => (
              <Link key={article.id} className="hb-card" href={`${blog}/${encodeURIComponent(article.slug)}`}>
                <span className="hb-img" style={article.cover ? { backgroundImage: cssImage(article.cover, 700) } : undefined} data-empty={article.cover ? undefined : "true"}>
                  {article.category ? <em>{article.category.name}</em> : null}
                </span>
                <span className="hb-body">
                  <time dateTime={article.createdAt}>{date.format(new Date(article.createdAt))}</time>
                  <b>{article.title}</b>
                  {article.excerpt ? <span className="hb-excerpt">{article.excerpt}</span> : null}
                  <span className="hb-read">
                    {t("read")}
                    {ARROW}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Link className="hb-empty" href={blog}>
            <span>{t("empty")}</span>
            {ARROW}
          </Link>
        )}
      </div>
    </section>
  );
}
