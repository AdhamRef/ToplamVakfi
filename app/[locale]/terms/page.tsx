import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import LegalPage from "@/components/minbar/legal/LegalPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvLegal"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvLegal" });
  const values = { org: ORG.legalName, email: ORG.email };
  return buildPageMetadata(locale, {
    title: t("terms.title", values),
    description: t("terms.intro", values),
    path: `/${slugFor("terms", locale)}`,
  });
}

/** Laid out as `ToplamVakfi-design/Toplum Vakfı Terms.dc.html` (its donation terms sit under `#donation`). */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <LegalPage doc="terms" />
    </MinbarMessages>
  );
}
