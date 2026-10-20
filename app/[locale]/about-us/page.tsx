import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import AboutPage from "@/components/minbar/about/AboutPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildPageMetadata(locale, {
    title: t("heroTitle"),
    description: t("introText"),
    path: `/${slugFor("about", locale)}`,
  });
}

/** About us  `ToplamVakfi-design/Toplum Vakfı About.dc.html`. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <AboutPage />
    </MinbarMessages>
  );
}
