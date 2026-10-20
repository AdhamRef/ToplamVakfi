import type { ReactNode } from "react";

/**
 * Small pieces shared by the editorial pages (blog, article, news,
 * publications, the video and course listings, search), all laid out after the
 * Toplum design's inner-page template. Styles live in
 * `styles/minbar/pages/blog.css` under the `ed-` prefix.
 *
 * No hooks here, so both client pages and the server-rendered search page can
 * use them.
 */

/** The "read more" chevron. It points forward and is mirrored for RTL in CSS. */
export function EdArrow() {
  return (
    <svg className="ed-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 6l6 6-6 6" />
    </svg>
  );
}

/**
 * The design's inner-page banner (`.in-banner`): field photograph under a navy
 * fade, title with its gradient rule, optional lead, wave into the page.
 *
 * `id="hero"` is kept because older rules in minbar.css address the page's
 * non-hero sections as `section:not(#hero)`.
 */
export function EdBanner({ title, lead, children }: { title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section id="hero" className="ed-banner">
      <div className="ed-wrap">
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
