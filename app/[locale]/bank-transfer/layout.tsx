import type { Metadata } from "next";
import { buildPageMetadata, LOCALE_SEO, type Locale } from "@/lib/seo";

/**
 * Partial by design: the lookup below already falls back to `en`, and the
 * locales added with the Minbar port have no hand-written copy for this page
 * yet. A full `Record` would force placeholder text into 11 languages, which is
 * worse for search than the English fallback.
 */
type PageSeo = { title: string; description: string };
const BANK_TRANSFER_SEO: { en: PageSeo } & Partial<Record<Locale, PageSeo>> = {
  ar: {
    title: "التبرع عبر التحويل البنكي | مؤسسة منبر الأقصى الدولية",
    description: "اطّلع على حسابات مؤسسة منبر الأقصى الدولية البنكية وتبرع بأمان عبر التحويل البنكي لدعم المشاريع الإنسانية والطبية والتعليمية.",
  },
  en: {
    title: "Donate by Bank Transfer | ToplamVakfi",
    description: "View ToplamVakfi bank accounts and complete your donation safely by bank transfer to support humanitarian, medical, and educational projects.",
  },
  tr: {
    title: "Banka Havalesi ile Bağış | ToplamVakfi Derneği",
    description: "ToplamVakfi Derneği banka hesaplarını görüntüleyin ve insani, tıbbi ve eğitim projelerine güvenle havale yoluyla bağış yapın.",
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
