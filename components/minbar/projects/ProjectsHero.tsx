"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";

/**
 * Projects hero carousel  ported from `Minbar/المشاريع.dc.html`, laid out as
 * `ToplamVakfi-design/Toplum Vakfı Projects.dc.html`.
 *
 * Slides cross-fade rather than slide, so there is nothing to mirror in RTL; the
 * arrows do mirror, because "next" has to point forward in the reading
 * direction. Swipe is supported with both touch and pointer events, since a
 * pointer drag is how this behaves with a mouse or a pen.
 */
export interface ProjectSlide {
  title: string;
  image: string | null;
  href: string;
}

/** Under this many pixels, a drag is a click, not a swipe. */
const SWIPE_THRESHOLD = 40;

export default function ProjectsHero({ slides }: { slides: ProjectSlide[] }) {
  const locale = useLocale();
  const rtl = localeDirection(locale) === "rtl";
  const t = useTranslations("common");
  // "View project"  the shell bundle's Concierge namespace carries the label.
  const tConcierge = useTranslations("Concierge");

  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const count = slides.length;
  const go = useCallback(
    (delta: number) => {
      if (!count) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  /* Arrow keys move the carousel when it has focus  a carousel that only
     responds to a swipe is unusable from a keyboard. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") go(rtl ? -1 : 1);
    if (event.key === "ArrowLeft") go(rtl ? 1 : -1);
  };

  /* Advance on a timer, paused while the tab is hidden so a backgrounded page
     does not race through every slide. */
  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => {
      if (!document.hidden) go(1);
    }, 7000);
    return () => window.clearInterval(id);
  }, [count, go]);

  const endSwipe = (x: number) => {
    if (startX.current == null) return;
    const dx = x - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // A drag toward the start edge means "next", whichever side that is.
    go(rtl ? (dx > 0 ? 1 : -1) : dx > 0 ? -1 : 1);
  };

  if (!count) return null;

  const arrow = (direction: "next" | "prev") => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: (direction === "prev") === rtl ? "scaleX(-1)" : undefined }}
    >
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );

  return (
    /* Toplum Vakfı Projects.dc.html: the carousel is a rounded card inside the
       page container, the arrows sit on its edges and the dots below it. The
       `tvp-*` classes (styles/minbar/pages/projects.css) replace the old
       full-bleed `proj-hero-*` ones, whose phone rules in minbar.css assume
       the edge-to-edge band. */
    <section className="mia-projects-hero">
      <div className="tvp-hero-in">
        <div
          className="tvp-stage"
          role="group"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onTouchStart={(e) => {
            startX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => endSwipe(e.changedTouches[0].clientX)}
          onPointerDown={(e) => {
            if (e.pointerType !== "touch") startX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (e.pointerType !== "touch") endSwipe(e.clientX);
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.title}
              aria-hidden={i !== index}
              className="tvp-slide"
              style={{
                opacity: i === index ? 1 : 0,
                pointerEvents: i === index ? "auto" : "none",
              }}
            >
              {slide.image ? (
                <span
                  role="img"
                  aria-label={slide.title}
                  className="tvp-slide-img"
                  style={{ backgroundImage: `url('${slide.image}')` }}
                />
              ) : null}
              <span className="tvp-slide-shade" aria-hidden="true" />
              <div className="tvp-slide-info">
                <h2>{slide.title}</h2>
                {slide.href ? (
                  <a href={slide.href} tabIndex={i === index ? undefined : -1} className="tvp-slide-cta">
                    {tConcierge("a_view")}
                    <span aria-hidden="true">{rtl ? "←" : "→"}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("prev")} className="tvp-arrow tvp-arrow--prev">
              {arrow("prev")}
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("next")} className="tvp-arrow tvp-arrow--next">
              {arrow("next")}
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="tvp-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setIndex(i)}
              data-dot={i === index ? "1" : ""}
              aria-label={t("goToSlide", { n: i + 1 })}
              aria-current={i === index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
