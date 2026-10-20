"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { cssImage } from "@/lib/minbar/image-url";
import { homeNumber } from "@/lib/minbar/home-content";

/**
 * The hero  `.hero > .th` of `ToplamVakfi-design/Toplum Vakfı
 * Homepage.dc.html`: field photographs crossfading behind a navy fade, the
 * headline «الإنسانية تجمعنا» with its lead, body and two actions, the three
 * trust figures, the slide dots, and the quick-donation disc («دائرة الخير»)
 * beside it. The wave at the foot rises into the page ground.
 *
 * The first photograph is the hero image in /public (the page's LCP); the
 * others are the campaigns' own pictures. The slides advance every 7 s, not at
 * all under reduced motion, and the dots are real 44 px targets.
 */

const SLIDE_MS = 7000;
/** The design's hero photograph; its two sizes are picked in CSS (`.th-slide--hero`). */
export const HERO_IMAGE = "/toplum/hero-bg.webp";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

const HeartLine = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" />
  </svg>
);

export default function HomeHero({ slides, donate }: { slides: string[]; donate?: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.hero");
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [count, cycle]);

  const show = (n: number) => {
    setActive(n);
    setCycle((c) => c + 1);
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="th">
        <div className="th-photo" aria-hidden="true">
          {slides.map((src, i) => (
            <div
              key={src}
              className={`th-slide${i === active ? " active" : ""}${src === HERO_IMAGE ? " th-slide--hero" : ""}`}
              style={src === HERO_IMAGE ? undefined : { backgroundImage: cssImage(src, 1400) }}
            />
          ))}
        </div>
        <div className="th-fade" aria-hidden="true" />
        <div className="th-orb" aria-hidden="true" />
        <p className="th-script th-script--a" aria-hidden="true">
          {t("scriptA1")}
          <br />
          {t("scriptA2")}
        </p>

        <div className="th-inner">
          <div className="th-copy">
            <h1 id="hero-title" className="th-h1">
              {t("titleLead")} <span>{t("titleAccent")}</span>
            </h1>
            <p className="th-lead">{t("lead")}</p>
            <p className="th-body">{t("body")}</p>
            <div className="th-actions">
              <a className="th-cta" href="#programs">
                {t("cta")}
                <b aria-hidden="true">
                  <ArrowIcon />
                </b>
              </a>
              <Link className="th-link" href={miaPath("ourStory", locale)}>
                {t("story")}
              </Link>
            </div>
            <ul className="th-trust" aria-label={t("trustLabel")}>
              <li>
                <b>{ORG.licenseNumber}</b>
                <span>{t("trustRegistry")}</span>
              </li>
              <li>
                <b>+{homeNumber(locale, 20)}</b>
                <span>{t("trustCountries")}</span>
              </li>
              <li>
                <b>{ORG.foundedYear}</b>
                <span>{t("trustFounded")}</span>
              </li>
            </ul>
            {count > 1 ? (
              <div className="th-dots" role="tablist" aria-label={t("slidesLabel")}>
                {slides.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={t("slide", { n: homeNumber(locale, i + 1) })}
                    className={i === active ? "active" : undefined}
                    onClick={() => show(i)}
                  >
                    <i />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {donate ? (
            <div className="th-ring-slot">
              <p className="th-script th-script--b" aria-hidden="true">
                {t("scriptB1")}
                <br />
                {t("scriptB2")} <HeartLine />
              </p>
              {donate}
            </div>
          ) : null}
        </div>

        <svg className="th-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="thWaveFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f8fb" stopOpacity="0" />
              <stop offset="1" stopColor="#f4f8fb" stopOpacity=".35" />
            </linearGradient>
          </defs>
          <path d="M0 30 C 260 78, 560 -10, 860 22 S 1270 72, 1440 12 L1440 90 L0 90 Z" fill="url(#thWaveFade)" />
          <path d="M0 44 C 260 92, 560 4, 860 36 S 1270 86, 1440 26 L1440 90 L0 90 Z" fill="#f4f8fb" />
        </svg>
      </div>
    </section>
  );
}
