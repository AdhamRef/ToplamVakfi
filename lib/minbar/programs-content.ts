/**
 * Static content entries for the Toplum Vakfı programme pages
 * (`ToplamVakfi-design/Toplum Vakfı Program - *.dc.html`).
 *
 * Each programme is one entry: its URL slug, the giving theme its linked
 * campaigns are matched by, and the four field-of-work cards with the design's
 * own icons. The copy itself is in the `tvPrograms` message namespace under
 * `detail.<slug>`; nothing here is a sentence.
 */

import type { GivingTheme } from "./programs-match";

/** The design's inline icons, as the inner markup of a 24×24 stroked SVG. */
export const PROGRAM_ICONS = {
  dome: '<path d="M4 20v-6a8 8 0 0 1 16 0v6"/><path d="M4 20h16"/>',
  cap: '<path d="M12 3L2 8l10 5 10-5-10-5z"/>',
  lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/>',
  wave: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1.5 1 6.5 1 8 0M8 10c1.5-1 6.5-1 8 0"/>',
  pipes: '<path d="M12 3v18M5 8h14M5 16h14"/>',
  plus: '<path d="M20 12H4M12 4v16"/>',
  shield: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  book: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>',
  gradcap: '<path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 10v6c0 2 2.5 3.5 6 3.5s6-1.5 6-3.5v-6"/>',
  house: '<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>',
} as const;

export type ProgramIcon = keyof typeof PROGRAM_ICONS;

export interface ProgramEntry {
  slug: ProgramSlug;
  theme: GivingTheme;
  /** The four area cards' icons, in the design's order (copy: `detail.<slug>.a1…a4`). */
  areas: readonly [ProgramIcon, ProgramIcon, ProgramIcon, ProgramIcon];
}

export const PROGRAM_SLUGS = ["aytam", "ighatha", "miyah", "quran", "sakan", "taalim"] as const;
export type ProgramSlug = (typeof PROGRAM_SLUGS)[number];

export const PROGRAMS: Readonly<Record<ProgramSlug, ProgramEntry>> = {
  aytam: { slug: "aytam", theme: "orphans", areas: ["dome", "cap", "lock", "person"] },
  ighatha: { slug: "ighatha", theme: "relief", areas: ["plus", "shield", "lock", "person"] },
  miyah: { slug: "miyah", theme: "water", areas: ["wave", "pipes", "dome", "person"] },
  quran: { slug: "quran", theme: "quran", areas: ["book", "person", "shield", "dome"] },
  sakan: { slug: "sakan", theme: "shelter", areas: ["dome", "cap", "lock", "person"] },
  taalim: { slug: "taalim", theme: "education", areas: ["gradcap", "book", "house", "person"] },
};

export const isProgramSlug = (value: string): value is ProgramSlug =>
  (PROGRAM_SLUGS as readonly string[]).includes(value);
