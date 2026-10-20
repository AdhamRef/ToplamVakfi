"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Rail from "@/components/minbar/Rail";
import { miaPath } from "@/lib/minbar/routes";
import { youtubeEmbed, youtubeThumb } from "@/lib/minbar/content/media";
import { CONFERENCE_2_EMBED, CONFERENCE_3_EMBED, khatibEmbed } from "@/lib/minbar/content/catalog";
import type { CmsCourse, CmsPlaylist, CmsVideo } from "@/lib/minbar/cms";
import type { HomeEvent } from "@/lib/minbar/home-layout-read";
import type { BuiltinEventId } from "@/lib/minbar/home-layout";
import { ArrowGlyph } from "./TopSections";
import ViewAllLink from "./ViewAllLink";
import { cssImage } from "@/lib/minbar/image-url";

/**
 * Homepage media sections  events, the endorsement and achievement reels, the
 * programmes rail and the courses rail. Ported from
 * `Minbar/الصفحة الرئيسية.dc.html`.
 *
 * The reels, programmes and courses are CMS content, read on the server by the
 * page and passed down already in the visitor's locale. A video's `regionKey`
 * is an interface string when one exists for it (regionGaza, tagTezkiye…) and
 * shown as written otherwise, so an editor can tag freely.
 */

/* ── Events ─────────────────────────────────────────────────────────────────
 * Embedded recordings of the foundation's conferences and events, as the
 * homepage layout picks them: the three built-in conference recordings (the
 * default set) and any video filed under «فعالياتنا». The Turkish edition
 * plays the Turkish recording of the preacher's address. */
/** A YouTube embed URL's still image, or "" for a playlist or another host. */
function embedThumb(src: string): string {
  const id = /\/embed\/([\w-]{11})(?:[?/]|$)/.exec(src || "")?.[1];
  // `videoseries` (a playlist embed) is also eleven characters; it has no still.
  return id && id !== "videoseries" ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

/** `src` with autoplay on, for an embed the visitor has just asked to play. */
function withAutoplay(src: string): string {
  try {
    const url = new URL(src);
    url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * The recording's still and a play button until the visitor presses it; only
 * then the YouTube player. Three players embedded up front cost the homepage
 * ~1.5 MB of YouTube script, its fonts and its cookies before anyone pressed
 * play  PageSpeed's largest JavaScript and third-party-cookie findings.
 */
function EventVideo({ src, title, playLabel }: { src: string; title: string; playLabel: string }) {
  const [playing, setPlaying] = useState(false);
  const thumb = embedThumb(src);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: thumb ? `var(--navy) ${cssImage(thumb, 400)} center / cover no-repeat` : "var(--navy)",
      }}
    >
      {playing ? (
        <iframe
          src={withAutoplay(src)}
          title={title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${playLabel}: ${title}`}
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", width: "100%", height: "100%", padding: 0, border: 0, background: "linear-gradient(0deg, rgba(3,26,54,.55), rgba(3,26,54,0) 55%)", cursor: "pointer" }}
        >
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 60, height: 60, borderRadius: "50%", background: "#fff", color: "#062442", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

export function EventsSection({ events }: { events: HomeEvent[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  if (events.length === 0) return null;

  const builtin: Record<BuiltinEventId, { src: string; title: string }> = {
    "builtin:khatib": { src: khatibEmbed(locale), title: t("eventKhatibTitle") },
    "builtin:conf3": { src: CONFERENCE_3_EMBED, title: t("eventConf3Title") },
    "builtin:conf2": { src: CONFERENCE_2_EMBED, title: t("eventConf2Title") },
  };
  const cards = events.map((event) => ({ id: event.id, ...(event.builtin ? builtin[event.builtin] : { src: event.src, title: event.title }) }));

  return (
    <section id="events" className="tv-sec" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "grid", gap: 22 }}>
        <div id="events-row" className="tv-sec-head tv-sec-head--stack">
          <h2 className="tv-h2">{t("ourActivities")}</h2>
          <p className="tv-lead">{t("activitiesLead")}</p>
        </div>
        <div id="events-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20, alignItems: "stretch" }}>
          {cards.map((card) => (
            <div
              key={card.id}
              className="mia-lift"
              style={{ display: "grid", gridTemplateRows: "auto 1fr", background: "#fff", border: "1px solid #e6eef3", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 28px rgba(2,52,88,.07)" }}
            >
              <EventVideo src={card.src} title={card.title} playLabel={t("watch")} />
              <div style={{ display: "grid", padding: "16px 20px 18px" }}>
                <b style={{ fontSize: "clamp(15px,1.4vw,17px)", fontWeight: 800, lineHeight: 1.6, color: "var(--ink, #062442)" }}>{card.title}</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Reels ──────────────────────────────────────────────────────────────────
 * Endorsements and achievements share one card. An item with a real video opens
 * it in the in-site player; an item with only a still renders without a play
 * affordance, because a dead play button is worse than none
 * (COMPONENT_INVENTORY: "placeholder  بلا زر وهمي"). */
function ReelRail({
  id,
  title,
  viewAllLabel,
  viewAllHref,
  videos,
  showMeta,
  watchLabel,
  onPlay,
}: {
  id: string;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  videos: CmsVideo[];
  showMeta: boolean;
  watchLabel: string;
  onPlay: (embed: string) => void;
}) {
  const t = useTranslations("homepage");
  const tCommon = useTranslations("common");

  return (
    <Rail
      id={id}
      step={472}
      prevLabel={tCommon("prev")}
      nextLabel={tCommon("next")}
      heading={<h2 className="tv-h2">{title}</h2>}
      action={<ViewAllLink href={viewAllHref}>{viewAllLabel}</ViewAllLink>}
    >
      {videos.map((video) => {
        const label = video.title;
        const image = video.thumbnail || (video.youtubeId ? youtubeThumb(video.youtubeId) : null);
        /* A YouTube id plays in the in-site player. A row with only a URL (a
           film hosted elsewhere) still has something to watch: it opens that
           URL in a new tab rather than showing a card with no "Watch" at all
           (`DEPLOYED_VS_DESIGN_AUDIT.md` § P2.4). */
        const embeddable = Boolean(video.youtubeId);
        const external = !embeddable && Boolean(video.url);
        const playable = embeddable || external;
        const tag = video.regionKey ? (t.has(video.regionKey) ? t(video.regionKey) : video.regionKey) : "";

        const content = (
          <>
            {image ? (
              <span
                role="img"
                aria-label={label}
                style={{ position: "absolute", inset: 0, display: "block", backgroundImage: cssImage(image, 232), backgroundSize: "cover", backgroundPosition: "center" }}
              />
            ) : null}
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(3,26,54,.9) 8%, rgba(3,26,54,.45) 44%, rgba(3,26,54,0) 70%)" }} />
            {playable ? (
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <span style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: "50%", background: "#fff", color: "#062442", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                  </svg>
                </span>
              </span>
            ) : null}
            <span style={{ position: "absolute", insetInline: 14, bottom: 14, display: "grid", gap: 8 }}>
              <b style={{ color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1.45 }}>{label}</b>
              <span style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.74)", fontSize: 11.5, fontWeight: 700 }}>
                {showMeta && tag ? tag : null}
                {playable ? (
                  <span style={{ marginInlineStart: "auto", color: "#7fd6f5", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {watchLabel}
                    <ArrowGlyph size={12} />
                  </span>
                ) : null}
              </span>
            </span>
          </>
        );

        const cardStyle: React.CSSProperties = {
          flex: "0 0 232px",
          position: "relative",
          display: "block",
          aspectRatio: "9 / 16",
          borderRadius: 14,
          overflow: "hidden",
          background: "var(--deep)",
          border: "1px solid #e6eef3",
          boxShadow: "0 12px 28px rgba(2,52,88,.07)",
          padding: 0,
        };

        return embeddable ? (
          <button
            key={video.id}
            type="button"
            className="mia-reel"
            onClick={() => onPlay(youtubeEmbed(video.youtubeId, { autoplay: true, start: video.startSeconds ?? undefined }))}
            style={{ ...cardStyle, cursor: "pointer", textAlign: "start" }}
          >
            {content}
          </button>
        ) : external ? (
          <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="mia-reel" style={{ ...cardStyle, textDecoration: "none" }}>
            {content}
          </a>
        ) : (
          <div key={video.id} className="mia-reel" style={cardStyle}>
            {content}
          </div>
        );
      })}
    </Rail>
  );
}

export function ReelsSection({
  onPlay,
  endorsements,
  achievements,
}: {
  onPlay: (embed: string) => void;
  endorsements: CmsVideo[];
  achievements: CmsVideo[];
}) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  if (endorsements.length === 0 && achievements.length === 0) return null;

  return (
    <section className="tv-sec tv-sec--reels" style={{ position: "relative", zIndex: 1, overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 46 }}>
        {endorsements.length > 0 && (
          <ReelRail
            id="reels-a"
            title={t("ourTestimonials")}
            viewAllLabel={t("endViewAll")}
            viewAllHref={miaPath("endorsementVideos", locale)}
            videos={endorsements}
            showMeta
            watchLabel={t("watch")}
            onPlay={onPlay}
          />
        )}
        {achievements.length > 0 && (
          <ReelRail
            id="reels-b"
            title={t("ourAchievements")}
            viewAllLabel={t("achViewAll")}
            viewAllHref={miaPath("achievementVideos", locale)}
            videos={achievements}
            showMeta={false}
            watchLabel={t("watchImplementation")}
            onPlay={onPlay}
          />
        )}
      </div>
    </section>
  );
}

/* ── Programmes ─────────────────────────────────────────────────────────────
 * The first episode of each programme is the poster frame, so publishing a new
 * episode at the head of a programme updates the homepage with no other edit.
 *
 * Laid out as the Toplum design's programmes row (`.program-row`): the heading
 * and its pill at the start, then the cards  a photo cut by a soft curve, a
 * round icon chip riding the curve, the title, the copy and an arrow. */
const PlayGlyph = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

function ProgCardBody({ image, label, tag, title, text }: { image: string; label?: string; tag?: string; title: string; text?: string }) {
  return (
    <>
      <span className="tv-prog-img" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} style={{ backgroundImage: cssImage(image, 285) }} />
      <span className="tv-prog-ico" aria-hidden="true">
        <PlayGlyph size={16} />
      </span>
      <span className="tv-prog-body">
        {tag ? <em className="tv-prog-tag">{tag}</em> : null}
        <b>{title}</b>
        {text ? <span className="tv-prog-text">{text}</span> : null}
        <i aria-hidden="true">
          <ArrowGlyph size={11} />
        </i>
      </span>
    </>
  );
}

export function ProgramsRail({ playlists }: { playlists: CmsPlaylist[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  if (playlists.length === 0) return null;

  return (
    <section id="programs" className="tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div className="tv-wrap tv-prog">
        <div className="tv-prog-intro">
          <h2 className="tv-h2 tv-h2--brand">{t("programsTitle")}</h2>
          <ViewAllLink href={miaPath("programs", locale)} variant="pill">{t("programsAll")}</ViewAllLink>
        </div>
        <div id="programs-rail" className="mia-rail tv-prog-rail" style={railStyle}>
          {playlists.map((program) => (
            /* Each programme opens its own YouTube playlist  in a new tab,
               since it leaves the site  and falls back to the programmes
               page only when the CMS row has no playlist URL. Every card used
               to land on the same generic page (`DEPLOYED_VS_DESIGN_AUDIT.md`
               § P2.3). */
            <Link
              key={program.id}
              href={program.youtubePlaylistUrl || miaPath("programs", locale)}
              {...(program.youtubePlaylistUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="tv-prog-card"
            >
              <ProgCardBody
                image={program.coverImage || program.episodes[0]?.thumbnail || youtubeThumb(program.episodes[0]?.youtubeId ?? "")}
                title={program.title}
                text={program.description || undefined}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Courses ────────────────────────────────────────────────────────────────
 * A course with an internal page links there; one hosted on YouTube opens its
 * intro film in the in-site player instead of leaving the site. Same card as
 * the programmes, with the course's kind as its tag. */
export function CoursesRail({ onPlay, courses }: { onPlay: (embed: string) => void; courses: CmsCourse[] }) {
  const locale = useLocale();
  const t = useTranslations("homepage");

  if (courses.length === 0) return null;

  return (
    <section id="courses" className="tv-sec" style={{ position: "relative", zIndex: 1 }}>
      <div className="tv-wrap tv-prog">
        <div className="tv-prog-intro">
          <h2 className="tv-h2 tv-h2--brand">{t("coursesTitle")}</h2>
          <p className="tv-lead">{t("coursesLead")}</p>
          <ViewAllLink href={miaPath("courses", locale)} variant="pill">{t("coursesAll")}</ViewAllLink>
        </div>
        <div id="courses-rail" className="mia-rail tv-prog-rail" style={railStyle}>
          {courses.map((course) => {
            const label = course.title;
            const cover = course.coverImage || (course.introVideoId ? youtubeThumb(course.introVideoId) : "");
            const inner = (
              <ProgCardBody
                image={cover}
                label={label}
                tag={course.kind === "SEMINAR" ? t("kindSeminar") : t("kindCourse")}
                title={label}
                text={course.description || undefined}
              />
            );
            const style: React.CSSProperties = {
              padding: 0,
              font: "inherit",
              textAlign: "start",
            };

            /* Where a card leads follows the row's flags, in this order: a course
               with its own page goes there (the Zengi course is the one built);
               one hosted elsewhere opens that site; one with only an intro film
               plays it in place; anything else goes to the courses page. */
            if (course.hasDetailPage) {
              const href = course.slug === "zenki" ? miaPath("zenkiCourse", locale) : miaPath("courses", locale);
              return <Link key={course.id} href={href} className="tv-prog-card" style={style}>{inner}</Link>;
            }
            if (course.isExternal && course.externalUrl) {
              return <a key={course.id} href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="tv-prog-card" style={style}>{inner}</a>;
            }
            if (course.introVideoId) {
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => onPlay(youtubeEmbed(course.introVideoId, { autoplay: true }))}
                  className="tv-prog-card"
                  style={{ ...style, cursor: "pointer" }}
                >
                  {inner}
                </button>
              );
            }
            return <Link key={course.id} href={miaPath("courses", locale)} className="tv-prog-card" style={style}>{inner}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}

const railStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  paddingBottom: 6,
  scrollSnapType: "x mandatory",
  WebkitOverflowScrolling: "touch",
};

