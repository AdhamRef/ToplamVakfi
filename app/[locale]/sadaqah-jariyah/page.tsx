import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import { listProjects } from "@/lib/minbar/projects";
import { imageForTheme, targetForTheme, toGivingTarget } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import SadaqahJariyahPage, { type SadaqahOption } from "@/components/minbar/giving/SadaqahJariyahPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvSadaqah"] as const;

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvSadaqah" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("lead"),
    path: `/${slugFor("sadaqahJariyah", locale)}`,
  });
}

/**
 * Sadaqah jariyah — `ToplamVakfi-design/Toplum Vakfı Sadaqah Jariyah.dc.html`.
 * Each option gives to the first published campaign matching it.
 */
export default async function SadaqahJariyah({ params }: Props) {
  const { locale } = await params;
  const projects = await listProjects(locale);

  const options: SadaqahOption[] = [
    { id: "tree", target: toGivingTarget(targetForTheme(projects, "tree")), image: imageForTheme(projects, "tree") },
    { id: "well", target: toGivingTarget(targetForTheme(projects, "water")), image: imageForTheme(projects, "water") },
  ];

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <SadaqahJariyahPage options={options} />
    </MinbarMessages>
  );
}
