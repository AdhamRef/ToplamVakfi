"use client";

import { useTranslations } from "next-intl";
import { youtubeEmbed } from "@/lib/minbar/content/media";
import {
  ZENKI_ANNEX,
  ZENKI_QUOTES,
  ZENKI_UNITS,
  ZENKI_VOCAB,
  ZENKI_WHO_TEXT,
  ZENKI_WHY_MINBAR_TEXT,
} from "@/lib/minbar/content/zenki";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";

/**
 * The Nur ad-Din Zangi course  ported from
 * `Minbar/دورة نور الدين زنكي.dc.html`.
 *
 * The one course with a page of its own: what it is, who Nur ad-Din was, why
 * the foundation is named for a minbar, the concepts it establishes, the ten
 * sessions with their topics, objectives and bibliography, the annex for
 * preachers, and the two ways it is run.
 *
 * Every label here is translated. The syllabus is not, deliberately  see
 * `lib/minbar/content/zenki.ts`. Those blocks are marked `lang="ar" dir="rtl"`
 * so they render and are announced correctly inside a page read in any other
 * language.
 *
 * Laid out on the Toplum editorial template: the photo banner (here two
 * columns, the intro film beside the title) with its wave, then white 16px
 * cards and navy panels on the page background (blog.css `ed-` classes).
 */

/** The course's introductory recording, from the handoff's hero embed. */
const INTRO_VIDEO = "vC1A_17VBpQ";

const H2 = { margin: 0, fontSize: "clamp(21px,2.2vw,29px)", fontWeight: 900 } as const;

/** Arabic source content set inside a page that may be read left-to-right. */
const ARABIC = { lang: "ar", dir: "rtl" as const, style: { unicodeBidi: "isolate" as const } };

export default function ZenkiPage() {
  const t = useTranslations("zenki");

  const badges = ["badgeUnits", "badgeAnnex", "badgeMode"];

  return (
    <div className="zk-page ed-page">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="ed-banner">
        <div id="zk-hero" className="ed-wrap ed-zk-hero">
          <div>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroLead")}</p>
            <div className="zk-badges ed-zk-badges">
              {badges.map((badge) => (
                <span key={badge}>{t(badge)}</span>
              ))}
            </div>
          </div>

          <div className="ed-zk-video">
            {/* Not autoplayed and not muted: the handoff starts this film
                muted on load and offers an "unmute" button over it. A course
                page that begins playing at a reader is worse than one they
                press play on. */}
            <iframe
              src={youtubeEmbed(INTRO_VIDEO)}
              title={t("heroTitle")}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── The programme, and the man ────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "40px 0 0" }}>
        <div className="zk-2col ed-wrap ed-2col">
          <div className="ed-card ed-panel ed-panel--dark">
            <h2>{t("introTitle")}</h2>
            <p>{t("introText1")}</p>
            <p>{t("introText2")}</p>
          </div>
          <div className="ed-card ed-panel">
            <h2>{t("whoTitle")}</h2>
            <p {...ARABIC}>
              {ZENKI_WHO_TEXT}
            </p>
          </div>
        </div>
      </section>

      {/* ── What was said of him, and why a minbar ────────────────────────── */}
      <section style={{ position: "relative", padding: "46px 0 0" }}>
        <div className="zk-2col ed-wrap ed-2col">
          <div className="ed-card ed-panel" style={{ gap: 12 }}>
            <b className="ed-eyebrow" style={{ fontSize: 14 }}>{t("quotesTitle")}</b>
            {ZENKI_QUOTES.map((quote) => (
              <div key={quote.by} className="ed-quote">
                <span {...ARABIC} style={{ ...ARABIC.style, fontSize: 13.5, lineHeight: 1.95, fontWeight: 700 }}>
                  {quote.text}
                </span>
                <b {...ARABIC} style={{ ...ARABIC.style, fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
                   {quote.by}
                </b>
              </div>
            ))}
          </div>
          <div className="ed-card ed-panel">
            <h2>{t("whyMinbarTitle")}</h2>
            <p {...ARABIC}>
              {ZENKI_WHY_MINBAR_TEXT}
            </p>
          </div>
        </div>
      </section>

      {/* ── The concepts ──────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "46px 0 0" }}>
        <div className="ed-wrap" style={{ display: "grid", gap: 18 }}>
          <h2 style={H2}>{t("vocabTitle")}</h2>
          <p style={{ margin: 0, maxWidth: "70ch", fontSize: 14.5, lineHeight: 1.9, color: "var(--muted)" }}>{t("vocabIntro")}</p>
          <div id="zk-vocab" className="ed-concepts">
            {ZENKI_VOCAB.map((concept) => (
              <span
                key={concept}
                {...ARABIC}
                style={ARABIC.style}
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── The sessions ──────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "46px 0 0" }}>
        <div className="ed-wrap" style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <h2 style={H2}>{t("unitsTitle")}</h2>
            <p style={{ margin: 0, maxWidth: "70ch", fontSize: 14.5, lineHeight: 1.9, color: "var(--muted)" }}>{t("unitsIntro")}</p>
          </div>

          <div className="zk-units ed-units">
            {ZENKI_UNITS.map((unit) => (
              <article key={unit.title} className="zk-unit ed-card ed-unit">
                <header className="ed-unit-head">
                  <span {...ARABIC} className="ed-unit-n">
                    {unit.n}
                  </span>
                  <b {...ARABIC} style={{ ...ARABIC.style, flex: "1 1 240px", fontSize: 17, lineHeight: 1.5, fontWeight: 900, color: "var(--deep)" }}>
                    {unit.title}
                  </b>
                  <span {...ARABIC} className="ed-unit-dur">
                    {unit.duration}
                  </span>
                </header>

                <SyllabusList label={t("topicsLabel")} items={unit.topics} />
                <SyllabusList label={t("goalsLabel")} items={unit.goals} />
                {unit.refs.length ? <SyllabusList label={t("refsUnitLabel")} items={unit.refs} muted /> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── The annex for preachers ───────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "46px 0 0" }}>
        <div className="ed-wrap" style={{ display: "grid", gap: 16 }}>
          <div className="ed-card ed-panel ed-panel--dark" style={{ gap: 12 }}>
            <h2>{t("annexTitle")}</h2>
            <p>{t("annexText")}</p>
            <span style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", minHeight: 32, padding: "0 14px", borderRadius: 999, background: "#00a2e0", color: "#031a36", fontSize: 12.5, fontWeight: 800 }}>
              {t("annexDuration")}
            </span>
          </div>

          {ZENKI_ANNEX.map((part) => (
            <article key={part.title} className="zk-unit ed-card ed-unit">
              {/* No number and no duration here: the two lectures share one,
                  stated once in the block above. */}
              <b {...ARABIC} style={{ ...ARABIC.style, fontSize: 17, lineHeight: 1.5, fontWeight: 900, color: "var(--deep)" }}>
                {part.title}
              </b>

              <SyllabusList label={t("topicsLabel")} items={part.topics} />
              <SyllabusList label={t("elementsLabel")} items={part.elements} />
              {part.refs.length ? <SyllabusList label={t("refsSessionLabel")} items={part.refs} muted /> : null}
            </article>
          ))}
        </div>
      </section>

      {/* ── How it is run ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "46px 0 60px" }}>
        <div className="ed-wrap" style={{ display: "grid", gap: 18 }}>
          <h2 style={H2}>{t("formatsTitle")}</h2>
          <div className="zk-formats" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
            {[
              { title: "formatRegularTitle", text: "formatRegularText" },
              { title: "formatIntensiveTitle", text: "formatIntensiveText" },
            ].map((format) => (
              <div key={format.title} className="ed-card ed-panel" style={{ gap: 8 }}>
                <b style={{ fontSize: 16.5, fontWeight: 900, color: "var(--deep)" }}>{t(format.title)}</b>
                <span style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.9 }}>{t(format.text)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ZakatBanner />
      <TravelBanner />
    </div>
  );
}

/**
 * One labelled list inside a session card.
 *
 * The label is translated; the items are the Arabic syllabus, so the list
 * carries its own language and direction.
 */
function SyllabusList({ label, items, muted = false }: { label: string; items: readonly string[]; muted?: boolean }) {
  return (
    <div className={muted ? "ed-syl ed-syl--muted" : "ed-syl"}>
      <b>{label}</b>
      <ul {...ARABIC}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
