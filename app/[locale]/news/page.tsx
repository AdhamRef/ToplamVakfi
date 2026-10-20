import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { listNews } from "@/lib/minbar/posts";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import NewsPage from "@/components/minbar/news/NewsPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvNews"] as const;

/** News changes when an editor publishes, not per request. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvNews" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("lead"),
    path: `/${slugFor("news", locale)}`,
  });
}

/**
 * The newsroom  `ToplamVakfi-design/Toplum Vakfı News.dc.html`.
 */
export default async function News({ params }: Props) {
  const { locale } = await params;
  const items = await listNews(locale);

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <NewsPage items={items} />
    </MinbarMessages>
  );
}
