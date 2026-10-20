import { prisma } from "@/lib/prisma";
import { pickTranslation, translationLocaleWhere } from "@/lib/i18n/translation-fallback";

/**
 * Server-side reader for the CMS-managed bank accounts, in the shape the
 * public pages render.
 *
 * Sibling of `lib/minbar/projects.ts` and `lib/minbar/posts.ts`. The reader
 * takes the visitor's locale and returns text already resolved  Arabic from
 * the row, anything else from the translation with English as the fallback 
 * so a component never sees a translation table.
 *
 * Pages call it on the server and pass the result down. That is what keeps
 * the content in the first HTML response, which `PRODUCTION_SEO_CONTRACT.md`
 * requires of anything that should be indexed.
 */

/* ── Bank accounts ───────────────────────────────────────────────────────── */

export interface CmsBankAccount {
  id: string;
  slug: string;
  name: string;
  branch: string;
  holder: string;
  swift: string;
  logo: string;
  currencies: Array<{ code: string; accountNo: string; extNo: string; iban: string }>;
}

/** Accounts published to this locale  `locales` is an allow-list, empty = all. */
export async function listBankAccounts(locale: string): Promise<CmsBankAccount[]> {
  const rows = await prisma.bankAccount.findMany({
    where: { isActive: true, OR: [{ locales: { isEmpty: true } }, { locales: { has: locale } }] },
    orderBy: { order: "asc" },
    select: {
      id: true, slug: true, name: true, branch: true, holder: true, swift: true, logo: true,
      translations: { where: translationLocaleWhere(locale), take: 2, select: { locale: true, name: true, branch: true, holder: true } },
      currencies: { select: { code: true, accountNo: true, extNo: true, iban: true } },
    },
  });
  return rows.map((b) => {
    const t = pickTranslation(b.translations, locale);
    return {
      id: b.id,
      slug: b.slug,
      name: t?.name ?? b.name,
      branch: t?.branch || b.branch || "",
      holder: t?.holder || b.holder,
      swift: b.swift ?? "",
      logo: b.logo ?? "",
      currencies: b.currencies.map((c) => ({ code: c.code, accountNo: c.accountNo ?? "", extNo: c.extNo ?? "", iban: c.iban ?? "" })),
    };
  });
}
