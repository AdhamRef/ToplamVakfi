/**
 * The fixed labels of the thank-you certificate sheet
 * (`ToplamVakfi-design/Toplum Vakfı Certificate.dc.html`): the meta captions,
 * the two signature lines and the seal's registry caption.
 *
 * The sheet is rendered without hooks  it is also the HTML the PDF renderer
 * prints (`lib/certificates/render.tsx`)  so these few words travel with it
 * instead of through next-intl. Everything a dashboard can edit (title, the
 * name lead, the body, the closing line, the organisation name) still arrives
 * through `ThanksCopy`.
 */
export interface CertSheetLabels {
  certNo: string;
  issueDate: string;
  director: string;
  stampSign: string;
  registry: string;
}

const LABELS: Record<"ar" | "en" | "tr" | "sq", CertSheetLabels> = {
  ar: { certNo: "رقم الشهادة", issueDate: "تاريخ الإصدار", director: "مدير المؤسسة", stampSign: "الختم والتوقيع", registry: "سجل رقم" },
  en: { certNo: "Certificate no.", issueDate: "Date of issue", director: "Director of the foundation", stampSign: "Seal and signature", registry: "Registry no." },
  tr: { certNo: "Belge no.", issueDate: "Düzenlenme tarihi", director: "Vakıf müdürü", stampSign: "Mühür ve imza", registry: "Sicil no." },
  sq: { certNo: "Nr. i certifikatës", issueDate: "Data e lëshimit", director: "Drejtori i fondacionit", stampSign: "Vula dhe nënshkrimi", registry: "Nr. i regjistrit" },
};

/** The labels for a sheet's language; an unknown language falls back by direction. */
export function certSheetLabels(locale: string | undefined, dir: "rtl" | "ltr"): CertSheetLabels {
  const code = (locale ?? "").slice(0, 2) as keyof typeof LABELS;
  return LABELS[code] ?? (dir === "rtl" ? LABELS.ar : LABELS.en);
}
