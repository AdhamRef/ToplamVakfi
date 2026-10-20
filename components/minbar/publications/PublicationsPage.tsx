"use client";

import { useTranslations } from "next-intl";
import type { CmsDocument } from "@/lib/minbar/cms";
import { EdBanner } from "@/components/minbar/blog/Editorial";

/**
 * Our publications  originally `Minbar/كتيبات المؤسسة.dc.html`, now on the
 * Toplum editorial listing template (photo banner with its wave, section on
 * the page background, white 16px cards; styles in
 * `styles/minbar/pages/blog.css`, `ed-` classes).
 *
 * One card per booklet: its cover, what it is, and two ways to have it  read
 * in the browser, or downloaded.
 *
 * The booklets are the documents published in the dashboard; nothing here
 * invents a title or an author for a book that has none.
 */

/**
 * `title` and `author` are proper names and stay as written in every language
 * the same rule the video catalog applies to named speakers. Everything else is
 * interface copy and resolves through the `common` namespace.
 */

export default function PublicationsPage({ booklets }: { booklets: CmsDocument[] }) {
  const t = useTranslations("common");

  return (
    <div className="bk-page ed-page">
      <EdBanner title={t("bookletsTitle")} lead={t("bookletsLead")} />

      <section className="ed-main">
        <div className="ed-wrap">
          <div className="ed-grid ed-grid--4">
            {booklets.map((booklet) => (
              <div key={booklet.id} className="ed-card ed-card--lift ed-book">
                {/* Without cover artwork the panel is the soft blue ground
                    rather than a stand-in photograph from somewhere else. */}
                <span aria-hidden="true" className="ed-media">
                  {booklet.coverImage ? (
                    <span className="ed-media-img" style={{ backgroundImage: `url('${booklet.coverImage}')` }} />
                  ) : null}
                  <span className="ed-badge">{t("bookletTagFoundation")}</span>
                </span>

                <span className="ed-body" style={{ gap: 9 }}>
                  {/* A book title and an author's name keep their own script and
                      direction whatever language the page is read in. */}
                  <b dir="rtl" style={{ fontSize: 16, lineHeight: 1.5, unicodeBidi: "isolate" }}>{booklet.title}</b>
                  {booklet.author ? <span dir="rtl" className="ed-eyebrow" style={{ fontSize: 13, unicodeBidi: "isolate" }}>{booklet.author}</span> : null}
                  {booklet.description ? <span className="ed-text">{booklet.description}</span> : null}

                  <span className="ed-book-foot">
                    <span>{t("bookletFormatPdf")}</span>
                    <span style={{ marginInlineStart: "auto" }}>{t("bookletLanguageArabic")}</span>
                  </span>

                  <span className="ed-book-actions">
                    <a href={booklet.fileUrl} target="_blank" rel="noopener noreferrer" className="ed-pill ed-pill--plain bk-read">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 19.5V6a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v14" />
                        <path d="M6.5 19.5H19a1 1 0 0 0 1-1V17H8a1.5 1.5 0 0 0 0 3H6.5a1.5 1.5 0 0 1 0-3" />
                      </svg>
                      {t("readBooklet")}
                    </a>
                    <a href={booklet.fileUrl} download className="ed-outline ed-outline--light">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
                      </svg>
                      {t("download")}
                    </a>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
