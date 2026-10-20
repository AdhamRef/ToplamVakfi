import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import BoardPage from "@/components/minbar/foundation/BoardPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about", "tvBoard"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvBoard" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("metaDescription"),
    path: `/${slugFor("board", locale)}`,
  });
}

/** Board of trustees  `ToplamVakfi-design/Toplum Vakfı Board.dc.html`. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <BoardPage />
    </MinbarMessages>
  );
}
