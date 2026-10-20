/**
 * The structure of each legal page, block by block, as laid out in
 * `ToplamVakfi-design/Toplum Vakfı {Privacy Policy, Terms, Donation Agreement,
 * Refund Policy}.dc.html`. Cookie policy and the accessibility statement have
 * no design file of their own and follow the same template.
 *
 * Every key is a path in the `tvLegal` namespace. A text may use `{org}` (the
 * foundation's name from `ORG.legalName`) and `{email}` (`ORG.email`).
 */
export type LegalBlock =
  | { type: "h2"; key: string; id?: string; divider?: boolean }
  | { type: "h3"; key: string }
  | { type: "p"; key: string }
  | { type: "ul"; keys: readonly string[] };

export interface LegalDoc {
  /** Group in `tvLegal`: `<group>.title` is the h1, `<group>.intro` the lead. */
  group: string;
  blocks: readonly LegalBlock[];
}

/** The donation terms, shared by the terms page and the donation agreement. */
const DONATION_TERMS = (heading: "h2" | "h3"): LegalBlock[] => [
  { type: heading, key: "donation.natureH" },
  { type: "ul", keys: ["donation.nature1", "donation.nature2"] },
  { type: heading, key: "donation.monthlyH" },
  { type: "p", key: "donation.monthlyP" },
  { type: heading, key: "donation.receiptsH" },
  { type: "p", key: "donation.receiptsP" },
];

export const LEGAL_DOCS = {
  privacy: {
    group: "privacy",
    blocks: [
      { type: "h2", key: "privacy.collectH" },
      { type: "ul", keys: ["privacy.collect1", "privacy.collect2"] },
      { type: "h2", key: "privacy.useH" },
      { type: "p", key: "privacy.useP" },
      { type: "h2", key: "privacy.beneficiariesH" },
      { type: "p", key: "privacy.beneficiariesP" },
    ],
  },
  terms: {
    group: "terms",
    blocks: [
      { type: "h2", key: "terms.usageH" },
      { type: "p", key: "terms.usageP" },
      { type: "h2", key: "terms.ipH" },
      { type: "p", key: "terms.ipP" },
      { type: "h2", key: "terms.liabilityH" },
      { type: "p", key: "terms.liabilityP" },
      { type: "h2", key: "terms.changesH" },
      { type: "p", key: "terms.changesP" },
      { type: "h2", key: "terms.donationH", id: "donation", divider: true },
      { type: "p", key: "terms.donationIntro" },
      ...DONATION_TERMS("h3"),
    ],
  },
  donation: {
    group: "donation",
    blocks: DONATION_TERMS("h2"),
  },
  refund: {
    group: "refund",
    blocks: [
      { type: "h2", key: "refund.monthlyH" },
      { type: "p", key: "refund.monthlyP" },
      { type: "h2", key: "refund.requestsH" },
      { type: "ul", keys: ["refund.requests1", "refund.requests2"] },
      { type: "h2", key: "refund.howH" },
      { type: "p", key: "refund.howP" },
    ],
  },
  cookies: {
    group: "cookies",
    blocks: [
      { type: "h2", key: "cookies.whatH" },
      { type: "p", key: "cookies.whatP" },
      { type: "h2", key: "cookies.typesH" },
      { type: "ul", keys: ["cookies.types1", "cookies.types2", "cookies.types3"] },
      { type: "h2", key: "cookies.controlH" },
      { type: "p", key: "cookies.controlP" },
    ],
  },
  accessibility: {
    group: "accessibility",
    blocks: [
      { type: "h2", key: "accessibility.commitH" },
      { type: "p", key: "accessibility.commitP" },
      { type: "h2", key: "accessibility.measuresH" },
      { type: "ul", keys: ["accessibility.measures1", "accessibility.measures2", "accessibility.measures3", "accessibility.measures4"] },
      { type: "h2", key: "accessibility.feedbackH" },
      { type: "p", key: "accessibility.feedbackP" },
    ],
  },
} as const satisfies Record<string, LegalDoc>;

export type LegalDocId = keyof typeof LEGAL_DOCS;
