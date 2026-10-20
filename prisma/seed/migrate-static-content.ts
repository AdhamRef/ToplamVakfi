/**
 * prisma/seed/migrate-static-content.ts  move the bank accounts the site
 * used to keep in code (`lib/minbar/banks.ts`) into the database, so the
 * dashboard becomes the only place they are edited from.
 *
 * On the bank accounts: the schema says nothing there is ever seeded, and that
 * rule is about placeholders  a made-up IBAN that reaches production sends a
 * donor's transfer nowhere. These are not placeholders. They are the accounts
 * the site has published on its bank-transfer page since launch, copied as
 * they are, and nothing is invented.
 *
 * Idempotent: upsert on slug. Re-running updates; it never duplicates.
 *
 *   npx tsx prisma/seed/migrate-static-content.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  /* ── Bank accounts ─────────────────────────────────────────────────────── */
  const HOLDER = "ToplamVakfi Uluslararası Yardımlaşma Derneği";
  const banks = [
    {
      slug: "ziraat-katilim",
      name: "Ziraat Katılım Bankası",
      swift: "ZKBATRIS",
      logo: "/ziraat-katilim.jpg",
      currencies: [
        { code: "TRY", iban: "TR750020900001843729000001" },
        { code: "EUR", iban: "TR210020900001843729000003" },
        { code: "USD", iban: "TR480020900001843729000002" },
      ],
    },
    {
      slug: "albaraka",
      name: "AlbarakaTürk Katılım Bankası",
      swift: "BTFHTRIS",
      logo: null as string | null,
      currencies: [{ code: "TRY", iban: "TR710020300009942518000001" }],
    },
  ];
  for (const [i, b] of banks.entries()) {
    const row = await prisma.bankAccount.upsert({
      where: { slug: b.slug },
      update: { name: b.name, holder: HOLDER, swift: b.swift, logo: b.logo ?? undefined, order: i, isActive: true },
      create: { slug: b.slug, name: b.name, holder: HOLDER, swift: b.swift, logo: b.logo ?? undefined, order: i, isActive: true, locales: [] },
    });
    /* Currencies have no key of their own  replace the set, as the dashboard does.
       "TL" in the old file was the bank's local label; ISO 4217 is TRY. */
    await prisma.bankAccountCurrency.deleteMany({ where: { bankAccountId: row.id } });
    await prisma.bankAccountCurrency.createMany({ data: b.currencies.map((c) => ({ bankAccountId: row.id, code: c.code, iban: c.iban })) });
  }
  console.log(`✓ bank accounts: ${banks.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
