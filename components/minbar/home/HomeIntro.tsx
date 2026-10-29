"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { cssImage } from "@/lib/minbar/image-url";
import { HOME_ICONS, HOME_PROGRAMS, HOME_STATS, homeNumber, type HomeIcon } from "@/lib/minbar/home-content";

/**
 * The two bands under the hero  `.impact-panel` of `ToplamVakfi-design/
 * Toplum Vakfı Homepage.dc.html`: the figures strip (the quote «مجتمعات أقوى»
 * beside five figures from the 2026 achievements catalogue, and its source
 * line), and the programme row (the intro with its link, the 2026 campaign
 * card and the four paths).
 */

export function Icon({ name, className }: { name: HomeIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={HOME_ICONS[name]} />
    </svg>
  );
}

/**
 * A figure that counts up once it scrolls into view (the design's
 * `setupCounters`). The server HTML and a reduced-motion visitor get the
 * final figure; the count always ends on it exactly.
 */
function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1100);
          setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        setShown(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <b ref={ref}>
      {prefix}
      {homeNumber(locale, shown)}
      {suffix}
    </b>
  );
}

export function ImpactStrip() {
  const t = useTranslations("tvHome.impact");

  return (
    <section className="impact-panel" aria-labelledby="hs-quote">
      <div className="hs-strip">
        <blockquote className="hs-quote">
          <span className="hs-qmark" aria-hidden="true">
            ”
          </span>
          <p id="hs-quote">
            {t("quote1")} <br />
            {t("quote2")}
          </p>
        </blockquote>
        <div className="stats hs-stats">
          {HOME_STATS.map((stat) => (
            <div key={stat.key} className="stat">
              <i>
                <Icon name={stat.icon} />
              </i>
              {stat.value === "founded" ? <b>{ORG.foundedYear}</b> : <CountUp value={stat.value} suffix={stat.plus ? "+" : ""} />}
              <span>{t(stat.key)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="hs-source">{t("source")}</p>
    </section>
  );
}

export function ProgramsRow({ images }: { images: string[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.programs");

  return (
    <section className="impact-panel impact-panel--programs" aria-labelledby="programs-title">
      <div className="program-row" id="programs">
        <div className="program-intro">
          <h2 id="programs-title">
            {t("title1")} <br />
            {t("title2")}
          </h2>
          <p>{t("lead")}</p>
          <Link href={miaPath("programs", locale)}>
            {t("all")} <span className="tv-arrow" aria-hidden="true">←</span>
          </Link>
        </div>
        {HOME_PROGRAMS.map((card, i) => {
          const href = miaPath(card.route, locale) + (card.hash ? `#${card.hash}` : "");
          const tag = card.tag === "campaign" ? t("campaignTag") : t("track", { n: String(card.tag).padStart(2, "0") });
          return (
            <Link key={card.title} className="program" href={href}>
              <div className="program-image" style={{ backgroundImage: cssImage(images[i % images.length], 500) }} />
              <span className="program-ico">
                <Icon name={card.icon} />
              </span>
              <div className="program-body">
                <em className="program-tag">{tag}</em>
                <b>{t(card.title)}</b>
                <span>{t(card.text)}</span>
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </i>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
