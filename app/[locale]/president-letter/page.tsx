import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import PresidentLetterPage from "@/components/minbar/foundation/PresidentLetterPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about", "tvPresident"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvPresident" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("quote"),
    path: `/${slugFor("presidentLetter", locale)}`,
  });
}

/** President's letter  `ToplamVakfi-design/Toplum Vakfı President Letter.dc.html`. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <PresidentLetterPage />
    </MinbarMessages>
  );
}
