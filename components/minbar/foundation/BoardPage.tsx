"use client";

import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";
import AboutSideNav from "./AboutSideNav";

/**
 * Board of trustees  `ToplamVakfi-design/Toplum Vakfı Board.dc.html`: photo
 * banner, the About family's side menu, and three member cards (photo slot
 * with the wavy lower edge, name, role).
 *
 * The design leaves the portraits as image slots and no photographs have been
 * supplied, so each slot shows the member's initials on the brand's light
 * field rather than an empty placeholder. Styles: `.fd-board*` in
 * `styles/minbar/pages/about.css`.
 */

/**
 * Each member, with the initials of the name as published in Latin script
 * (the members are Turkish; Arabic initials would join into a word).
 */
const MEMBERS: ReadonlyArray<{ key: string; initials: string }> = [
  { key: "m1", initials: "AY" }, // Dr. Ahmet Hamdi Yıldırım
  { key: "m2", initials: "HA" }, // Dr. Hamdi Arslan
  { key: "m3", initials: "AK" }, // Dr. Abdüssamet Koçak
];

export default function BoardPage() {
  const locale = useLocale();
  const t = useTranslations("tvBoard");
  const tAbout = useTranslations("about");

  return (
    <div className="fd-page fd-p-board">
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
          <AboutSideNav active="board" />

          <ul className="fd-board">
            {MEMBERS.map(({ key, initials }) => {
              const name = t(`${key}.name`);
              return (
                <li key={key} className="fd-card fd-board-card">
                  <div className="fd-board-photo" aria-hidden="true">
                    <span className="fd-board-initials">{initials}</span>
                  </div>
                  <div className="fd-board-body">
                    <h3>{name}</h3>
                    <span>{t(`${key}.role`)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
