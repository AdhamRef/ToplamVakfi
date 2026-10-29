"use client";

import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";
import AboutSideNav from "./AboutSideNav";

/**
 * Our story  `ToplamVakfi-design/Toplum Vakfı Our Story.dc.html`: photo banner,
 * the About family's side menu, and one card holding the calligraphic lead and
 * the seven chapters of the foundation's history. Styles: `.fd-story` in
 * `styles/minbar/pages/about.css`.
 */

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

export default function OurStoryPage() {
  const locale = useLocale();
  const t = useTranslations("tvStory");
  const tAbout = useTranslations("about");

  return (
    <div className="fd-page fd-p-story">
      <InnerBanner
        crumbs={[
          { label: tAbout("home"), href: miaPath("home", locale) },
          { label: tAbout("heroTitle"), href: miaPath("about", locale) },
          { label: t("title") },
        ]}
        crumbLabel={tAbout("crumbLabel")}
        title={t("title")}
        lead={t("lead")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-side">
          <AboutSideNav active="story" />

          <article className="fd-card fd-story">
            <span className="fd-script fd-story-lead">{t("script")}</span>
            {SECTIONS.map((key) => (
              <section key={key} aria-labelledby={`fd-story-${key}`}>
                <h2 id={`fd-story-${key}`}>{t(`${key}.title`)}</h2>
                {/* A section's text holds its paragraphs separated by a blank line. */}
                {t(`${key}.text`)
                  .split(/\n\s*\n/)
                  .map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
