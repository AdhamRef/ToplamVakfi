import CertificateFrame, { CertificateRule, CERT_BRAND_INK, CERT_NAVY } from "./CertificateFrame";
import type { ThanksCertificateProps } from "./ThanksCertificate";

/**
 * The thank-you certificate, portrait  `شهادة الشكر - احتياطي بالطول.dc.html`.
 *
 * The alternate layout: the landscape sheet is the one issued to donors and
 * emailed; this one is offered inside the dashboard only, for an admin who
 * wants a tall frame. Same props, same wording, laid out for A4 portrait.
 */

const SERIF = "var(--font-amiri), Amiri, serif";
const SANS = "var(--font-cairo), Cairo, system-ui, sans-serif";

export default function ThanksCertificatePortrait({ donorName, copy, verse, duaVerse, dir, assetBase = "" }: ThanksCertificateProps) {
  const asset = (file: string) => `${assetBase}/minbar/assets/${file}`;

  return (
    <div
      className="cert-sheet cert-sheet-portrait"
      dir={dir}
      style={{ position: "relative", width: "100%", maxWidth: 760, margin: "0 auto", aspectRatio: "1/1.414", containerType: "inline-size", background: "#FFFFFF", boxShadow: "0 26px 70px rgba(6,36,66,.18)", overflow: "hidden", fontFamily: SANS, color: "#062442" }}
    >
      {/* The official-document frame: navy band, guilloche, inner rule, medallions. */}
      <CertificateFrame watermark={asset("logo-mark.png")} />

      <div style={{ position: "relative", height: "100%", padding: "8.5% 10% 7%", display: "grid", gridTemplateRows: "auto auto 1fr auto", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- letterhead */}
          <img src={asset("logo-horizontal.png")} alt={copy.orgName} style={{ width: "30%", maxWidth: 190, height: "auto" }} />
          <span dir="rtl" style={{ fontFamily: SERIF, fontSize: "clamp(11px,2cqw,15px)", color: "#062442" }}>بسم الله الرحمن الرحيم</span>
          <p dir="rtl" style={{ margin: 0, width: "100%", fontFamily: SERIF, fontSize: "clamp(10px,2cqw,16px)", fontWeight: 700, lineHeight: 1.9, color: "#0F55B8", whiteSpace: "nowrap" }}>{verse.arabic}</p>
          {verse.translation ? <p style={{ margin: 0, width: "94%", fontSize: "clamp(9px,1.4cqw,12px)", lineHeight: 1.7, color: "#0F55B8", opacity: 0.85 }}>{verse.translation}</p> : null}
        </div>

        {/* The design's title block: navy Cairo over the engraved rule. */}
        <div style={{ display: "grid", justifyItems: "center", gap: 14, paddingTop: "4%" }}>
          <h1 style={{ margin: 0, fontFamily: SANS, fontSize: "clamp(30px,7.4cqw,62px)", fontWeight: 900, letterSpacing: "-.01em", color: CERT_NAVY, lineHeight: 1.4, whiteSpace: "nowrap" }}>{copy.title}</h1>
          <CertificateRule width="40%" />
        </div>

        <div style={{ display: "grid", alignContent: "center", justifyItems: "center", gap: "3.4%" }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 10, width: "84%" }}>
            <span style={{ fontSize: "clamp(10px,1.9cqw,14px)", fontWeight: 700, color: "#5D7187", whiteSpace: "nowrap" }}>{copy.nameLabel}</span>
            <span style={{ display: "grid", placeItems: "center", minWidth: "60%", maxWidth: "100%", minHeight: 46, padding: "4px 6px 6px", borderBottom: "1.5px dotted #9fc0d6", fontSize: "clamp(14px,3.4cqw,27px)", fontWeight: 900, color: CERT_BRAND_INK, whiteSpace: "nowrap" }}>{donorName}</span>
          </div>

          <p style={{ margin: 0, width: "94%", fontSize: "clamp(10px,2cqw,15px)", lineHeight: 2.1, color: "#031A36" }}>{copy.body}</p>

          <p dir="rtl" style={{ margin: "1.8% 0 0", width: "100%", fontFamily: SERIF, fontSize: "clamp(11px,2.4cqw,20px)", fontWeight: 700, lineHeight: 1.9, color: "#0F55B8", whiteSpace: "nowrap" }}>{duaVerse.arabic}</p>
          {duaVerse.translation ? <p style={{ margin: 0, width: "92%", fontSize: "clamp(9px,1.4cqw,12px)", lineHeight: 1.7, color: "#0F55B8", opacity: 0.85 }}>{duaVerse.translation}</p> : null}
          <p style={{ margin: 0, width: "92%", fontSize: "clamp(10px,2.15cqw,17px)", lineHeight: 2, color: "#031A36" }}>{copy.duaText}</p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, paddingTop: "3%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the foundation's seal */}
          <img src={asset("cert-seal-alpha.png")} alt="" aria-hidden="true" style={{ width: "clamp(66px,12.5cqw,110px)", height: "auto" }} />
          <div style={{ display: "grid", justifyItems: "end", gap: 6, textAlign: "end" }}>
            <span style={{ fontFamily: SERIF, fontSize: "clamp(13px,2.7cqw,22px)", fontWeight: 700, color: "#0077B3", whiteSpace: "nowrap" }}>{copy.motto}</span>
            <span style={{ fontSize: "clamp(9px,1.6cqw,13px)", fontWeight: 700, color: "#031A36", whiteSpace: "nowrap" }}>{copy.orgName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
