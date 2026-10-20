import type { CSSProperties } from "react";
import Link from "next/link";

/**
 * The inner-page banner (`.in-banner` in `ToplamVakfi-design/toplum-inner.css`)
 * as the Impact and Transparency pages use it: a field photograph under the
 * directional navy fade, an optional breadcrumb, the page's `h1` with the
 * short brand rule, a lead line, and the wave into the page background.
 * Styles: `.tvi-banner*` in `styles/minbar/pages/reports.css`.
 */
export type TrustCrumb = { label: string; href?: string };

export default function TrustBanner({
  image,
  title,
  lead,
  crumbs,
  crumbLabel,
}: {
  image: string;
  title: string;
  lead: string;
  crumbs?: ReadonlyArray<TrustCrumb>;
  crumbLabel?: string;
}) {
  return (
    <section className="tvi-banner" style={{ "--tvi-img": `url('${image}')` } as CSSProperties}>
      <div className="tvi-wrap">
        {crumbs?.length ? (
          <nav className="tvi-crumb" aria-label={crumbLabel}>
            {crumbs.map((crumb, index) => (
              <span key={`${index}-${crumb.label}`} className="tvi-crumb-item">
                {index > 0 ? <span aria-hidden="true" className="tvi-crumb-sep">‹</span> : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
    </section>
  );
}
