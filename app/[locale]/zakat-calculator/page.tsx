import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { getCategoryPageByTemplate } from "@/lib/minbar/category-page";
import { zakatCartTarget } from "@/lib/minbar/programs-zakat";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ZakatCalculator from "@/components/minbar/zakat/ZakatCalculator";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["zakat"] as const;

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "zakat" });
  return buildPageMetadata(locale, {
    title: t("calcTitle"),
    description: t("calcLead"),
    path: `/${slugFor("zakatCalculator", locale)}`,
  });
}

/**
 * Zakat calculator — `ToplamVakfi-design/Toplum Vakfı Zakat Calculator.dc.html`.
 *
 * "Give your zakat" goes where the zakat page's gifts go: the zakat category
 * bound to that page (its donation box's target, else the category itself).
 *
 * `[BACKEND-INTEGRATION]`: `DEVELOPER_HANDOFF` lists a daily gold-price API as
 * a required integration. Until it exists the donor enters the rate per gram
 * themselves (optional), and no nisāb figure is computed from an invented rate.
 */
export default async function ZakatCalculatorPage({ params }: Props) {
  const { locale } = await params;
  const category = await getCategoryPageByTemplate("zakat", locale);

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <ZakatCalculator target={zakatCartTarget(category)} bannerImage={category?.projects.find((p) => p.image)?.image ?? null} />
    </MinbarMessages>
  );
}
