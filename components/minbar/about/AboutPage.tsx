"use client";

import { type ReactElement, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import AboutSideNav, { ABOUT_PANELS, type AboutPanel } from "@/components/minbar/foundation/AboutSideNav";
import InnerBanner from "./InnerBanner";

/**
 * About us  `ToplamVakfi-design/Toplum Vakfı About.dc.html`.
 *
 * Photo banner, the About family's side menu, then one of five panels chosen
 * by the URL hash as in the design: the overview (registration intro beside a
 * photograph, mission / vision / goal cards, institutional values, the dark
 * "how to take part" band), and the vision, mission, purpose and goals quote
 * cards. The banner title and breadcrumb follow the panel.
 *
 * The registration date and registry number come from `lib/minbar/org.ts`.
 * Styles: `styles/minbar/pages/about.css`.
 */

/* The catalogue's five values, each with its definition (`values.*`, `valuesText.*`). */
const VALUES = ["v1", "v2", "v3", "v4", "v5"] as const;
const TARGETS = ["t1", "t2", "t3", "t4"] as const;
/* From the foundation catalogue: its four goals, four strategic advantages and the thirteen values it promotes. */
const GOALS = ["g1", "g2", "g3", "g4"] as const;
const ADVANTAGES = ["a1", "a2", "a3", "a4"] as const;
const PROMOTE = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13"] as const;

const TRIO: ReadonlyArray<{ title: string; text: string; icon: ReactElement }> = [
  { title: "missionTitle", text: "missionText", icon: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /> },
  {
    title: "visionTitle",
    text: "visionText",
    icon: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    title: "goalTitle",
    text: "goalText",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
  },
];

const JOIN = ["partner", "donate", "volunteer"] as const;

function panelFromHash(): AboutPanel {
  if (typeof window === "undefined") return "about";
  const key = window.location.hash.slice(1);
  return (ABOUT_PANELS as readonly string[]).includes(key) ? (key as AboutPanel) : "about";
}

function QuoteMark() {
  return (
    <span className="fd-quote-mark" aria-hidden="true">
      ”
    </span>
  );
}

export default function AboutPage() {
  const locale = useLocale();
  const t = useTranslations("about");
  const [panel, setPanel] = useState<AboutPanel>("about");

  useEffect(() => {
    const show = (scroll: boolean) => {
      setPanel(panelFromHash());
      if (scroll) window.scrollTo(0, 0);
    };
    show(false);
    const onHash = () => show(true);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, []);

  const aboutHref = miaPath("about", locale);
  const title = panel === "about" ? t("heroTitle") : t(`nav.${panel}`);
  const crumbs =
    panel === "about"
      ? [{ label: t("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]
      : [{ label: t("home"), href: miaPath("home", locale) }, { label: t("heroTitle"), href: aboutHref }, { label: title }];

  const joinHref: Record<(typeof JOIN)[number], string> = {
    partner: miaPath("partner", locale),
    donate: miaPath("projects", locale),
    volunteer: miaPath("volunteer", locale),
  };

  return (
    <div className="fd-page fd-p-about">
      <InnerBanner crumbs={crumbs} crumbLabel={t("crumbLabel")} title={title} lead={t("heroSubtitle")} />

      <div className="fd-main">
        <div className="fd-wrap fd-side">
          <AboutSideNav
            active={panel}
            onShowAbout={() => {
              setPanel("about");
              window.scrollTo(0, 0);
            }}
          />

          <div>
            {panel === "about" ? (
              <div>
                <article className="fd-card fd-intro">
                  <div className="fd-intro-text">
                    <span className="fd-eyebrow">{t("introEyebrow")}</span>
                    <h2>{t("introTitle", { date: ORG.registeredOn, registry: ORG.licenseNumber })}</h2>
                    <p>{t("introText")}</p>
                    <Link className="fd-pill" href={miaPath("ourStory", locale)}>
                      <span className="fd-pill-ico" aria-hidden="true">
                        <span className="fd-arrow">←</span>
                      </span>
                      {t("introCta")}
                    </Link>
                  </div>
                  <div className="fd-intro-img" role="img" aria-label={t("introImgAlt")} />
                </article>

                <div className="fd-trio">
                  {TRIO.map((card) => (
                    <article key={card.title} className="fd-card">
                      <span className="fd-ico" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                          {card.icon}
                        </svg>
                      </span>
                      <h3>{t(card.title)}</h3>
                      <p>{t(card.text)}</p>
                    </article>
                  ))}
                </div>

                <Values t={t} />
                <Promoted t={t} />

                <section className="fd-join" aria-label={t("joinLabel")}>
                  {JOIN.map((key) => (
                    <article key={key}>
                      <h3>{t(`join.${key}.title`)}</h3>
                      <span className="fd-script">{t(`join.${key}.script`)}</span>
                      <p>{t(`join.${key}.text`)}</p>
                      <Link href={joinHref[key]}>
                        {t(`join.${key}.cta`)} <span className="fd-arrow" aria-hidden="true">←</span>
                      </Link>
                    </article>
                  ))}
                </section>
              </div>
            ) : null}

            {panel === "vision" ? (
              <div>
                <article className="fd-card fd-quote">
                  <QuoteMark />
                  <h2>{t("visionQuote")}</h2>
                </article>
                <Values t={t} />
              </div>
            ) : null}

            {panel === "mission" ? (
              <article className="fd-card fd-quote">
                <QuoteMark />
                <h2>{t("missionQuote")}</h2>
                <div className="fd-quote-sign">
                  <span className="fd-script">{t("heroSubtitle")}</span>
                  <small>{t("mottoLabel")}</small>
                </div>
              </article>
            ) : null}

            {panel === "purpose" ? (
              <article className="fd-card fd-quote">
                <QuoteMark />
                <h2>{t("purposeQuote")}</h2>
                <span className="fd-quote-rule" aria-hidden="true" />
                <div className="fd-targets fd-advantages">
                  {ADVANTAGES.map((key) => (
                    <div key={key}>
                      <b>{t(`advantages.${key}.title`)}</b>
                      <span>{t(`advantages.${key}.text`)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {panel === "goals" ? (
              <div>
                <article className="fd-card fd-quote">
                  <QuoteMark />
                  <h2>{t("goalTitle")}</h2>
                  <span className="fd-quote-rule" aria-hidden="true" />
                  <ol className="fd-goals">
                    {GOALS.map((key) => (
                      <li key={key}>{t(`goalsList.${key}`)}</li>
                    ))}
                  </ol>
                </article>
                <section className="fd-card fd-quote-sub" aria-labelledby="fd-targets-title">
                  <h2 id="fd-targets-title" className="fd-h2">
                    {t("targetsTitle")}
                  </h2>
                  <div className="fd-targets">
                    {TARGETS.map((key) => (
                      <div key={key}>
                        <b>{t(`targets.${key}.title`)}</b>
                        <span>{t(`targets.${key}.text`)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* The thirteen values the catalogue says the foundation works to promote. */
function Promoted({ t }: { t: (key: string) => string }) {
  return (
    <section className="fd-card fd-values" aria-labelledby="fd-promote-title">
      <h2 id="fd-promote-title" className="fd-h2">
        {t("promoteTitle")}
      </h2>
      <ul className="fd-chips">
        {PROMOTE.map((key) => (
          <li key={key}>{t(`promote.${key}`)}</li>
        ))}
      </ul>
    </section>
  );
}

function Values({ t }: { t: (key: string) => string }) {
  return (
    <section className="fd-card fd-values" aria-labelledby="fd-values-title">
      <h2 id="fd-values-title" className="fd-h2">
        {t("valuesTitle")}
      </h2>
      <ul className="fd-values-list">
        {VALUES.map((key) => (
          <li key={key}>
            <b>{t(`values.${key}`)}:</b> {t(`valuesText.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
