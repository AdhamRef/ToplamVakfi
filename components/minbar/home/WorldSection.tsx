"use client";

import { useLocale, useTranslations } from "next-intl";
import { ORG } from "@/lib/minbar/org";
import { WORLD_EXTRA, WORLD_HUB, WORLD_NAMED, WORLD_REGIONS, WORLD_VIEWBOX, homeNumber } from "@/lib/minbar/home-content";

/**
 * «أثرنا حول العالم»  `.impact-world` of `ToplamVakfi-design/Toplum Vakfı
 * Homepage.dc.html`: the dark band between two waves, the copy with three
 * figure cards and the four regions on one side, the map on the other.
 *
 * The design draws the map in the browser with d3 and a world-atlas file
 * from a CDN. Here the countries are a pre-rendered image of the same
 * projection and the hub, points and animated dashed arcs are an SVG overlay
 * in the same coordinates (see `lib/minbar/home-content.ts`): no script, no
 * third-party request, and the map is in the server HTML.
 */

const LABEL_STYLE = { font: "700 12px Cairo, Arial, sans-serif", fill: "#fff", paintOrder: "stroke", stroke: "rgba(3,26,54,.85)", strokeWidth: 3 } as const;

export default function WorldSection() {
  const locale = useLocale();
  const t = useTranslations("tvHome.world");
  const years = Math.max(1, new Date().getFullYear() - ORG.foundedYear);

  return (
    <section className="impact-world" aria-labelledby="iw-title">
      <svg className="iw-wave iw-wave--top" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H1440 V28 C 1180 72, 900 6, 620 34 S 180 70, 0 26 Z" fill="#f4f8fb" />
      </svg>
      <svg className="iw-wave iw-wave--bottom" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 H1440 V46 C 1200 8, 900 70, 620 40 S 200 6, 0 50 Z" fill="#f4f8fb" />
      </svg>
      <div className="impact-world-inner container">
        <div className="iw-text">
          <h2 id="iw-title">{t("title")}</h2>
          <p>{t("lead")}</p>
          <div className="iw-cards">
            <div>
              <b>{homeNumber(locale, 20)}+</b>
              <span>{t("countries")}</span>
            </div>
            <div>
              <b>{homeNumber(locale, WORLD_REGIONS.length)}</b>
              <span>{t("regions")}</span>
            </div>
            <div>
              <b suppressHydrationWarning>{homeNumber(locale, years)}</b>
              <span>{t("years")}</span>
            </div>
          </div>
          <span className="iw-regions-label">{t("regionsLabel")}</span>
          <div className="iw-regions">
            {WORLD_REGIONS.map((r) => (
              <span key={r.key}>
                <i>{homeNumber(locale, r.count)}</i>
                {t(r.key)}
              </span>
            ))}
          </div>
        </div>
        <div className="iw-map">
          <span className="iw-note" aria-hidden="true">
            {t("note1")} <br />
            {t("note2")}
          </span>
          <div className="iw-map-frame" role="img" aria-label={t("mapLabel")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG drawing; nothing for the optimiser to do */}
            <img src="/toplum/impact-world.svg" alt="" width={1000} height={500} loading="lazy" decoding="async" className="iw-map-countries" />
            <svg viewBox={WORLD_VIEWBOX} className="iw-map-overlay" aria-hidden="true">
              <defs>
                <radialGradient id="iwHubGlow">
                  <stop offset="0" stopColor="rgba(0,182,245,.4)" />
                  <stop offset="1" stopColor="rgba(0,182,245,0)" />
                </radialGradient>
              </defs>
              <circle cx={WORLD_HUB.x} cy={WORLD_HUB.y} r={34} fill="url(#iwHubGlow)" />
              {WORLD_NAMED.map((p) => (
                <path key={`a-${p.key}`} className="iw-arc" d={p.arc} />
              ))}
              {WORLD_EXTRA.map(([x, y, arc]) => (
                <g key={`${x}-${y}`}>
                  <path className="iw-arc iw-arc--minor" d={arc} />
                  <circle cx={x} cy={y} r={2.6} className="iw-dot iw-dot--minor" />
                </g>
              ))}
              {WORLD_NAMED.map((p) => (
                <g key={p.key}>
                  <circle cx={p.x} cy={p.y} r={4.5} className="iw-dot" />
                  <text x={p.x} y={p.labelY} textAnchor="middle" style={LABEL_STYLE}>
                    {t(p.key)}
                  </text>
                </g>
              ))}
              <circle cx={WORLD_HUB.x} cy={WORLD_HUB.y} r={6} className="iw-pulse" />
              <circle cx={WORLD_HUB.x} cy={WORLD_HUB.y} r={10} fill="none" stroke="rgba(0,182,245,.55)" strokeWidth={1.5} />
              <circle cx={WORLD_HUB.x} cy={WORLD_HUB.y} r={5.5} fill="#fff" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,.8))" }} />
              <text x={WORLD_HUB.x} y={WORLD_HUB.y - 30} textAnchor="middle" style={{ ...LABEL_STYLE, strokeWidth: 0 }}>
                {t("hub")}
              </text>
              <text x={WORLD_HUB.x} y={WORLD_HUB.y - 16} textAnchor="middle" style={{ ...LABEL_STYLE, font: "600 12px Cairo, Arial, sans-serif", fill: "#cfe3f1" }}>
                {t("hubSub")}
              </text>
            </svg>
          </div>
          <span className="iw-caption">{t("caption")}</span>
        </div>
      </div>
    </section>
  );
}
