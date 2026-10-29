"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import {
  FIELD_PHOTOS,
  GIVING_PATHS,
  IMPACT_BANNER_IMAGE,
  IMPACT_REGIONS,
  IMPACT_STATS,
  WORLD_MAP,
} from "@/lib/minbar/achievements";
import TrustBanner from "./TrustBanner";

/**
 * "Our impact"  `ToplamVakfi-design/Toplum Vakfı Impact.dc.html`.
 *
 * Banner, the world map with the routes out of Istanbul, the five selected
 * indicators, the four regions, the four giving paths, the field photographs
 * and the pill on to Reports & transparency. Every figure comes from
 * `lib/minbar/achievements.ts`; the founding year from `ORG`.
 */

/** The design's stat glyphs (inline SVGs of the Impact page). */
const STAT_ICONS: Record<string, ReactElement> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 5.6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.6-3.5-9s1-6.5 3.5-9z" />
    </>
  ),
  mosque: <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" />,
  basket: (
    <>
      <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
      <path d="M9 11V6a3 3 0 0 1 6 0v5" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
};

/** The giving-path badges. */
const PATH_ICONS: Record<string, ReactElement> = {
  sprout: <path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.5a3 3 0 0 1 0 5.8M21 20c0-2.6-1.5-4.5-3.8-5.2" />
    </>
  ),
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  heart: <path d="M12 20s-7.2-4.6-9.4-9.2C1.2 7.8 3 5 6 5c2 0 3.3 1.1 4 2.3.7-1.2 2-2.3 4-2.3 3 0 4.8 2.8 3.4 5.8C19.2 15.4 12 20 12 20z" />,
};

function Glyph({ children, width = 1.9 }: { children: ReactElement; width?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const LABEL_STYLE = { fill: "#fff", paintOrder: "stroke", stroke: "rgba(3,26,54,.85)", strokeWidth: 3 } as const;

/** The design's d3 map, pre-projected: countries as an image, routes and labels as SVG. */
function WorldMap() {
  const t = useTranslations("tvImpact");
  const { width, height, hub } = WORLD_MAP;
  return (
    <div className="tvi-map" role="img" aria-label={t("map.label")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static vector, no optimisation to gain */}
      <img src={WORLD_MAP.image} alt="" className="tvi-map-land" decoding="async" />
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="tvi-map-routes" aria-hidden="true">
        <defs>
          <radialGradient id="tviHubGlow">
            <stop offset="0" stopColor="rgba(0,182,245,.4)" />
            <stop offset="1" stopColor="rgba(0,182,245,0)" />
          </radialGradient>
        </defs>
        <circle cx={hub.x} cy={hub.y} r="34" fill="url(#tviHubGlow)" />
        {WORLD_MAP.labelled.map((point) => (
          <g key={point.id}>
            <path d={point.arc} fill="none" stroke="rgba(0,182,245,.65)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 6" className="tvi-arc">
              <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3s" repeatCount="indefinite" />
            </path>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#00a2e0" style={{ filter: "drop-shadow(0 0 5px rgba(0,182,245,.95))" }} />
            <text x={point.x} y={point.labelY} textAnchor="middle" className="tvi-map-label" style={LABEL_STYLE}>
              {t(`map.${point.id}`)}
            </text>
          </g>
        ))}
        {WORLD_MAP.extra.map((point, index) => (
          <g key={index}>
            <path d={point.arc} fill="none" stroke="rgba(0,182,245,.5)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 5">
              <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="3.6s" repeatCount="indefinite" />
            </path>
            <circle cx={point.x} cy={point.y} r="2.6" fill="#00a2e0" style={{ filter: "drop-shadow(0 0 3px rgba(0,182,245,.8))" }} />
          </g>
        ))}
        <circle cx={hub.x} cy={hub.y} r="6" fill="none" stroke="rgba(0,182,245,.7)" strokeWidth="1.5">
          <animate attributeName="r" values="6;20" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".9;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={hub.x} cy={hub.y} r="10" fill="none" stroke="rgba(0,182,245,.55)" strokeWidth="1.5" />
        <circle cx={hub.x} cy={hub.y} r="5.5" fill="#fff" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,.8))" }} />
        <text x={hub.x} y={hub.y - 30} textAnchor="middle" className="tvi-map-label" style={{ fill: "#fff" }}>
          {t("map.turkey")}
        </text>
        <text x={hub.x} y={hub.y - 16} textAnchor="middle" className="tvi-map-label tvi-map-label--sub" style={{ ...LABEL_STYLE, fill: "#cfe3f1" }}>
          {t("map.hub")}
        </text>
      </svg>
      <span className="tvi-script tvi-map-script">{t("map.script")}</span>
    </div>
  );
}

export default function ReportsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const t = useTranslations("tvImpact");
  const { formatNumber } = useMinbarMoney();

  /* "+20" in Arabic; the design's LTR layer moves the plus after the figure ("20+"). */
  const figure = (value: number, plus: boolean, grouped: boolean) => {
    const text = grouped ? formatNumber(value) : String(value);
    if (!plus) return text;
    return rtl ? `+${text}` : `${text}+`;
  };
  const forward = rtl ? "←" : "→";

  return (
    <div className="tvi-page">
      <TrustBanner
        image={IMPACT_BANNER_IMAGE}
        title={t("title")}
        lead={t("lead")}
        crumbs={[{ label: t("crumbHome"), href: `/${locale}` }, { label: t("title") }]}
        crumbLabel={t("crumbLabel")}
      />

      <main className="tvi-main">
        <div className="tvi-wrap">
          <WorldMap />

          <section className="tvi-sec" aria-labelledby="tvi-stats-h">
            <div className="tvi-sec-head">
              <h2 id="tvi-stats-h" className="tvi-h2">{t("stats.title")}</h2>
              <p className="tvi-sub">{t("stats.sub")}</p>
            </div>
            <div className="tvi-stats">
              {IMPACT_STATS.map((stat) => (
                <div key={stat.id} className="tvi-card tvi-stat">
                  <span className="tvi-ico"><Glyph>{STAT_ICONS[stat.icon]}</Glyph></span>
                  <b dir="ltr">{stat.id === "founded" ? String(ORG.foundedYear) : figure(stat.value, stat.plus, stat.grouped)}</b>
                  <span>{t(`stats.${stat.id}`)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="tvi-sec" aria-labelledby="tvi-regions-h">
            <h2 id="tvi-regions-h" className="tvi-h2">{t("regions.title")}</h2>
            <div className="tvi-regions">
              {IMPACT_REGIONS.map((region) => (
                <div key={region.id} className="tvi-card tvi-region">
                  <h3>
                    <i dir="ltr">{formatNumber(region.countries.length)}</i>
                    {t(`regions.${region.id}`)}
                  </h3>
                  <p className="tvi-region-text">{t(`regions.text.${region.id}`)}</p>
                  <div>
                    {region.countries.map((country) => (
                      <span key={country}>{t(`countries.${country}`)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="tvi-sec" aria-labelledby="tvi-paths-h">
            <h2 id="tvi-paths-h" className="tvi-h2">{t("paths.title")}</h2>
            <p className="tvi-sub">{t("paths.sub")}</p>
            <div className="tvi-paths">
              {GIVING_PATHS.map((path, index) => (
                <Link key={path.id} href={`${miaPath("programs", locale)}#${path.anchor}`} className="tvi-card tvi-path">
                  <div className="tvi-path-img" style={{ backgroundImage: `url('${path.image}')` }}>
                    <span className="tvi-path-badge"><Glyph>{PATH_ICONS[path.icon]}</Glyph></span>
                  </div>
                  <div className="tvi-path-body">
                    <small>{t("paths.number", { n: String(index + 1).padStart(2, "0") })}</small>
                    <h3>{t(`paths.${path.id}.title`)}</h3>
                    <p>{t(`paths.${path.id}.text`)}</p>
                    <div className="tvi-path-foot">
                      <span>{t("paths.count", { count: path.programmes })}</span>
                      <b>
                        {t("paths.explore")} <span aria-hidden="true">{forward}</span>
                      </b>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="tvi-sec" aria-labelledby="tvi-field-h">
            <h2 id="tvi-field-h" className="tvi-h2">{t("field.title")}</h2>
            <p className="tvi-sub">{t("field.sub")}</p>
            <div className="tvi-field">
              {FIELD_PHOTOS.map((photo) => (
                <div key={photo.id} className="tvi-field-card" style={{ backgroundImage: `url('${photo.image}')` }}>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {t(`field.${photo.id}`)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <Link className="tvi-pill" href={miaPath("transparency", locale)}>
                <i aria-hidden="true">{forward}</i>
                {t("toTransparency")}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
