"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle } from "@/lib/minbar/posts";
import { NoResults } from "@/components/minbar/states/ContentStates";
import { EdBanner, EdFeatureCard } from "@/components/minbar/blog/Editorial";

/**
 * The newsroom  `ToplamVakfi-design/Toplum Vakfı News.dc.html` (styles in
 * `styles/minbar/pages/blog.css`, `ed-` classes).
 *
 * The photo banner (الأخبار والشراكات and its lead), "مقالات ومشاريع مميزة"
 * with the newest item as the design's single feature card, then "آخر
 * الأخبار": the dated list  the date in its own column, the headline and its
 * lead beside it, a hairline between rows  grouped under a heading per year
 * as the design groups its archive.
 *
 * These are the real published posts filed under the newsroom category, each
 * with its own publication date, linking to the article page.
 */

export interface NewsPageProps {
  items: MinbarArticle[];
}

export default function NewsPage({ items }: NewsPageProps) {
  const locale = useLocale();
  const t = useTranslations("tvNews");

  /* Dates are formatted for the reader's language. */
  const dateFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });
  const yearFormat = new Intl.DateTimeFormat(locale, { year: "numeric" });

  const hrefOf = (item: MinbarArticle) => `${miaPath("blog", locale)}/${encodeURIComponent(item.slug)}`;
  const [lead] = items;

  /* Newest first, grouped by year in that order. */
  const groups: Array<{ key: string; label: string; items: MinbarArticle[] }> = [];
  for (const item of items) {
    const date = new Date(item.createdAt);
    const key = String(date.getFullYear());
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: t("groupYear", { year: yearFormat.format(date) }), items: [item] });
  }

  return (
    <div className="news-page ed-page">
      <EdBanner title={t("title")} lead={t("lead")} />

      <section className="ed-main">
        <div className="ed-wrap">
          {lead ? (
            <div className="ed-section">
              <div className="ed-head">
                <h2>{t("featuredTitle")}</h2>
                <span>{t("featuredNote")}</span>
              </div>
              <div className="ed-featured">
                <EdFeatureCard
                  href={hrefOf(lead)}
                  badge={lead.category?.name}
                  title={lead.title}
                  text={lead.excerpt}
                  cta={t("readMore")}
                />
              </div>
            </div>
          ) : null}

          {items.length ? (
            <div className="ed-section">
              <div className="ed-head">
                <h2>{t("latestTitle")}</h2>
                <span>{t("latestNote")}</span>
              </div>
              <div className="ed-nlist">
                {groups.map((group) => (
                  <div key={group.key} style={{ display: "contents" }}>
                    <div className="ed-ngroup">{group.label}</div>
                    {group.items.map((item) => (
                      <Link key={item.id} href={hrefOf(item)} className="ed-nrow">
                        <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
                        <div>
                          <h4>{item.title}</h4>
                          {item.excerpt ? <p>{item.excerpt}</p> : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <NoResults />
          )}
        </div>
      </section>
    </div>
  );
}
