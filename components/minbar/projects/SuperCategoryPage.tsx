"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import { youtubeEmbed, youtubeThumb, youtubeWatch } from "@/lib/minbar/content/media";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import VideoModal, { useVideoModal } from "@/components/minbar/VideoModal";
import { NoProjects } from "@/components/minbar/states/ContentStates";
import type { SuperCategoryBlockContent, SuperCategoryContent } from "@/lib/minbar/super-category";

/**
 * A super category's landing page, rendered from the database.
 *
 * This is the page ʿIbādan Lanā used to have hand-written in JSX with its copy
 * in the i18n bundle (`components/minbar/projects/IbadanPage.tsx`, removed).
 * Everything it showed is now editable: the hero photograph, the wordmark, the
 * accent colour, the verse, the calls to action, and an ordered list of
 * sections that can hold campaigns, articles, videos, playlists, courses,
 * reports, booklets, a free text panel or a single film.
 *
 * Nothing here reads the translation tables: `lib/minbar/super-category.ts`
 * resolves every string for the visitor's locale on the server, so this file
 * only lays content out. The `ib-*` and `prg-*` class names are kept because
 * the phone rules for this layout already live under them in
 * `styles/minbar/minbar.css`.
 */

const SECTION = { maxWidth: 1240, margin: "0 auto", padding: "0 24px" } as const;
const NARROW = { maxWidth: 900, margin: "0 auto", padding: "0 24px" } as const;

export default function SuperCategoryPage({ page }: { page: SuperCategoryContent }) {
  const locale = useLocale();
  const rtl = localeDirection(locale) === "rtl";
  const arrow = rtl ? "←" : "→";
  const video = useVideoModal();

  return (
    <div className="ib-page tvsc-page">
      <Hero page={page} rtl={rtl} arrow={arrow} />

      {page.blocks.map((block) => (
        <Block key={block.key} block={block} page={page} arrow={arrow} onPlay={video.open} />
      ))}

      <VideoModal embed={video.embed} onClose={video.close} />
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

/**
 * Laid out as `ToplamVakfi-design/Toplum Vakfı Programs.dc.html`'s campaign
 * banner: the photograph full bleed under a navy fade from the text side, the
 * copy straight on it (no panel), the first call to action as the CTA pill and
 * the page background rising into the bottom as the design's wave. The
 * editor's accent colour stays the base under the photograph. The fade and
 * the wave live in styles/minbar/pages/projects.css (`tvsc-hero`).
 */
function Hero({ page, arrow }: { page: SuperCategoryContent; rtl: boolean; arrow: string }) {
  return (
    <section className="tvsc-hero" style={{ background: page.accentColor }}>
      {page.heroImage ? (
        /* eslint-disable-next-line @next/next/no-img-element -- fills the section; not a fixed-size image */
        <img
          src={page.heroImage}
          alt=""
          className="tvsc-hero-img"
        />
      ) : null}
      <div aria-hidden="true" className="tvsc-hero-fade" />

      {page.logoImage ? (
        <a
          href={page.ctas[0]?.href || "#"}
          className="ib-logo tvsc-logo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fluid wordmark, sized by its container */}
          <img src={page.logoImage} alt={page.title} style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }} />
        </a>
      ) : null}

      <div
        className="ib-hero tvsc-hero-in"
        style={{ gridTemplateColumns: page.heroVideoId ? "minmax(0,1.1fr) minmax(0,1fr)" : "minmax(0,1fr)" }}
      >
        <div className="tvsc-hero-copy">
          <h1>{page.title}</h1>

          {page.subtitle ? <p className="tvsc-hero-sub">{page.subtitle}</p> : null}

          {page.verseArabic ? (
            <p
              dir="rtl"
              className="tvsc-hero-verse"
              style={{ fontFamily: "var(--font-amiri), Almarai, Cairo, sans-serif", unicodeBidi: "isolate" }}
            >
              {page.verseArabic}
            </p>
          ) : null}

          {page.verseTranslation ? (
            <p className="tvsc-hero-trans" style={{ textWrap: "pretty" }}>
              {page.verseTranslation}
            </p>
          ) : null}

          {page.verseAttribution ? (
            <span className="tvsc-hero-attr">
              <span aria-hidden="true" />
              {page.verseAttribution}
              <span aria-hidden="true" />
            </span>
          ) : null}

          {page.intro ? <p className="tvsc-hero-lead">{page.intro}</p> : null}

          {page.ctas.length ? (
            <div className="ib-ctas tvsc-ctas">
              {page.ctas.map((cta, i) => (
                <a
                  key={cta.href + cta.label}
                  href={cta.href}
                  className={i === 0 ? "tv-pill" : "ib-ghost tv-ghost-dark"}
                >
                  {i === 0 ? <i aria-hidden="true" style={{ color: page.accentColor }}>{arrow}</i> : null}
                  {cta.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {page.heroVideoId ? (
          <div className="tvsc-hero-film">
            <iframe
              src={youtubeEmbed(page.heroVideoId)}
              title={page.title}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ── Blocks ───────────────────────────────────────────────────────────────── */

function BlockHeading({ block }: { block: SuperCategoryBlockContent }) {
  if (!block.title && !block.eyebrow && !block.subtitle) return null;
  return (
    <div className="tv-head">
      {block.eyebrow ? <span className="tv-eyebrow">{block.eyebrow}</span> : null}
      {block.title ? <h2 className="tv-h2">{block.title}</h2> : null}
      {block.subtitle ? <span className="tv-sub">{block.subtitle}</span> : null}
    </div>
  );
}

function Block({
  block,
  page,
  arrow,
  onPlay,
}: {
  block: SuperCategoryBlockContent;
  page: SuperCategoryContent;
  arrow: string;
  onPlay: (embed: string) => void;
}) {
  const locale = useLocale();
  const tHome = useTranslations("homepage");
  const anchor = block.anchor || undefined;
  const wrap = (children: React.ReactNode, narrow = false) => (
    <section id={anchor} style={{ position: "relative", zIndex: 1, padding: "44px 0 8px" }}>
      <div style={narrow ? NARROW : SECTION}>{children}</div>
    </section>
  );

  switch (block.kind) {
    /* A free panel: the press mentions the programme page carried, and anything
       else an editor needs to say in its own words. */
    case "TEXT":
      return (
        <section id={anchor} style={{ position: "relative", zIndex: 1, padding: "30px 24px 0" }}>
          <div className="tv-card tvsc-text">
            {block.eyebrow ? <span className="tv-eyebrow">{block.eyebrow}</span> : null}
            {block.title ? (
              <h3 style={{ margin: 0, fontSize: "clamp(19px,2vw,24px)", lineHeight: 1.4, fontWeight: 900 }}>{block.title}</h3>
            ) : null}
            {block.body ? (
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.9, color: "var(--muted)", whiteSpace: "pre-line" }}>{block.body}</p>
            ) : null}
            {block.linkUrl && block.linkLabel ? (
              <a
                href={block.linkUrl}
                target={block.linkUrl.startsWith("http") ? "_blank" : undefined}
                rel={block.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="tv-ghost"
                style={{ width: "fit-content" }}
              >
                {block.linkLabel} <span aria-hidden="true">{arrow}</span>
              </a>
            ) : null}
          </div>
        </section>
      );

    /* One film, full width of the reading column. */
    case "VIDEO":
      if (!block.youtubeId) return null;
      return (
        <section id={anchor} style={{ position: "relative", zIndex: 1, padding: "34px 0 0" }}>
          <div style={NARROW}>
            {block.title ? (
              <h2 className="tv-h2" style={{ marginBottom: 16 }}>{block.title}</h2>
            ) : null}
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 50px rgba(2,52,88,.18)" }}>
              <iframe
                src={youtubeEmbed(block.youtubeId)}
                title={block.title || page.title}
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      );

    case "CAMPAIGNS":
      return (
        <section id={anchor} style={{ position: "relative", zIndex: 1, padding: "44px 0 12px" }}>
          <div style={{ ...SECTION, display: "grid", gap: 18 }}>
            <BlockHeading block={block} />
            {block.campaigns.length ? (
              <div className="tv-card-grid">
                {block.campaigns.map((project) => (
                  <ProjectDonateCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <NoProjects />
            )}
          </div>
        </section>
      );

    /* The episodes of one playlist, with the "watch the whole series" link. */
    case "PLAYLIST_EPISODES": {
      const series = block.playlist;
      if (!series || !series.episodes.length) return null;
      const listId = series.youtubePlaylistUrl.match(/list=([\w-]+)/)?.[1] ?? null;
      return (
        <section id={anchor} className="tvsc-band" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ ...SECTION, display: "grid", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 3 }}>
                <b className="tv-h2">{block.title || series.title}</b>
                {block.subtitle || series.description ? (
                  <span className="tv-sub">{block.subtitle || series.description}</span>
                ) : null}
              </div>
              {series.youtubePlaylistUrl ? (
                <a
                  href={series.youtubePlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="prg-all tv-ghost"
                  onClick={(event) => {
                    if (!listId || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    onPlay(`https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1`);
                  }}
                >
                  {block.linkLabel || tHome("watchFullSeries")}
                  <span aria-hidden="true">{arrow}</span>
                </a>
              ) : null}
            </div>

            <div className="prg-eps" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
              {series.episodes.map((episode) => (
                <a
                  key={episode.youtubeId}
                  href={episode.url || youtubeWatch(episode.youtubeId)}
                  className="prg-ep"
                  aria-label={episode.title || series.title}
                  style={{ display: "grid", gap: 10, overflow: "hidden", borderRadius: 14, color: "inherit", textDecoration: "none" }}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    onPlay(youtubeEmbed(episode.youtubeId, { autoplay: true }));
                  }}
                >
                  <span style={{ position: "relative", display: "block", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", background: "var(--navy)", boxShadow: "0 12px 28px rgba(2,52,88,.12)" }}>
                    <span
                      aria-hidden="true"
                      className="prg-thumb"
                      style={{ position: "absolute", inset: 0, backgroundImage: `url('${episode.thumbnail || youtubeThumb(episode.youtubeId)}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                    <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <span className="prg-play" style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(6,36,66,.55)", display: "grid", placeItems: "center", border: "1.5px solid rgba(255,255,255,.6)" }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </span>
                  {/* The dashboard's title when typed, else YouTube's own. */}
                  {episode.title ? (
                    <b className="prg-ep-title" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 14, lineHeight: 1.55, fontWeight: 800 }}>
                      {episode.title}
                    </b>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "POSTS":
      if (!block.posts.length) return null;
      return wrap(
        <div style={{ display: "grid", gap: 18 }}>
          <BlockHeading block={block} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {block.posts.map((post) => (
              <Link
                key={post.id}
                href={miaPath("article", locale, post.slug)}
                className="tv-card tv-lift"
                style={{ display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}
              >
                <span style={{ display: "block", aspectRatio: "16/9", background: `var(--sand) url('${post.cover ?? ""}') center/cover` }} />
                <span style={{ display: "grid", gap: 6, padding: "16px 18px 18px" }}>
                  <b style={{ fontSize: 15.5, lineHeight: 1.5, fontWeight: 800, color: "var(--deep)" }}>{post.title}</b>
                  {post.excerpt ? (
                    <span style={{ fontSize: 13, lineHeight: 1.75, color: "var(--muted)" }}>{post.excerpt}</span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        </div>
      );

    case "VIDEOS":
      if (!block.videos.length) return null;
      return wrap(
        <div style={{ display: "grid", gap: 18 }}>
          <BlockHeading block={block} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {block.videos.map((v) => (
              <button
                key={v.id}
                type="button"
                className="prg-ep"
                onClick={() => onPlay(youtubeEmbed(v.youtubeId, { autoplay: true, start: v.startSeconds ?? undefined }))}
                style={{ display: "grid", gap: 8, padding: 0, border: 0, background: "none", cursor: "pointer", font: "inherit", textAlign: "start" }}
              >
                <span style={{ position: "relative", display: "block", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", background: "var(--navy)", boxShadow: "0 12px 28px rgba(2,52,88,.12)" }}>
                  <span
                    aria-hidden="true"
                    className="prg-thumb"
                    style={{ position: "absolute", inset: 0, backgroundImage: `url('${v.thumbnail || youtubeThumb(v.youtubeId)}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                  />
                  <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <span className="prg-play" style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(6,36,66,.55)", display: "grid", placeItems: "center", border: "1.5px solid rgba(255,255,255,.6)" }}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </span>
                <b style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 800 }}>{v.title}</b>
              </button>
            ))}
          </div>
        </div>
      );

    case "PLAYLISTS":
      if (!block.playlists.length) return null;
      return wrap(
        <div style={{ display: "grid", gap: 18 }}>
          <BlockHeading block={block} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {block.playlists.map((p) => (
              <Link key={p.id} href={miaPath("programs", locale)} style={{ display: "grid", gap: 8 }}>
                <span style={{ display: "block", aspectRatio: "16/9", borderRadius: 14, boxShadow: "0 12px 28px rgba(2,52,88,.12)", background: `var(--navy) url('${p.coverImage || (p.episodes[0] ? youtubeThumb(p.episodes[0].youtubeId) : "")}') center/cover` }} />
                <b style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 800 }}>{p.title}</b>
              </Link>
            ))}
          </div>
        </div>
      );

    case "COURSES":
      if (!block.courses.length) return null;
      return wrap(
        <div style={{ display: "grid", gap: 18 }}>
          <BlockHeading block={block} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {block.courses.map((c) => (
              <Link
                key={c.id}
                href={c.isExternal && c.externalUrl ? c.externalUrl : miaPath("courses", locale)}
                style={{ display: "grid", gap: 8 }}
              >
                <span style={{ display: "block", aspectRatio: "16/9", borderRadius: 14, boxShadow: "0 12px 28px rgba(2,52,88,.12)", background: `var(--navy) url('${c.coverImage}') center/cover` }} />
                <b style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 800 }}>{c.title}</b>
              </Link>
            ))}
          </div>
        </div>
      );

    case "REPORTS":
    case "BOOKLETS": {
      const documents = block.kind === "REPORTS" ? block.reports : block.booklets;
      if (!documents.length) return null;
      return wrap(
        <div style={{ display: "grid", gap: 18 }}>
          <BlockHeading block={block} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {documents.map((d) => (
              <a
                key={d.id}
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tv-card tv-lift"
                style={{ display: "grid", gap: 10, padding: 14 }}
              >
                <span style={{ display: "block", aspectRatio: "3/4", borderRadius: 10, background: `var(--sand) url('${d.coverImage}') center/cover` }} />
                <b style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 800 }}>{d.title}</b>
                {d.author || d.year ? (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.author || d.year}</span>
                ) : null}
              </a>
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
