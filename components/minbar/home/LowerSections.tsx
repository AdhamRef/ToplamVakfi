"use client";

import { useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { cssImage } from "@/lib/minbar/image-url";
import { FIELD_RAIL, HOME_FAQ, HOME_PARTNERS } from "@/lib/minbar/home-content";
import { Icon } from "./HomeIntro";

/**
 * The lower homepage of `ToplamVakfi-design/Toplum Vakfı Homepage.dc.html`:
 * «من الميدان» (`.fd`), «لماذا تثق بنا» (`.wt`), the partners strip (`.pt`),
 * the FAQ (`.fq`) and the closing call to give (`.cf`).
 */

const PILL_ARROW = <i aria-hidden="true"><span className="tv-arrow">←</span></i>;

/* ── من الميدان ──────────────────────────────────────────────────────────── */

export function StoriesSection({ images }: { images: string[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.stories");
  const stories = miaPath("stories", locale);

  return (
    <section className="fd" id="stories" aria-labelledby="fd-title">
      <div className="container">
        <div className="fd-head">
          <h2 id="fd-title">{t("title")}</h2>
          <p>{t("lead")}</p>
        </div>
        <div className="fd-story">
          <div className="fd-text">
            <h3>{t("storyTitle")}</h3>
            <b>{t("storyProject")}</b>
            <p>{t("storyText")}</p>
            <Link className="fd-pill" href={miaPath("projects", locale)}>
              {PILL_ARROW}
              {t("support")}
            </Link>
          </div>
          <Link className="fd-video" href={stories} aria-label={t("watch")} style={{ backgroundImage: cssImage(images[1 % images.length], 1200) }}>
            <span className="fd-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            </span>
            <span className="fd-cap" aria-hidden="true">
              {t("caption")}
            </span>
          </Link>
        </div>
        <div className="fd-rail" role="list" aria-label={t("railLabel")}>
          {FIELD_RAIL.map((key, i) => (
            <Link key={key} role="listitem" className="fd-card" href={stories} style={{ backgroundImage: cssImage(images[(i + 2) % images.length], 700) }}>
              <span>
                <Icon name="pin" />
                {t(key)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── لماذا تثق بنا ───────────────────────────────────────────────────────── */

export function TrustSection() {
  const locale = useLocale();
  const t = useTranslations("tvHome.trust");
  const cards = [
    { title: t("c1Title"), text: t("c1Text", { year: String(ORG.foundedYear), registry: ORG.licenseNumber }) },
    { title: t("c2Title"), text: t("c2Text") },
    { title: t("c3Title"), text: t("c3Text") },
    { title: t("c4Title"), text: t("c4Text") },
  ];

  return (
    <section className="wt-sec" aria-labelledby="wt-title">
      <div className="container">
        <div className="wt">
          <div className="wt-head">
            <div>
              <h2 id="wt-title">{t("title")}</h2>
              <p>{t("lead")}</p>
            </div>
            <Link className="wt-pill" href={miaPath("transparency", locale)}>
              {PILL_ARROW}
              {t("reports")}
            </Link>
          </div>
          <div className="wt-grid">
            {cards.map((card, i) => (
              <div key={card.title} className="wt-card">
                <header>
                  <i>{i + 1}</i>
                  <b>{card.title}</b>
                </header>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
          <div className="wt-foot">
            <p>
              <Icon name="shield" />
              <b>{t("approval", { date: ORG.registeredOn, registry: ORG.licenseNumber })}</b>
            </p>
            <p>
              <span>
                <b>{t("memberOf")}</b> {t("members")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── شركاؤنا ─────────────────────────────────────────────────────────────── */

export function PartnersSection() {
  const locale = useLocale();
  const t = useTranslations("tvHome.partners");
  const track = useRef<HTMLDivElement>(null);

  /* "Next" moves toward the inline end: negative scrollLeft in RTL. */
  const move = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: Math.round(el.clientWidth * 0.6) * direction * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <section className="pt" aria-label={t("label")}>
      <div className="container pt-row">
        <h2>{t("title")}</h2>
        <button className="pt-arrow" type="button" onClick={() => move(-1)} aria-label={t("prev")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div className="pt-track" ref={track}>
          {HOME_PARTNERS.map((key) => (
            <Link key={key} className="pt-logo" href={miaPath("partner", locale)}>
              <b>{t(key)}</b>
              <span>{t(`${key}Loc`)}</span>
            </Link>
          ))}
        </div>
        <button className="pt-arrow" type="button" onClick={() => move(1)} aria-label={t("next")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

/* ── الأسئلة الشائعة ─────────────────────────────────────────────────────── */

export function FaqSection() {
  const locale = useLocale();
  const t = useTranslations("tvHome.faq");

  return (
    <section className="fq" aria-labelledby="fq-title">
      <div className="container fq-inner">
        <h2 id="fq-title">{t("title")}</h2>
        <div className="fq-list">
          {HOME_FAQ.map((n) => (
            <details key={n} className="fq-item" open={n === 1}>
              <summary>{t(`q${n}`)}</summary>
              <p>{t(`a${n}`)}</p>
            </details>
          ))}
        </div>
        <div className="fq-foot">
          <Link className="fq-more" href={miaPath("faq", locale)}>
            {t("more")}
          </Link>
          <Link className="fq-ask" href={miaPath("contact", locale)}>
            {t("ask")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── تبرع اليوم لمشروع قائم ──────────────────────────────────────────────── */

export function ClosingCta() {
  const locale = useLocale();
  const t = useTranslations("tvHome.cta");

  return (
    <section className="cf" aria-labelledby="cf-title">
      <div className="container">
        <div className="cf-card">
          <span className="cf-ring" aria-hidden="true" />
          <div className="cf-body">
            <h2 id="cf-title">{t("title")}</h2>
            <p className="cf-script">{t("script")}</p>
            <div className="cf-join">
              <span>{t("join")}</span>
              <Link href={miaPath("volunteer", locale)}>
                <Icon name="volunteer" />
                {t("volunteer")}
              </Link>
              <Link href={miaPath("partner", locale)}>
                <Icon name="heart" />
                {t("partner")}
              </Link>
            </div>
          </div>
          <Link className="cf-donate" href={miaPath("projects", locale)}>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20s-7.2-4.6-9.4-9.2C1.2 7.8 3 5 6 5c2 0 3.3 1.1 4 2.3.7-1.2 2-2.3 4-2.3 3 0 4.8 2.8 3.4 5.8C19.2 15.4 12 20 12 20z" />
              </svg>
            </i>
            {t("donate")}
          </Link>
        </div>
      </div>
    </section>
  );
}
