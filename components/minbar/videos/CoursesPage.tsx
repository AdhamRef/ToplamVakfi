"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import type { CmsCourse } from "@/lib/minbar/cms";
import { youtubeEmbed, youtubeThumb } from "@/lib/minbar/content/media";
import VideoModal, { useVideoModal } from "@/components/minbar/VideoModal";
import { EdBanner } from "@/components/minbar/blog/Editorial";

/**
 * Our courses  ported from `Minbar/دوراتنا.dc.html`.
 *
 * A course with a page of its own (the Zangi course) links to it; the rest are
 * full recordings and open in the overlay player, on a card that is still a
 * real anchor to the video so a copied link works.
 *
 * The handoff decides "course" vs "seminar" by testing whether the Arabic title
 * begins with "ندوة". That stops being true the moment the title is translated,
 * so the distinction is a field on the course instead.
 *
 * Laid out on the Toplum editorial listing template: the photo banner with its
 * wave, then white 16px cards three-up (blog.css `ed-` classes).
 */
export default function CoursesPage({ courses }: { courses: CmsCourse[] }) {
  const locale = useLocale();
  const rtl = localeDirection(locale) === "rtl";
  const t = useTranslations("homepage");
  const { embed, open, close } = useVideoModal();

  return (
    <div className="crs-page ed-page">
      <EdBanner title={t("coursesTitle")} lead={t("coursesLead")} />

      <section className="ed-main">
        <div className="ed-wrap">
          <div className="crs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 22 }}>
            {courses.map((course) => {
              const title = course.title;
              const cover = course.coverImage || (course.introVideoId ? youtubeThumb(course.introVideoId) : "");
              /* A course with its own page links there (the Zengi course is the
                 one built); anything else is a recording that opens in place,
                 on a card that is still a real anchor to the video. */
              const internal = course.hasDetailPage;
              const href = internal
                ? (course.slug === "zenki" ? miaPath("zenkiCourse", locale) : miaPath("courses", locale))
                : course.externalUrl || (course.introVideoId ? `https://www.youtube.com/watch?v=${course.introVideoId}` : "");
              const isSeminar = course.kind === "SEMINAR";

              const body = (
                <>
                  <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16/9", background: "var(--navy)", overflow: "hidden" }}>
                    <span
                      role="img"
                      aria-label={title}
                      className="crs-cover"
                      style={{ position: "absolute", inset: 0, backgroundImage: `url('${cover}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                    />
                    <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(3,26,54,.72), rgba(3,26,54,.1) 45%, transparent 65%)" }} />
                    <span aria-hidden="true" className="crs-play" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <span className="ed-play">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                    <span className="ed-badge">
                      {t(isSeminar ? "kindSeminar" : "kindCourse")}
                    </span>
                    <span style={{ position: "absolute", insetInlineStart: 14, bottom: 12, display: "inline-flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 11.5, fontWeight: 800, textShadow: "0 1px 6px rgba(3,26,54,.7)" }}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="m10 8.5 5 3.5-5 3.5z" />
                      </svg>
                      {t(course.unitsCount ? "unitsCount" : "recordedVideo")}
                    </span>
                  </span>

                  <span style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 10, padding: "22px 22px 24px" }}>
                    <b style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.5 }}>{title}</b>
                    {course.description ? (
                      <span style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.8, alignSelf: "start", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {course.description}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6, paddingTop: 14, borderTop: "1px solid #e3edf4" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0077b3", fontWeight: 800, fontSize: 13 }}>
                        {t(internal ? "courseDetails" : "watchNow")}
                        <span aria-hidden="true" className="crs-arrow">{rtl ? "←" : "→"}</span>
                      </span>
                      <span aria-hidden="true" style={{ width: 26, height: 3, borderRadius: 2, background: `linear-gradient(to ${rtl ? "left" : "right"}, rgba(0,162,224,.25), var(--gold))` }} />
                    </span>
                  </span>
                </>
              );

              const frame = {
                display: "grid",
                gridTemplateRows: "auto 1fr",
                background: "#fff",
                border: "1px solid #e6eef3",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 12px 28px rgba(2,52,88,.07)",
                color: "var(--deep)",
              } as const;

              return internal ? (
                <Link key={course.id} href={href} className="crs-card" style={frame}>
                  {body}
                </Link>
              ) : (
                <a
                  key={course.id}
                  href={href}
                  target={course.externalUrl && !course.introVideoId ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="crs-card"
                  style={frame}
                  onClick={(event) => {
                    if (!course.introVideoId) return;
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    open(youtubeEmbed(course.introVideoId, { autoplay: true }));
                  }}
                >
                  {body}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <VideoModal embed={embed} onClose={close} />
    </div>
  );
}
