import "server-only";

import { Prisma, type Certificate, type DonationReceipt } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/locales";
import { nextSequenceNumber, padSerial } from "./sequences";

/**
 * Issuing the two documents a confirmed donation carries
 * (`CERTIFICATES_DOWNLOADS_HANDOFF.md §1`):
 *
 *   - the thank-you certificate  every confirmed donation;
 *   - the donation receipt  every confirmed donation.
 *
 * Older rows may also hold SHARE/METER certificates from the retired waqf
 * product; they stay in the table and are no longer read.
 *
 * `DONATION_LOGIC_SPEC §2` and its idempotency contract govern everything here:
 * nothing is issued before the payment is confirmed, a serial is minted once,
 * and running this again for the same donation  from the success page, from
 * a re-download, from a replayed webhook  returns the same records. The
 * unique constraints on the tables catch the one race the lookups cannot.
 */

export interface IssuedDocuments {
  donationId: string;
  /** The locale the donation was made in  every document renders in it. */
  locale: string;
  receipt: DonationReceipt;
  thanks: Certificate;
}

export class DonationNotConfirmedError extends Error {
  constructor(donationId: string) {
    super(`donation ${donationId} is not confirmed`);
    this.name = "DonationNotConfirmedError";
  }
}

export class DonationNotFoundError extends Error {
  constructor(donationId: string) {
    super(`donation ${donationId} not found`);
    this.name = "DonationNotFoundError";
  }
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Whether a donation is confirmed in the sense the spec means: `PAID`, and
 * stamped by the gateway's webhook or the finance officer. A card order is
 * created optimistically as `PAID` with no `paidAt`; that is not confirmed.
 */
export function isDonationConfirmed(row: { status: string; paidAt: Date | null }): boolean {
  return row.status === "PAID" && row.paidAt != null;
}

/** The donation's own locale, falling back to the donor's, then the site default. */
function documentLocale(donationLocale: string | null, donorLocale: string | null | undefined): string {
  for (const candidate of [donationLocale, donorLocale]) {
    if (candidate && isValidLocale(candidate)) return candidate;
  }
  return DEFAULT_LOCALE;
}

/** Short, unambiguous verification code for the receipt's foot. */
function verifyCodeFor(donationId: string, number: number): string {
  const tail = donationId.slice(-6).toUpperCase();
  return `${tail}-${padSerial(number, 4)}`;
}

async function ensureReceipt(donation: { id: string; paidAt: Date | null }, locale: string): Promise<DonationReceipt> {
  const existing = await prisma.donationReceipt.findUnique({ where: { donationId: donation.id } });
  if (existing) return existing;

  const year = (donation.paidAt ?? new Date()).getUTCFullYear();
  const number = await nextSequenceNumber(`receipt-${year}`);
  try {
    return await prisma.donationReceipt.create({
      data: {
        donationId: donation.id,
        number,
        receiptNo: `MIA-RCP-${year}-${padSerial(number)}`,
        verifyCode: verifyCodeFor(donation.id, number),
        issuedAt: donation.paidAt ?? new Date(),
        locale,
      },
    });
  } catch (error) {
    /* A parallel issue won the race; its row is the receipt. The number this
       call drew is simply never used  a gap is harmless, a duplicate is not. */
    if (!isUniqueViolation(error)) throw error;
    const winner = await prisma.donationReceipt.findUnique({ where: { donationId: donation.id } });
    if (winner) return winner;
    throw error;
  }
}

async function ensureThanksCertificate(
  donation: { id: string; donorId: string; paidAt: Date | null; totalAmount: number; currency: string; donorName: string },
  locale: string
): Promise<Certificate> {
  const existing = await prisma.certificate.findFirst({ where: { donationId: donation.id, type: "THANKS" } });
  if (existing) return existing;

  const year = (donation.paidAt ?? new Date()).getUTCFullYear();
  const number = await nextSequenceNumber(`thanks-${year}`);
  try {
    return await prisma.certificate.create({
      data: {
        serial: `MIA-THX-${year}-${padSerial(number)}`,
        number,
        type: "THANKS",
        donationId: donation.id,
        donorId: donation.donorId,
        count: 1,
        amount: donation.totalAmount,
        currency: donation.currency,
        donorName: donation.donorName,
        issuedAt: donation.paidAt ?? new Date(),
        locale,
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const winner = await prisma.certificate.findFirst({ where: { donationId: donation.id, type: "THANKS" } });
    if (winner) return winner;
    throw error;
  }
}

/**
 * Issue  or, on every call after the first, simply return  the documents
 * for a confirmed donation.
 *
 * Throws `DonationNotFoundError` for an unknown id and
 * `DonationNotConfirmedError` for a donation whose payment has not settled:
 * an unconfirmed card order or a bank transfer still under review gets no
 * serial, full stop.
 */
export async function issueDonationDocuments(donationId: string): Promise<IssuedDocuments> {
  if (!OBJECT_ID.test(donationId)) throw new DonationNotFoundError(donationId);

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: {
      id: true,
      status: true,
      paidAt: true,
      locale: true,
      currency: true,
      totalAmount: true,
      donorId: true,
      donor: { select: { name: true, preferredLang: true } },
    },
  });
  if (!donation) throw new DonationNotFoundError(donationId);
  if (!isDonationConfirmed(donation)) throw new DonationNotConfirmedError(donationId);

  const locale = documentLocale(donation.locale, donation.donor?.preferredLang);
  const base = { ...donation, donorName: (donation.donor?.name ?? "").trim() };

  const [receipt, thanks] = await Promise.all([ensureReceipt(base, locale), ensureThanksCertificate(base, locale)]);

  return { donationId, locale, receipt, thanks };
}

/**
 * The documents already issued for a donation, without issuing anything.
 * `null` when none have been  the caller decides whether to issue.
 */
export async function findDonationDocuments(donationId: string): Promise<IssuedDocuments | null> {
  if (!OBJECT_ID.test(donationId)) return null;
  const [receipt, thanks] = await Promise.all([
    prisma.donationReceipt.findUnique({ where: { donationId } }),
    prisma.certificate.findFirst({ where: { donationId, type: "THANKS" } }),
  ]);
  if (!receipt || !thanks) return null;
  return { donationId, locale: thanks.locale, receipt, thanks };
}

/**
 * Issue on demand: the documents if the donation is confirmed, `null` if it
 * is not yet (or does not exist). For surfaces that must not fail the whole
 * page over a webhook that has not landed.
 */
export async function ensureDonationDocuments(donationId: string): Promise<IssuedDocuments | null> {
  try {
    return await issueDonationDocuments(donationId);
  } catch (error) {
    if (error instanceof DonationNotConfirmedError || error instanceof DonationNotFoundError) return null;
    throw error;
  }
}
