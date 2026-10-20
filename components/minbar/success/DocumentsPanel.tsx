"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { SuccessDocuments } from "@/lib/certificates/documents";
import ThanksCertificate from "@/components/minbar/certificates/ThanksCertificate";
import { withDonationToken } from "@/lib/donations/access-token-link";
import ReceiptSheet from "@/components/minbar/certificates/ReceiptSheet";
import ScaledSheet from "@/components/minbar/certificates/ScaledSheet";

/**
 * The download surface of the success page  `نجاح التبرع.dc.html`
 * (`#succ-downloads` and the preview panels).
 *
 * Receipt and thank-you certificate are always offered. Every preview is the
 * live sheet component scaled down, never an image, and every download is the
 * server's PDF of the persisted record  the placeholders in the handoff
 * (`receiptHref`, `certificateHref`) are the real endpoints here.
 *
 * The donor may correct the name on the thank-you certificate; the preview
 * follows as they type, and the final name is what the PDF endpoint receives
 * (`?name=`) and stores.
 */

const DownloadIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
  </svg>
);

/* Toplum Vakfı thank-you (`Thank You.dc.html` § `.certificate`): the document
   toggles are the design's outline pills (`.btn-outline-full`), the previews sit
   in the miniature-sheet frame (`.cert-mini`), and each download is a full pill. */
const rowButton = (tone: "plain" | "gold"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  minHeight: 46,
  padding: "0 20px",
  borderRadius: 999,
  border: tone === "plain" ? "1.5px solid #e2eaf0" : "1.5px solid var(--brand)",
  background: "#fff",
  fontFamily: "inherit",
  fontWeight: 800,
  fontSize: 13.5,
  color: tone === "plain" ? "var(--ink)" : "var(--brand-ink)",
  cursor: "pointer",
});

const panel: React.CSSProperties = {
  position: "relative",
  width: "100%",
  display: "grid",
  gap: 16,
  padding: "20px 18px 18px",
  background: "#fff",
  border: "1px solid #cfe3ef",
  borderRadius: 12,
  textAlign: "start",
  overflow: "hidden",
  boxSizing: "border-box",
};

/* The sheet's brand rule along the top edge (`.cm-rule`). */
const panelRule: React.CSSProperties = {
  position: "absolute",
  insetInline: 0,
  top: 0,
  height: 4,
  background: "linear-gradient(90deg, var(--brand), #7fd6f5)",
};

const downloadLink = (background: string, color: string): React.CSSProperties => ({
  justifySelf: "stretch",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  minHeight: 48,
  padding: "0 24px",
  borderRadius: 999,
  background,
  color,
  fontWeight: 800,
  fontSize: 14,
  textAlign: "center",
  textDecoration: "none",
  boxShadow: "0 8px 20px rgba(0,162,224,.25)",
});

const input: React.CSSProperties = {
  height: 46,
  padding: "0 14px",
  borderRadius: 10,
  border: "1.5px solid #e2eaf0",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 14,
  color: "var(--ink)",
};

export default function DocumentsPanel({
  documents,
  donationId,
  accessToken,
  donorName,
  extraButtons,
}: {
  documents: SuccessDocuments | null;
  donationId: string;
  /** The guest's `?t=`; every document link carries it. Null for a signed-in owner. */
  accessToken: string | null;
  /** From checkout  pre-fills the certificate name. */
  donorName: string;
  /** The share button, rendered in the same row. */
  extraButtons?: ReactNode;
}) {
  const t = useTranslations("system");

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [certName, setCertName] = useState(documents?.thanks.donorName || donorName);

  const receiptHref = withDonationToken(`/api/receipts/${donationId}`, accessToken);
  const certificateHref = withDonationToken(
    `/api/certificates/thanks/${donationId}${certName.trim() ? `?name=${encodeURIComponent(certName.trim())}` : ""}`,
    accessToken
  );

  return (
    <>
      <div id="succ-downloads" className="succ-in succ-in-4" style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={() => setReceiptOpen((open) => !open)} aria-expanded={receiptOpen} className="succ-link" style={rowButton("plain")}>
          {DownloadIcon}
          {t("downloadReceipt")}
        </button>

        <button type="button" onClick={() => setCertOpen((open) => !open)} aria-expanded={certOpen} className="succ-link2" style={rowButton("gold")}>
          {DownloadIcon}
          {t("thankYouCertTitle")}
        </button>


        {extraButtons}
      </div>

      {receiptOpen ? (
        <div style={panel}>
          <span aria-hidden="true" style={panelRule} />
          {documents?.receipt ? (
            <ScaledSheet width={810} height={null} maxWidth={520} className="succ-receipt-canvas">
              <div style={{ width: 810 }}>
                <ReceiptSheet
                  copy={documents.receipt.copy}
                  org={documents.receipt.org}
                  receiptNo={documents.receipt.receiptNo}
                  issueDate={documents.receipt.issueDate}
                  payMethod={documents.receipt.payMethod}
                  payStatus={documents.receipt.payStatus}
                  donorName={documents.receipt.donorName}
                  donorContact={documents.receipt.donorContact}
                  lines={documents.receipt.lines}
                  totalAmount={documents.receipt.totalAmount}
                  verifyCode={documents.receipt.verifyCode}
                  copyOf={documents.receipt.copyOf}
                  pairNote={documents.receipt.pairNote}
                  dir={documents.receipt.dir}
                />
              </div>
            </ScaledSheet>
          ) : (
            <p style={{ margin: 0, textAlign: "center", fontSize: 13.5, color: "var(--muted)" }}>{t("issuing")}</p>
          )}
          <a href={receiptHref} style={downloadLink("var(--cta-gradient)", "#fff")}>
            {DownloadIcon}
            {t("downloadReceipt")}
          </a>
        </div>
      ) : null}

      {certOpen && documents ? (
        <div style={panel}>
          <span aria-hidden="true" style={panelRule} />
          <label style={{ display: "grid", gap: 7 }}>
            <b style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>{t("certNameLabel")}</b>
            <input value={certName} onChange={(event) => setCertName(event.target.value)} placeholder={t("writeYourName")} style={input} />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: 20 }}>
            <ScaledSheet width={1060} height={750} maxWidth={620} className="succ-cert-canvas">
              <div style={{ width: 1060 }}>
                <ThanksCertificate donorName={certName.trim()} copy={documents.thanks.copy} verse={documents.thanks.verse} duaVerse={documents.thanks.duaVerse} dir={documents.thanks.dir} />
              </div>
            </ScaledSheet>
          </div>
          <a href={certificateHref} style={downloadLink("var(--cta-gradient)", "#fff")}>
            {DownloadIcon}
            {t("downloadThankYouCert")}
          </a>
        </div>
      ) : null}
    </>
  );
}
