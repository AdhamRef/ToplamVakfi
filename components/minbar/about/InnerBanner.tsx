"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * The Toplum inner-page banner (`.in-banner` in ToplamVakfi-design/toplum-inner.css),
 * shared by the foundation pages: about, contact, become a partner, volunteer.
 *
 * A field photograph under a navy fade that deepens toward the reading edge,
 * a breadcrumb, an optional eyebrow, the page's one `h1` with the short brand
 * rule under it, a lead line, and the wavy lower edge running into the page
 * background. Styles live in `styles/minbar/pages/about.css` (`.fd-*`); the
 * fade and the photo flip with the writing direction there.
 */

export type BannerCrumb = { label: string; href?: string };

export default function InnerBanner({
  id,
  crumbs,
  eyebrow,
  title,
  lead,
}: {
  id?: string;
  crumbs: ReadonlyArray<BannerCrumb>;
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  const tNav = useTranslations("navigation");

  return (
    <section id={id} className="fd-banner">
      <div className="fd-wrap fd-banner-inner">
        {/* Same label as the project page's breadcrumb (no dedicated key). */}
        <nav aria-label={tNav("home")} className="fd-crumb fd-in">
          <ol>
            {crumbs.map((crumb, index) => (
              <li key={`${index}-${crumb.label}`}>
                {index > 0 ? (
                  <span aria-hidden="true" className="fd-crumb-sep">
                    ›
                  </span>
                ) : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow ? <span className="fd-banner-eyebrow fd-in">{eyebrow}</span> : null}
        <h1 className="fd-in fd-in-1">{title}</h1>
        {lead ? <p className="fd-in fd-in-2">{lead}</p> : null}
      </div>
    </section>
  );
}
