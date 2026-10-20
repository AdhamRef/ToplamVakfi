import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORTED_LOCALES, localeDirection } from "@/lib/locales";
import { searchPublicContent, type PublicSearchItem } from "@/lib/minbar/public-search";
import { messagesFor } from "@/i18n/locale-messages";
import { EdArrow } from "@/components/minbar/blog/Editorial";

/**
 * Site search  laid out after `ToplamVakfi-design/Toplum Vakfı Search
 * Results.dc.html` (styles in `styles/minbar/pages/blog.css`, `ed-` classes):
 * title, the pill search field with its gradient button, the type tabs, then
 * the results as white cards three-up.
 *
 * The type tabs are plain links (`?type=`), so the page stays server-rendered
 * and every filtered view has its own URL.
 */

export const metadata: Metadata = { robots: { index: false, follow: true } };

const TYPES: readonly PublicSearchItem["type"][] = ["project", "article", "news"];

export default async function SearchPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const safeLocale = SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number]) ? locale : "ar";
  const q = (queryParams.q ?? "").trim().slice(0, 90);
  const ar = safeLocale === "ar";
  const results = q.length >= 2 ? await searchPublicContent(safeLocale, q, 48) : [];
  const labels = ar
    ? { title: "البحث في الموقع", placeholder: "ابحث عن مشروع أو مقال أو خبر", go: "بحث", empty: "لا توجد نتائج مطابقة. جرّب كلمات أخرى.", hint: "اكتب كلمتين أو أكثر للبحث", project: "مشروع", article: "مقال", news: "خبر" }
    : { title: "Search the website", placeholder: "Search projects, articles and news", go: "Search", empty: "No matching results. Try different keywords.", hint: "Enter at least two characters", project: "Project", article: "Article", news: "News" };
  const allLabel = ((messagesFor(safeLocale).system ?? {}) as Record<string, string>).allFilter ?? "";

  /* Only offer a tab for a kind of result this search actually found. */
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
        <div className="ed-search-head">
          <h1>{labels.title}</h1>
          <form action={`/${safeLocale}/search`} method="get" className="ed-search-form" role="search">
            <input name="q" defaultValue={q} placeholder={labels.placeholder} aria-label={labels.placeholder} minLength={2} maxLength={90} required />
            <button type="submit">{labels.go}</button>
          </form>

          {presentTypes.length > 1 && allLabel ? (
            <nav className="ed-tabs" aria-label={labels.title}>
              <Link href={tabHref(null)} className="ed-tab" aria-current={activeType === null ? "true" : undefined}>
                {allLabel}
              </Link>
              {presentTypes.map((type) => (
                <Link key={type} href={tabHref(type)} className="ed-tab" aria-current={activeType === type ? "true" : undefined}>
                  {labels[type]}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="ed-main" style={{ paddingTop: 16 }}>
          {q.length < 2 ? <p className="ed-search-note">{labels.hint}</p> : shown.length === 0 ? <div className="ed-card ed-empty">{labels.empty}</div> : (
            <div className="ed-grid">
              {shown.map(item => <Link key={item.id} href={item.href} className="ed-card">
                <span className="ed-media">
                  {item.image ? <span className="ed-media-img" style={{ backgroundImage: `url("${item.image.replace(/"/g, "%22")}")` }} /> : null}
                  <span className="ed-badge">{labels[item.type]}</span>
                </span>
                <span className="ed-body">
                  <h3>{item.title}</h3>
                  {item.summary ? <p className="ed-clamp">{item.summary.slice(0, 170)}</p> : null}
                  <span className="ed-cta" aria-hidden="true">
                    <EdArrow />
                  </span>
                </span>
              </Link>)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
