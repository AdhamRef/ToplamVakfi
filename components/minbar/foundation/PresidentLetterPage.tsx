"use client";

import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";
import AboutSideNav from "./AboutSideNav";

/**
 * President's letter  `ToplamVakfi-design/Toplum Vakfı President Letter.dc.html`:
 * photo banner (no lead line), the About family's side menu, and the letter as
 * a quote card  opening sentence as the heading, a short rule, three
 * paragraphs. Styles: `.fd-quote` in `styles/minbar/pages/about.css`.
 */

const PARAGRAPHS = ["p1", "p2", "p3"] as const;

export default function PresidentLetterPage() {
  const locale = useLocale();
  const t = useTranslations("tvPresident");
  const tAbout = useTranslations("about");

  return (
    <div className="fd-page fd-p-president">
      <InnerBanner
        crumbs={[
          { label: tAbout("home"), href: miaPath("home", locale) },
          { label: tAbout("heroTitle"), href: miaPath("about", locale) },
          { label: t("title") },
        ]}
        crumbLabel={tAbout("crumbLabel")}
        title={t("title")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-side">
          <AboutSideNav active="president" />

          <article className="fd-card fd-quote">
            <span className="fd-quote-mark" aria-hidden="true">
              ”
            </span>
            <h2>{t("quote")}</h2>
            <span className="fd-quote-rule" aria-hidden="true" />
            {PARAGRAPHS.map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
