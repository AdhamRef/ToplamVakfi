import type { ReactNode } from "react";
import Link from "next/link";

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

/**
 * The design's `.feature-card` (Blog.dc.html, News.dc.html): a 110px
 * navy-to-blue band carrying the category pill, then the title, the lead and
 * the "read more" link. The whole card is the link. The band's six gradient
 * pairs cycle by position, as drawn.
 */
export function EdFeatureCard({
  href,
  badge,
  title,
  text,
  cta,
  meta,
}: {
  href: string;
  badge?: string | null;
  title: string;
  text?: string | null;
  cta: string;
  /** An optional line over the title (the news date). */
  meta?: ReactNode;
}) {
  return (
    <Link href={href} className="ed-fcard">
      <span className="ed-fcard-top">{badge ? <span className="ed-fbadge">{badge}</span> : null}</span>
      <span className="ed-fcard-body">
        {meta ? <span className="ed-fmeta">{meta}</span> : null}
        <h3>{title}</h3>
        {text ? <p>{text}</p> : null}
        <span className="ed-fcta">{cta}</span>
      </span>
    </Link>
  );
}

/**
 * "مقالات ذات صلة" / "أخبار ذات صلة"  the white band of small cards that
 * closes an article (`.related-news` / `.related-card`).
 */
export function EdRelated({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ id: string; href: string; label?: string | null; title: string }>;
}) {
  if (!items.length) return null;
  return (
    <section className="ed-related">
      <div className="ed-wrap">
        <h2>{title}</h2>
        <div className="ed-related-grid">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="ed-related-card">
              {item.label ? <span>{item.label}</span> : null}
              <h4>{item.title}</h4>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
