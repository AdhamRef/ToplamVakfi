import type { MinbarRoute } from "@/lib/minbar/routes";

/**
 * Which of the eight closing calls an article ends on.
 *
 * This lives outside `components/minbar/blog/ArticleCta.tsx` because that file
 * is a `"use client"` module: a function exported from it is a client
 * reference, and calling one from a server component throws
 * ("Attempted to call ctaKeyFor() from the server but ctaKeyFor is on the
 * client"). The article route needs the decision server-side to render, so the
 * pure part lives here and both sides import it.
 *
 * The key is derived from the CMS category **slug**, which is stable across
 * languages, with the handoff's Arabic name kept as a second chance for
 * categories created before slugs were required. `iman`  the general donation
 * call  is the fallback, exactly as it is in the handoff. The waqf, family
 * and Qur'an calls sent readers to pages that were retired, so articles in
 * those categories now close on the fallback.
 */

/** The eight calls, each naming the two routes it sends the reader to. */
export const CTA_ROUTES: Record<string, { primary: MinbarRoute; secondary: MinbarRoute }> = {
  zakat: { primary: "zakat", secondary: "zakatCalculator" },
  orphans: { primary: "projects", secondary: "recurring" },
  gaza: { primary: "projects", secondary: "recurring" },
  water: { primary: "projects", secondary: "recurring" },
  ramadan: { primary: "recurring", secondary: "projects" },
  dhulhijjah: { primary: "projects", secondary: "zakat" },
  iman: { primary: "projects", secondary: "recurring" },
  trust: { primary: "about", secondary: "projects" },
};

/** Category slug fragments that identify each call. First match wins. */
const SLUG_HINTS: ReadonlyArray<[string, readonly string[]]> = [
  ["zakat", ["zakat"]],
  ["orphans", ["orphan", "solidarity", "takaful"]],
  ["gaza", ["gaza", "relief", "emergency", "food"]],
  ["water", ["water", "health", "medical", "sanitation"]],
  ["ramadan", ["ramadan"]],
  ["dhulhijjah", ["dhul", "hijjah", "qurbani", "udhiyah", "adahi"]],
  ["trust", ["trust", "transparency", "institutional", "governance"]],
];

/** The handoff's own Arabic category names, for rows created without a slug. */
const ARABIC_NAMES: Record<string, string> = {
  "الزكاة والصدقات": "zakat",
  "الأيتام والتكافل": "orphans",
  "غزة والإغاثة": "gaza",
  "المياه والصحة": "water",
  رمضان: "ramadan",
  "ذو الحجة والأضاحي": "dhulhijjah",
  "إيمانيات وتزكية": "iman",
  "الثقة والشفافية والعمل المؤسسي": "trust",
};

/** Which of the eight calls fits this article. */
export function ctaKeyFor(categorySlug?: string | null, categoryName?: string | null): string {
  const slug = (categorySlug || "").toLowerCase();
  if (slug) {
    for (const [key, hints] of SLUG_HINTS) {
      if (hints.some((hint) => slug.includes(hint))) return key;
    }
  }
  const byName = categoryName ? ARABIC_NAMES[categoryName.trim()] : undefined;
  return byName ?? "iman";
}
