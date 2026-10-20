import CertificateFrame, { CertificateRule, CERT_BRAND, CERT_BRAND_INK, CERT_NAVY } from "./CertificateFrame";
import type { ThanksCopy } from "@/lib/certificates/copy-defaults";
import { ORG } from "@/lib/minbar/org";
import { certSheetLabels } from "@/lib/minbar/giving-cert-labels";

/**
 * The thank-you certificate sheet  `ToplamVakfi-design/Toplum Vakfı Certificate.dc.html`,
 * the plaque alone: no buttons, nothing that touches the host page.
 *
 * The same component is the live preview on the success page, the standalone
 * print page, and the sheet the server turns into the PDF, so it takes no
 * hooks: every editable string arrives as a prop, resolved by the caller from
 * the i18n bundle and the dashboard's overrides (`lib/certificates/copy.ts`).
 * Sizes are in container query units against the sheet's own width (with
 * floors for a phone), so one set serves the 1060px sheet, a scaled preview
 * and the A4 print.
 *
 * Layout, top to bottom, as the design: the certificate number and the date
 * of issue in two framed boxes, the logo, the organisation name, the navy
 * title over its engraved rule, the lead ("the foundation certifies that"),
 * the name on a dotted line, the body, and the foot  two signature lines
 * either side of the registry seal. A4 landscape is a minimum, not a cap: the
 * sheet grows rather than clip when a long name or body needs more room.
 */

export interface CertificateVerse {
  arabic: string;
  /** Translation of the meaning; null in an Arabic edition. */
  translation: string | null;
}

export interface ThanksCertificateProps {
  /** The name engraved on the plaque. Empty renders a blank line to write on. */
  donorName: string;
  copy: ThanksCopy;
  /** Al-Baqarah 261. Carried for the callers; the Toplum Vakfı sheet prints no verse. */
  verse: CertificateVerse;
  /** Al-Baqarah 110. Carried for the callers; the Toplum Vakfı sheet prints no verse. */
  duaVerse: CertificateVerse;
  /** `rtl` for Arabic editions, `ltr` otherwise. */
  dir: "rtl" | "ltr";
  /** Origin to prefix asset paths with when the sheet renders outside the site. */
  assetBase?: string;
  /** The certificate's serial (`ThanksDocument.serial`); the meta row is drawn only with it. */
  serial?: string;
  /** The date of issue, already formatted for the sheet's language. */
  issueDate?: string;
  /** The sheet's language, for its few fixed labels; defaults by direction. */
  locale?: string;
}

const SANS = "var(--font-cairo), Cairo, system-ui, sans-serif";

export default function ThanksCertificate({ donorName, copy, dir, assetBase = "", serial, issueDate, locale }: ThanksCertificateProps) {
  const asset = (file: string) => `${assetBase}/minbar/assets/${file}`;
  const labels = certSheetLabels(locale, dir);

  const metaBox = (label: string, value: string) => (
    <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
      <span style={{ fontSize: "clamp(12px,1.22cqw,13px)", fontWeight: 700, color: "#5D7187", letterSpacing: ".3px", whiteSpace: "nowrap" }}>{label}</span>
      <b dir="ltr" style={{ minWidth: "clamp(92px,12cqw,128px)", minHeight: 30, display: "grid", placeItems: "center", padding: "0 8px", border: "1px solid #cfe3ef", borderRadius: 4, background: "#fbfdff", fontSize: "clamp(12px,1.33cqw,14px)", fontWeight: 800, color: CERT_BRAND_INK, letterSpacing: ".5px", boxSizing: "border-box", whiteSpace: "nowrap" }}>
        {value}
      </b>
    </div>
  );

  const signLine = (label: string) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ borderBottom: "1.5px solid rgba(6,36,66,.35)", marginBottom: 7, minHeight: 22 }} />
      <span style={{ fontSize: 12, color: "#5D7187" }}>{label}</span>
    </div>
  );

  return (
    <div
      className="cert-sheet"
      dir={dir}
      style={{
        position: "relative",
        display: "grid",
        width: "100%",
        maxWidth: 1060,
        margin: "0 auto",
        aspectRatio: "1.414/1",
        containerType: "inline-size",
        background: "#FFFFFF",
        boxShadow: "0 30px 70px rgba(2,36,66,.24)",
        /* `clip`, not `hidden`: the A4 ratio is a minimum, so a longer body
           grows the sheet instead of being cut off. */
        overflow: "clip",
        fontFamily: SANS,
        color: CERT_NAVY,
      }}
    >
      {/* The official-document frame: navy band, guilloche, inner rule, medallions. */}
      <CertificateFrame watermark={asset("logo-mark.png")} />

      <div
        className="cert-body"
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
          gap: "clamp(14px,1.6cqw,18px)",
          padding: "clamp(40px,4.9cqw,52px) clamp(36px,9.2cqw,98px) clamp(38px,4.7cqw,50px)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {serial || issueDate ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            {serial ? metaBox(labels.certNo, serial) : <span />}
            {issueDate ? metaBox(labels.issueDate, issueDate) : <span />}
          </div>
        ) : (
          <span />
        )}

        <div style={{ display: "grid", justifyItems: "center", gap: 6, marginTop: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- sized in container units */}
          <img src={asset("logo-mark.png")} alt={copy.orgName} style={{ height: "clamp(44px,4.5cqw,54px)", width: "auto" }} />
          <span style={{ fontSize: "clamp(12px,1.22cqw,13px)", fontWeight: 800, color: CERT_BRAND_INK, letterSpacing: dir === "rtl" ? 0 : "2px" }}>{copy.orgName}</span>
          <h1 style={{ margin: 0, fontFamily: SANS, fontSize: "clamp(21px,3.06cqw,34px)", fontWeight: 900, letterSpacing: "-.6px", color: CERT_NAVY, lineHeight: 1.4 }}>
            {copy.title}
          </h1>
          <CertificateRule width="clamp(160px,26.5cqw,280px)" />
          <p style={{ margin: "2px 0 0", fontSize: "clamp(12.5px,1.48cqw,15.5px)", fontWeight: 700, color: "#5D7187" }}>{copy.nameLabel}</p>
        </div>

        <div className="cert-main" style={{ display: "grid", alignContent: "center", justifyItems: "center", gap: 14 }}>
          {/* The name line keeps its height when empty, so a certificate
              printed before the donor typed a name has a rule to write on. */}
          <span style={{ display: "inline-block", minWidth: "clamp(200px,34.7cqw,360px)", maxWidth: "100%", minHeight: "1.5em", paddingBottom: 8, borderBottom: "1.5px dotted #9fc0d6", fontSize: "clamp(19px,2.65cqw,28px)", fontWeight: 900, lineHeight: 1.5, color: CERT_BRAND_INK, overflowWrap: "anywhere", boxSizing: "border-box" }}>
            {donorName}
          </span>
          <p style={{ margin: "8px auto 0", maxWidth: "62ch", fontSize: "clamp(12px,1.33cqw,14px)", lineHeight: 2, color: "#3f5567", textWrap: "pretty" }}>{copy.body}</p>
          {copy.duaText ? (
            <p style={{ margin: 0, maxWidth: "62ch", fontSize: "clamp(12px,1.33cqw,14px)", lineHeight: 1.9, fontWeight: 700, color: CERT_BRAND_INK }}>{copy.duaText}</p>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "end", gap: 14 }}>
          {signLine(labels.director)}
          {/* The registry seal: a notched, embossed-stamp edge around the name
              and the waqf registry number (`ORG.licenseNumber`). */}
          <div
            style={{
              position: "relative",
              isolation: "isolate",
              width: "clamp(100px,12.65cqw,134px)",
              aspectRatio: "1",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              alignContent: "center",
              gap: 1,
              color: CERT_NAVY,
              background: "radial-gradient(circle, #fff 0 58%, #eef8fd 58% 100%)",
              border: `2px solid ${CERT_NAVY}`,
              boxShadow: `inset 0 0 0 3px #fff, inset 0 0 0 4.5px ${CERT_BRAND}, 0 4px 14px rgba(2,36,66,.14)`,
              boxSizing: "border-box",
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", inset: -7, borderRadius: "50%", zIndex: -1, background: `repeating-conic-gradient(${CERT_NAVY} 0 3deg, transparent 3deg 9deg)`, opacity: 0.5 }} />
            <b style={{ maxWidth: "84%", fontSize: "clamp(12px,1.33cqw,13px)", fontWeight: 900, lineHeight: 1.3 }}>{copy.orgName}</b>
            <span style={{ fontSize: 12, color: "#5D7187", fontWeight: 700 }}>{labels.registry}</span>
            <i dir="ltr" style={{ fontStyle: "normal", fontSize: 12, color: CERT_BRAND_INK, fontWeight: 800, letterSpacing: "1px" }}>{ORG.licenseNumber}</i>
          </div>
          {signLine(labels.stampSign)}
        </div>
      </div>
    </div>
  );
}
