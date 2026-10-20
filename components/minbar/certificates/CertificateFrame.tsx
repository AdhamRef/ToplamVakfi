import type { CSSProperties } from "react";

/**
 * The official-document frame of `ToplamVakfi-design/Toplum Vakfı Certificate.dc.html`,
 * shared by both thank-you sheets: a deep navy band with a brand hairline, a
 * fine guilloche field, a white inner panel on a double rule with diamond
 * medallions at its corners, and a faint logo watermark.
 *
 * Every layer is absolutely positioned and inline-styled (the PDF renderer
 * loads no stylesheet), and sized in `cqw` against the sheet's own inline-size
 * container so the frame keeps its proportions at 1060px, in a scaled preview
 * and on A4.
 */

export const CERT_NAVY = "#062442";
export const CERT_BRAND = "#00A2E0";
export const CERT_BRAND_INK = "#0077B3";

/* Guilloche: two counter-rotated fine hatches and a ring field, at low opacity
   a security-print texture rather than a bold weave. */
const WEAVE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: [
    "repeating-linear-gradient(45deg, rgba(6,36,66,.07) 0 1px, transparent 1px 7px)",
    "repeating-linear-gradient(-45deg, rgba(0,162,224,.09) 0 1px, transparent 1px 7px)",
    "repeating-radial-gradient(circle at 50% 50%, rgba(0,162,224,.07) 0 1px, transparent 1px 13px)",
    "linear-gradient(#fbfdff, #f4fafe)",
  ].join(", "),
};

/** How far in the inner panel sits, as a share of the sheet's width. */
const RULE = 2.7;

const medallion = (v: "top" | "bottom", h: "left" | "right"): CSSProperties => ({
  position: "absolute",
  [v]: `${RULE / 2}cqw`,
  [h]: `${RULE / 2}cqw`,
  width: `${RULE}cqw`,
  height: `${RULE}cqw`,
  boxSizing: "border-box",
  border: `1.5px solid ${CERT_BRAND}`,
  background: "#fff",
  transform: "rotate(45deg)",
});

export default function CertificateFrame({ watermark }: { watermark: string }) {
  return (
    <>
      <div aria-hidden="true" style={WEAVE} />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: `${RULE}cqw`,
          background: "#fff",
          border: `1.5px solid ${CERT_NAVY}`,
          boxShadow: "0 0 0 4px #fff, 0 0 0 5px rgba(0,162,224,.55)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative sheet artwork, sized as a share of the sheet */}
      <img
        src={watermark}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", left: "50%", top: "46%", height: "58%", width: "auto", transform: "translate(-50%, -50%)", opacity: 0.045, pointerEvents: "none" }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: `1cqw solid ${CERT_NAVY}`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,.28), inset 0 0 0 3px ${CERT_BRAND}`,
          pointerEvents: "none",
        }}
      />
      {(["top", "bottom"] as const).flatMap((v) =>
        (["left", "right"] as const).map((h) => (
          <div key={`${v}-${h}`} aria-hidden="true" style={medallion(v, h)}>
            <span style={{ position: "absolute", inset: "20%", border: "1px solid rgba(6,36,66,.45)" }} />
          </div>
        ))
      )}
    </>
  );
}

/** The engraved divider under the title: a navy rule with a centred lozenge. */
export function CertificateRule({ width }: { width: string }) {
  return (
    <span aria-hidden="true" style={{ position: "relative", display: "block", width, height: 1.5, background: `linear-gradient(90deg, transparent, ${CERT_NAVY} 22%, ${CERT_NAVY} 78%, transparent)` }}>
      <span style={{ position: "absolute", top: "50%", left: "50%", width: 9, height: 9, margin: "-4.5px 0 0 -4.5px", background: CERT_BRAND, transform: "rotate(45deg)", boxShadow: "0 0 0 3px #fff" }} />
    </span>
  );
}
