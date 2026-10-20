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
    title: t("donation.title", values),
    description: t("donation.intro", values),
    path: `/${slugFor("donationPolicy", locale)}`,
  });
}

/** The donation agreement, laid out as `ToplamVakfi-design/Toplum Vakfı Donation Agreement.dc.html`. */
export default async function Page({ params }: Props) {
  const { locale } = await params;

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <LegalPage doc="donation" />
    </MinbarMessages>
  );
}
