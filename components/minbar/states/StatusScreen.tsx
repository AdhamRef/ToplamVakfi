import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Button } from "@/components/minbar/ds";
import { NotFoundIcon } from "@/components/minbar/states/StatusIcons";

/**
 * The shared shape of every status screen  payment failed, cancelled,
 * processing, awaiting confirmation, technical error, maintenance, 404.
 *
 * Ported from the seven single-purpose pages in the handoff
 * (`فشل الدفع`, `إلغاء الدفع`, `معالجة الدفع`, `الدفع قيد التأكيد`,
 * `خطأ تقني`, `الصيانة`, `صفحة غير موجودة`), which share one layout: a tinted
 * circular glyph, a heading, a line of explanation, an optional detail panel,
 * and at most two ways out.
 *
 * Two ways out is the ceiling on purpose  the handoff's note on the 404 page
 * is that more exits scatter the decision rather than help it.
 *
 * Toplum Vakfı layout: two variants of the same content.
 *  - `panel` (`Payment Error.dc.html`)  one white card centred on the page
 *    background, the glyph in a tinted disc, the two exits side by side.
 *  - `dark` (`404.dc.html`)  the navy gradient band with the status code in
 *    large brand-blue figures in place of the glyph.
 * The 404 screen is recognised by its glyph, so the callers need no change.
 */

export type StatusTone = "error" | "neutral" | "pending" | "success";

const TONES: Record<StatusTone, { color: string; background: string }> = {
  error: { color: "#d64545", background: "#fdeaea" },
  neutral: { color: "var(--muted)", background: "#eef4f8" },
  pending: { color: "var(--brand-ink)", background: "#eaf6fd" },
  success: { color: "#1a9d5c", background: "#e6f9ee" },
};

export interface StatusScreenProps {
  tone: StatusTone;
  icon: ReactElement;
  title: string;
  lead: string;
  /** Label/value rows shown in a panel beneath the lead. */
  details?: Array<{ label: string; value: ReactNode; latin?: boolean }>;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Extra content between the lead and the actions. */
  children?: ReactNode;
  /** Adds a gentle attention animation. Off for calm states. */
  animate?: boolean;
  /** `dark` is the 404 band; defaults to it for the not-found glyph, else `panel`. */
  variant?: "panel" | "dark";
  /** Large figures shown in the dark variant (e.g. "404"). */
  code?: string;
  /** The checkout bar above the panel (`Payment Error.dc.html` § `.steps`). */
  bar?: ReactNode;
}

export default function StatusScreen({
  tone,
  icon,
  title,
  lead,
  details,
  primary,
  secondary,
  children,
  animate = false,
  variant,
  code,
  bar,
}: StatusScreenProps) {
  const palette = TONES[tone];
  const isNotFound = icon === NotFoundIcon;
  const look = variant ?? (isNotFound ? "dark" : "panel");
  const figures = code ?? (isNotFound ? "404" : undefined);

  const actions =
    primary || secondary ? (
      <div className="gf-status-actions" style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
        {primary ? (
          <Button variant="primary" href={primary.href} style={{ ...actionStyle, boxShadow: "0 8px 20px rgba(0,162,224,.3)" }}>
            {primary.label}
          </Button>
        ) : null}
        {secondary ? (
          <Button
            variant={look === "dark" ? "outline" : "light"}
            href={secondary.href}
            style={look === "dark" ? actionStyle : { ...actionStyle, background: "transparent", color: "var(--muted)", border: "1.5px solid #e2eaf0" }}
          >
            {secondary.label}
          </Button>
        ) : null}
      </div>
    ) : null;

  const detailRows = details?.length ? (
    <div style={{ width: "100%", display: "grid", padding: "6px 18px", background: look === "dark" ? "rgba(255,255,255,.06)" : "var(--page-bg)", border: look === "dark" ? "1px solid rgba(255,255,255,.14)" : 0, borderRadius: 12, textAlign: "start", boxSizing: "border-box" }}>
      {details.map((row, i) => (
        <span key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${look === "dark" ? "rgba(255,255,255,.12)" : "#eef3f7"}` : 0, fontSize: 13.5 }}>
          <span style={{ color: look === "dark" ? "#b9d3e6" : "var(--muted)" }}>{row.label}</span>
          {/* Reference numbers and amounts are Latin-script data. */}
          <b dir={row.latin ? "ltr" : undefined} style={{ ...(row.latin ? latinValue : {}), color: look === "dark" ? "#fff" : "var(--ink)" }}>
            {row.value}
          </b>
        </span>
      ))}
    </div>
  ) : null;

  if (look === "dark") {
    return (
      <section className="gf-status gf-status--dark" style={{ position: "relative", overflow: "hidden", minHeight: "72vh", display: "grid", alignItems: "center", padding: "70px 16px 80px", background: "var(--dark-gradient)", color: "#fff", textAlign: "center" }}>
        <span aria-hidden="true" className="gf-status-glow" />
        <div style={{ position: "relative", width: "min(560px, 100%)", margin: "0 auto", display: "grid", justifyItems: "center", gap: 14 }}>
          {figures ? (
            <span className={animate ? "mia-status-glyph mia-status-glyph--animate gf-status-code" : "mia-status-glyph gf-status-code"} aria-hidden="true" dir="ltr" style={{ fontSize: "clamp(72px, 12vw, 96px)", lineHeight: 1.1, fontWeight: 900, color: "var(--brand)", letterSpacing: "-1px" }}>
              {figures}
            </span>
          ) : (
            <span className={animate ? "mia-status-glyph mia-status-glyph--animate" : "mia-status-glyph"} style={{ display: "grid", placeItems: "center", width: 74, height: 74, borderRadius: "50%", background: "rgba(255,255,255,.08)", color: "#7fd6f5" }}>
              {icon}
            </span>
          )}
          <h1 style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.5 }}>{title}</h1>
          <p style={{ margin: "0 0 10px", maxWidth: "48ch", color: "#b9d3e6", fontSize: 14.5, lineHeight: 1.9 }}>{lead}</p>
          {detailRows}
          {children}
          {actions}
        </div>
      </section>
    );
  }

  return (
    <section className="gf-status" style={{ padding: bar ? "26px 0 60px" : "40px 16px 64px" }}>
      {bar ? <div className="gf-status-bar">{bar}</div> : null}
      <div
        className="gf-status-panel"
        style={{ width: bar ? "min(720px, calc(100% - 32px))" : "min(720px, 100%)", margin: bar ? "20px auto 0" : "0 auto", display: "grid", justifyItems: "center", gap: 12, padding: 34, background: "#fff", border: "1px solid #e6eef3", borderRadius: 18, boxShadow: "0 16px 34px rgba(2,52,88,.08)", textAlign: "center", boxSizing: "border-box" }}
      >
        <span
          className={animate ? "mia-status-glyph mia-status-glyph--animate" : "mia-status-glyph"}
          style={{ display: "grid", placeItems: "center", width: 68, height: 68, marginBottom: 6, borderRadius: "50%", background: palette.background, color: palette.color }}
        >
          {icon}
        </span>

        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--ink)", lineHeight: 1.5 }}>{title}</h1>
        <p style={{ margin: "0 0 12px", maxWidth: "56ch", color: "var(--muted)", fontSize: 14, lineHeight: 1.85 }}>{lead}</p>

        {detailRows}

        {children}

        {actions}
      </div>
    </section>
  );
}

const latinValue: CSSProperties = { unicodeBidi: "isolate" };

/* The design's `.btn-row a`: equal halves, never narrower than 130px. */
const actionStyle: CSSProperties = { flex: "1 1 auto", minWidth: 130, maxWidth: "100%", minHeight: 50, whiteSpace: "nowrap" };
