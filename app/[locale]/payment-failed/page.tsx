import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { miaPath } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import StatusScreen from "@/components/minbar/states/StatusScreen";
import { FailIcon } from "@/components/minbar/states/StatusIcons";
import { CheckoutSteps } from "@/components/minbar/cart/CheckoutSteps";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["system", "cart", "tvPayment"] as const;

/**
 * Payment failed  `ToplamVakfi-design/Toplum Vakfı Payment Error.dc.html`.
 *
 * The checkout bar with the payment step in red and the "nothing was charged"
 * cue, then one white panel: the glyph, what happened, and two exits  try
 * the payment again, or reach a human. A failed card is most often a
 * bank-side decline the donor can resolve, so retry leads.
 *
 * Never indexed: a status screen has no standalone meaning in search, and
 * `PRODUCTION_SEO_CONTRACT.md` lists the payment states as noindex.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const tv = await getTranslations({ locale, namespace: "tvPayment" });

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <StatusScreen
        tone="error"
        icon={FailIcon}
        title={tv("error.title")}
        lead={tv("error.lead")}
        primary={{ label: tv("error.retry"), href: miaPath("checkout", locale) }}
        secondary={{ label: tv("error.support"), href: miaPath("contact", locale) }}
        bar={
          <CheckoutSteps
            id="fail-steps"
            maxWidth={768}
            steps={[
              { n: 1, label: tv("checkout.stepCart"), current: false, enabled: false, done: true },
              { n: 2, label: tv("checkout.stepPay"), current: true, enabled: false, error: true },
              { n: 3, label: tv("checkout.stepConfirm"), current: false, enabled: false },
            ]}
            trailing={
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                {tv("error.badge")}
              </>
            }
          />
        }
      />
    </MinbarMessages>
  );
}
