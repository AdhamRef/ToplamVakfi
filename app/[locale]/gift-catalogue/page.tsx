import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import { imageForTheme, targetForTheme, toGivingTarget, type GivingTheme } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import GiftCataloguePage, { type GiftId, type GiftItem } from "@/components/minbar/giving/GiftCataloguePage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvGifts"] as const;

export const revalidate = 300;

/** The design's six gifts: indicative value (USD) and the themes their campaign is matched by. */
const GIFTS: ReadonlyArray<{ id: GiftId; price: number; themes: GivingTheme[] }> = [
  { id: "food", price: 75, themes: ["food", "relief"] },
  { id: "well", price: 1500, themes: ["water"] },
  { id: "bag", price: 40, themes: ["education"] },
  { id: "tree", price: 25, themes: ["tree"] },
  { id: "mushaf", price: 60, themes: ["quran"] },
  { id: "winter", price: 50, themes: ["winter", "relief"] },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvGifts" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("lead"),
    path: `/${slugFor("giftCatalogue", locale)}`,
  });
}

/** Gift catalogue — `ToplamVakfi-design/Toplum Vakfı Gift Catalogue.dc.html`. */
export default async function GiftCatalogue({ params }: Props) {
  const { locale } = await params;
  const projects = await listProjects(locale);

  const gifts: GiftItem[] = GIFTS.map((g) => ({
    id: g.id,
    price: g.price,
    target: toGivingTarget(targetForTheme(projects, g.themes)),
    image: imageForTheme(projects, g.themes),
  }));

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <GiftCataloguePage gifts={gifts} bannerImage={imageForTheme(projects, ["food", "relief"])} />
    </MinbarMessages>
  );
}
