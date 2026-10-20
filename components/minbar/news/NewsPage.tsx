"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle } from "@/lib/minbar/posts";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import { NoResults } from "@/components/minbar/states/ContentStates";
import { EdArrow, EdBanner } from "@/components/minbar/blog/Editorial";

/**
 * The newsroom  laid out after `ToplamVakfi-design/Toplum Vakfı News.dc.html`
 * (styles in `styles/minbar/pages/blog.css`, `ed-` classes).
 *
 * The photo banner, then the newest item as the design's featured card, then
 * the design's dated list: the date in its own column, the headline and its
 * lead beside it, a hairline between rows. News is read newest-first, and the
 * date is the point.
 *
 * These are real published posts filed under the newsroom category, each
 * carrying its own publication date and linking to the same article page the
 * blog links to. The design's rows have no picture; ours keep the cover each
 * item already showed, as a small thumbnail at the row's end.
 */

export interface NewsPageProps {
  items: MinbarArticle[];
}

export default function NewsPage({ items }: NewsPageProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tHome = useTranslations("homepage");

  /* Dates are formatted for the reader's language, so an Arabic page shows an
     Arabic month name and a Japanese page a Japanese one. */
  const dateFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  const hrefOf = (item: MinbarArticle) => `${miaPath("blog", locale)}/${encodeURIComponent(item.slug)}`;
  const [lead, ...rest] = items;

  return (
    <div className="news-page ed-page">
      <EdBanner title={tCommon("newsTitle")} lead={tCommon("newsLead")} />

      <section className="ed-main">
        <div className="ed-wrap">
          {lead ? (
            <div className="ed-section">
              <Link href={hrefOf(lead)} className="ed-card ed-feature">
                <span className="ed-media">
                  {lead.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary CMS URLs, not a known-host set
                    <img src={lead.cover} alt="" decoding="async" />
                  ) : null}
                  {lead.category ? <span className="ed-badge">{lead.category.name}</span> : null}
                </span>
                <span className="ed-body">
                  <time className="ed-eyebrow" dateTime={lead.createdAt}>{dateFormat.format(new Date(lead.createdAt))}</time>
                  <h3>{lead.title}</h3>
                  {lead.excerpt ? <p className="ed-clamp">{lead.excerpt}</p> : null}
                  <span className="ed-cta">
                    {tHome("readNews")}
                    <EdArrow />
                  </span>
                </span>
              </Link>
            </div>
          ) : null}

          {rest.length ? (
            <div className="ed-section">
              <div className="ed-head">
                <h2>{tHome("allNews")}</h2>
              </div>
              <div className="ed-list">
                {rest.map((item) => (
                  <Link key={item.id} href={hrefOf(item)} className={`ed-row${item.cover ? "" : " ed-row--nothumb"}`}>
                    <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
                    <span className="ed-row-copy">
                      <b>{item.title}</b>
                      {item.excerpt ? <span>{item.excerpt}</span> : null}
                    </span>
                    {item.cover ? (
                      <span className="ed-row-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary CMS URLs, not a known-host set */}
                        <img src={item.cover} alt="" loading="lazy" decoding="async" />
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {items.length === 0 ? <NoResults /> : null}
        </div>
      </section>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}
