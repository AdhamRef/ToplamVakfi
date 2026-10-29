/**
 * Bank accounts for the bank-transfer donation path.
 *
 * A fixed list, copied from the foundation catalogue ("Hesap numaralarımız").
 * The bank-accounts page, the bank-transfer block, the checkout and the
 * payment-pending page all read it from here; nothing is kept in the database.
 *
 * The bank names come from the bank code inside each IBAN (00010 Ziraat
 * Bankası, 00210 Vakıf Katılım). The catalogue gives no SWIFT codes, so
 * `swift` is empty and the pages leave that row out until one is added.
 */

export interface BankCurrencyAccount {
  /** ISO 4217 code. */
  code: string;
  iban: string;
  accountNo?: string;
  /** Extension / sub-account number where the bank issues one. */
  extNo?: string;
}

export interface MinbarBank {
  id: string;
  name: string;
  /** Legal account holder. */
  holder: string;
  swift: string;
  branch?: string;
  /** Logo URL, when one is available. */
  logo?: string;
  currencies: BankCurrencyAccount[];
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export const BANK_ACCOUNTS: readonly MinbarBank[] = [
  {
    id: "ziraat",
    name: "Ziraat Bankası",
    holder: "Toplum Vakfı",
    swift: "",
    logo: "/ziraat.jpg",
    currencies: [
      { code: "TRY", iban: "TR250001002116978321515001" },
      { code: "USD", iban: "TR950001002116978321515002" },
      { code: "GBP", iban: "TR680001002116978321515003" },
    ],
  },
  {
    id: "vakif-katilim",
    name: "Vakıf Katılım",
    holder: "Toplum Vakfı",
    swift: "",
    logo: "/vakif.png",
    currencies: [
      { code: "TRY", iban: "TR880021000000106985300001" },
      { code: "USD", iban: "TR070021000000106985300101" },
      { code: "GBP", iban: "TR770021000000106985300102" },
    ],
  },
];
