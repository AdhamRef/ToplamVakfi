import Link from "next/link";

/**
 * The design's inner banner (`.in-banner` in `ToplamVakfi-design/toplum-inner.css`)
 * for the giving pages: a photograph under a directional navy fade, an
 * optional breadcrumb, the page's one `h1` with the short brand rule, a lead
 * line, and the wavy lower edge. Styles: `styles/minbar/pages/giving.css`
 * (`.tvg-banner`).
 */

export interface GivingCrumb {
  label: string;
  href?: string;
}

export default function GivingBanner({
  image,
  crumbs,
  crumbAria,
  title,
  lead,
}: {
  image?: string | null;
  crumbs?: GivingCrumb[];
  crumbAria?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="tvg-banner" style={image ? { ["--tvg-img" as string]: `url("${image}")` } : undefined}>
      <div className="tvg-wrap">
        {crumbs?.length ? (
          <nav className="tvg-crumb" aria-label={crumbAria}>
            {crumbs.map((crumb, i) => (
              <span key={`${i}-${crumb.label}`} style={{ display: "contents" }}>
                {i > 0 ? <span aria-hidden="true">‹</span> : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
      </div>
    </div>
  );
}
