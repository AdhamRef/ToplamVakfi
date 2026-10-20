import Link from "next/link";

/**
 * The Toplum inner-page banner (`.in-banner` in ToplamVakfi-design/toplum-inner.css),
 * shared by the foundation pages: about, our story, president's letter, board,
 * partners, contact, stories, volunteer.
 *
 * A field photograph under a navy fade that deepens toward the reading edge,
 * an optional breadcrumb, the page's one `h1` with the short brand rule under
 * it, an optional lead line, and the wavy lower edge running into the page
 * background. Styles: `styles/minbar/pages/about.css` (`.fd-banner`).
 *
 * Takes its labels as props (no translation hook), so it renders from both
 * server and client components.
 */

export type BannerCrumb = { label: string; href?: string };

export default function InnerBanner({
  id = "hero",
  crumbs,
  crumbLabel,
  title,
  lead,
}: {
  id?: string;
  /** Omitted on pages whose design has no breadcrumb (Partners). */
  crumbs?: ReadonlyArray<BannerCrumb>;
  /** Accessible name of the breadcrumb (`مسار التنقل`). */
  crumbLabel?: string;
  title: string;
  lead?: string;
}) {
  return (
    <section id={id} className="fd-banner">
      <div className="fd-wrap fd-banner-inner">
        {crumbs && crumbs.length ? (
          <nav aria-label={crumbLabel} className="fd-crumb fd-in">
            <ol>
              {crumbs.map((crumb, index) => (
                <li key={`${index}-${crumb.label}`}>
                  {index > 0 ? (
                    <span aria-hidden="true" className="fd-crumb-sep">
                      ‹
                    </span>
                  ) : null}
                  {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="fd-in fd-in-1">{title}</h1>
        {lead ? <p className="fd-in fd-in-2">{lead}</p> : null}
      </div>
    </section>
  );
}
