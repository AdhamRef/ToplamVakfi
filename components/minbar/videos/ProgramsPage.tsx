"use client";

import { useTranslations } from "next-intl";
import type { CmsPlaylist } from "@/lib/minbar/cms";
import { youtubeEmbed, youtubeThumb, youtubeWatch } from "@/lib/minbar/content/media";
import VideoModal, { useVideoModal } from "@/components/minbar/VideoModal";
import { EdBanner } from "@/components/minbar/blog/Editorial";

/**
 * Our video programmes  ported from `Minbar/برامجنا المصورة.dc.html`.
 *
 * One band per series: its name, what it is, a link to the whole playlist, and
 * its episodes as thumbnails. Both this page and the homepage rail read the
 * same playlists from the CMS, so publishing an episode in the dashboard
 * updates both  the single source the handoff specifies.
 *
 * Playlists and episodes both open in the overlay player rather than sending
 * the visitor to YouTube  but every card is still a real anchor to the real
 * video, so a middle-click, a copied link and a crawler all get somewhere.
 *
 * Laid out on the Toplum editorial listing template: the photo banner with its
 * wave, then one white 16px card per series on the page background
 * (blog.css `ed-` classes).
 */

/** Playlist id out of a YouTube playlist URL, for the in-site player. */
function playlistId(href: string): string | null {
  return href.match(/list=([\w-]+)/)?.[1] ?? null;
}

export default function ProgramsPage({ playlists }: { playlists: CmsPlaylist[] }) {
  const t = useTranslations("homepage");
  const tCommon = useTranslations("common");
  const { embed, open, close } = useVideoModal();

  return (
    <div className="prg-page ed-page">
      <EdBanner title={tCommon("programsTitle")} lead={tCommon("programsLead")} />

      <div className="ed-main">
        <div className="ed-wrap">
          {playlists.map((series) => {
            const list = series.youtubePlaylistUrl ? playlistId(series.youtubePlaylistUrl) : null;
            return (
              <section key={series.id} className="prg-band ed-band">
                <div className="ed-card ed-band-card" style={{ display: "grid", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 3 }}>
                      <h2 style={{ margin: 0, fontSize: "clamp(19px,2vw,25px)", fontWeight: 900, lineHeight: 1.4, color: "var(--deep)" }}>{series.title}</h2>
                      {series.description ? <span style={{ color: "var(--muted)", fontSize: 13.5 }}>{series.description}</span> : null}
                    </div>
                    {series.youtubePlaylistUrl ? (
                    <a
                      href={series.youtubePlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="prg-all ed-outline ed-outline--light"
                      style={{ gap: 8, minHeight: 44 }}
                      onClick={(event) => {
                        if (!list || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                        event.preventDefault();
                        open(`https://www.youtube.com/embed/videoseries?list=${list}&autoplay=1`);
                      }}
                    >
                      {t("watchFullSeries")}
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="prg-arrow">
                        <path d="M10 6l6 6-6 6" />
                      </svg>
                    </a>
                    ) : null}
                  </div>

                  <div className="prg-eps" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
                    {series.episodes.map((episode) => (
                      <a
                        key={episode.youtubeId}
                        href={episode.url || youtubeWatch(episode.youtubeId)}
                        className="prg-ep ed-ep"
                        aria-label={episode.title || series.title}
                        style={{ overflow: "hidden", color: "inherit" }}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                          event.preventDefault();
                          open(youtubeEmbed(episode.youtubeId, { autoplay: true }));
                        }}
                      >
                        <span className="ed-thumb">
                          <span
                            aria-hidden="true"
                            className="prg-thumb"
                            style={{ position: "absolute", inset: 0, backgroundImage: `url('${episode.thumbnail || youtubeThumb(episode.youtubeId)}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                          />
                          <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                            <span className="ed-play">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                        </span>
                        {/* The episode's own title  the dashboard's when one was
                            typed, else the one YouTube publishes for the video. */}
                        {episode.title ? (
                          <b className="prg-ep-title">
                            {episode.title}
                          </b>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <VideoModal embed={embed} onClose={close} />
    </div>
  );
}
