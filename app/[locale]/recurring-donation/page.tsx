import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { listProjects } from "@/lib/minbar/projects";
import { ENABLED_RECURRING_FREQUENCIES } from "@/lib/minbar/frequencies";
import { miaPath, slugFor } from "@/lib/minbar/routes";
import { imageForTheme, targetForTheme, toGivingTarget, type GivingTheme } from "@/lib/minbar/programs-match";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import RecurringPage, { type RecurringCause, type RecurringCauseId } from "@/components/minbar/recurring/RecurringPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["recurring"] as const;

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recurring" });
  return buildPageMetadata(locale, {
    title: `${t("title1")} ${t("title2")}`,
    description: t("lead"),
    path: `/${slugFor("recurring", locale)}`,
  });
}

/** The design's six causes: their campaign theme and the programme page each card opens. */
const CAUSES: ReadonlyArray<{ id: RecurringCauseId; theme: GivingTheme | null; program: string | null }> = [
  { id: "orphans", theme: "orphans", program: "aytam" },
  { id: "education", theme: "education", program: "taalim" },
  { id: "relief", theme: "relief", program: "ighatha" },
  { id: "water", theme: "water", program: "miyah" },
  { id: "quran", theme: "quran", program: "quran" },
  { id: "needed", theme: null, program: null },
];

/**
 * Monthly giving — `ToplamVakfi-design/Toplum Vakfı Monthly Giving.dc.html`.
 *
 * Each cause gives to the first published campaign matching it; "where the
 * need is greatest" gives to the top-priority campaign (the list is ordered by
 * the dashboard's priority, then newest).
 */
export default async function Recurring({ params }: Props) {
  const { locale } = await params;
  /* No recurring frequency enabled (`config/donation-frequencies.ts`): nothing to set up here. */
  if (!ENABLED_RECURRING_FREQUENCIES.length) redirect(miaPath("projects", locale));
  const projects = await listProjects(locale);
  const urgent = projects.find((p) => !p.shares) ?? null;

  const causes: RecurringCause[] = CAUSES.map((c) => ({
    id: c.id,
    target: toGivingTarget(c.theme ? targetForTheme(projects, c.theme) : urgent),
    image: c.theme ? imageForTheme(projects, c.theme) : urgent?.image ?? null,
    href: c.program ? miaPath("programDetail", locale, c.program) : miaPath("projects", locale),
  }));

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <RecurringPage causes={causes} projects={projects.map((p) => ({ slug: p.slug, title: p.title }))} />
    </MinbarMessages>
  );
}
