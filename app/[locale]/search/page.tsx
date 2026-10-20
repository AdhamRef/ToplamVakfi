import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SUPPORTED_LOCALES, localeDirection } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import { searchPublicContent, type PublicSearchItem } from "@/lib/minbar/public-search";

/**
 * Site search  `ToplamVakfi-design/Toplum Vakfı Search Results.dc.html`
 * (styles in `styles/minbar/pages/blog.css`, `ed-sr-*`): the title and its
 * note, the pill search box with its gradient button, the filter chips, the
 * result count, then the results as white cards three-up (photo, the kind
 * pill, title, summary, "view" link); or the design's empty state.
 *
 * The chips are the kinds of result this search actually found (projects,
 * articles, news) and are plain links (`?type=`), so the page stays
 * server-rendered and every filtered view has its own URL.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvSearch" });
  return { title: t("title"), robots: { index: false, follow: true } };
}

const TYPES: readonly PublicSearchItem["type"][] = ["project", "article", "news"];

export default async function SearchPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const safeLocale = SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number]) ? locale : "ar";
  const t = await getTranslations({ locale: safeLocale, namespace: "tvSearch" });
  const q = (queryParams.q ?? "").trim().slice(0, 90);
  const results = q.length >= 2 ? await searchPublicContent(safeLocale, q, 48) : [];

  const typeLabel: Record<PublicSearchItem["type"], string> = { project: t("typeProject"), article: t("typeArticle"), news: t("typeNews") };
  const typeChip: Record<PublicSearchItem["type"], string> = { project: t("chipProjects"), article: t("chipArticles"), news: t("chipNews") };
  const linkLabel: Record<PublicSearchItem["type"], string> = { project: t("viewProject"), article: t("readArticle"), news: t("readNews") };

  /* Only offer a chip for a kind of result this search actually found. */
  const presentTypes = TYPES.filter((type) => results.some((item) => item.type === type));
  const activeType = presentTypes.find((type) => type === queryParams.type) ?? null;
  const shown = activeType ? results.filter((item) => item.type === activeType) : results;
  const tabHref = (type: string | null) => {
    const sp = new URLSearchParams({ q });
    if (type) sp.set("type", type);
    return `/${safeLocale}/search?${sp.toString()}`;
  };

  return (
    <main className="mia-site-search-page-v2 ed-page" dir={localeDirection(safeLocale)}>
      <div className="ed-wrap">
        <div className="ed-sr-top">
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
          <form action={`/${safeLocale}/search`} method="get" className="ed-sr-box" role="search">
            <input name="q" defaultValue={q} placeholder={t("placeholder")} aria-label={t("placeholder")} minLength={2} maxLength={90} required />
            <button type="submit">{t("submit")}</button>
          </form>

          {presentTypes.length > 1 ? (
            <nav className="ed-sr-filters" aria-label={t("filtersLabel")}>
              <Link href={tabHref(null)} className="ed-sr-chip" aria-current={activeType === null ? "true" : undefined}>
                {t("chipAll")}
              </Link>
              {presentTypes.map((type) => (
                <Link key={type} href={tabHref(type)} className="ed-sr-chip" aria-current={activeType === type ? "true" : undefined}>
                  {typeChip[type]}
                </Link>
              ))}
            </nav>
          ) : null}
          {shown.length ? <p className="ed-sr-count">{t("count", { count: shown.length })}</p> : null}
          {q.length < 2 ? <p className="ed-sr-count">{t("hint")}</p> : null}
        </div>

        {q.length >= 2 && shown.length === 0 ? (
          <div className="ed-sr-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <h2>{t("emptyTitle")}</h2>
            <p>{t("emptyText")}</p>
            <Link href={miaPath("projects", safeLocale)}>{t("emptyCta")}</Link>
          </div>
        ) : shown.length ? (
          <div className="ed-sr-grid">
            {shown.map((item) => (
              <Link key={item.id} href={item.href} className="ed-sr-card">
                <span
                  className="ed-sr-img"
                  style={item.image ? { backgroundImage: `url("${item.image.replace(/"/g, "%22")}")` } : undefined}
                />
                <span className="ed-sr-body">
                  <span className="ed-sr-cat">{typeLabel[item.type]}</span>
                  <h3>{item.title}</h3>
                  {item.summary ? <p>{item.summary.slice(0, 170)}</p> : null}
                  <span className="ed-sr-link">{linkLabel[item.type]}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
