import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { slugFor } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import FaqPage from "@/components/minbar/foundation/FaqPage";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvFaq"] as const;

/** Same order as the accordion in `FaqPage`. */
const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvFaq" });
  return buildPageMetadata(locale, {
    title: t("title"),
    description: t("metaDescription"),
    path: `/${slugFor("faq", locale)}`,
  });
}

/** FAQ  `ToplamVakfi-design/Toplum Vakfı FAQ.dc.html`. */
export default async function Faq({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvFaq" });

  /* The questions and answers exactly as the page shows them. */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: QUESTIONS.map((key) => ({
      "@type": "Question",
      name: t(`${key}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`${key}.a`) },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\u003c") }} />
      <MinbarMessages locale={locale} namespaces={NAMESPACES}>
        <FaqPage />
      </MinbarMessages>
    </>
  );
}
