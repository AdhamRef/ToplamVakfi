"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarArticle } from "@/lib/minbar/posts";
import type { CmsFaq } from "@/lib/minbar/cms";
import { ArrowGlyph } from "./TopSections";
import ViewAllLink from "./ViewAllLink";
import { cssImage } from "@/lib/minbar/image-url";

/**
 * The knowledge end of the homepage  articles, news and the FAQ. Ported from
 * `Minbar/الصفحة الرئيسية.dc.html`.
 *
 * Everything shown here is CMS content, read on the server by the page and
 * passed down: the articles and news are posts, the FAQ is the Faq model. The
 * hand-written lists that used to sit in this file were the design's
 * placeholders and are gone  an editor publishes, and it appears.
 */

/* ── Articles ───────────────────────────────────────────────────────────────
 * The four newest published posts. The topic chip is the post's category. */
export function ArticlesSection({ articles }: { articles: MinbarArticle[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  if (articles.length === 0) return null;

  return (
    <section id="blog" className="tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <div className="tv-sec-head">
          <h2 className="tv-h2">{t("blogTitle")}</h2>
          <ViewAllLink href={miaPath("blog", locale)}>{t("allArticles")}</ViewAllLink>
        </div>
        <div id="articles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 18 }}>
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`${miaPath("blog", locale)}/${encodeURIComponent(article.slug)}`}
              className="mia-lift"
              style={{ display: "flex", flexDirection: "column", color: "var(--deep)", textDecoration: "none", background: "#fff", border: "1px solid #e6eef3", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 28px rgba(2,52,88,.07)" }}
            >
              <span style={{ position: "relative", display: "block", aspectRatio: "3 / 2", background: "var(--deep)", overflow: "hidden" }}>
                {article.cover ? (
                  <span role="img" aria-label={article.title} style={{ position: "absolute", inset: 0, display: "block", backgroundImage: cssImage(article.cover, 400), backgroundSize: "cover", backgroundPosition: "center" }} />
                ) : null}
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(6,36,66,.42), transparent 55%)" }} />
                {article.category ? (
                  <span style={{ position: "absolute", insetInlineStart: 14, top: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,.95)", color: "var(--deep)", fontSize: 11, fontWeight: 900 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
                    {article.category.name}
                  </span>
                ) : null}
              </span>
              <span style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 10, padding: "18px 20px 20px", flex: "1 1 auto" }}>
                <b
                  style={{
                    fontSize: 16.5,
                    fontWeight: 800,
                    lineHeight: 1.55,
                    minHeight: "2.9em",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {article.title}
                </b>
                <span style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid #e6eef3", fontSize: 12.5, fontWeight: 800, alignSelf: "end" }}>
                  <span style={{ color: "var(--gold-2)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {t("readArticle")}
                    <ArrowGlyph size={12} />
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── News ───────────────────────────────────────────────────────────────────
 * A lead item plus up to three secondary rows: the newest posts filed under
 * the `news` category (`listNews`). With nothing filed there the section is
 * not rendered  an empty news block says less than no news block. */
export function NewsSection({ news }: { news: MinbarArticle[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const tNav = useTranslations("navigation");

  if (news.length === 0) return null;
  const [lead, ...rest] = news;
  const articleHref = (a: MinbarArticle) => `${miaPath("blog", locale)}/${encodeURIComponent(a.slug)}`;

  return (
    <section id="news" className="tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <div className="tv-sec-head">
          <h2 className="tv-h2">{tNav("news")}</h2>
          <ViewAllLink href={miaPath("news", locale)}>{t("allNews")}</ViewAllLink>
        </div>
        <div id="news-grid" style={{ display: "grid", gridTemplateColumns: rest.length ? "minmax(0,1.4fr) minmax(0,1fr)" : "minmax(0,1fr)", gap: 22, alignItems: "start" }}>
          <Link href={articleHref(lead)} style={{ position: "relative", display: "block", minHeight: 340, borderRadius: 16, overflow: "hidden", background: "var(--navy)" }}>
            {lead.cover ? (
              <span role="img" aria-label={lead.title} style={{ position: "absolute", inset: 0, display: "block", backgroundImage: cssImage(lead.cover, 620), backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : null}
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(3,26,54,.9) 6%, rgba(3,26,54,.35) 52%, rgba(3,26,54,0) 82%)" }} />
            <span style={{ position: "absolute", insetInline: 24, bottom: 24, display: "grid", gap: 10 }}>
              {lead.category ? (
                <span style={{ justifySelf: "start", padding: "5px 11px", borderRadius: 999, background: "var(--gold)", color: "#031a36", fontSize: 11, fontWeight: 900 }}>
                  {lead.category.name}
                </span>
              ) : null}
              <b style={{ color: "#fff", fontSize: "clamp(20px,2.2vw,28px)", lineHeight: 1.45, maxWidth: "24ch" }}>{lead.title}</b>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#7fd6f5", fontSize: 13, fontWeight: 800 }}>
                {t("readNews")}
                <ArrowGlyph />
              </span>
            </span>
          </Link>
          {rest.length ? (
            <div id="news-list" style={{ display: "grid", gap: 12 }}>
              {rest.map((item) => (
                <Link
                  key={item.id}
                  href={articleHref(item)}
                  className="mia-lift"
                  style={{ display: "grid", gridTemplateColumns: "116px minmax(0,1fr) 20px", gap: 16, alignItems: "center", padding: 14, background: "#fff", border: "1px solid #e6eef3", borderRadius: 16, boxShadow: "0 12px 28px rgba(2,52,88,.07)" }}
                >
                  <span style={{ position: "relative", display: "block", aspectRatio: "4 / 3", borderRadius: 10, overflow: "hidden", background: "var(--deep)" }}>
                    {item.cover ? (
                      <span role="img" aria-label={item.title} style={{ position: "absolute", inset: 0, display: "block", backgroundImage: cssImage(item.cover, 160), backgroundSize: "cover", backgroundPosition: "center" }} />
                    ) : null}
                  </span>
                  <span style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    {item.category ? (
                      <span style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 999, background: "#eaf6fd", fontSize: 11, fontWeight: 900, color: "var(--deep)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
                        {item.category.name}
                      </span>
                    ) : null}
                    <b style={{ fontSize: 16, lineHeight: 1.6 }}>{item.title}</b>
                  </span>
                  <span style={{ color: "var(--gold-2)" }} aria-hidden="true">
                    <ArrowGlyph size={17} />
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────────
 * Questions come from the Faq model; each row's `page` is the category it was
 * filed under, and the filter chips are built from whatever categories the
 * rows actually use. The chip label is an interface string where one exists
 * for that id (zakat, waqf, donation, reports) and the raw id otherwise, so an
 * editor can introduce a new category without a code change and still see it
 * filter correctly  comparing ids, never labels. */
const CATEGORY_LABEL: Record<string, { ns: "navigation" | "common"; key: string }> = {
  zakat: { ns: "navigation", key: "zakat" },
  waqf: { ns: "navigation", key: "waqf" },
  donation: { ns: "common", key: "donate" },
  reports: { ns: "navigation", key: "reports" },
};

export function FaqSection({ faqs, whatsappNumber = "905398436050" }: { faqs: CmsFaq[]; whatsappNumber?: string }) {
  const t = useTranslations("homepage");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const tSystem = useTranslations("system");

  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(0);

  const categories = useMemo(() => {
    const ids: string[] = [];
    for (const f of faqs) if (f.page && !ids.includes(f.page)) ids.push(f.page);
    return ids;
  }, [faqs]);

  const label = (id: string) => {
    const m = CATEGORY_LABEL[id];
    if (!m) return id;
    return m.ns === "navigation" ? tNav(m.key) : tCommon(m.key);
  };

  const visible = faqs.filter((f) => category === "all" || f.page === category);

  if (faqs.length === 0) return null;

  /* The Toplum design's FAQ block (`.fq` on the homepage, the FAQ page's
     `.faq-item`): one centred column  the heading and the filter chips, each
     question its own white card with a round +/− mark that fills with the CTA
     gradient when open, and the "didn't find your answer" line closing it. */
  return (
    <section id="faq" className="tv-sec" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div id="faq-grid" className="tv-faq">
        <div id="faq-aside" className="tv-faq-head">
          <h2 className="tv-h2">{t("faqTitle")}</h2>
          <p className="tv-lead">{t("faqLead")}</p>
          <div id="faq-chips" className="tv-chips">
            {["all", ...categories].map((id) => (
              <button
                key={id}
                type="button"
                className="tv-chip"
                data-chip={category === id ? "faq" : ""}
                aria-pressed={category === id}
                onClick={() => {
                  setCategory(id);
                  setOpen(0);
                }}
              >
                {id === "all" ? tSystem("allFilter") : label(id)}
              </button>
            ))}
          </div>
        </div>

        <div id="faq-list" className="tv-faq-list">
          {visible.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.id} className="tv-faq-item" data-open={isOpen ? "true" : "false"}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="faq-q"
                >
                  {faq.page ? <span className="faq-tag">{label(faq.page)}</span> : null}
                  <span className="faq-qtext">{faq.question}</span>
                  <span className="faq-plus" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? <div className="faq-a">{faq.answer}</div> : null}
              </div>
            );
          })}
        </div>

        <div id="faq-help" className="tv-faq-foot">
          <span className="tv-faq-foot-text">
            <b>{t("faqNotFound")}</b>
            <span>{t("faqWhatsapp")}</span>
          </span>
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="tv-faq-ask">
            {tNav("contact")}
            <ArrowGlyph />
          </a>
        </div>
      </div>
    </section>
  );
}
