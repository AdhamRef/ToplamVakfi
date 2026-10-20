"use client";

import type { ReactNode } from "react";

/**
 * The standalone page around one document  the sheet, the print rules from
 * its handoff file, and the `.no-print` toolbar (save as PDF, print, back).
 * The buttons never appear in print or in the PDF.
 *
 * Laid out as `ToplamVakfi-design/Toplum Vakfı Certificate.dc.html`
 * (`.cert-stage`): a pale stage, the toolbar above the sheet with the primary
 * action as the gradient pill and the rest as white pills, and the print hint
 * beneath the sheet.
 *
 * The site shell (header, footer, quick-donation dock) is hidden in print so
 * the page prints the sheet alone, as the handoff files do when opened on
 * their own.
 */

export interface DocumentAction {
  label: string;
  href?: string;
  /** `print` calls `window.print()`; the default follows `href`. */
  kind?: "print" | "link";
  primary?: boolean;
  /** Hint to the browser to download rather than open. */
  download?: boolean;
}

export interface DocumentPageProps {
  /** Extra `@media print` CSS: the `@page` size and the sheet's print size. */
  printCss: string;
  actions: DocumentAction[];
  /** Optional note beneath the sheet (`.cert-hint`). */
  note?: string;
  children: ReactNode;
}

const PrintIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z" />
  </svg>
);

const DownloadIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
  </svg>
);

const SHELL_PRINT_CSS = `
@media print {
  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
  .mia-scope .mia-head, .mia-scope .mia-head-spacer, .mia-scope .mia-foot, .mia-scope .no-print,
  .mia-scope [data-quick-donate], .mia-scope .mia-quick-dock, .mia-scope .mia-cart-reminder { display: none !important; }
  .mia-scope main { padding: 0 !important; }
  .mia-doc-wrap { padding: 0 !important; min-height: 0 !important; background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;

export default function DocumentPage({ printCss, actions, note, children }: DocumentPageProps) {
  return (
    <div className="mia-doc-wrap gf-doc-stage">
      <style dangerouslySetInnerHTML={{ __html: SHELL_PRINT_CSS + printCss }} />

      <div className="no-print gf-doc-toolbar">
        {actions.map((action) => {
          const className = action.primary ? "gf-doc-btn is-primary" : "gf-doc-btn";
          if (action.kind === "print") {
            return (
              <button key={action.label} type="button" onClick={() => window.print()} className={className}>
                {PrintIcon}
                {action.label}
              </button>
            );
          }
          return (
            <a key={action.label} href={action.href} download={action.download ? "" : undefined} className={className}>
              {action.download ? DownloadIcon : null}
              {action.label}
            </a>
          );
        })}
      </div>

      {children}

      {note ? <p className="no-print gf-doc-hint">{note}</p> : null}
    </div>
  );
}
