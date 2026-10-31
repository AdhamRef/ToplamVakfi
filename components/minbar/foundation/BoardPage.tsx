"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";
import AboutSideNav from "./AboutSideNav";

/**
 * Board of trustees  `ToplamVakfi-design/Toplum Vakfı Board.dc.html`: photo
 * banner, the About family's side menu, and one card per member (portrait,
 * name, role, biography).
 *
 * Portraits and biographies come from the foundation's board profile sheets
 * ("About the board of directors.pdf"); the biography is a list of points
 * under `tvBoard.<member>.bio`. Styles: `.fd-board*` in
 * `styles/minbar/pages/about.css`.
 */

const MEMBERS: ReadonlyArray<{ key: string; photo: string }> = [
  { key: "m1", photo: "/people/Ahmet_Hamdi_Yildirim.png" },
  { key: "m2", photo: "/people/Hamdi_Arslan.png" },
  { key: "m3", photo: "/people/Abdussamet_Kocak.png" },
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
            {MEMBERS.map(({ key, photo }) => {
              const name = t(`${key}.name`);
              const bio = t.raw(`${key}.bio`) as string[];
              return (
                <li key={key} className="fd-card fd-board-card">
                  <div className="fd-board-photo">
                    <Image src={photo} alt={name} fill sizes="(max-width: 900px) 100vw, 260px" />
                  </div>
                  <div className="fd-board-body">
                    <h3>{name}</h3>
                    <span>{t(`${key}.role`)}</span>
                    <ul className="fd-board-bio">
                      {bio.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
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
