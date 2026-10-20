"use client";

import { useTranslations } from "next-intl";
import { youtubeEmbed, youtubeThumb, youtubeWatch } from "@/lib/minbar/content/media";
import type { CmsVideo } from "@/lib/minbar/cms";
import VideoModal, { useVideoModal } from "@/components/minbar/VideoModal";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import { EdBanner } from "@/components/minbar/blog/Editorial";

/**
 * The two video index pages  ported from `Minbar/إنجازاتنا بالفيديو.dc.html`
 * and `Minbar/تزكياتنا بالفيديو.dc.html`, which are the same page over two
 * different sets.
 *
 * A card with a real recording is an anchor to YouTube that opens the overlay
 * player instead, so a middle-click or a copied link still works and nobody is
 * sent off the site mid-journey. A card that is only a still  a piece the
 * foundation has photographed but not yet filmed  is not a link and carries no
 * play affordance: offering one that plays nothing is worse than offering none.
 *
 * Laid out on the Toplum editorial listing template (photo banner with its
 * wave, 16px-radius tiles on the page background; blog.css `ed-` classes).
 */

export interface VideoGridPageProps {
  /** Already narrowed to this locale by `listVideos` on the server. */
  videos: readonly CmsVideo[];
  /** Keys in the `homepage` namespace for the page's own title and lead. */
  titleKey: string;
  leadKey: string;
}

export default function VideoGridPage({ videos, titleKey, leadKey }: VideoGridPageProps) {
  const t = useTranslations("homepage");
  const { embed, open, close } = useVideoModal();

  /* The locale allow-list (the Turkish endorsements are recorded for a Turkish
     audience) is applied by the reader; what arrives is what this edition shows. */
  const shown = videos;

  return (
    <div className="vg-page ed-page">
      <EdBanner title={t(titleKey)} lead={t(leadKey)} />

      <section className="ed-main">
        <div className="ed-wrap">
          <div className="vg-grid ed-grid">
            {shown.map((video) => {
              const title = video.title;
              const image = video.thumbnail || (video.youtubeId ? youtubeThumb(video.youtubeId) : null);
              const tag = video.regionKey ? (t.has(video.regionKey) ? t(video.regionKey) : video.regionKey) : "";

              const card = (
                <>
                  <span
                    role="img"
                    aria-label={title}
                    style={{ position: "absolute", inset: 0, backgroundImage: image ? `url('${image}')` : undefined, backgroundColor: image ? undefined : "var(--navy)", backgroundSize: "cover", backgroundPosition: "center" }}
                  />
                  <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(3,26,54,.9) 8%, rgba(3,26,54,.38) 46%, rgba(3,26,54,0) 80%)", pointerEvents: "none" }} />
                  {tag ? (
                    <span style={{ position: "absolute", insetInlineStart: 14, top: 14, display: "inline-flex", alignItems: "center", minHeight: 26, padding: "0 11px", borderRadius: 999, background: "rgba(3,26,54,.82)", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                      {tag}
                    </span>
                  ) : null}
                  {video.youtubeId ? (
                    <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <span className="ed-play">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  ) : null}
                  <span style={{ position: "absolute", insetInline: 16, bottom: 14, display: "grid", gap: 6 }}>
                    <b style={{ color: "#fff", fontWeight: 800, fontSize: 15.5, lineHeight: 1.5 }}>{title}</b>
                  </span>
                </>
              );

              const frame = {
                position: "relative" as const,
                display: "grid",
                borderRadius: 16,
                overflow: "hidden",
                background: "var(--navy)",
                aspectRatio: "16/10",
                boxShadow: "0 12px 28px rgba(2,52,88,.12)",
              };

              return video.youtubeId ? (
                <a
                  key={video.id}
                  href={youtubeWatch(video.youtubeId, video.startSeconds ?? undefined)}
                  className="vg-card"
                  style={{ ...frame, cursor: "pointer" }}
                  onClick={(event) => {
                    /* Modified clicks are the reader asking for a new tab, and
                       the href they land on is the real video. */
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    open(youtubeEmbed(video.youtubeId, { autoplay: true, start: video.startSeconds ?? undefined }));
                  }}
                >
                  {card}
                </a>
              ) : (
                <div key={video.id} className="vg-card vg-card--still" style={frame}>
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <VideoModal embed={embed} onClose={close} />
      <ZakatBanner />
    </div>
  );
}
