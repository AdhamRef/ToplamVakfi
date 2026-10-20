import { optionalInt, optionalStr, str } from "./translation-write";

/**
 * Shaping for the landing page a category owns.
 *
 * The category endpoints predate the site-content group and write their own
 * scalars and translations by hand; this only covers the page fields added on
 * top  the hero, the figures and the donation box  so the existing name /
 * slug / image logic is untouched.
 */

/** The site pages a category may be published as, instead of its own. */
/** Pages a category can be bound to. "aqsa" was retired with the Al-Aqsa page;
 *  a category still stored with it reads as unbound (`pageTemplate()` → null). */
export const CATEGORY_PAGE_TEMPLATES = ["zakat"] as const;
export type CategoryPageTemplate = (typeof CATEGORY_PAGE_TEMPLATES)[number];

export function pageTemplate(v: unknown): CategoryPageTemplate | null {
  const s = str(v);
  return (CATEGORY_PAGE_TEMPLATES as readonly string[]).includes(s) ? (s as CategoryPageTemplate) : null;
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** Whole positive amounts, de-duplicated, in the order the editor gave them. */
function amounts(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const v of raw) {
    const n = optionalInt(v);
    if (n !== undefined && n > 0 && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 12);
}

const MAX_CURRENCY_OVERRIDES = 20;

/**
 * `{ EUR: [50, 100], ... }`  the per-currency exceptions. USD is the base list
 * and is dropped here rather than kept as a duplicate of `suggestedAmounts`;
 * a currency whose list comes out empty is dropped too, so an exception row
 * the editor added and never filled in does not blank that currency's chips.
 */
export function amountsByCurrency(raw: unknown): Record<string, number[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const code = str(k).toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || code === "USD") continue;
    const list = amounts(v);
    if (list.length) out[code] = list;
    if (Object.keys(out).length >= MAX_CURRENCY_OVERRIDES) break;
  }
  return out;
}

/** The page's own scalars. Only keys the request carried are returned, so a
 *  caller that knows nothing about the page leaves it exactly as it was. */
export function buildCategoryPagePatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  const text = (key: string) => {
    if (body[key] !== undefined) patch[key] = optionalStr(body[key]) ?? null;
  };
  const int = (key: string) => {
    if (body[key] !== undefined) patch[key] = optionalInt(body[key]) ?? null;
  };

  for (const key of [
    "heroImage",
    "heroVideoUrl",
    "heroLead",
    "ctaLabel",
    "statDoneLabel",
    "statGoalLabel",
    "projectsTitle",
    "donateTitle",
    "donateNote",
  ]) {
    text(key);
  }
  int("statDoneValue");
  int("statGoalValue");

  if (body.pageTemplate !== undefined) patch.pageTemplate = pageTemplate(body.pageTemplate);

  if (body.suggestedAmounts !== undefined) patch.suggestedAmounts = amounts(body.suggestedAmounts);
  if (body.suggestedByCurrency !== undefined) {
    const by = amountsByCurrency(body.suggestedByCurrency);
    patch.suggestedByCurrency = Object.keys(by).length ? by : null;
  }
  if (body.donateToCategory !== undefined) patch.donateToCategory = body.donateToCategory === true;
  if (body.donateCampaignId !== undefined) {
    const id = str(body.donateCampaignId);
    patch.donateCampaignId = OBJECT_ID.test(id) ? id : null;
  }
  return patch;
}

/** The translated half of the page, per locale  merged into the row the
 *  category endpoints already upsert for `name` / `description`. */
export const CATEGORY_PAGE_TRANSLATION_FIELDS = [
  "heroLead",
  "ctaLabel",
  "statDoneLabel",
  "statGoalLabel",
  "projectsTitle",
  "donateTitle",
  "donateNote",
] as const;

export function categoryPageTranslation(t: Record<string, unknown> | null | undefined) {
  const out: Record<string, string | null> = {};
  if (!t || typeof t !== "object") return out;
  for (const key of CATEGORY_PAGE_TRANSLATION_FIELDS) {
    if (t[key] !== undefined) out[key] = optionalStr(t[key]) ?? null;
  }
  return out;
}

/** Everything the edit form needs back, on top of the category's own fields. */
export const CATEGORY_PAGE_SELECT = {
  pageTemplate: true,
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

/**
 * A site page carries one category at most. Called after a category is saved
 * with a template: any other category still bound to that page lets go of it,
 * so the page never has to choose between two.
 */
export async function releasePageTemplateFromOthers(
  db: { category: { updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown> } },
  categoryId: string,
  template: CategoryPageTemplate | null
): Promise<void> {
  if (!template) return;
  await db.category.updateMany({
    where: { pageTemplate: template, id: { not: categoryId } },
    data: { pageTemplate: null },
  });
}
