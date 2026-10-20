import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph } from "./TopSections";

/**
 * The one "see all of these" link every homepage section uses beside its
 * heading. Before this, the sections had four different treatments for the
 * same job  a red text link, a bordered button, a pill and an inline arrow
 * link  which read as four different levels of importance for one action.
 *
 * `pill` is the Toplum design's gradient pill with the white arrow chip
 * (`.wt-pill`, `.fd-pill`), for the one section-level action inside a panel;
 * the default is the design's quiet light pill (`.wg-bar a`).
 */
export default function ViewAllLink({ href, children, variant = "link" }: { href: string; children: ReactNode; variant?: "link" | "pill" }) {
  return (
    <Link href={href} className={variant === "pill" ? "mia-pill-link mia-viewall mia-viewall--pill" : "mia-pill-link mia-viewall"}>
      {children}
      {variant === "pill" ? (
        <i aria-hidden="true" className="mia-viewall-chip">
          <ArrowGlyph size={14} />
        </i>
      ) : (
        <ArrowGlyph size={13} />
      )}
    </Link>
  );
}
