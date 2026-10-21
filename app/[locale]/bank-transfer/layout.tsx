import type { Metadata } from "next";
import { buildPageMetadata, LOCALE_SEO, type Locale } from "@/lib/seo";

/** One entry per public locale; the lookup still falls back to `en`. */
type PageSeo = { title: string; description: string };
const BANK_TRANSFER_SEO: { en: PageSeo } & Partial<Record<Locale, PageSeo>> = {
  ar: {
    title: "التبرع عبر التحويل البنكي — وقف التضامن الاجتماعي",
    description: "حسابات وقف التضامن الاجتماعي (Toplum Vakfı) البنكية في إسطنبول: حوّل تبرعك بأمان وارفع الإيصال لنطابقه ونرسل لك التأكيد.",
  },
  en: {
    title: "Donate by bank transfer — Toplumsal Dayanışma Vakfı",
    description: "Bank accounts of Toplum Vakfı in Istanbul: transfer your donation safely, upload the receipt, and we will match it and confirm by email.",
  },
  tr: {
    title: "Banka havalesi ile bağış — Toplumsal Dayanışma Vakfı",
    description: "Toplum Vakfı banka hesapları: bağışınızı güvenle havale edin, dekontu yükleyin; eşleştirip size e-postayla onaylayalım.",
  },
  sq: {
    title: "Dhuro me transfertë bankare — Toplumsal Dayanışma Vakfı",
    description: "Llogaritë bankare të Toplum Vakfı në Stamboll: transferoni dhurimin me siguri, ngarkoni faturën dhe ne do ta konfirmojmë me email.",
  },
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale in LOCALE_SEO ? rawLocale : "en") as Locale;
  const seo = BANK_TRANSFER_SEO[locale] ?? BANK_TRANSFER_SEO.en;

  return buildPageMetadata(locale, {
    title: seo.title,
    description: seo.description,
    path: "/bank-transfer",
    keywords: LOCALE_SEO[locale].keywords,
  });
}

export default function BankTransferLayout({ children }: Props) {
  return children;
}
