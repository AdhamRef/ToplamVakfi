/**
 * Where a zakat gift from the zakat pages goes, as cart-row identifiers.
 *
 * The rule the zakat page has always used, shared with the calculator: with a
 * zakat category bound to the page the gift goes where its donation box points
 * — the category itself, or one campaign — and to the category when the box
 * has no target. The bare `zakatToPalestine` intention has no destination the
 * order can carry; it is only left for a site with no zakat category at all.
 */

import type { MinbarCartItem } from "./cart";
import type { CategoryPageContent } from "./category-page";

/** The serialisable part of a zakat category the client needs. */
export type ZakatCartTarget = Pick<MinbarCartItem, "categoryId" | "projectId" | "titleKey">;

export function zakatCartTarget(
  category: Pick<CategoryPageContent, "id" | "donateTarget"> | null | undefined
): ZakatCartTarget {
  if (category?.donateTarget?.kind === "category") return { categoryId: category.donateTarget.id };
  if (category?.donateTarget?.kind === "campaign") return { projectId: category.donateTarget.slug };
  if (category) return { categoryId: category.id };
  return { titleKey: "zakatToPalestine" };
}
