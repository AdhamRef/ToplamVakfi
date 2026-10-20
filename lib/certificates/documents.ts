import "server-only";

import { prisma } from "@/lib/prisma";
import { messagesFor } from "@/i18n/locale-messages";
import { localeDirection, isValidLocale } from "@/lib/locales";
import { formatMoney } from "@/lib/minbar/money";
import { verseBlock } from "@/lib/minbar/quran";
import { pickTranslation, translationLocaleWhere } from "@/lib/i18n/translation-fallback";
import type { CertificateVerse } from "@/components/minbar/certificates/ThanksCertificate";
import type { ReceiptLine } from "@/components/minbar/certificates/ReceiptSheet";
import { getReceiptCopy, getThanksCopy } from "./copy";
import type { ReceiptCopy, ReceiptOrgData, ThanksCopy } from "./copy-defaults";
import type { IssuedDocuments } from "./issue";

/**
 * From the persisted records to the props each sheet renders  the one place
 * the two documents read their data. The PDF endpoints, the print pages
 * and the success page's previews all come through here, so what a donor
 * sees on screen is what the PDF says and what the email attaches.
 *
 * Nothing here recomputes a serial: the numbers come from the records
 * `lib/certificates/issue.ts` wrote.
 */

export interface ThanksDocument {
  kind: "thanks";
  certificateId: string;
  donationId: string;
  serial: string;
  donorName: string;
  copy: ThanksCopy;
  verse: CertificateVerse;
  duaVerse: CertificateVerse;
  locale: string;
  dir: "rtl" | "ltr";
}

export interface ReceiptDocument {
  kind: "receipt";
  donationId: string;
  receiptNo: string;
  verifyCode: string;
  issueDate: string;
  payMethod: string;
  payStatus: string;
  donorName: string;
  donorContact: string;
  lines: ReceiptLine[];
  totalAmount: string;
  copy: ReceiptCopy;
  org: ReceiptOrgData;
  copyOf: string;
  pairNote: string;
  locale: string;
  dir: "rtl" | "ltr";
}

type Namespace = Record<string, unknown>;

/** A string from a namespace of the locale's catalog, empty when missing. */
function t(locale: string, ns: string, key: string): string {
  const table = messagesFor(locale)[ns];
  const value = table && typeof table === "object" ? (table as Namespace)[key] : undefined;
  return typeof value === "string" ? value : "";
}

function certificateVerse(locale: string, id: string): CertificateVerse {
  const quran = messagesFor(locale).quran as Parameters<typeof verseBlock>[0];
  const block = verseBlock(quran, id, locale);
  return { arabic: block.arabic, translation: block.translation };
}

/** Numeric date with Latin digits in every locale  a number on a document, not prose. */
export function documentDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function money(amount: number, currency: string, locale: string): string {
  try {
    return formatMoney(amount, currency, `${locale}-u-nu-latn`, { maximumFractionDigits: 2 });
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function buildThanksDocument(docs: IssuedDocuments, copy: ThanksCopy, locale = docs.locale): ThanksDocument {
  return {
    kind: "thanks",
    certificateId: docs.thanks.id,
    donationId: docs.donationId,
    serial: docs.thanks.serial,
    donorName: docs.thanks.donorName,
    copy,
    verse: certificateVerse(locale, "baqarah_261"),
    duaVerse: certificateVerse(locale, "baqarah_110"),
    locale,
    dir: localeDirection(locale),
  };
}

export async function thanksDocumentFor(docs: IssuedDocuments): Promise<ThanksDocument> {
  return buildThanksDocument(docs, await getThanksCopy(docs.locale));
}

/**
 * The receipt in one language.
 *
 * `إيصال التبرع.dc.html`: a receipt is issued in the donor's language AND in
 * Turkish (the legally recognised copy), as two pages of one PDF with the same
 * number and code; a Turkish donor gets the one page. `copyOf` and
 * `pairNote` say which page this is.
 */
export async function receiptDocumentFor(
  docs: IssuedDocuments,
  locale: string,
  page: { index: number; total: number }
): Promise<ReceiptDocument> {
  const lang = isValidLocale(locale) ? locale : docs.locale;
  const donation = await prisma.donation.findUnique({
    where: { id: docs.donationId },
    select: {
      amount: true,
      teamSupport: true,
      fees: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      provider: true,
      subscriptionId: true,
      paidAt: true,
      createdAt: true,
      donor: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          amount: true,
          shareCount: true,
          campaign: { select: { title: true, translations: { where: translationLocaleWhere(lang), take: 2, select: { locale: true, title: true } } } },
        },
      },
      categoryItems: {
        select: {
          amount: true,
          category: { select: { name: true, translations: { where: translationLocaleWhere(lang), take: 2, select: { locale: true, name: true } } } },
        },
      },
    },
  });
  if (!donation) throw new Error(`donation ${docs.donationId} not found`);

  const { copy, org } = await getReceiptCopy(lang);
  const currency = donation.currency;
  const kindProject = t(lang, "cart", "typeProject");
  const kindRecurring = t(lang, "cart", "typeRecurring");
  const kindExtra = t(lang, "cart", "typeExtra");
  const lineKind = donation.subscriptionId ? kindRecurring : kindProject;

  const lines: ReceiptLine[] = [];
  for (const item of donation.items) {
    const tr = pickTranslation(item.campaign.translations, lang);
    const title = tr?.title || item.campaign.title;
    lines.push({ title: item.shareCount ? `${title} × ${item.shareCount}` : title, kind: lineKind, amount: money(item.amount, currency, lang) });
  }
  for (const item of donation.categoryItems) {
    const tr = pickTranslation(item.category.translations, lang);
    lines.push({ title: tr?.name || item.category.name, kind: lineKind, amount: money(item.amount, currency, lang) });
  }
  if (donation.teamSupport > 0) lines.push({ title: t(lang, "system", "successTeam"), kind: kindExtra, amount: money(donation.teamSupport, currency, lang) });
  if (donation.fees > 0) lines.push({ title: t(lang, "system", "successFees"), kind: kindExtra, amount: money(donation.fees, currency, lang) });

  const method =
    donation.paymentMethod === "PAYPAL"
      ? t(lang, "system", "successPaypal")
      : donation.paymentMethod === "BANK_TRANSFER" || donation.provider === "BANK_TRANSFER"
        ? t(lang, "cart", "bankTransfer")
        : t(lang, "cart", "card");

  const contact = [donation.donor?.email, donation.donor?.phone].filter((v): v is string => Boolean(v && v.trim())).join(" · ");
  const single = page.total === 1;

  return {
    kind: "receipt",
    donationId: docs.donationId,
    receiptNo: docs.receipt.receiptNo,
    verifyCode: docs.receipt.verifyCode,
    issueDate: documentDate(docs.receipt.issuedAt, lang),
    payMethod: method,
    payStatus: copy.statusPaid,
    donorName: donation.donor?.name?.trim() || "—",
    donorContact: contact || "—",
    lines,
    totalAmount: money(donation.totalAmount, currency, lang),
    copy,
    org,
    copyOf: `${page.index} / ${page.total}`,
    /* The note that the copy is valid with its Turkish counterpart belongs on
       the donor-language page only; the Turkish page is that counterpart. */
    pairNote: single || lang === "tr" ? "" : copy.pairNote,
    locale: lang,
    dir: localeDirection(lang),
  };
}

/** The pages of a receipt: donor language, then Turkish unless it already is. */
export async function receiptPagesFor(docs: IssuedDocuments): Promise<ReceiptDocument[]> {
  const locales = docs.locale === "tr" ? ["tr"] : [docs.locale, "tr"];
  const pages: ReceiptDocument[] = [];
  for (const [i, locale] of locales.entries()) pages.push(await receiptDocumentFor(docs, locale, { index: i + 1, total: locales.length }));
  return pages;
}

/**
 * What the success page previews: the two documents, issued when the
 * payment is confirmed. Before confirmation  a card donor usually lands
 * before the webhook  the previews render from the donation itself with no
 * serials, and the download links wait for the records.
 */
export interface SuccessDocuments {
  /** Whether the records exist yet. */
  issued: boolean;
  receiptNo: string | null;
  thanks: ThanksDocument;
  receipt: ReceiptDocument | null;
}

export async function successDocumentsFor(donationId: string, docs: IssuedDocuments | null): Promise<SuccessDocuments | null> {
  if (docs) {
    const [thanks, receipt] = await Promise.all([
      thanksDocumentFor(docs),
      receiptDocumentFor(docs, docs.locale, { index: 1, total: docs.locale === "tr" ? 1 : 2 }),
    ]);
    return { issued: true, receiptNo: docs.receipt.receiptNo, thanks, receipt };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(donationId)) return null;
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: {
      id: true,
      locale: true,
      currency: true,
      totalAmount: true,
      createdAt: true,
      donor: { select: { name: true, preferredLang: true } },
    },
  });
  if (!donation) return null;

  const locale = [donation.locale, donation.donor?.preferredLang].find((c): c is string => Boolean(c && isValidLocale(c))) ?? "ar";
  const thanksCopy = await getThanksCopy(locale);
  const dir = localeDirection(locale);

  return {
    issued: false,
    receiptNo: null,
    thanks: {
      kind: "thanks",
      certificateId: "",
      donationId: donation.id,
      serial: "",
      donorName: (donation.donor?.name ?? "").trim(),
      copy: thanksCopy,
      verse: certificateVerse(locale, "baqarah_261"),
      duaVerse: certificateVerse(locale, "baqarah_110"),
      locale,
      dir,
    },
    receipt: null,
  };
}
