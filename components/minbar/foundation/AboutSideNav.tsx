"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";

/**
 * The About family's section menu (`.in-nav` in ToplamVakfi-design/toplum-inner.css):
 * About, Our story, Vision, Mission, Purpose, Goals, President's letter, Board.
 *
 * Vision / mission / purpose / goals are panels of the About page selected by
 * the URL hash (`#vision` …), exactly as the design does. Those four are plain
 * anchors so that, on the About page itself, a click fires `hashchange` and
 * swaps the panel without a navigation; from the other pages they load the
 * About page on that panel.
 */

export type AboutSection = "about" | "story" | "vision" | "mission" | "purpose" | "goals" | "president" | "board";

export const ABOUT_PANELS = ["vision", "mission", "purpose", "goals"] as const;
export type AboutPanel = "about" | (typeof ABOUT_PANELS)[number];

export default function AboutSideNav({
  active,
  onShowAbout,
}: {
  active: AboutSection;
  /**
   * Set by the About page: returning to its first panel from a hash panel is
   * the same URL without the hash, which fires no `hashchange`, so the page
   * swaps the panel itself instead of reloading.
   */
  onShowAbout?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("about");
  const about = miaPath("about", locale);

  const items: ReadonlyArray<{ key: AboutSection; href: string; hash?: boolean }> = [
    { key: "about", href: about },
    { key: "story", href: miaPath("ourStory", locale) },
    { key: "vision", href: `${about}#vision`, hash: true },
    { key: "mission", href: `${about}#mission`, hash: true },
    { key: "purpose", href: `${about}#purpose`, hash: true },
    { key: "goals", href: `${about}#goals`, hash: true },
    { key: "president", href: miaPath("presidentLetter", locale) },
    { key: "board", href: miaPath("board", locale) },
  ];

  return (
    <nav className="fd-nav" aria-label={t("navLabel")}>
      {items.map((item) => {
        const current = active === item.key ? ("page" as const) : undefined;
        if (item.key === "about" && onShowAbout) {
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={current}
              onClick={(event) => {
                event.preventDefault();
                window.history.pushState(null, "", item.href);
                onShowAbout();
              }}
            >
              {t(`nav.${item.key}`)}
            </a>
          );
        }
        return item.hash ? (
          <a key={item.key} href={item.href} aria-current={current}>
            {t(`nav.${item.key}`)}
          </a>
        ) : (
          <Link key={item.key} href={item.href} aria-current={current}>
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
