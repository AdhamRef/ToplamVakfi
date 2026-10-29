/**
 * Content of the Impact page (`ToplamVakfi-design/Toplum Vakfı Impact.dc.html`)
 * and the Transparency page (`… Transparency.dc.html`).
 *
 * The figures are the foundation's published impact figures, carried from the
 * design ("أرقام من كتالوج إنجازات الوقف 2026، ولكل رقم مصدره"). They are only
 * ever replaced by newer published figures, never computed or rounded here.
 *
 * Only numbers, ids and asset paths live here; every visible string is a key in
 * the `tvImpact` / `tvTransparency` namespaces.
 */
import type { MinbarRoute } from "./routes";

/** Selected indicators. `plus` marks an "at least" figure (+20, +100,000). */
export const IMPACT_STATS: ReadonlyArray<{ id: string; value: number; plus: boolean; icon: string; grouped: boolean }> = [
  { id: "countries", value: 20, plus: true, icon: "globe", grouped: true },
  { id: "mosques", value: 100000, plus: true, icon: "mosque", grouped: true },
  { id: "food", value: 55000, plus: true, icon: "basket", grouped: true },
  { id: "students", value: 6000, plus: true, icon: "cap", grouped: true },
  /* The founding year (ORG.foundedYear) is read at render time; never grouped. */
  { id: "founded", value: 0, plus: false, icon: "calendar", grouped: false },
];

/** The four regions and the countries listed under each, in the catalogue's order (Türkiye & the Balkans first). */
export const IMPACT_REGIONS: ReadonlyArray<{ id: string; countries: readonly string[] }> = [
  { id: "turkeyBalkans", countries: ["turkey", "albania", "kosovo", "macedonia"] },
  { id: "asia", countries: ["indonesia", "bangladesh", "rohingya", "uzbekistan", "tajikistan"] },
  { id: "middleEast", countries: ["syria", "palestine", "yemen", "egypt"] },
  { id: "africa", countries: ["sudan", "chad", "cameroon", "togo", "burkinaFaso", "somalia", "benin", "senegal", "tanzania"] },
];

/** The four giving paths; `anchor` is the path's section on the programmes page. */
export const GIVING_PATHS: ReadonlyArray<{ id: string; anchor: string; programmes: number; image: string; icon: string }> = [
  { id: "values", anchor: "values", programmes: 4, image: "/assets/blog/176-seeking-knowledge-in-islam-education.webp", icon: "sprout" },
  { id: "human", anchor: "human", programmes: 7, image: "/assets/blog/108-education-right-during-crises.webp", icon: "people" },
  { id: "youth", anchor: "youth", programmes: 5, image: "/assets/blog/113-world-volunteer-day.webp", icon: "trend" },
  { id: "community", anchor: "community", programmes: 8, image: "/assets/blog/114-feeding-people-islam-food-security.webp", icon: "heart" },
];

/** "From the field": eight captioned photographs (project, place, year). */
export const FIELD_PHOTOS: ReadonlyArray<{ id: string; image: string }> = [
  { id: "mosques", image: "/toplum/hero-bg-800.webp" },
  { id: "water", image: "/assets/blog/180-gaza-water-desalination-emergency-vs-resilient.webp" },
  { id: "quran", image: "/assets/blog-cover-30-quran-ramadan.webp" },
  { id: "bread", image: "/assets/blog/184-community-kitchens-crisis-food-safety-dignity.webp" },
  { id: "guides", image: "/assets/blog/101-professional-humanitarian-work-behind-the-scenes.webp" },
  { id: "ramadan", image: "/assets/blog/150-ramadan-volunteering-and-iftar-programs.webp" },
  { id: "iftar", image: "/assets/blog/154-ramadan-around-the-world-cultures.webp" },
  { id: "qurbani", image: "/assets/blog/135-udhiyah-donation-to-distribution-journey.webp" },
];

export const IMPACT_BANNER_IMAGE = "/toplum/hero-bg.webp";

/**
 * The world map. The country shapes are a static SVG (`public/toplum/impact-world.svg`,
 * Natural Earth projection of world-atlas 110m, drawn exactly as the design's d3
 * script draws it into a 1000×500 box). The routes from the Istanbul hub are
 * pre-projected into the same box, so no map library ships to the browser.
 */
export const WORLD_MAP = {
  image: "/toplum/impact-world.svg",
  width: 1000,
  height: 500,
  hub: { x: 585.3, y: 149.7 },
  labelled: [
  {
    id: "palestine",
    x: 599.8,
    y: 170.6,
    labelY: 186.6,
    arc: "M585.3,149.7L586.5,147.4C587.7,145.2,590.1,140.7,592.5,144.1C594.9,147.6,597.4,159.1,598.6,164.9L599.8,170.6"
  },
  {
    id: "somalia",
    x: 627.3,
    y: 273.4,
    labelY: 287.4,
    arc: "M585.3,149.7L588.8,152.3C592.3,155,599.3,160.4,606.3,181C613.3,201.6,620.3,237.5,623.8,255.4L627.3,273.4"
  },
  {
    id: "indonesia",
    x: 799.9,
    y: 300.2,
    labelY: 314.2,
    arc: "M585.3,149.7L603.1,146.9C621,144.2,656.8,138.7,692.6,163.7C728.3,188.8,764.1,244.5,782,272.3L799.9,300.2"
  },
  {
    id: "egypt",
    x: 581.7,
    y: 195.2,
    labelY: 229.2,
    arc: "M585.3,149.7L585,149.5C584.7,149.2,584.1,148.8,583.5,156.4C582.9,164,582.3,179.6,582,187.4L581.7,195.2"
  }
],
  extra: [{x:622.9,y:229.5,arc:"M585.3,149.7L588.4,153.1C591.5,156.5,597.8,163.3,604.1,176.6C610.3,190,616.6,209.7,619.7,219.6L622.9,229.5"},{x:583.9,y:229.2,arc:"M585.3,149.7L585.1,153.4C585,157.1,584.8,164.5,584.6,177.8C584.4,191,584.2,210.1,584.1,219.7L583.9,229.2"},{x:552,y:229.5,arc:"M585.3,149.7L582.5,153.1C579.7,156.6,574.2,163.6,568.6,176.9C563.1,190.2,557.5,209.9,554.8,219.7L552,229.5"},{x:522.2,y:222.7,arc:"M585.3,149.7L580,152.2C574.7,154.8,564.2,159.8,553.7,172C543.2,184.2,532.7,203.4,527.4,213.1L522.2,222.7"},{x:477.8,y:222.7,arc:"M585.3,149.7L576.3,151C567.3,152.3,549.4,154.9,531.5,167.1C513.6,179.3,495.7,201,486.8,211.8L477.8,222.7"},{x:603.5,y:275.8,arc:"M585.3,149.7L586.8,155.5C588.3,161.3,591.3,173,594.4,194C597.4,215,600.4,245.4,601.9,260.6L603.5,275.8"},{x:608.4,y:250.4,arc:"M585.3,149.7L587.2,154.3C589.1,158.9,593,168.1,596.8,184.9C600.7,201.7,604.5,226,606.5,238.2L608.4,250.4"},{x:521,y:250.4,arc:"M585.3,149.7L579.9,153.7C574.5,157.7,563.8,165.7,553.1,182.5C542.4,199.3,531.7,224.8,526.4,237.6L521,250.4"},{x:551.1,y:145.2,arc:"M585.3,149.7L582.4,147C579.6,144.2,573.9,138.8,568.2,138.1C562.5,137.4,556.8,141.3,553.9,143.2L551.1,145.2"},{x:545.3,y:136.8,arc:"M585.3,149.7L581.9,146.3C578.6,142.8,571.9,136,565.3,133.9C558.6,131.8,552,134.3,548.7,135.5L545.3,136.8"},{x:692.4,y:145.5,arc:"M585.3,149.7L594.2,145.4C603.1,141.1,621,132.5,638.8,131.9C656.7,131.2,674.6,138.4,683.5,141.9L692.4,145.5"},{x:686,y:154,arc:"M585.3,149.7L593.6,146.3C602,143,618.8,136.3,635.6,137C652.4,137.7,669.2,145.9,677.6,149.9L686,154"},{x:683.5,y:167.4,arc:"M585.3,149.7L593.4,147.5C601.6,145.3,618,140.9,634.4,143.9C650.7,146.8,667.1,157.1,675.3,162.2L683.5,167.4"},{x:694.1,y:170,arc:"M585.3,149.7L594.3,147.3C603.4,144.9,621.5,140.2,639.7,143.6C657.8,147,676,158.5,685,164.2L694.1,170"},{x:747.5,y:202.7,arc:"M585.3,149.7L598.8,147.8C612.3,146,639.3,142.3,666.4,151.2C693.4,160,720.4,181.4,733.9,192.1L747.5,202.7"},{x:764.1,y:208.6,arc:"M585.3,149.7L600.2,147.7C615.1,145.7,644.9,141.7,674.7,151.5C704.5,161.3,734.3,185,749.2,196.8L764.1,208.6"},{x:836.8,y:232.5,arc:"M585.3,149.7L606.2,146.8C627.2,144,669.1,138.4,711,152.2C753,166,794.9,199.2,815.9,215.9L836.8,232.5"},{x:726.5,y:254.3,arc:"M585.3,149.7L597,151.9C608.8,154.2,632.3,158.8,655.9,176.2C679.4,193.6,703,224,714.7,239.1L726.5,254.3"},{x:481.9,y:170.3,arc:"M585.3,149.7L576.6,147.5C568,145.4,550.8,141.1,533.6,144.5C516.4,148,499.1,159.1,490.5,164.7L481.9,170.3"},{x:525.2,y:169,arc:"M585.3,149.7L580.2,148.9C575.2,148.2,565.2,146.8,555.2,150C545.2,153.2,535.2,161.1,530.2,165.1L525.2,169"},{x:470,y:211.9,arc:"M585.3,149.7L575.6,150C566,150.4,546.8,151.2,527.6,161.6C508.4,171.9,489.2,191.9,479.6,201.9L470,211.9"},{x:595.4,y:169.3,arc:"M585.3,149.7L586.1,149C586.9,148.3,588.6,146.9,590.3,150.2C592,153.4,593.7,161.4,594.5,165.4L595.4,169.3"},{x:596,y:175.9,arc:"M585.3,149.7L586.1,149.5C587,149.4,588.8,149.1,590.6,153.4C592.4,157.8,594.2,166.8,595.1,171.4L596,175.9"}],
} as const;

/** Transparency page: the policy documents, in the design's order. */
export const TRANSPARENCY_DOCS: ReadonlyArray<{ id: string; route: MinbarRoute; hash?: string }> = [
  { id: "privacy", route: "privacy" },
  { id: "donation", route: "donationPolicy" },
  { id: "refund", route: "refundPolicy" },
  { id: "payment", route: "paymentDetails" },
  { id: "terms", route: "terms" },
  { id: "faq", route: "faq" },
];

/** "آخر تحديث لهذه الصفحة: 1 سبتمبر 2026" as an ISO date, formatted per locale. */
export const TRANSPARENCY_UPDATED = "2026-09-01";

export const TRANSPARENCY_BANNER_IMAGE = "/assets/blog/108-education-right-during-crises.webp";
