/**
 * The homepage's fixed content  everything `ToplamVakfi-design/Toplum Vakfı
 * Homepage.dc.html` draws that is not a database list: which programme card
 * goes where, the map's points, the sponsorship and achievement tiles, the
 * partners. The words are in the `tvHome` messages; this file holds the
 * structure, the figures and the icons.
 *
 * Pure: no React, no Prisma.
 */

import type { MinbarRoute } from "./routes";
import { cachedNumberFormat } from "./money";

/**
 * A figure as the design prints it: Western digits in every edition (the
 * design's Arabic uses 1995, 3673, 100,000), grouped the locale's way.
 */
export function homeNumber(locale: string, value: number): string {
  return cachedNumberFormat(`${locale}-u-nu-latn`, { maximumFractionDigits: 2 }).format(value);
}

/* ── Impact strip (`.hs-stats`) ──────────────────────────────────────────── */

/** The design's icons, as stroke paths on a 24×24 grid. */
export const HOME_ICONS = {
  globe: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM3.5 12h17M12 3.5c2.4 2.4 3.5 5.4 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.4-3.5-8.5S9.6 5.9 12 3.5z",
  mosque: "M12 3v2.5M8 10a4 4 0 0 1 8 0M5 20V12h14v8M9.5 20v-4a2.5 2.5 0 0 1 5 0v4M3.5 20h17",
  basket: "M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8zM9 11V6a3 3 0 0 1 6 0v5",
  cap: "m2.5 9 9.5-4.5L21.5 9 12 13.5zM6.5 11v4.5c1.5 1.3 3.4 2 5.5 2s4-.7 5.5-2V11",
  calendar: "M5.5 5.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM3.5 10h17M8 3v4M16 3v4",
  heart: "M12 20s-7.2-4.6-9.4-9.2C1.2 7.8 3 5 6 5c2 0 3.3 1.1 4 2.3.7-1.2 2-2.3 4-2.3 3 0 4.8 2.8 3.4 5.8C19.2 15.4 12 20 12 20z",
  sprout: "M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.2-5-5.5-5 0 3 2.2 5 5.5 5z",
  people: "M9 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18.5 14.8c1.6.7 2.5 2.4 2.5 5.2",
  trend: "M3 17 9 11l4 4 8-8M15 7h6v6",
  home: "M3 10.2 12 3.5l9 6.7V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z",
  person: "M12 4.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM4.5 20c1.4-3.6 4.4-5.6 7.5-5.6s6.1 2 7.5 5.6",
  repeat: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  coin: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5v11",
  pin: "M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  shield: "M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6zM9 12l2 2 4-4",
  volunteer: "M9 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.5a3 3 0 0 1 0 5.8M21 20c0-2.6-1.5-4.5-3.8-5.2",
} as const;
export type HomeIcon = keyof typeof HOME_ICONS;

/**
 * The five figures under the hero. `value` is the design's figure as drawn
 * (the 2026 achievements catalogue); `founded` reads the foundation's year.
 */
export const HOME_STATS: ReadonlyArray<{ key: "countries" | "mosques" | "food" | "students" | "founded"; icon: HomeIcon; value: number | "founded"; plus: boolean }> = [
  { key: "countries", icon: "globe", value: 20, plus: true },
  { key: "mosques", icon: "mosque", value: 100_000, plus: true },
  { key: "food", icon: "basket", value: 55_000, plus: true },
  { key: "students", icon: "cap", value: 6_000, plus: true },
  { key: "founded", icon: "calendar", value: "founded", plus: false },
];

/* ── Programme cards (`.program-row`) ────────────────────────────────────── */

export interface HomeProgramCard {
  /** Message keys under `tvHome.programs`. */
  title: string;
  text: string;
  /** `campaign` shows the campaign tag; a number shows «المسار 0n». */
  tag: "campaign" | number;
  icon: HomeIcon;
  route: MinbarRoute;
  hash?: string;
}

/** In the design's order: the 2026 campaign, then the four paths. */
export const HOME_PROGRAMS: readonly HomeProgramCard[] = [
  { title: "campaignTitle", text: "campaignText", tag: "campaign", icon: "heart", route: "projects" },
  { title: "valuesTitle", text: "valuesText", tag: 1, icon: "sprout", route: "programs", hash: "values" },
  { title: "humanTitle", text: "humanText", tag: 2, icon: "people", route: "programs", hash: "human" },
  { title: "youthTitle", text: "youthText", tag: 3, icon: "trend", route: "programs" },
  { title: "communityTitle", text: "communityText", tag: 4, icon: "heart", route: "programs", hash: "community" },
];

/* ── World map (`.impact-world`) ─────────────────────────────────────────── *
 * The design draws the map with d3 at load (Natural Earth projection fitted
 * to the frame, world-atlas 110m). The countries are pre-rendered once into
 * `/toplum/impact-world.svg` (viewBox 1000×500, the same projection:
 * fitSize([1000, 700]) translated to [500, 280]); the hub, the points and the
 * dashed arcs below were projected with the same parameters, so the overlay
 * lines up with the image exactly. Coordinates are in that viewBox. */

export const WORLD_VIEWBOX = "0 0 1000 500";
export const WORLD_HUB = { x: 585.3, y: 149.7 } as const;

export const WORLD_NAMED: ReadonlyArray<{ key: "palestine" | "somalia" | "indonesia" | "egypt"; x: number; y: number; labelY: number; arc: string }> = [
  { key: "palestine", x: 599.8, y: 170.6, labelY: 186.6, arc: "M585.3,149.7L586.5,147.4C587.7,145.2,590.1,140.7,592.6,144.2C595,147.6,597.4,159.1,598.6,164.9L599.8,170.6" },
  { key: "somalia", x: 627.3, y: 273.4, labelY: 287.4, arc: "M585.3,149.7L588.8,152.4C592.3,155.1,599.3,160.5,606.3,181.1C613.3,201.7,620.3,237.5,623.8,255.5L627.3,273.4" },
  { key: "indonesia", x: 799.9, y: 300.2, labelY: 314.2, arc: "M585.3,149.7L603.2,147C621.1,144.2,656.8,138.7,692.6,163.8C728.4,188.9,764.1,244.5,782,272.4L799.9,300.2" },
  { key: "egypt", x: 581.7, y: 195.2, labelY: 229.2, arc: "M585.3,149.7L585,149.5C584.7,149.3,584.1,148.9,583.5,156.5C582.9,164,582.3,179.6,582,187.4L581.7,195.2" },
];

/** The smaller points: every other country the foundation works in. [x, y, arc]. */
export const WORLD_EXTRA: ReadonlyArray<readonly [number, number, string]> = [
  [622.9, 229.5, "M585.3,149.7L588.4,153.1C591.6,156.5,597.8,163.4,604.1,176.7C610.4,190,616.6,209.7,619.8,219.6L622.9,229.5"],
  [583.9, 229.2, "M585.3,149.7L585.2,153.4C585.1,157.1,584.8,164.5,584.6,177.8C584.4,191,584.1,210.1,584,219.7L583.9,229.2"],
  [552, 229.5, "M585.3,149.7L582.5,153.2C579.8,156.7,574.2,163.6,568.7,176.9C563.1,190.2,557.6,209.9,554.8,219.7L552,229.5"],
  [522.2, 222.7, "M585.3,149.7L580,152.2C574.8,154.8,564.3,159.9,553.8,172C543.2,184.2,532.7,203.5,527.5,213.1L522.2,222.7"],
  [477.8, 222.7, "M585.3,149.7L576.3,151C567.4,152.3,549.5,155,531.6,167.1C513.6,179.3,495.7,201,486.8,211.9L477.8,222.7"],
  [603.5, 275.8, "M585.3,149.7L586.8,155.5C588.3,161.4,591.4,173,594.4,194.1C597.4,215.1,600.5,245.4,602,260.6L603.5,275.8"],
  [608.4, 250.4, "M585.3,149.7L587.2,154.3C589.2,158.9,593,168.1,596.9,184.9C600.7,201.7,604.6,226,606.5,238.2L608.4,250.4"],
  [521, 250.4, "M585.3,149.7L579.9,153.7C574.6,157.7,563.9,165.7,553.2,182.5C542.4,199.3,531.7,224.9,526.4,237.6L521,250.4"],
  [551.1, 145.2, "M585.3,149.7L582.4,147C579.6,144.3,573.9,138.9,568.2,138.1C562.5,137.4,556.8,141.3,554,143.2L551.1,145.2"],
  [545.3, 136.8, "M585.3,149.7L582,146.3C578.6,142.9,572,136.1,565.3,133.9C558.6,131.8,552,134.3,548.6,135.5L545.3,136.8"],
  [692.4, 145.5, "M585.3,149.7L594.2,145.4C603.2,141.1,621,132.6,638.9,131.9C656.7,131.2,674.6,138.3,683.5,141.9L692.4,145.5"],
  [686, 154, "M585.3,149.7L593.7,146.4C602.1,143,618.9,136.4,635.7,137.1C652.4,137.8,669.2,145.9,677.6,149.9L686,154"],
  [683.5, 167.4, "M585.3,149.7L593.5,147.5C601.7,145.3,618,141,634.4,143.9C650.8,146.9,667.1,157.1,675.3,162.3L683.5,167.4"],
  [694.1, 170, "M585.3,149.7L594.4,147.3C603.4,145,621.6,140.2,639.7,143.6C657.8,147,676,158.5,685,164.3L694.1,170"],
  [747.5, 202.7, "M585.3,149.7L598.8,147.9C612.3,146,639.4,142.3,666.4,151.2C693.4,160,720.5,181.4,734,192L747.5,202.7"],
  [764.1, 208.6, "M585.3,149.7L600.2,147.7C615.1,145.7,644.9,141.7,674.7,151.5C704.5,161.4,734.3,185,749.2,196.8L764.1,208.6"],
  [836.8, 232.5, "M585.3,149.7L606.3,146.9C627.2,144.1,669.1,138.5,711.1,152.3C753,166.1,794.9,199.3,815.8,215.9L836.8,232.5"],
  [726.5, 254.3, "M585.3,149.7L597.1,152C608.8,154.2,632.4,158.8,655.9,176.2C679.4,193.7,703,224,714.7,239.1L726.5,254.3"],
  [481.9, 170.3, "M585.3,149.7L576.7,147.6C568.1,145.4,550.8,141.1,533.6,144.5C516.4,148,499.1,159.1,490.5,164.7L481.9,170.3"],
  [525.2, 169, "M585.3,149.7L580.3,149C575.3,148.3,565.3,146.8,555.3,150C545.2,153.2,535.2,161.1,530.2,165.1L525.2,169"],
  [470, 211.9, "M585.3,149.7L575.7,150.1C566.1,150.5,546.9,151.2,527.7,161.6C508.4,172,489.2,191.9,479.6,201.9L470,211.9"],
  [595.4, 169.3, "M585.3,149.7L586.1,149C587,148.3,588.7,146.9,590.4,150.2C592,153.4,593.7,161.4,594.6,165.3L595.4,169.3"],
  [596, 175.9, "M585.3,149.7L586.2,149.5C587.1,149.4,588.9,149.1,590.7,153.5C592.4,157.8,594.2,166.9,595.1,171.4L596,175.9"],
];

/** The four regions and how many countries each holds, in the catalogue's order (Türkiye & the Balkans first). */
export const WORLD_REGIONS: ReadonlyArray<{ key: "middleEast" | "balkans" | "asia" | "africa"; count: number }> = [
  { key: "balkans", count: 4 },
  { key: "asia", count: 5 },
  { key: "middleEast", count: 4 },
  { key: "africa", count: 9 },
];

/* ── Ways of giving (`.ways-giving`) ─────────────────────────────────────── */

export const WAYS_TABS = ["projects", "units", "sponsor", "monthly", "zakat", "gift"] as const;
export type WaysTab = (typeof WAYS_TABS)[number];
export const WAYS_TAB_ICON: Record<WaysTab, HomeIcon> = {
  projects: "home",
  units: "basket",
  sponsor: "person",
  monthly: "repeat",
  zakat: "coin",
  gift: "heart",
};

/** «إنجازاتنا»: the catalogue's headline figures. */
export const WAYS_ACHIEVEMENTS: ReadonlyArray<{ value: number; title: string; text: string }> = [
  { value: 100_000, title: "achMosquesTitle", text: "achMosquesText" },
  { value: 55_000, title: "achFoodTitle", text: "achFoodText" },
  { value: 6_000, title: "achScholarsTitle", text: "achScholarsText" },
  { value: 20, title: "achCountriesTitle", text: "achCountriesText" },
];

/**
 * «الكفالات»: the three sponsorships, each opening the programme it belongs
 * to (the programme pages carry the giving for them). Prices in USD.
 */
export const WAYS_SPONSORSHIPS: ReadonlyArray<{ title: string; text: string; price: number; monthly: boolean; program: string }> = [
  { title: "sponsorQuranTitle", text: "sponsorQuranText", price: 300, monthly: true, program: "quran" },
  { title: "sponsorStudentTitle", text: "sponsorStudentText", price: 1150, monthly: false, program: "taalim" },
  { title: "sponsorCarerTitle", text: "sponsorCarerText", price: 195, monthly: false, program: "aytam" },
];

/** The monthly tab's amounts (USD), the first selected. */
export const MONTHLY_AMOUNTS = [25, 50, 75, 100] as const;
/** The gift tab's amounts (USD), the first selected. */
export const GIFT_AMOUNTS = [100, 200, 300] as const;
export const GIFT_OCCASIONS = ["gift", "soul", "healing"] as const;
export type GiftOccasion = (typeof GIFT_OCCASIONS)[number];

/* ── From the field (`.fd`) ──────────────────────────────────────────────── */

export const FIELD_RAIL = ["mosques", "water", "quran", "bread"] as const;

/* ── Partners (`.pt`) ─────────────────────────────────────────────────────── *
 * The partners as `Toplum Vakfı Partners.dc.html` lists them; the design's
 * homepage strip leaves logo slots, which are drawn here as name tiles. */
export const HOME_PARTNERS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;

/* ── FAQ (`.fq`) ──────────────────────────────────────────────────────────── */

export const HOME_FAQ = [1, 2, 3] as const;

/* ── Photographs ──────────────────────────────────────────────────────────── *
 * The design's photo slots take the campaigns' own pictures first, then the
 * foundation's field photographs in /public. */
export const HOME_FALLBACK_IMAGES = ["/toplum/hero-bg.webp", "/hero2.jpg", "/hero.png", "/join-us.jpeg"] as const;

/** A pool of distinct photographs: `preferred` first, then the fallbacks. */
export function photoPool(preferred: ReadonlyArray<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const src of [...preferred, ...HOME_FALLBACK_IMAGES]) {
    if (src && !out.includes(src)) out.push(src);
  }
  return out;
}

/** The zakat tab's destination, resolved on the server from the zakat category. */
export type HomeZakatTarget = { categoryId: string } | { projectId: string } | null;
