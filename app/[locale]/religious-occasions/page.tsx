import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import { imageForTheme, targetForTheme, toGivingTarget } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import ReligiousOccasionsPage from "@/components/minbar/giving/ReligiousOccasionsPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvOccasions"] as const;

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvOccasions" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("lead"),
    path: `/${slugFor("religiousOccasions", locale)}`,
  });
}

/**
 * Religious occasions — `ToplamVakfi-design/Toplum Vakfı Religious Occasions.dc.html`.
 * Each occasion gives to the first published campaign matching it.
 */
export default async function ReligiousOccasions({ params }: Props) {
  const { locale } = await params;
  const projects = await listProjects(locale);

  const feeding = toGivingTarget(targetForTheme(projects, ["kaffarah", "food"]));
  const targets = {
    kaffarah: feeding,
    fidya: feeding,
    aqiqah: toGivingTarget(targetForTheme(projects, "aqiqah")),
  };

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <ReligiousOccasionsPage targets={targets} image={imageForTheme(projects, ["food", "relief"])} />
    </MinbarMessages>
  );
}
