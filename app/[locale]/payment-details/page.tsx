import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { miaPath, slugFor } from "@/lib/minbar/routes";
import { SUPPORTED_CURRENCY_OPTIONS } from "@/lib/supported-currencies";
import MinbarMessages from "@/components/minbar/MinbarMessages";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvPayment"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvPayment.details" });
  return buildPageMetadata(locale, {
    title: t("metaTitle"),
    description: t("intro"),
    path: `/${slugFor("paymentDetails", locale)}`,
  });
}

/**
 * Payment information  `ToplamVakfi-design/Toplum Vakfı Payment Details.dc.html`.
 *
 * A short static page: how a donation is paid, in which currencies, and how
 * the payment is protected. Every fact is the app's own: the three methods the
 * checkout offers (`components/minbar/checkout/CheckoutPage.tsx`  card,
 * bank transfer, PayPal) and the currencies of the public currency selector
 * (`lib/supported-currencies.ts`), named in the reader's language.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tvPayment.details" });

  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "currency" });
  } catch {
    names = null;
  }
  const currencies = SUPPORTED_CURRENCY_OPTIONS.map((c) => `${names?.of(c.code) ?? c.name} (${c.code})`);
  let list = currencies.join(", ");
  try {
    list = new Intl.ListFormat(locale, { style: "long", type: "disjunction" }).format(currencies);
  } catch {
    /* An engine without ListFormat keeps the plain join. */
  }

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <div className="gf-details">
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>

        <h2>{t("methodsHeading")}</h2>
        <div className="gf-details-chips">
          <span>{t("methodCard")}</span>
          <span>{t("methodBank")}</span>
          {/* A brand name  Latin in every language. */}
          <span>PayPal</span>
        </div>

        <h2>{t("currenciesHeading")}</h2>
        <p>{t("currenciesText", { list })}</p>

        <h2>{t("securityHeading")}</h2>
        <p>{t("securityText")}</p>

        <Link className="gf-details-back" href={miaPath("transparency", locale)}>
          {t("back")}
        </Link>
      </div>
    </MinbarMessages>
  );
}
