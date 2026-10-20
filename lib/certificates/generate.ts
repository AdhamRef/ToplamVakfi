import "server-only";

import { messagesFor } from "@/i18n/locale-messages";
import { receiptPagesFor, thanksDocumentFor } from "./documents";
import { htmlToPdf } from "./pdf";
import { renderReceiptHtml, renderThanksHtml, type ThanksLayout } from "./render";
import { documentFilename } from "./http";
import type { IssuedDocuments } from "./issue";

/**
 * From issued records to PDF bytes. The endpoints call the single-document
 * functions; the payment-confirmation email calls `donationAttachments` for
 * the whole set at once.
 */

export interface GeneratedPdf {
  pdf: Buffer;
  filename: string;
}

export async function generateThanksPdf(docs: IssuedDocuments, assetBase: string, layout: ThanksLayout = "landscape"): Promise<GeneratedPdf> {
  const doc = await thanksDocumentFor(docs);
  const html = await renderThanksHtml(doc, assetBase, layout);
  const pdf = await htmlToPdf(html, { landscape: layout === "landscape", marginMm: 0 });
  return { pdf, filename: documentFilename.thanks(docs.locale, doc.serial) };
}

export async function generateReceiptPdf(docs: IssuedDocuments, assetBase: string): Promise<GeneratedPdf> {
  const pages = await receiptPagesFor(docs);
  const html = await renderReceiptHtml(pages, assetBase);
  const pdf = await htmlToPdf(html, { landscape: false, marginMm: 8 });
  return { pdf, filename: documentFilename.receipt(docs.locale, docs.receipt.receiptNo) };
}

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded bytes. */
  content: string;
  contentType: string;
}

function attachmentName(locale: string, key: "attachment0" | "attachment1", fallback: string): string {
  const email = messagesFor(locale).email;
  const success = email && typeof email === "object" ? (email as Record<string, unknown>).success : undefined;
  const name = success && typeof success === "object" ? (success as Record<string, unknown>)[key] : undefined;
  return typeof name === "string" && name.trim() ? name : fallback;
}

/**
 * The PDFs the confirmation email attaches (`CERTIFICATES_DOWNLOADS_HANDOFF §7`):
 * the thank-you certificate and the receipt under the names
 * `email.success.attachment0/1` give them in the donor's language.
 */
export async function donationAttachments(docs: IssuedDocuments, assetBase: string): Promise<EmailAttachment[]> {
  const out: EmailAttachment[] = [];
  const thanks = await generateThanksPdf(docs, assetBase);
  out.push({ filename: attachmentName(docs.locale, "attachment0", thanks.filename), content: thanks.pdf.toString("base64"), contentType: "application/pdf" });
  const receipt = await generateReceiptPdf(docs, assetBase);
  out.push({ filename: attachmentName(docs.locale, "attachment1", receipt.filename), content: receipt.pdf.toString("base64"), contentType: "application/pdf" });
  return out;
}
