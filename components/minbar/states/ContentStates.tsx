"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";

/**
 * The four in-page content states  ported from `Minbar/لا توجد مشاريع.dc.html`,
 * `لا توجد نتائج`, `حالة تحميل المحتوى` and `حالة خطأ تحميل المحتوى`.
 *
 * None of these is a page. Each replaces one region of a page  a project grid,
 * an article grid  and leaves the rest of it, including the
 * ways to give, standing. That is the distinction the handoff draws against the
 * full-page states in `StatusScreen`: a failed fetch is not a 500, and an empty
 * category is not a 404.
 *
 * The two empty states are also distinct from one another, and the handoff is
 * explicit that they must not be collapsed into one:
 *  - `NoResults`  filters or a search matched nothing that exists.
 *  - `NoProjects`  nothing is published in this category at all.
 * A reader who filtered their way to an empty grid needs a reset button; a
 * reader looking at a category with nothing in it needs a way out of it.
 */

function Frame({
  children,
  sand = false,
}: {
  children: ReactNode;
  /** The design sets some of these on sand with a radius, others on the page. */
  sand?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 14,
        textAlign: "center",
        padding: "60px 24px",
        /* Toplum Vakfı empty card (`.pg-empty` on `.in-card`): white, hairline, soft shadow. */
        ...(sand ? { background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 12px 30px rgba(2,52,88,.07)", padding: "44px 20px" } : {}),
      }}
    >
      {children}
    </div>
  );
}

function Glyph({ children, tone = "gold", background = "#eaf5fc", size = 60 }: { children: ReactNode; tone?: "gold" | "muted" | "red"; background?: string; size?: number }) {
  const color = tone === "gold" ? "var(--brand-ink)" : tone === "red" ? "#d64545" : "var(--muted)";
  return (
    <span aria-hidden="true" className="st-in" style={{ display: "grid", placeItems: "center", width: size, height: size, borderRadius: "50%", background, color }}>
      {children}
    </span>
  );
}

/**
 * Nothing matched the filters or the search.
 *
 * `onReset` clears the filters in the page that owns them  it is not a link,
 * and it must never navigate: the reader is already where they want to be.
 * Omit it where there is no filter to clear, and the button is left out
 * rather than rendered as a control that does nothing.
 */
export function NoResults({ onReset }: { onReset?: () => void }) {
  const t = useTranslations("system");
  return (
    <Frame>
      <Glyph tone="muted" background="#eef4f8">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m20 20-4.35-4.35" />
        </svg>
      </Glyph>
      <h3 className="st-in st-in-1" style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>{t("noResultsTitle")}</h3>
      <p className="st-in st-in-2" style={{ margin: 0, maxWidth: "40ch", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.85 }}>
        {t("noResultsLead")}
      </p>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="st-in st-in-3 st-reset"
          style={{ height: 44, padding: "0 22px", borderRadius: 999, border: "1.5px solid var(--brand)", background: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, color: "var(--brand-ink)", cursor: "pointer", minWidth: 44 }}
        >
          {t("resetFilters")}
        </button>
      ) : null}
    </Frame>
  );
}

/** No project is published in this category  everything here is funded or in preparation. */
export function NoProjects() {
  const locale = useLocale();
  const t = useTranslations("system");
  return (
    <Frame sand>
      <Glyph>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </Glyph>
      <h3 className="st-in st-in-1" style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--ink)" }}>{t("noProjectsTitle")}</h3>
      <p className="st-in st-in-2" style={{ margin: 0, maxWidth: "42ch", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.85 }}>
        {t("noProjectsLead")}
      </p>
      <Link
        href={miaPath("projects", locale)}
        className="st-in st-in-3 st-cta"
        style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: 999, background: "var(--cta-gradient)", color: "#fff", fontSize: 13.5, fontWeight: 800, boxShadow: "0 8px 20px rgba(0,162,224,.3)" }}
      >
        {t("allProjectsCta")}
      </Link>
    </Frame>
  );
}


/**
 * Placeholder cards while a request is in flight.
 *
 * The skeleton mirrors the real card's shape so the layout does not jump when
 * the data lands  the handoff's stated reason for having one at all instead of
 * a spinner. `count` should match how many cards the grid expects.
 */
export function ContentSkeleton({ count = 3 }: { count?: number }) {
  const t = useTranslations("system");
  return (
    <div className="sk-grid" role="status" aria-busy="true" aria-label={t("loading")}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={{ display: "grid", gap: 10 }}>
          <div className="sk" style={{ height: 180 }} />
          <div className="sk" style={{ height: 16, width: "70%" }} />
          <div className="sk" style={{ height: 14, width: "45%" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * One region failed to load.
 *
 * `onRetry` re-runs the request that failed. This replaces that region only 
 * the rest of the page, and every other way to give on it, keeps working.
 */
export function ContentError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("system");
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 12, textAlign: "center", padding: "44px 24px", background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 12px 30px rgba(2,52,88,.07)" }}>
      <Glyph tone="red" background="#fdeaea" size={50}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 2.5 18a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />
        </svg>
      </Glyph>
      <p className="st-in st-in-1" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{t("contentLoadFailed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="st-in st-in-2 st-reset"
        style={{ height: 44, padding: "0 22px", borderRadius: 999, border: "1.5px solid var(--brand)", background: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: "var(--brand-ink)", cursor: "pointer" }}
      >
        {t("retryCta")}
      </button>
    </div>
  );
}
