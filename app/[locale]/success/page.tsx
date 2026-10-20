import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { miaPath } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import { CheckoutSteps } from "@/components/minbar/cart/CheckoutSteps";

interface Props {
  params: Promise<{ locale: string }>;
}

/** The page's own namespaces, on top of the shell bundle. */
const NAMESPACES = ["tvPayment"] as const;

/**
 * `/success` without a donation id  the generic form of
 * `ToplamVakfi-design/Toplum Vakfı Thank You.dc.html`.
 *
 * Every real confirmation lives at `/success/{id}`, where the receipt rows and
 * the certificate are the donation's own. This address is kept for tracking
 * links that name the bare path; with no donation behind it, it says thank you
 * and shows no figures at all (it used to show a made-up donor and amount).
 * Never indexed (`layout.tsx`).
 */
export default async function Page({ params }: Props) {
  const { locale } = await params;
  const tv = await getTranslations({ locale, namespace: "tvPayment" });

  return (
    <MinbarMessages locale={locale} namespaces={NAMESPACES}>
      <div className="succ-page gf-success">
        <CheckoutSteps
          id="succ-steps"
          maxWidth={768}
          steps={[
            { n: 1, label: tv("checkout.stepCart"), current: false, enabled: false, done: true },
            { n: 2, label: tv("checkout.stepPay"), current: false, enabled: false, done: true },
            { n: 3, label: tv("checkout.stepConfirm"), current: true, enabled: true, done: true },
          ]}
          trailing={
            <>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {tv("success.badge")}
            </>
          }
        />
        <div className="gf-success-panel">
          <span className="gf-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M4 12l5 5L20 6" />
            </svg>
          </span>
          <h1>{tv("success.title")}</h1>
          <p className="gf-success-lead">{tv("success.lead")}</p>
          <div className="gf-success-actions">
            <Link className="gf-btn-pill" href={miaPath("home", locale)}>
              {tv("success.home")}
            </Link>
            <Link className="gf-btn-pill is-outline" href={miaPath("projects", locale)}>
              {tv("success.browse")}
            </Link>
          </div>
        </div>
      </div>
    </MinbarMessages>
  );
}
