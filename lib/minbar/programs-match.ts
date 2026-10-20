/**
 * Giving-theme matching for the Toplum Vakfı programme and giving-product pages.
 *
 * The design's programme pages, the sadaqah jariyah options, the gift
 * catalogue and the religious occasions are static content, but every donation
 * they take has to land on something the order can carry: a real campaign
 * (`projectId`) or a real category. Nothing in the database says "this
 * campaign is the water-wells one", so a theme is matched by keyword against
 * the campaign's own title, slug and category names/slugs, in the four site
 * languages. A theme with no match simply has no target — the page then links
 * to the projects list instead of inventing a destination.
 *
 * Pure functions: safe on the server and in the browser.
 */

import type { MinbarProject } from "./projects";

export type GivingTheme =
  | "orphans"
  | "education"
  | "relief"
  | "water"
  | "quran"
  | "shelter"
  | "tree"
  | "food"
  | "winter"
  | "aqiqah"
  | "kaffarah"
  | "hope";

/** Lower-case, without Arabic diacritics/tatweel, with the alef/ya/ta-marbuta forms folded. */
export function normalizeForMatch(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[-_/]+/g, " ");
}

/* Stems, not whole words: "يتيم" also finds "الأيتام" once folded, "orphan"
   finds "orphanage", "kuyu" finds "kuyuları". */
const KEYWORDS: Record<GivingTheme, readonly string[]> = {
  orphans: ["يتيم", "ايتام", "orphan", "yetim", "jetim", "aytam"],
  education: ["تعليم", "مدرس", "منح", "طلاب", "school", "educat", "scholar", "student", "eğitim", "egitim", "okul", "burs", "öğrenci", "arsim", "shkoll", "bursa", "taalim"],
  relief: ["اغاث", "سلال", "سله", "طرود", "relief", "emergency", " aid ", "basket", "yardım", "yardim", "acil", "ndihm", "ighatha"],
  water: [" ماء", "الماء", "مياه", "بئر", "ابار", "سقيا", "water", " well", "kuyu", " su ", "sukuyu", "ujë", "uje", " pus", "miyah"],
  quran: ["قران", "تحفيظ", "مصحف", "مصاحف", "quran", "qur'an", "qur’an", "kuran", "kur'an", "kur’an", "hafız", "hafiz", "kuran"],
  shelter: ["سكن", "مأوي", "ماوي", "ايواء", "اعمار", "منازل", "بيوت", "shelter", "housing", " home", " house", "barınma", "barinma", "konut", " ev ", "strehim", "shtëpi", "shtepi", "sakan"],
  tree: ["شجر", "غرس", "tree", "plant", "ağaç", "agac", "fidan", " pem"],
  food: ["غذا", "طعام", "اطعام", "وجب", "سلال", "خبز", "food", "meal", "bread", "gıda", "gida", "yemek", "ekmek", "ushqim", "bukë"],
  winter: ["شتا", "كسوه", "دفء", "winter", "cloth", "blanket", "kış", " kis ", "giysi", "dimër", "dimer", "veshje"],
  aqiqah: ["عقيق", "اضاح", "اضحي", "ذبائح", "aqiqah", "aqeeqah", "akika", "sacrific", "qurban", "kurban", "kurbani"],
  kaffarah: ["كفار", "فديه", "اطعام", "kaffar", "fidya", "fidye", "kefaret"],
  hope: ["الامل", " امل ", "حمله امل", "hope", "umut", "shpres", " amal"],
};

const projectHaystack = (project: MinbarProject): string =>
  normalizeForMatch(
    ` ${[project.title, project.slug, ...project.categories.flatMap((c) => [c.label, c.slug ?? ""])].join(" ")} `
  );

/** Whether a campaign belongs to a theme. */
export function matchesTheme(project: MinbarProject, theme: GivingTheme): boolean {
  const hay = projectHaystack(project);
  return KEYWORDS[theme].some((word) => hay.includes(normalizeForMatch(word)));
}

/** Whether a free text (a category's name or slug) belongs to a theme. */
export function textMatchesTheme(text: string, theme: GivingTheme): boolean {
  const hay = normalizeForMatch(` ${text} `);
  return KEYWORDS[theme].some((word) => hay.includes(normalizeForMatch(word)));
}

/**
 * The campaigns of a theme, in the list's own order (the projects list is
 * already ordered by priority, then newest). Shares campaigns are skipped when
 * `amountOnly` is set: they take a share count, not a free amount.
 */
export function projectsForTheme(
  projects: readonly MinbarProject[],
  themes: GivingTheme | readonly GivingTheme[],
  opts: { amountOnly?: boolean; limit?: number } = {}
): MinbarProject[] {
  const list = typeof themes === "string" ? [themes] : themes;
  const out: MinbarProject[] = [];
  for (const theme of list) {
    for (const project of projects) {
      if (opts.amountOnly && project.shares) continue;
      if (out.includes(project)) continue;
      if (matchesTheme(project, theme)) out.push(project);
    }
  }
  return opts.limit ? out.slice(0, opts.limit) : out;
}

/** The first campaign that can take a free amount for a theme (or the first of several themes). */
export function targetForTheme(
  projects: readonly MinbarProject[],
  themes: GivingTheme | readonly GivingTheme[]
): MinbarProject | null {
  return projectsForTheme(projects, themes, { amountOnly: true, limit: 1 })[0] ?? null;
}

/** A photograph for a theme: the first matching campaign's cover. */
export function imageForTheme(
  projects: readonly MinbarProject[],
  themes: GivingTheme | readonly GivingTheme[]
): string | null {
  return projectsForTheme(projects, themes).find((p) => p.image)?.image ?? null;
}

/** The fallback photograph for every image slot without a real match. */
export const TV_FALLBACK_IMAGE = "/toplum/hero-bg.webp";

/**
 * The slice of a campaign the giving pages' client components need — kept
 * small because it crosses into the browser bundle.
 */
export interface GivingTarget {
  slug: string;
  title: string;
}

export const toGivingTarget = (project: MinbarProject | null): GivingTarget | null =>
  project ? { slug: project.slug, title: project.title } : null;
