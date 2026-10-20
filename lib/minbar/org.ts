/**
 * The foundation's own published details.
 *
 * These are facts about a real, registered organisation  a licence number, a
 * street address, a phone line someone answers  so they live in one place and
 * are never retyped into a page. The Footer, the about page and the contact
 * page all read from here; if the foundation moves office, this file changes
 * and every page follows.
 *
 * Values carried verbatim from the Toplum Vakfı design (ToplamVakfi-design/).
 */
export const ORG = {
  /** Registered foundation name (ToplamVakfi-design, header and footer). */
  legalName: "Toplum Vakfı",
  /** Waqf registry number with the General Directorate of Foundations (Türkiye). */
  licenseNumber: "3673",
  /** Date of registration, as printed in the design's About and Transparency pages. */
  registeredOn: "03/11/1995",
  /** Year the foundation was established. */
  foundedYear: 1995,
  address: "Mimar Sinan Cd. No:38, Bağlar, 34209 Bağcılar / İstanbul",
  /** Google Maps search for {@link ORG.address}, as linked from the contact page. */
  mapUrl: "https://maps.google.com/?q=Mimar+Sinan+Cd.+No:38+Ba%C4%9Flar+Ba%C4%9Fc%C4%B1lar+Istanbul",
  email: "info@toplumsalvakfi.org",
  /** Display form. `whatsapp` below is the same line in dial format. */
  phone: "+90 212 582 79 70",
  whatsapp: "902125827970",
  /** The foundation's accounts, in the design footer's order. */
  social: {
    facebook: "https://www.facebook.com/ToplumvakfiAR",
    instagram: "https://www.instagram.com/toplumvakfi_ar/",
    x: "https://x.com/ToplumVakfi_ar",
    youtube: "https://www.youtube.com/@toplumvakfi",
  },
} as const;

/** `tel:` href for {@link ORG.phone}  spaces are not valid in a tel URI. */
export const ORG_TEL = `tel:${ORG.phone.replace(/\s/g, "")}`;

/** WhatsApp deep link for {@link ORG.whatsapp}. */
export const ORG_WHATSAPP = `https://wa.me/${ORG.whatsapp}`;
