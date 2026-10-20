import "server-only";

import type { ReactElement } from "react";
import ThanksCertificate from "@/components/minbar/certificates/ThanksCertificate";
import ThanksCertificatePortrait from "@/components/minbar/certificates/ThanksCertificatePortrait";
import ReceiptSheet, { RECEIPT_RESPONSIVE_CSS } from "@/components/minbar/certificates/ReceiptSheet";
import type { ReceiptDocument, ThanksDocument } from "./documents";

/**
 * Self-contained HTML for each document, for the PDF renderer.
 *
 * The same React sheets the site shows are rendered to static markup inside
 * a minimal page: the two fonts the templates load, the page size and the
 * print rules copied from `@media print` in the handoff files. Assets are
 * absolute URLs on the site's origin, so the headless browser fetches the
 * same PNGs the pages use.
 */

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&display=swap";

const BASE_CSS = `
  :root { --font-cairo: Cairo; --font-amiri: Amiri; --font-quran: Amiri; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Cairo, system-ui, sans-serif; color: #10212B; }
`;

async function toMarkup(element: ReactElement): Promise<string> {
  /* Imported at call time: pulling `react-dom/server` into the module graph
     at build time trips Next's page-data collection under React 19. */
  const { renderToStaticMarkup } = await import("react-dom/server");
  return renderToStaticMarkup(element);
}

function page(lang: string, dir: "rtl" | "ltr", css: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS_LINK}" rel="stylesheet">
<style>${BASE_CSS}${css}</style>
</head>
<body>${body}</body>
</html>`;
}

export type ThanksLayout = "landscape" | "portrait";

/**
 * `شهادة الشكر عرضية.dc.html`  A4 landscape, no margins, the sheet fills the
 * page. The portrait alternate (`شهادة الشكر - احتياطي بالطول`) is A4 portrait.
 */
export async function renderThanksHtml(doc: ThanksDocument, assetBase: string, layout: ThanksLayout = "landscape"): Promise<string> {
  const css =
    layout === "portrait"
      ? `
  @page { size: A4 portrait; margin: 0; }
  .cert-sheet { box-shadow: none !important; margin: 0 !important; width: 209mm !important; height: 295mm !important; max-width: none !important; aspect-ratio: auto !important; break-inside: avoid; overflow: hidden; }
  `
      : `
  @page { size: A4 landscape; margin: 0; }
  .cert-sheet { box-shadow: none !important; margin: 0 !important; width: 296mm !important; height: 209mm !important; max-width: none !important; aspect-ratio: auto !important; break-inside: avoid; overflow: hidden; }
  .cert-body { grid-template-rows: auto auto 1fr auto !important; }
  .cert-main { align-content: center !important; }
  `;
  const props = { donorName: doc.donorName, copy: doc.copy, verse: doc.verse, duaVerse: doc.duaVerse, dir: doc.dir, assetBase };
  const body = await toMarkup(layout === "portrait" ? <ThanksCertificatePortrait {...props} /> : <ThanksCertificate {...props} />);
  return page(doc.locale, doc.dir, css, body);
}

/** `إيصال التبرع.dc.html`  A4 portrait, 8mm margin, one page per language copy. */
export async function renderReceiptHtml(pages: ReceiptDocument[], assetBase: string): Promise<string> {
  const css = `
  @page { size: A4 portrait; margin: 8mm; }
  .rcp-page { break-after: page; }
  .rcp-page:last-child { break-after: auto; }
  .rcp-sheet { width: 194mm !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; break-inside: avoid; }
  ${RECEIPT_RESPONSIVE_CSS}
  `;
  const bodies: string[] = [];
  for (const doc of pages) {
    const markup = await toMarkup(
      <ReceiptSheet
        copy={doc.copy}
        org={doc.org}
        receiptNo={doc.receiptNo}
        issueDate={doc.issueDate}
        payMethod={doc.payMethod}
        payStatus={doc.payStatus}
        donorName={doc.donorName}
        donorContact={doc.donorContact}
        lines={doc.lines}
        totalAmount={doc.totalAmount}
        verifyCode={doc.verifyCode}
        copyOf={doc.copyOf}
        pairNote={doc.pairNote}
        dir={doc.dir}
        assetBase={assetBase}
      />
    );
    bodies.push(`<div class="rcp-page" lang="${doc.locale}" dir="${doc.dir}">${markup}</div>`);
  }
  const first = pages[0];
  return page(first.locale, first.dir, css, bodies.join(""));
}
