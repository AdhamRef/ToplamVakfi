import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import OurStoryPage from "@/components/minbar/foundation/OurStoryPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about", "tvStory"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvStory" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("lead"),
    path: `/${slugFor("ourStory", locale)}`,
  });
}

/** Our story  `ToplamVakfi-design/Toplum Vakfı Our Story.dc.html`. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <OurStoryPage />
    </MinbarMessages>
  );
}
