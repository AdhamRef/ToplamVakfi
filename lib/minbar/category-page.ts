import { prisma } from "@/lib/prisma";
import { pickTranslation, translationLocaleWhere } from "@/lib/i18n/translation-fallback";
import { whereByIdOrAnyLocaleSlug } from "@/lib/slug";
import { listProjectsInCategory, type MinbarProject } from "./projects";
import { youtubeId as parseYoutubeId } from "@/lib/content/translation-write";
import { amountsByCurrency, type CategoryPageTemplate } from "@/lib/content/category-page-write";
import { getTranslations } from "next-intl/server";

/**
 * Server-side reader for a category's own landing page.
 *
 * Every category is published as a project page in the shape of
 * `Minbar/مشروع ترميم منازل القدس.dc.html`  hero with a film, a figures band,
 * its campaigns as donate cards and a donation box.
 *
 * Text arrives already resolved for the visitor's locale  Arabic from the row,
 * anything else from the translation with English as the fallback. Landing copy
 * that was written in Arabic but never translated falls back to a localized
 * template (`CategoryLanding` messages) rather than to the Arabic  so the page
 * component never sees a translation table. Sections whose fields are empty come
 * back empty and are not rendered, which is what lets a bare category still
 * publish as a hero plus its campaigns.
 */

export interface CategoryPageContent {
  id: string;
  slug: string;
  /** The site page this category is published as, or null for its own. */
  pageTemplate: CategoryPageTemplate | null;
  name: string;
  description: string;
  image: string;
  heroImage: string;
  /** Bare YouTube id, or "" when the hero carries no film. */
  heroVideoId: string;
  heroLead: string;
  ctaLabel: string;
  /** The figures band; null when no goal is set. */
  stats: { done: number; doneLabel: string; goal: number; goalLabel: string; percent: number } | null;
  projectsTitle: string;
  donateTitle: string;
  donateNote: string;
  /** Quick amounts in USD. */
  suggestedAmounts: number[];
  /** Quick amounts per currency code, replacing `suggestedAmounts` for a visitor in that currency. */
  suggestedByCurrency: Record<string, number[]>;
  /**
   * What the donation box gives to: the category itself (the order carries a
   * category item, keyed by id because category slugs differ per locale), or
   * one campaign  the editor's choice, else the highest priority one in the
   * category. Null when the box targets a campaign and the category has none,
   * in which case the box is not rendered.
   */
  donateTarget:
    | { kind: "category"; id: string; title: string }
    | { kind: "campaign"; id: string; slug: string; title: string }
    | null;
  projects: MinbarProject[];
}

const PAGE_SELECT = {
  id: true,
  slug: true,
  pageTemplate: true,
  name: true,
  description: true,
  image: true,
  heroImage: true,
  heroVideoUrl: true,
  heroLead: true,
  ctaLabel: true,
  statDoneValue: true,
  statDoneLabel: true,
  statGoalValue: true,
  statGoalLabel: true,
  projectsTitle: true,
  donateTitle: true,
  donateNote: true,
  suggestedAmounts: true,
  suggestedByCurrency: true,
  donateToCategory: true,
  donateCampaignId: true,
} as const;

/** One category's whole page, or `null` when the slug names nothing. */
export async function getCategoryPage(idOrSlug: string, locale: string): Promise<CategoryPageContent | null> {
  /* `whereByIdOrAnyLocaleSlug` only matches on `id` when the key actually looks
     like an ObjectId, so an unknown slug misses rather than throwing. */
  return readCategoryPage(whereByIdOrAnyLocaleSlug(idOrSlug), locale);
}

/**
 * The category bound to one of the site's own pages, or `null` when none is.
 * An archived category is skipped, so archiving it takes its campaigns off the
 * page rather than leaving them there.
 */
export async function getCategoryPageByTemplate(
  template: CategoryPageTemplate,
  locale: string
): Promise<CategoryPageContent | null> {
  return readCategoryPage({ pageTemplate: template, NOT: { isActive: false } }, locale);
}

type CategoryWhere = NonNullable<Parameters<typeof prisma.category.findFirst>[0]>["where"];

async function readCategoryPage(where: CategoryWhere, locale: string): Promise<CategoryPageContent | null> {
  const row = await prisma.category.findFirst({
    where,
    select: {
      ...PAGE_SELECT,
      translations: {
        where: translationLocaleWhere(locale),
        take: 2,
        select: {
          locale: true,
          name: true,
          description: true,
          slug: true,
          heroLead: true,
          ctaLabel: true,
          statDoneLabel: true,
          statGoalLabel: true,
          projectsTitle: true,
          donateTitle: true,
          donateNote: true,
        },
      },
    },
  });
  if (!row) return null;

  const t = pickTranslation(row.translations, locale);

  const projects = await listProjectsInCategory(row.id, locale);

  const name = t?.name || row.name;

  /* Off the Arabic site a field nobody translated would otherwise show the
     row's Arabic. Where the Arabic is set, a localized template stands in;
     where it is empty, the field stays empty and its section is skipped. */
  const tLanding = locale === "ar" ? null : await getTranslations({ locale, namespace: "CategoryLanding" });
  const tCert = locale === "ar" ? null : await getTranslations({ locale, namespace: "certificates" });
  type LandingKey = "heroLead" | "ctaLabel" | "projectsTitle" | "donateTitle" | "statDoneLabel" | "statGoalLabel";
  const copy = (key: LandingKey, own: string | null | undefined, arabic: string | null | undefined): string =>
    own || (!tLanding ? arabic || "" : arabic ? tLanding(key, { name, org: tCert!("orgName") }) : "");

  /* `projects` is already ordered priority-first, so the fallback target is
     simply its head. An explicit choice that has since been archived falls back
     the same way rather than leaving the box pointing at nothing. */
  const donateCampaign =
    (row.donateCampaignId ? projects.find((p) => p.id === row.donateCampaignId) : undefined) ??
    projects[0] ??
    null;
  const donateTarget: CategoryPageContent["donateTarget"] = row.donateToCategory
    ? { kind: "category", id: row.id, title: name }
    : donateCampaign
      ? { kind: "campaign", id: donateCampaign.id, slug: donateCampaign.slug, title: donateCampaign.title }
      : null;

  const done = row.statDoneValue ?? 0;
  const goal = row.statGoalValue ?? 0;

  return {
    id: row.id,
    slug: t?.slug || row.slug || row.id,
    pageTemplate: (row.pageTemplate as CategoryPageTemplate | null) ?? null,
    name,
    description: t?.description || row.description || "",
    image: row.image ?? "",
    heroImage: row.heroImage || row.image || "",
    heroVideoId: row.heroVideoUrl ? parseYoutubeId(row.heroVideoUrl) : "",
    heroLead: copy("heroLead", t?.heroLead || t?.description, row.heroLead || row.description),
    ctaLabel: copy("ctaLabel", t?.ctaLabel, row.ctaLabel),
    stats:
      goal > 0
        ? {
            done,
            doneLabel: copy("statDoneLabel", t?.statDoneLabel, row.statDoneLabel),
            goal,
            goalLabel: copy("statGoalLabel", t?.statGoalLabel, row.statGoalLabel),
            percent: Math.min(Math.round((done / goal) * 100), 100),
          }
        : null,
    projectsTitle: copy("projectsTitle", t?.projectsTitle, row.projectsTitle),
    donateTarget,
    donateTitle: copy("donateTitle", t?.donateTitle, row.donateTitle),
    // Free text with no template; the box shows the target campaign's title instead.
    donateNote: t?.donateNote || (locale === "ar" ? row.donateNote || "" : ""),
    suggestedAmounts: row.suggestedAmounts ?? [],
    suggestedByCurrency: amountsByCurrency(row.suggestedByCurrency),
    projects,
  };
}

/** A category the cart can name: its id and its title in the visitor's locale. */
export interface MinbarCategoryTitle {
  id: string;
  title: string;
}

/**
 * Every active category's title, for the cart and checkout pages.
 *
 * A cart row that gives to a category stores the category's **id**  its slugs
 * differ per locale  and these pages resolve the title live, the way they
 * resolve a project slug through the project list. Archived categories are
 * still listed: the title of a row already in someone's basket should not go
 * blank because the category was archived after it was added; the order API
 * is what refuses it.
 */
export async function listCategoryTitles(locale: string): Promise<MinbarCategoryTitle[]> {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      translations: { where: translationLocaleWhere(locale), select: { locale: true, name: true } },
    },
  });
  return rows.map((row) => ({ id: row.id, title: pickTranslation(row.translations, locale)?.name || row.name }));
}
