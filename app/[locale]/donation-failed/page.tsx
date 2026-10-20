"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Toaster, toast } from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  Wifi,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BankAccountsBlock from "../bank-transfer/_components/BankAccountsBlock";
import { restoreCheckoutAttempt } from "@/lib/minbar/cart";
import { miaPath } from "@/lib/minbar/routes";
import { CheckoutSteps } from "@/components/minbar/cart/CheckoutSteps";
import {
  resolvePaymentError,
  type PaymentErrorKey,
  type ResolvedPaymentError,
} from "@/lib/donations/payment-error-catalog";

// User-provided donation form. It is independent of the original checkout attempt.
const CHARITY_GIVING_IFRAME_URL = "https://charitygiving.net/iframe/eyJpdiI6IkxubFNEQnNnbU50R2V4dG5TeHg0dVE9PSIsInZhbHVlIjoiVkkwYkdUcnpwRHFsczd4dkRLY0Z2QT09IiwibWFjIjoiYjI5NTU5ZGZmZjdhMjllNTgwMzk2NTlhNTdlYzY3MjQwYWNiMjM1MzFmNjMxYjA1NTBmZGI4MDIxYTM4ODRjMyIsInRhZyI6IiJ9";

const CHARITY_GIVING_NOTICES: Record<string, string> = {
  "ar": "هذا نموذج تبرع عبر CharityGiving. إذا ظهر خصم سابق من حسابك، تحقّق من حالته قبل الدفع مجددًا.",
  "en": "This donation form is provided by CharityGiving. If a previous charge appears on your account, check its status before paying again.",
  "tr": "Bu bağış formu CharityGiving tarafından sağlanmaktadır. Hesabınızda önceki bir ödeme görünüyorsa yeniden ödeme yapmadan önce durumunu kontrol edin.",
  "fr": "Ce formulaire de don est fourni par CharityGiving. Si un débit précédent apparaît sur votre compte, vérifiez son statut avant de payer à nouveau.",
  "de": "Dieses Spendenformular wird von CharityGiving bereitgestellt. Falls eine frühere Abbuchung auf Ihrem Konto erscheint, prüfen Sie deren Status, bevor Sie erneut bezahlen.",
  "es": "Este formulario de donación es de CharityGiving. Si aparece un cargo anterior en su cuenta, compruebe su estado antes de volver a pagar.",
  "id": "Formulir donasi ini disediakan oleh CharityGiving. Jika ada tagihan sebelumnya di rekening Anda, periksa statusnya sebelum membayar lagi.",
  "pt": "Este formulário de donativo é fornecido pela CharityGiving. Se aparecer uma cobrança anterior na sua conta, verifique o estado antes de pagar novamente.",
  "ur": "یہ عطیہ فارم CharityGiving فراہم کرتا ہے۔ اگر آپ کے اکاؤنٹ سے پہلے رقم کٹی ہے تو دوبارہ ادائیگی سے پہلے اس کی حالت معلوم کریں۔",
  "sq": "Ky formular dhurimi ofrohet nga CharityGiving. Nëse në llogarinë tuaj shfaqet një pagesë e mëparshme, kontrolloni gjendjen e saj përpara se të paguani përsëri.",
  "it": "Questo modulo di donazione è fornito da CharityGiving. Se sul conto compare un addebito precedente, verificane lo stato prima di pagare di nuovo.",
  "nl": "Dit donatieformulier wordt aangeboden door CharityGiving. Als er een eerdere afschrijving op uw rekening staat, controleer dan de status voordat u opnieuw betaalt.",
  "sv": "Det här donationsformuläret tillhandahålls av CharityGiving. Om en tidigare debitering visas på ditt konto, kontrollera dess status innan du betalar igen.",
  "no": "Dette donasjonsskjemaet leveres av CharityGiving. Hvis en tidligere belastning vises på kontoen din, må du kontrollere statusen før du betaler på nytt.",
  "da": "Denne donationsformular leveres af CharityGiving. Hvis der vises en tidligere hævning på din konto, skal du kontrollere dens status, før du betaler igen.",
  "ms": "Borang sumbangan ini disediakan oleh CharityGiving. Jika terdapat caj terdahulu dalam akaun anda, semak statusnya sebelum membuat bayaran semula.",
  "ja": "この寄付フォームはCharityGivingが提供しています。口座に以前の請求が表示されている場合は、再度支払う前に状況を確認してください。",
  "zh": "此捐赠表单由 CharityGiving 提供。如果您的账户显示先前的扣款，请先核实其状态，再决定是否重新付款。",
  "hi": "यह दान फ़ॉर्म CharityGiving द्वारा प्रदान किया गया है। यदि आपके खाते में पहले की कोई कटौती दिखाई देती है, तो दोबारा भुगतान करने से पहले उसकी स्थिति जाँच लें।"
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  SAR: "ر.س",
  AED: "د.إ",
};

interface DonationDetails {
  id: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  provider?: string | null;
  paymentMethod?: string | null;
  providerProcReturnCode?: string | null;
  providerErrorMessage?: string | null;
  providerTxnResult?: string | null;
  subscriptionId?: string | null;
  items?: Array<{
    id: string;
    amount: number;
    campaign?: { title?: string };
  }>;
}

/** Icon picker per error key  visual cue that matches the explanation. */
const ERROR_ICONS: Record<PaymentErrorKey, typeof AlertCircle> = {
  insufficientFunds: WalletCards,
  cardDeclined: CreditCard,
  expiredCard: CreditCard,
  invalidCvc: ShieldCheck,
  incorrectNumber: CreditCard,
  lostOrStolen: AlertTriangle,
  doNotHonor: AlertCircle,
  limitExceeded: WalletCards,
  currencyNotSupported: AlertCircle,
  authenticationFailed: ShieldCheck,
  processingError: RefreshCw,
  networkError: Wifi,
  issuerUnavailable: Landmark,
  fraudSuspected: AlertTriangle,
  generic: HelpCircle,
};

export default function DonationFailedPage() {
  const t = useTranslations("DonationFailed");
  const tErrors = useTranslations("DonationFailed.errors");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const donationId = searchParams?.get("donationId") ?? "";

  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(donationId));
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!donationId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`/api/donations/${donationId}`);
        if (!cancelled) setDonation(res.data as DonationDetails);
      } catch (err) {
        console.error("Failed to load donation:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [donationId]);

  const resolved: ResolvedPaymentError = useMemo(
    () =>
      resolvePaymentError({
        providerProcReturnCode: donation?.providerProcReturnCode,
        providerErrorMessage: donation?.providerErrorMessage,
        providerTxnResult: donation?.providerTxnResult,
        provider: donation?.provider,
      }),
    [
      donation?.providerProcReturnCode,
      donation?.providerErrorMessage,
      donation?.providerTxnResult,
      donation?.provider,
    ]
  );

  const ErrorIcon = ERROR_ICONS[resolved.key];
  const isHard = resolved.severity === "hard";

  // Tips that are universal but order changes depending on retryability
  const fixTips: { key: string; label: string }[] = (() => {
    const allTips = [
      { key: "tipRetry", label: tErrors("commonTips.tipRetry") },
      { key: "tipCheckBalance", label: tErrors("commonTips.tipCheckBalance") },
      { key: "tipUseAnotherCard", label: tErrors("commonTips.tipUseAnotherCard") },
      { key: "tipContactBank", label: tErrors("commonTips.tipContactBank") },
      { key: "tipUseTransfer", label: tErrors("commonTips.tipUseTransfer") },
    ];
    if (isHard) {
      // Hard errors → push "use another card" / "use transfer" first.
      return [
        allTips[2], // another card
        allTips[3], // contact bank
        allTips[4], // bank transfer
        allTips[0], // retry
      ];
    }
    return allTips;
  })();

  // Pretty amount for the donation summary card
  const formattedAmount = donation
    ? `${CURRENCY_SYMBOLS[donation.currency] ?? donation.currency + " "}${donation.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : null;

  const isMonthly = Boolean(donation?.subscriptionId);

  const handleRetry = async () => {
    if (!donation || retrying) return;
    setRetrying(true);

    /* The 3-D Secure card rails (PayFor, Albaraka) take the card on our own
       checkout, so a retry is the same basket back on that form. Checkout kept
       the basket aside under this order before the bank redirect; putting it
       back sends the donor straight to the card fields, in their own currency.
       No clone is created here: it could never be charged from this page, and
       every one used to be left behind as an abandoned order. */
    const cardRail = ["PAYFOR", "ALBARAKA"].includes((donation.provider ?? "").toUpperCase());
    if (cardRail) {
      if (restoreCheckoutAttempt(donation.id)) {
        window.location.assign(miaPath("checkout", locale));
        return;
      }
      toast.success(t("retry.payforHint"));
      router.push("/campaigns");
      return;
    }

    // Monthly subscriptions can't be cloned  send the donor back to the
    // campaign page where the regular dialog handles the subscribe flow.
    if (isMonthly) {
      const firstCampaignId = donation.items?.[0]?.campaign ? null : null;
      // Fallback to /campaigns since we don't have the campaign id stored
      router.push("/campaigns");
      return;
    }

    try {
      const res = await axios.post(`/api/donations/${donation.id}/retry`);
      const newId = res.data?.id as string | undefined;
      if (!newId) throw new Error("retry returned no id");

      // Pick the next-step URL by provider. STRIPE → checkout session URL.
      // The 3D Secure rails (PAYFOR, ALBARAKA) start from a signed form that needs
      // card details, so there's nothing to redirect to  bounce those donors back
      // to the campaign dialog. Default to Stripe for everything else.
      const provider = (donation.provider ?? "STRIPE").toUpperCase();
      /* PayPal: a new PayPal order for the clone, built by the server from
         the stored amount, and straight back to PayPal. */
      if (provider === "PAYPAL" || res.data?.paymentMethod === "PAYPAL") {
        const order = await axios.post("/api/paypal/orders", {
          donationId: newId,
          locale,
          ...(res.data?.accessToken ? { t: res.data.accessToken } : {}),
        });
        const approveUrl = order.data?.approveUrl as string | undefined;
        if (!approveUrl) throw new Error("paypal returned no url");
        window.location.href = approveUrl;
        return;
      }
      // Stripe path  create a new Checkout Session and redirect.
      const checkout = await axios.post("/api/stripe/checkout", {
        donationId: newId,
        locale,
      });
      const url = checkout.data?.url as string | undefined;
      if (!url) throw new Error("stripe returned no url");
      window.location.href = url;
    } catch (err) {
      console.error("retry failed:", err);
      toast.error(t("retry.failed"));
      setRetrying(false);
    }
  };

  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    /* Toplum Vakfı payment error (`Payment Error.dc.html`): the page
       background, one white card with the error glyph in a pale red disc, the
       explanation and the way on; every block below is a white card in the
       same language. */
    <main className="min-h-screen bg-[#f4f8fb]" dir={isRtl ? "rtl" : "ltr"}>
      <Toaster position="top-center" />

      {/* ── The checkout bar: the payment step in red, "nothing was charged" ── */}
      <section className="gf-status-bar px-4 pt-[26px]">
        <CheckoutSteps
          id="fail-steps"
          maxWidth={768}
          steps={[
            { n: 1, label: t("steps.cart"), current: false, enabled: false, done: true },
            { n: 2, label: t("steps.pay"), current: true, enabled: false, error: true },
            { n: 3, label: t("steps.confirm"), current: false, enabled: false },
          ]}
          trailing={
            <>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {t("notCharged")}
            </>
          }
        />
      </section>

      {/* ── Hero: the design's white panel ── */}
      <section className="px-4 pt-5">
        <div className="max-w-3xl mx-auto rounded-[18px] border border-[#e6eef3] bg-white px-5 py-8 sm:p-[34px] text-center shadow-[0_16px_34px_rgba(2,52,88,.08)]">
          <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-[#fdeaea] text-[#d64545] mb-[18px]">
            <AlertCircle className="w-8 h-8" strokeWidth={2} />
          </div>
          <h1 className="text-[19px] font-extrabold text-[#062442] leading-snug mb-2.5">
            {t("title")}
          </h1>
          <p className="text-[#5d7187] text-[13.5px] max-w-xl mx-auto leading-[1.85]">
            {t("description")}
          </p>
          <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
            <a
              href="#donate-again"
              className="flex-1 min-w-[130px] inline-flex min-h-[44px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#1b6fe0_0%,#1ca3ec_72%,#27b8f2_100%)] px-[26px] py-[13px] text-[13.5px] font-extrabold text-white shadow-[0_8px_20px_rgba(0,162,224,.3)] transition-transform hover:-translate-y-0.5"
            >
              {t("alternate.cta")}
            </a>
            <a
              href={miaPath("contact", locale)}
              className="flex-1 min-w-[130px] inline-flex min-h-[44px] items-center justify-center rounded-full border-[1.5px] border-[#e2eaf0] px-[26px] py-[13px] text-[13.5px] font-extrabold text-[#5d7187] transition-transform hover:-translate-y-0.5"
            >
              {t("contactSupport")}
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* ───────────── Donate again: hosted card form ──────────────────── */}
        {/* A separate, hosted payment page that does not depend on the card
            rails that just failed  the first thing a donor sees, so trying
            again is one step, not a hunt through the advice below. */}
        <section
          id="donate-again"
          className="scroll-mt-28 rounded-[18px] border border-[#e6eef3] bg-white shadow-[0_12px_30px_rgba(2,52,88,.07)] overflow-hidden"
        >
          <div className="bg-[linear-gradient(120deg,#021428_0%,#082b50_60%,#04172e_100%)] px-5 py-5 sm:px-7 sm:py-6 text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00a2e0] px-3 py-0.5 text-[12px] font-extrabold text-[#031a36]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("alternate.badge")}
            </span>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-extrabold leading-tight">{t("alternate.title")}</h2>
            <p className="mt-1 text-sm text-[#b9d3e6] leading-relaxed">{t("alternate.description")}</p>
          </div>
          <iframe
            src="https://charitygiving.net/iframe/eyJpdiI6IkxubFNEQnNnbU50R2V4dG5TeHg0dVE9PSIsInZhbHVlIjoiVkkwYkdUcnpwRHFsczd4dkRLY0Z2QT09IiwibWFjIjoiYjI5NTU5ZGZmZjdhMjllNTgwMzk2NTlhNTdlYzY3MjQwYWNiMjM1MzFmNjMxYjA1NTBmZGI4MDIxYTM4ODRjMyIsInRhZyI6IiJ9"
            title={t("alternate.title")}
            allow="payment"
            className="block w-full border-0 bg-white"
            style={{ height: 760 }}
          />
        </section>

        {/* ───────────── Loading skeleton (waiting on donation fetch) ─────── */}
        {loading && (
          <Card className="p-6 flex items-center justify-center gap-3 rounded-2xl border-[#e6eef3] bg-white text-[#5d7187] shadow-[0_12px_28px_rgba(2,52,88,.07)]">
            <Loader2 className="w-5 h-5 animate-spin text-[#00a2e0]" />
            <span className="text-sm">{t("loading")}</span>
          </Card>
        )}

        {/* ───────────── Error explanation card ──────────────────────────── */}
        {!loading && (
          <Card
            className={`p-5 sm:p-7 rounded-2xl border bg-white shadow-[0_12px_28px_rgba(2,52,88,.07)] ${
              isHard ? "border-[#f3d2cc]" : "border-amber-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isHard ? "bg-[#fdeaea] text-[#d64545]" : "bg-amber-100 text-amber-700"
                }`}
              >
                <ErrorIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[12px] font-extrabold mb-1 ${
                    isHard ? "text-[#b3391f]" : "text-amber-700"
                  }`}
                >
                  {isHard ? t("severityHard") : t("severitySoft")}
                </p>
                <h2 className="text-xl sm:text-[22px] font-extrabold text-[#062442] leading-snug">
                  {tErrors(`${resolved.key}.title`)}
                </h2>
                <p className="text-sm sm:text-[15px] text-[#5d7187] mt-2 leading-[1.85]">
                  {tErrors(`${resolved.key}.reason`)}
                </p>
              </div>
            </div>

            {/* What to do  actionable steps */}
            <div className="mt-5 sm:mt-6 ps-0 sm:ps-16">
              <h3 className="text-[14px] font-extrabold text-[#062442] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t("howToFixTitle")}
              </h3>
              <p className="text-sm text-[#33495e] leading-[1.85] mb-3">
                {tErrors(`${resolved.key}.fix`)}
              </p>
              <ul className="space-y-2">
                {fixTips.map((tip, idx) => (
                  <li key={tip.key} className="flex items-start gap-2.5 text-sm text-[#33495e]">
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                        idx === 0
                          ? "bg-[#0077b3] text-white"
                          : "bg-[#eef4f8] text-[#5d7187]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Raw provider message  hidden by default to avoid scaring donors */}
            {donation?.providerErrorMessage && (
              <details className="mt-5 sm:mt-6 ps-0 sm:ps-16 group">
                <summary className="text-xs font-bold text-[#5d7187] hover:text-[#0077b3] cursor-pointer select-none inline-flex items-center gap-1.5 min-h-[44px]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {t("rawMessageToggle")}
                </summary>
                <div className="mt-2 p-3 rounded-[10px] bg-[#f4f8fb] border border-[#e2ebf1]">
                  <p className="text-xs text-gray-700 font-mono leading-relaxed break-words">
                    {donation.providerErrorMessage}
                  </p>
                  {donation.providerProcReturnCode && (
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      {t("rawCodeLabel")}:{" "}
                      <span className="font-mono">{donation.providerProcReturnCode}</span>
                    </p>
                  )}
                </div>
              </details>
            )}
          </Card>
        )}

        {/* Alternative donation form, also available from a message without a donationId. */}
        {!loading && donation?.status !== "PAID" && (
          <Card className="p-5 sm:p-7 rounded-2xl border border-[#e6eef3] bg-white shadow-[0_12px_28px_rgba(2,52,88,.07)]">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#062442] mb-3">
              {t("retry.title")} · CharityGiving
            </h2>
            <p className="text-sm text-[#5d7187] leading-[1.85] mb-5">
              {CHARITY_GIVING_NOTICES[locale] ?? CHARITY_GIVING_NOTICES.en}
            </p>
            <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[14px] border border-[#e6eef3]">
              <iframe
                src={CHARITY_GIVING_IFRAME_URL}
                title="CharityGiving"
                allow="payment"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                width="400"
                height="700"
                className="block w-full min-w-0 border-0"
              />
            </div>
            <div className="mt-4 text-center">
              <a
                href={CHARITY_GIVING_IFRAME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 text-[#0077b3] hover:text-[#00a2e0] text-sm font-extrabold underline underline-offset-4"
              >
                CharityGiving <Arrow className="w-4 h-4" />
              </a>
            </div>
          </Card>
        )}

        {/* ───────────── Donation summary + Retry ────────────────────────── */}
        {!loading && donation && (
          <Card className="p-5 sm:p-7 rounded-2xl border border-[#e6eef3] bg-white shadow-[0_12px_28px_rgba(2,52,88,.07)]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#eaf5fc] text-[#0077b3] flex items-center justify-center">
                <RefreshCw className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#062442]">{t("retry.title")}</h3>
            </div>
            <p className="text-sm text-[#5d7187] leading-[1.85] mb-5">{t("retry.description")}</p>

            {/* Mini donation receipt */}
            <div className="rounded-xl bg-[#f4f8fb] p-4 mb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#5d7187]">
                    {t("retry.amountLabel")}
                  </p>
                  <p className="text-2xl font-black text-[#062442] mt-0.5">
                    {formattedAmount}
                    {isMonthly && (
                      <span className="text-sm font-medium text-[#5d7187] ms-1.5">
                        {t("retry.perMonth")}
                      </span>
                    )}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#00a2e0]/35 text-[#062442] bg-[#eaf6fd] font-extrabold"
                >
                  {isMonthly ? t("retry.monthly") : t("retry.oneTime")}
                </Badge>
              </div>
              {donation.items && donation.items.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-[#e3edf4] space-y-1">
                  {donation.items.slice(0, 4).map((it) => (
                    <li
                      key={it.id}
                      className="text-xs sm:text-sm text-[#33495e] flex items-center gap-2 truncate"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e0] shrink-0" />
                      <span className="truncate">{it.campaign?.title ?? "—"}</span>
                    </li>
                  ))}
                  {donation.items.length > 4 && (
                    <li className="text-xs text-[#5d7187]">
                      {t("retry.moreItems", { count: donation.items.length - 4 })}
                    </li>
                  )}
                </ul>
              )}
            </div>

            <Button
              onClick={handleRetry}
              disabled={retrying}
              size="lg"
              className="w-full sm:w-auto min-h-[50px] rounded-full bg-[linear-gradient(90deg,#1b6fe0_0%,#1ca3ec_72%,#27b8f2_100%)] hover:brightness-105 text-white font-extrabold gap-2 px-7 shadow-[0_8px_20px_rgba(0,162,224,.3)]"
            >
              {retrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isMonthly ? t("retry.ctaMonthly") : t("retry.cta")}
              <Arrow className="w-4 h-4" />
            </Button>
            <p className="text-xs text-[#5d7187] mt-2.5">{t("retry.securedBy")}</p>
          </Card>
        )}

        {/* Even without a donationId, give the user a path forward */}
        {!loading && !donation && (
          <Card className="p-5 sm:p-7 text-center rounded-2xl border border-[#e6eef3] bg-white shadow-[0_12px_28px_rgba(2,52,88,.07)]">
            <h3 className="text-lg font-extrabold text-[#062442] mb-2">{t("noDonation.title")}</h3>
            <p className="text-sm text-[#5d7187] leading-[1.85] mb-5">{t("noDonation.description")}</p>
            <Link
              href="/campaigns"
              className="inline-flex min-h-[46px] items-center gap-2 bg-[linear-gradient(90deg,#1b6fe0_0%,#1ca3ec_72%,#27b8f2_100%)] text-white font-extrabold text-sm px-6 rounded-full shadow-[0_8px_20px_rgba(0,162,224,.3)] transition-transform hover:-translate-y-0.5"
            >
              {t("noDonation.cta")}
              <Arrow className="w-4 h-4" />
            </Link>
          </Card>
        )}
      </div>

      {/* ───────────────────────── Bank transfer fallback ──────────────── */}
      <div className="border-y border-[#d7ecf8] bg-[#eaf6fd]">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center">
          <p className="text-sm text-[#062442] font-bold flex items-center justify-center gap-2">
            <Landmark className="w-4 h-4 shrink-0 text-[#0077b3]" />
            {t("manualFallback")}
          </p>
        </div>
      </div>

      <BankAccountsBlock />
    </main>
  );
}
