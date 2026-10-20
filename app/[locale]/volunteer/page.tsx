import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import VolunteerPage from "@/components/minbar/volunteer/VolunteerPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["about", "volunteer"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "volunteer" });
  return buildPageMetadata(locale, {
    title: t("heroTitle"),
    description: t("heroSubtitle"),
    path: `/${slugFor("volunteer", locale)}`,
  });
}

/** Volunteer with us  no design of its own; built on the shared inner-page system. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <VolunteerPage />
    </MinbarMessages>
  );
}
