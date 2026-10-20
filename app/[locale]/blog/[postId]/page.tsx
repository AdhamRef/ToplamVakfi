import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildLocalizedAlternates, buildPageMetadata, SITE_URL } from "@/lib/seo";
import { messagesFor } from "@/i18n/locale-messages";
import { getArticle, listRelatedArticles } from "@/lib/minbar/posts";
import { ORG } from "@/lib/minbar/org";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ArticleDetail from "@/components/minbar/blog/ArticleDetail";


interface Props {
  params: Promise<{ locale: string; postId: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvBlog"] as const;

/** Category slugs / names that file a post in the newsroom (as `listNews` reads them). */
const NEWS_KEYS = ["news", "akhbar", "الأخبار", "اخبار"];

/** Articles change when an editor publishes, not per request. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, postId } = await params;
  const article = await getArticle(decodeURIComponent(postId), locale);

  if (!article) {
    const system = (messagesFor(locale).system ?? {}) as Record<string, string>;
    return {
      title: system.notFoundTitleFull,
      robots: { index: false, follow: false },
    };
  }

  const alternates = buildLocalizedAlternates({
    basePath: "/blog",
    baseSlug: article.baseSlug,
    translations: article.localizations.map(({ locale: loc, slug }) => ({
      locale: loc,
      slug,
    })),
    fallback: article.id,
    currentLocale: locale,
    availableLocales: article.availableLocales,
  });

  return buildPageMetadata(locale, {
    title: article.seoTitle || article.title,
    description: (article.seoDescription || article.excerpt),
    path: `/blog/${encodeURIComponent(article.slug)}`,
    image: article.cover ?? undefined,
    keywords: article.seoKeywords,
    type: "article",
    alternates,
    robots: article.isLocalized
      ? { index: true, follow: true }
      : { index: false, follow: true },
  });
}

/**
 * One article  ported from `Minbar/تفاصيل المقال.dc.html`.
 *
 * The article resolves by locale slug, base slug, or id, so links minted before
 * an editor set a per-locale slug keep working. An unpublished or unknown
 * article is a real 404 rather than an empty article shell  a soft 404 is what
 * `PRODUCTION_SEO_CONTRACT.md` forbids.
 */
export default async function Article({ params }: Props) {
  const { locale, postId } = await params;
  const article = await getArticle(decodeURIComponent(postId), locale);
  if (!article) notFound();

  const isNews = NEWS_KEYS.includes(article.category?.slug ?? "") || NEWS_KEYS.includes(article.category?.name ?? "");
  const related = await listRelatedArticles(article, locale, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    inLanguage: locale,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${encodeURIComponent(article.slug)}`,
    ...(article.cover ? { image: [article.cover] } : {}),
    author: { "@type": "Organization", name: ORG.legalName },
    publisher: { "@type": "NGO", name: ORG.legalName },
  };

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <script
        type="application/ld+json"
        // JSON-LD has no other insertion point than dangerouslySetInnerHTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetail article={article} related={related} isNews={isNews} />
    </MinbarMessages>
  );
}
