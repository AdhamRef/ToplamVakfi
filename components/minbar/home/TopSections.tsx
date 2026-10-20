"use client";

import Link from "next/link";
import { useQuietFloatingButtonsWhileVisible } from "@/hooks/useQuietFloatingButtons";
import type { ReactNode } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { Button } from "@/components/minbar/ds";
import { miaPath } from "@/lib/minbar/routes";
import { verseBlock } from "@/lib/minbar/quran";
import { introVideoId } from "@/lib/minbar/content/catalog";
import { youtubeEmbed } from "@/lib/minbar/content/media";
import { imageUrl } from "@/lib/minbar/image-url";

/**
 * The top of the homepage  ported from `Minbar/الصفحة الرئيسية.dc.html`:
 * the landing section and the Qur'anic verse band beneath.
 */

/* ── Verse band ──────────────────────────────────────────────────────────────
 * Al-Isra 1, directly under the landing  the verse the whole site stands on.
 * The Arabic is shown in every language edition; the translation of the
 * meaning and its edition attribution appear beneath it in non-Arabic
 * sessions. See `lib/minbar/quran.ts` for why.
 *
 * It wraps. The earlier strip was a single non-wrapping line with an ellipsis,
 * which on a phone cut the verse mid-clause  the one text on the page that
 * must never be truncated. */
export function VerseStrip() {
  const locale = useLocale();
  const t = useTranslations("homepage");
  const messages = useMessages() as { quran?: Record<string, { ar?: string; label?: string; t?: string }> };
  const verse = verseBlock(messages.quran ?? {}, "isra_1", locale);

  return (
    <section id="aqsa" className="mia-verse">
      <div aria-hidden="true" data-aqsa-pattern="" className="mia-verse-pattern" />
      <div id="verse-inner" className="mia-verse-inner">
        {/* Always RTL and always in the Qur'anic face, whatever the page language. */}
        <p dir="rtl" className="mia-verse-ar">
          {verse.arabic}
        </p>
        {verse.translation ? <p className="mia-verse-tr">{verse.translation}</p> : null}
        <div id="verse-meta" className="mia-verse-meta">
          <span dir="rtl" className="mia-verse-cite">{verse.label || t("verseCitation")}</span>
          {verse.attribution ? <span className="mia-verse-attr">{verse.attribution}</span> : null}
          <Link href={miaPath("aqsa", locale)} className="mia-pill-link mia-verse-link">
            {t("aqsaPage")}
            <ArrowGlyph />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Landing ─────────────────────────────────────────────────────────────────
 * One section, two rows: the headline beside the intro film, and a proof band
 * across the bottom with the two headline figures and the link to the reports
 * they come from.
 *
 * The intro film is a different recording per language edition, so the play
 * action resolves the id from the locale rather than subtitling one cut  and
 * the poster is a frame of that edition's own film, served from
 * public/minbar/assets/hero/ rather than an unrelated photograph. A poster
 * that IS the film is the honest preview.
 *
 * Layered background: an ivory base, two soft gold glows placed toward the
 * film, the Aqsa pattern at its quietest, and the dome line faint at the end
 * edge. The card sits on a gradient hairline and a second offset outline, so
 * it reads as an object with depth rather than a flat rectangle. Entrance
 * motion is a single fade-up per column and respects reduced-motion. */

/**
 * The headline with one word set apart  Al-Quds, in whichever language 
 * by a hand-drawn gold stroke beneath it that draws itself in on load.
 *
 * The word is `homepage.heroTitleAccent`, a separate key per locale, because
 * the title is a sentence and where the city's name falls in it differs from
 * language to language. The stroke sits under exactly that substring and the
 * substring is kept on one line, so a wrap never cuts the stroke in half. If a
 * locale's accent is not found in its title the title renders plain  a
 * mismatch must never make the headline disappear.
 */
function AccentedTitle({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="mia-hero-accent">
        <span className="mia-hero-accent-word">{accent}</span>
        <svg className="mia-hero-accent-stroke" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
          <path d="M3 11 C 38 4, 82 3, 118 8 S 176 13, 197 7" pathLength="100" />
        </svg>
      </span>
      {text.slice(at + accent.length)}
    </>
  );
}

/** The 0:03 frame of the intro film for this edition. */
export function heroPoster(locale: string): string {
  // Named after the film they belong to (see `introVideoId`), so a new film
  // gets a new file and no cache keeps showing the old one.
  if (locale === "ar") return "/minbar/assets/hero/intro-ar-E_TZglHItoY.webp";
  if (locale === "tr") return "/minbar/assets/hero/intro-tr-G7mgN6jux2s.webp";
  return "/minbar/assets/hero/intro-intl-3VVMdV5c_RU.webp";
}

export function Hero({ onPlayIntro, donate }: { onPlayIntro: (embed: string) => void; donate?: ReactNode }) {
  useQuietFloatingButtonsWhileVisible(".mia-hero-actions--mobile");
  const locale = useLocale();
  const t = useTranslations("homepage");
  const tCommon = useTranslations("common");
  const poster = heroPoster(locale);
  // Each still has a 768px copy beside it for phones, where the card is ~380px
  // wide and the poster is the Largest Contentful Paint.
  const posterSmall = poster.replace(/\.webp$/, "-768.webp");
  const playIntro = () => onPlayIntro(youtubeEmbed(introVideoId(locale), { autoplay: true }));
  /* With the quick-donation disc in the hero (the Toplum design's «دائرة
     الخير») the disc takes the film's column and the film becomes a play link
     beside the two actions  the same film, one click away. With the disc
     switched off in the dashboard the poster card stays where it was. */
  const ring = Boolean(donate);
  const actions = (
    <>
      <Button variant="primary" size="lg" href={miaPath("projects", locale)} className="mia-hero-btn">
        {t("heroCtaPrimary")}
        <ArrowGlyph size={14} />
      </Button>
      <Button variant="gold" size="lg" href={miaPath("zakatCalculator", locale)} className="mia-hero-btn">
        {tCommon("zakatCalculator")}
      </Button>
      {ring ? (
        <button type="button" className="mia-hero-watch" onClick={playIntro}>
          <span aria-hidden="true" className="mia-hero-watch-ico">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
          </span>
          {t("videoTitle")}
        </button>
      ) : null}
    </>
  );

  return (
    <section id="hero" className="mia-hero">
      {/* Background layers  all non-interactive, all beneath the content. */}
      <div aria-hidden="true" className="mia-hero-glow" />
      <div aria-hidden="true" data-aqsa-pattern="" className="mia-hero-pattern" />
      {/* The design's glowing orb at the page edge behind the donation disc. */}
      <div aria-hidden="true" className="mia-hero-orb" />
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative asset in /public */}
      <img aria-hidden="true" src={imageUrl("/minbar/assets/aqsa-dome-line.png", 300)} alt="" className="mia-hero-dome" width={940} height={376} decoding="async" fetchPriority="low" />

      <div className="mia-hero-wrap">
        <div id="hero-main" className="mia-hero-main" data-ring={ring ? "true" : "false"}>
          {/* ── Copy ───────────────────────────────────────────────────── */}
          <div className="mia-hero-copy">

            {/* The title is the H1 on its own; the supporting line is a
                separate element, not part of the heading. Inside one H1 the
                two read as a single run of text to crawlers and screen
                readers  "…المرابطينحول المسجد…" (`DEPLOYED_VS_DESIGN_AUDIT.md`
                § P2.2). The classes are unchanged, so the layout is. */}
            <h1 className="mia-hero-h1">
              <span className="mia-hero-title">
                <AccentedTitle text={t("heroTitle")} accent={t("heroTitleAccent")} />
              </span>
            </h1>
            <p className="mia-hero-sub" style={{ margin: 0 }}>
              <span aria-hidden="true" className="mia-hero-sub-mark" />
              {t("heroSubtitle")}
            </p>

            <p className="mia-hero-lead">{t("heroLead")}</p>

            <div className="mia-hero-actions mia-hero-actions--desktop">{actions}</div>
          </div>

          {/* ── Quick-donation disc, or the film ────────────────────────── */}
          {ring ? (
            <div className="mia-hero-ring">{donate}</div>
          ) : (
          <div className="mia-hero-media">
            <span aria-hidden="true" className="mia-hero-media-back" />
            <div className="mia-hero-frame">
              <button
                type="button"
                className="mia-hero-card"
                onClick={playIntro}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the poster is a local, per-edition frame */}
                <img src={poster} srcSet={`${posterSmall} 768w, ${poster} 1280w`} sizes="(max-width: 900px) calc(100vw - 32px), 600px" alt="" className="mia-hero-poster" width={1280} height={720} decoding="async" fetchPriority="high" />
                <span aria-hidden="true" className="mia-hero-shade" />

                <span className="mia-hero-chip">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
                  {t("watch")}
                </span>

                <span aria-hidden="true" className="mia-hero-play">
                  <span className="mia-hero-play-ring" />
                  <span className="mia-hero-play-ring mia-hero-play-ring--2" />
                  <span className="mia-hero-play-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
                  </span>
                </span>

                <span className="mia-hero-caption">
                  <b>{t("videoTitle")}</b>
                  <span>{t("videoCaption")}</span>
                </span>
              </button>
            </div>
          </div>
          )}

          <div className="mia-hero-actions mia-hero-actions--mobile">{actions}</div>
        </div>

      </div>
    </section>
  );
}

/** "Continue" arrow  mirrors with reading direction. */
export function ArrowGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mia-arrow-next"
    >
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}
