"use client";

import { useQuietFloatingButtons } from "@/hooks/useQuietFloatingButtons";
import { digitsOnly } from "@/lib/minbar/numeric-input";
import { checkCardFields } from "@/lib/minbar/card-validation";

/** Server refusal codes (`app/api/albaraka/3d/initiate`) → `validation` messages. */
const CARD_ERROR_KEYS: Record<string, string> = {
  CARD_REQUIRED: "required",
  INVALID_CARD_NUMBER: "invalidCardNumber",
  INVALID_CARD_EXPIRY: "invalidCardExpiry",
  INVALID_CARD_CVC: "invalidCardCvc",
  TOO_MANY_ATTEMPTS: "tooManyPaymentAttempts",
};
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Elements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe-client";
import { StripePaymentStep, type StripePaymentHandle } from "@/components/StripePaymentStep";
import { miaPath } from "@/lib/minbar/routes";
import { CheckoutSteps, type CheckoutStep } from "@/components/minbar/cart/CheckoutSteps";
import { useMinbarCart } from "@/hooks/useMinbarCart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount, useHealLegacyRows } from "@/hooks/useDonationAmount";
import type { MinbarCartItem } from "@/lib/minbar/cart";
import { formatIban, type MinbarBank } from "@/lib/minbar/banks";
import {
  browserTimezone,
  chargeWithStripe,
  createDonation,
  initiateBankPayment,
  markDonationFailed,
  OrderRejectedError,
  orderSchedule,
  orderType,
  startPayPalPayment,
  submitGatewayForm,
  UnpayableItemsError,
  type CheckoutMethod,
} from "@/lib/minbar/checkout";
import { firstChargeAfterCheckout, frequencyOfOrderType, scheduleRuleFor } from "@/lib/donations/recurring-schedule";
import { withDonationToken } from "@/lib/donations/access-token-link";
import { clearCart, readTeamSupport, readTeamSupportRecurring, rememberCheckoutAttempt, restoreCheckoutAttempt, teamSupportIsRecurring } from "@/lib/minbar/cart";
import { fetchGlobalSettings } from "@/lib/global-settings-client";
import { useReferralCode } from "@/hooks/useReferralCode";
import { resolveGateway, type MainGateway } from "@/lib/payment-gateway";
import type { MinbarProject } from "@/lib/minbar/projects";
import type { MinbarCategoryTitle } from "@/lib/minbar/category-page";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

/**
 * Donor details and payment  ported from `Minbar/بيانات الدفع.dc.html`.
 *
 * Three payment paths: card, PayPal, and bank transfer.
 *
 * `[BACKEND-INTEGRATION]`, from the handoff and honoured here:
 *  - the cart is client-controlled and is never the basis for a charge. This
 *    form posts identifiers and the donor's details; the server re-resolves each
 *    project, recomputes the amount in its currency, and creates the order.
 *  - card details are not read or stored by this component beyond what the
 *    preview shows. The fields are the design's; wiring them to the gateway's
 *    hosted fields is the payment integration's job, and a real card number must
 *    never reach this origin.
 *  - PayPal: the order is created here as PENDING, the server creates a
 *    PayPal order from the stored amount (`/api/paypal/orders`) and the donor
 *    is redirected to PayPal. The server captures and verifies on return
 *    (`/api/paypal/return`); nothing is paid until that capture is COMPLETED.
 *    A recurring basket works the same way, and PayPal saves the wallet for
 *    the later instalments.
 *  - bank transfer creates the order and nothing to pay: the donor copies an
 *    IBAN, transfers outside the site, and uploads a receipt on the next page.
 *    A finance officer moves it to Confirmed (`DONATION_LOGIC_SPEC §3`), and
 *    only then is it counted or a certificate issued.
 *
 * `[AUTH-INTEGRATION]`: the Google and Facebook buttons sign the donor in and
 * pre-fill their name and email.
 */

type PaymentMethod = "card" | "paypal" | "bank";

export interface CheckoutPageProps {
  projects: MinbarProject[];
  /** Every published campaign's slugs in all languages → id (see `listProjectSlugAliases`). */
  projectAliases?: Record<string, string>;
  categories: MinbarCategoryTitle[];
  banks: readonly MinbarBank[];
  donor: { firstName: string; lastName: string; email: string; phone: string } | null;
  /** ISO 3166-1 alpha-2, lower case  the phone field's starting flag. */
  defaultCountry: string;
}

export default function CheckoutPage({ projects, projectAliases, categories, banks, donor, defaultCountry }: CheckoutPageProps) {
  useQuietFloatingButtons();
  const locale = useLocale();
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tv = useTranslations("tvPayment.checkout");
  const tValidation = useTranslations("validation");
  const tSystem = useTranslations("system");
  const { format, formatLocal } = useMinbarMoney();
  const { lineValue, lineTooSmall, minLabel, inLocal } = useDonationAmount();
  const tGive = useTranslations("CardGive");
  const { items, hydrated, replace } = useMinbarCart();
  useHealLegacyRows(items, replace, hydrated);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [firstName, setFirstName] = useState(donor?.firstName ?? "");
  const [lastName, setLastName] = useState(donor?.lastName ?? "");
  const [email, setEmail] = useState(donor?.email ?? "");
  const [phone, setPhone] = useState(donor?.phone ?? "");
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [copied, setCopied] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  /* "Donate with 3D (optional)": off by default, so a one-time card gift runs
     in 2D on Stripe. Ticked, it runs on PayFor's 3D Secure page, and a decline
     there brings the donor back here (`?fallback=<order>`) with the same
     basket to finish on Stripe. `fellBackFrom3d` is that return trip. */
  const [secure3d, setSecure3d] = useState(false);
  const [fellBackFrom3d, setFellBackFrom3d] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const failedOrder = params.get("fallback");
    if (!failedOrder) return;
    restoreCheckoutAttempt(failedOrder);
    setFellBackFrom3d(true);
    // A reload must not restore the basket a second time.
    params.delete("fallback");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  /* Stripe's own card fields, when Stripe is the rail. The card never touches
     this origin: the step confirms the intent in the browser, and the handle
     is what the submit calls. `stripeReady` gates the button the way the raw
     fields gate the bank rails. */
  const stripeRef = useRef<StripePaymentHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const onStripeReady = useCallback((ready: boolean) => setStripeReady(ready), []);
  const tRecurring = useTranslations("Recurring");
  const tTeam = useTranslations("TeamSupport");

  /* The "support the team" amount chosen in the basket. Read after mount:
     storage is not known to the server render. Zeroed when the admin has
     switched the step off, so the summary matches what will be charged. */
  const [teamSupport, setTeamSupport] = useState(0);
  const [teamSupportEnabled, setTeamSupportEnabled] = useState(true);
  const [teamRecurringChoice, setTeamRecurringChoice] = useState<boolean | null>(null);
  useEffect(() => {
    setTeamSupport(readTeamSupport());
    setTeamRecurringChoice(readTeamSupportRecurring());
  }, []);
  const teamRecurring = teamSupportIsRecurring(items, teamRecurringChoice);

  const router = useRouter();
  const { data: session } = useSession();
  const { currency } = useMinbarMoney();
  /* Whoever sent this donor here, if a campaign link set the cookie. Read at
     submit time so the attribution is the one in force when they gave. */
  const readReferralCode = useReferralCode();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Which rail this order runs on is the server's decision, not the browser's:
     it follows the currency and the admin switches. Fetched once so the card
     step knows whether the bank collects the card on its own page. */
  const [gatewayConfig, setGatewayConfig] = useState<{
    /* PayFor is never a *main* gateway an admin nominates  it is resolved per
       order, from the currency and the admin switch. */
    mainGateway: MainGateway;
    payforEnabled: boolean;
    albarakaUseOOS: boolean;
    albarakaConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    let live = true;
    fetchGlobalSettings()
      .then((settings) => {
        if (!live || !settings) return;
        setTeamSupportEnabled(settings.teamSupportEnabled);
        setGatewayConfig({
          mainGateway: settings.mainGateway,
          payforEnabled: settings.payforEnabled,
          albarakaUseOOS: settings.albarakaUseOOS,
          albarakaConfigured: settings.albarakaConfigured,
        });
      })
      .catch(() => {
        /* The order can still be created; the rail resolves to the default. */
      });
    return () => {
      live = false;
    };
  }, []);

  const titleBySlug = useMemo(() => new Map(projects.map((p) => [p.slug, p.title])), [projects]);
  const categoryTitleById = useMemo(() => new Map(categories.map((c) => [c.id, c.title])), [categories]);

  const resolveTitle = (item: MinbarCartItem): string => {
    if (item.projectId) {
      const fromCms = titleBySlug.get(item.projectId);
      if (fromCms) return fromCms;
    }
    if (item.categoryId) {
      const fromCms = categoryTitleById.get(item.categoryId);
      if (fromCms) return fromCms;
    }
    if (item.titleKey) {
      if (t.has(item.titleKey)) return t(item.titleKey);
      if (tCommon.has(item.titleKey)) return tCommon(item.titleKey);
    }
    return item.title ?? "";
  };

  const teamSupportCharged = teamSupportEnabled && teamSupport > 0 ? teamSupport : 0;
  /* The total as it will be charged, in the donor's currency: a line given in
     that currency counts as given (1 TL is 1 TL), the rest and the team
     support are converted from USD  the same rule the server charges by. */
  const totalUsd = items.reduce((sum, item) => sum + item.amount, 0) + teamSupportCharged;
  const totalLabel = inLocal
    ? formatLocal(items.reduce((sum, item) => sum + lineValue(item), 0) + lineValue({ amount: teamSupportCharged }))
    : format(totalUsd);
  /* With the $1 floor on, a line under it cannot be paid for; the basket is
     where it is raised. */
  const belowMinimum = items.some(lineTooSmall);
  /* One type for the whole order  `ONE_TIME`, or the plan's cadence; the
     cart page does not let cadences mix. The same function builds the order,
     so what is previewed here is what is sent. */
  const orderTypeForCart = orderType(items);
  const planFrequency = frequencyOfOrderType(orderTypeForCart);

  /* When the plan will charge  shown before the donor confirms, computed
     the way the server computes it: the same rule from the donor's chosen
     day and time, in the browser's zone. Set in an effect: the date depends
     on "now", which the server render cannot share. */
  const schedule = orderSchedule(items);
  const scheduleKey = schedule ? `${schedule.dayOfMonth ?? ""}@${schedule.hour}:${schedule.minute}` : "";
  const [nextChargeText, setNextChargeText] = useState<string | null>(null);
  useEffect(() => {
    if (!planFrequency) {
      setNextChargeText(null);
      return;
    }
    const tz = browserTimezone();
    const now = new Date();
    const next = firstChargeAfterCheckout(scheduleRuleFor(planFrequency, now, tz, schedule ?? null), now, tz);
    try {
      setNextChargeText(new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(next));
    } catch {
      setNextChargeText(next.toISOString().slice(0, 16).replace("T", " "));
    }
    // `schedule` is a fresh object each render; `scheduleKey` is its value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFrequency, locale, scheduleKey]);

  /* The rail this basket will run on, resolved the same way the server resolves
     it, so the card step can render what that rail actually needs. Before the
     settings arrive this is Stripe, which collects the card on our page  the
     same thing the design shows, so nothing flickers. */
  /* 3D is offered only when every line is one-time: a plan is charged again
     later without the donor present, so it always runs in 2D on Stripe. */
  const secure3dOffered = method === "card" && orderTypeForCart === "ONE_TIME" && (gatewayConfig?.payforEnabled ?? true);
  const gateway = resolveGateway({
    mainGateway: gatewayConfig?.mainGateway ?? "STRIPE",
    payforEnabled: gatewayConfig?.payforEnabled ?? true,
    currency,
    donationType: orderTypeForCart,
    secure3d: secure3dOffered && secure3d,
  });

  /* Albaraka in Ortak Ödeme Sayfası mode collects the card on the bank's own
     page. Asking for it here too would make the donor type it twice, and the
     copy we'd send is discarded  so the card fields are replaced by a line
     saying where the card is entered.

     Not for a plan: the scheduler charges the card the donor authorised, so it
     has to pass through this origin to be stored. A recurring basket always
     collects the card here, whatever the OOS switch says. */
  const bankCollectsCard = gateway === "ALBARAKA" && gatewayConfig?.albarakaUseOOS === true && !planFrequency;

  /* Albaraka signs everything with ALBARAKA_ENC_KEY. Without it the initiate
     route refuses, and the donor would only find out after an order had been
     created and failed. Hide the rail instead. */
  const cardRailUnavailable =
    gateway === "ALBARAKA" && gatewayConfig !== null && !gatewayConfig.albarakaConfigured;

  /* A card we never collect can't be validated, and the bank rails need one. */
  const needsOwnCardForm = !bankCollectsCard && !cardRailUnavailable;
  const selectedBank = banks.find((b) => b.id === bankId) ?? banks[0];

  /* A transfer is one act by the donor; nothing can be charged again next
     month. A recurring basket therefore has no bank option, and if the donor
     had it selected before the basket changed, the choice falls back to card. */
  const bankAvailable = orderTypeForCart === "ONE_TIME" && banks.length > 0;
  useEffect(() => {
    if (method === "bank" && !bankAvailable && hydrated) setMethod("card");
  }, [method, bankAvailable, hydrated]);

  /* Which IBAN the donor will send to. Defaults to the one in the currency
     they are browsing in, since that is the amount they were quoted. */
  const [bankCurrency, setBankCurrency] = useState<string | null>(null);
  const bankCurrencies = selectedBank?.currencies ?? [];
  const chosenBankCurrency =
    bankCurrencies.find((c) => c.code === bankCurrency)?.code ??
    bankCurrencies.find((c) => c.code === currency)?.code ??
    bankCurrencies[0]?.code ??
    null;

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      // Clipboard access can be denied; the value is on screen and selectable.
    }
  };

  /**
   * Create the donation, then hand the donor to whichever rail the server's
   * settings select.
   *
   * Bank transfer is the exception and creates nothing to pay: the donor copies
   * an IBAN, transfers outside the site and uploads a receipt, and a finance
   * officer confirms it (`DONATION_LOGIC_SPEC §3`). The order is still recorded
   * so there is something for them to match the money against, and the donor
   * lands on the "awaiting confirmation" screen rather than on success.
   */
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !items.length) return;
    if (belowMinimum) {
      setError(tGive("belowMinCheckout", { amount: minLabel }));
      return;
    }

    const signedIn = Boolean(session?.user);
    const phoneDigits = digitsOnly(phone);
    if (!signedIn && (!firstName.trim() || !email.trim() || phoneDigits.length < 7)) {
      setError(tValidation("required"));
      return;
    }

    /* Guard the card rail before an order exists. Creating a donation we then
       can't charge leaves a FAILED row behind for no reason. */
    if (method === "card") {
      if (cardRailUnavailable) {
        setError(tSystem("techErrorLead"));
        return;
      }
      if (gateway === "STRIPE") {
        if (!stripeReady || !stripeRef.current) {
          setError(tRecurring("stripeNotReady"));
          return;
        }
      } else if (needsOwnCardForm && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim())) {
        setError(tValidation("required"));
        return;
      } else if (needsOwnCardForm) {
        // Caught here, before the order exists, so a typo leaves no FAILED row.
        const cardError = checkCardFields(cardNumber, cardExpiry, cardCvc);
        if (cardError) {
          setError(tValidation(cardError));
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    const methodForServer: CheckoutMethod =
      method === "bank" ? "BANK_TRANSFER" : method === "paypal" ? "PAYPAL" : "CARD";

    /* A signed-in donor's number goes on their account, so the next checkout
       starts with it filled in. Best effort: the order does not wait on it. */
    // A bare dial code ("+90") is the empty field, not a number to save.
    if (signedIn && phone.replace(/\D/g, "").length >= 7 && phone.trim() !== donor?.phone) {
      void fetch("/api/users/me/phone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phone.trim() }) }).catch(() => undefined);
    }

    let donationId: string | null = null;
    try {
      const donation = await createDonation({
        items,
        projects,
        projectAliases,
        currency,
        locale,
        method: methodForServer,
        teamSupport: teamSupportCharged,
        teamSupportRecurring: teamRecurring,
        referralCode: readReferralCode(),
        bank:
          method === "bank" && selectedBank
            ? { slug: selectedBank.id, currency: chosenBankCurrency ?? currency }
            : null,
        /* Sent for a signed-in donor too: the server uses it to fill the gaps
           in their own profile (an imported account often lacks a phone). */
        guest: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() },
      });
      donationId = donation.id;

      if (method === "bank") {
        /* Nothing is charged. The basket is cleared because the order exists,
           and the donor goes to the page where they upload the receipt and
           follow the finance review. Guests are let in by the token. */
        clearCart();
        const pending = miaPath("paymentPending", locale, donation.id);
        router.push(donation.bankTransferToken ? `${pending}?t=${donation.bankTransferToken}` : pending);
        return;
      }

      if (method === "paypal") {
        /* The server builds the PayPal order from the donation row and hands
           back PayPal's approval page. The basket is cleared first, as for
           the bank rails: the order exists, and a donor coming back from
           PayPal must not find it ready to be paid again. */
        const approveUrl = await startPayPalPayment(donation.id, locale, donation.accessToken);
        rememberCheckoutAttempt(donation.id);
        clearCart();
        window.location.assign(approveUrl);
        return;
      }

      if (gateway === "STRIPE") {
        /* The route returns the secret; the browser confirms it with the card
           it collected, so the number never reaches this origin. Until this
           step existed the intent was created and never confirmed: nothing
           was charged, and the donor was sent to "success" regardless. */
        const charge = await chargeWithStripe(donation.id, locale);
        const handle = stripeRef.current;
        if (!handle) throw new Error("stripe-not-ready");
        const result = await handle.confirmPayment(charge.clientSecret);
        if (result.error) {
          await markDonationFailed(donation.id, result.error.message ?? "stripe_confirm_failed");
          setError(result.error.message ?? tSystem("techErrorLead"));
          setSubmitting(false);
          return;
        }
        clearCart();
        router.push(withDonationToken(`${miaPath("donationSuccess", locale)}/${donation.id}`, donation.accessToken));
        return;
      }

      /* A bank rail. Albaraka signs the card into its request MAC, so its card
         values go to the server; PayFor leaves them out of the hash, so the
         browser appends them and the number never reaches this origin. */
      const [expiryMonth = "", expiryYear = ""] = cardExpiry.split("/");
      /* In OOS mode the card fields go to the bank empty and its hosted page
         fills them; sending anything here would sign values the donor never
         confirmed. */
      const sendCardToServer = gateway === "ALBARAKA" && !bankCollectsCard;

      const form = await initiateBankPayment(
        donation.id,
        locale,
        gateway,
        sendCardToServer
          ? {
              number: cardNumber.replace(/\D/g, ""),
              expiry: cardExpiry,
              cvv: cardCvc,
              holder: cardName,
            }
          : undefined,
        { fallbackToStripe: gateway === "PAYFOR" }
      );

      const browserFields: Record<string, string> =
        gateway === "PAYFOR"
          ? {
              Pan: cardNumber.replace(/\D/g, ""),
              Expiry: `${expiryMonth}${expiryYear}`,
              Cvv2: cardCvc,
              CardHolderName: cardName,
            }
          : {};

      /* The basket is cleared before the redirect: the order now exists on the
         server, and a donor returning from the bank must not find it still
         sitting in their basket ready to be paid twice. */
      /* Kept aside under this order, so a declined donor can retry the same
         basket from the failure page. */
      rememberCheckoutAttempt(donation.id);
      clearCart();
      submitGatewayForm(form, browserFields);
    } catch (cause) {
      if (donationId) await markDonationFailed(donationId, String(cause));
      console.error("[checkout] could not complete the donation:", cause);
      /* Say what actually went wrong. Every failure used to read "we are
         fixing the problem", which hid both a basket the order cannot carry
         and the server's own reason for refusing it. */
      const knownCode = cause instanceof OrderRejectedError ? CARD_ERROR_KEYS[cause.code ?? ""] : undefined;
      if (cause instanceof UnpayableItemsError) {
        setError(t("itemsUnavailable", { items: cause.items.map(resolveTitle).join("، ") }));
      } else if (knownCode) {
        // The server's reason, in the donor's language rather than its English text.
        setError(tValidation(knownCode));
      } else if (cause instanceof OrderRejectedError && cause.status >= 400 && cause.status < 500 && cause.message !== "order-failed" && cause.message !== "gateway-failed") {
        setError(cause.message);
      } else {
        setError(tSystem("techErrorLead"));
      }
      setSubmitting(false);
    }
  };

  /* Confirmation is the page after paying, so stepping to it submits the form
     exactly as the pay button does. It is offered only once nothing the
     submit handler checks would stop it. */
  const detailsComplete =
    Boolean(session?.user) || (firstName.trim() !== "" && email.trim() !== "" && digitsOnly(phone).length >= 7);
  const paymentComplete =
    method !== "card" ||
    (!cardRailUnavailable &&
      (gateway === "STRIPE"
        ? stripeReady
        : !needsOwnCardForm || checkCardFields(cardNumber, cardExpiry, cardCvc) === null));
  const canConfirm = hydrated && items.length > 0 && !belowMinimum && !submitting && detailsComplete && paymentComplete;
  const steps: CheckoutStep[] = [
    { n: 1, label: tv("stepCart"), href: miaPath("cart", locale), current: false, enabled: true },
    { n: 2, label: tv("stepPay"), current: true, enabled: true },
    { n: 3, label: tv("stepConfirm"), current: false, enabled: canConfirm, onSelect: () => formRef.current?.requestSubmit() },
  ];

  const methods: ReadonlyArray<{ id: PaymentMethod; label: string; hint: string; icon: React.ReactElement }> = [
    {
      id: "card",
      label: tv("methodCard"),
      // Card scheme names  Latin in every language.
      hint: "Visa · Mastercard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="M2.5 9.5h19" />
        </svg>
      ),
    },
    {
      id: "paypal",
      // A brand name  Latin in every language.
      label: "PayPal",
      hint: tv("methodPaypalHint"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M7 20l2-14h5.5a3.5 3.5 0 0 1 0 7H9.5" />
        </svg>
      ),
    },
    {
      id: "bank",
      label: tv("methodBank"),
      hint: tv("methodBankHint"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10M12 3 21 8H3Z" />
        </svg>
      ),
    },
  ];
  const shownMethods = methods.filter((m) => m.id !== "bank" || bankAvailable);

  /* The live card preview (`.cc-face`) for the rails whose fields are ours:
     the number in groups of four, the brand from its first digits. */
  const cardDigits = cardNumber.replace(/\D/g, "").slice(0, 16);
  const cardBrand = /^4/.test(cardDigits)
    ? "VISA"
    : /^(5[1-5]|2[2-7])/.test(cardDigits)
      ? "MASTERCARD"
      : /^9792/.test(cardDigits)
        ? "TROY"
        : tv("ccBrand");
  const cardMasked = (cardDigits + "••••••••••••••••".slice(cardDigits.length)).replace(/(.{4})/g, "$1 ").trim();
  const holderShown = cardName.trim() || `${firstName} ${lastName}`.trim() || tv("ccNamePlaceholder");

  return (
    /* Toplum Vakfı payment step (`Payment Info.dc.html`): the checkout bar
       (steps + security cue), then one column of white panels  donor, then
       method with its view, the trust strip and the confirm button. The
       design drops the summary panel here ("the cart already shows it"); the
       amount rides on the button, and a plan's schedule sits above it. */
    <div className="gf-checkout">
      <div className="gf-ck-wrap">
        <CheckoutSteps
          id="pay-steps"
          steps={steps}
          maxWidth={760}
          trailing={
            <>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {tv("secureBadge")}
            </>
          }
        />

        <form ref={formRef} className="pay-form gf-ck-stack" onSubmit={onSubmit} noValidate>
          {/* ── Donor details ──────────────────────────────────────────── */}
          <div className="gf-panel">
            <h2>{tv("donorHeading")}</h2>

            {!donor ? (
              <div className="gf-ck-social">
                <button type="button" onClick={() => signIn("google")} className="pay-social-btn">
                  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
                    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
                    <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z" />
                    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
                  </svg>
                  Google
                </button>
                {/* Facebook sign-in is disabled for now.
                <button type="button" onClick={() => signIn("facebook")} className="pay-social-btn pay-social-btn--fb">Facebook</button>
                */}
                <small>{t("socialAutofillNote")}</small>
                <span className="gf-ck-or">{t("orFillManually")}</span>
              </div>
            ) : null}

            <div className="gf-field-row">
              <label className="gf-field">
                <span>{t("firstName")}</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className="pay-field" />
              </label>
              <label className="gf-field">
                <span>{t("lastName")}</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className="pay-field" />
              </label>
            </div>
            <div className="gf-field-row gf-field-row--phone">
              <label className="gf-field">
                <span>
                  {t("email")} <b aria-hidden="true">*</b>
                </span>
                {/* Latin-script data: isolated so bidi cannot reorder it. */}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" placeholder="name@example.com" className="pay-field" />
              </label>
              <label className="gf-field">
                <span>
                  {t("phone")} <b aria-hidden="true">*</b>
                </span>
                {/* Country picker with every flag; the default flag is the
                    account's country, else where the visit came from. The
                    value is E.164, so it is usable as stored. */}
                <div className="phone-input-wrapper pay-phone" dir="ltr">
                  <PhoneInput
                    defaultCountry={defaultCountry}
                    value={phone}
                    onChange={(value) => setPhone(value)}
                    forceDialCode
                    inputProps={{ required: true, autoComplete: "tel", name: "phone" }}
                    className="pay-phone-field"
                    inputClassName="pay-phone-input"
                    countrySelectorStyleProps={{ buttonClassName: "pay-phone-country", dropdownStyleProps: { className: "pay-phone-dropdown" } }}
                  />
                </div>
              </label>
            </div>

            {donor ? <span className="gf-ck-filled">{t("socialAutofillNote")}</span> : null}
            <p className="gf-donor-note">{tv("donorNote")}</p>
          </div>

          {/* ── Payment method ─────────────────────────────────────────── */}
          <div className="gf-panel">
            <h2>{tv("methodHeading")}</h2>

            {fellBackFrom3d ? (
              <p role="status" className="gf-3d-fallback">
                {InfoGlyph}
                <span>{tv("secure3dFallback")}</span>
              </p>
            ) : null}

            {/* The design's tiles (`.pay-option`): icon box over the name and
                its hint, the picked tile outlined in blue with a corner check. */}
            <div id="pay-methods" className="gf-pay-options" role="radiogroup" aria-label={tv("methodHeading")} style={{ gridTemplateColumns: `repeat(${shownMethods.length}, minmax(0, 1fr))` }}>
              {shownMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  data-pick={method === m.id ? "1" : ""}
                  onClick={() => setMethod(m.id)}
                  className="pay-method gf-pay-option"
                >
                  <span aria-hidden="true" className="pay-method-icon gf-po-icon">
                    {m.icon}
                  </span>
                  <span className="gf-po-body">
                    <b>{m.label}</b>
                    <i>{m.hint}</i>
                  </span>
                </button>
              ))}
            </div>

            {method === "bank" && selectedBank ? (
              <div className="gf-pay-view">
                <div className="gf-bank-box">
                  <b>{t("bankHeading")}</b>
                  <label className="gf-field">
                    <span>{t("bank")}</span>
                    <select value={bankId} onChange={(e) => setBankId(e.target.value)} className="pay-field">
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="gf-bank-id">
                    {selectedBank.logo ? <img src={selectedBank.logo} alt="" /> : null}
                    <span>
                      <b>{selectedBank.name}</b>
                      <small>
                        {t("acceptedCurrencies")}: {selectedBank.currencies.map((c) => c.code).join(" · ")}
                      </small>
                    </span>
                  </div>

                  {bankCurrencies.length > 1 ? (
                    <div role="radiogroup" aria-label={t("acceptedCurrencies")} className="gf-bank-currencies">
                      {bankCurrencies.map((c) => {
                        const active = c.code === chosenBankCurrency;
                        return (
                          <button key={c.code} type="button" role="radio" aria-checked={active} data-on={active ? "1" : undefined} onClick={() => setBankCurrency(c.code)}>
                            {c.code}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {[
                    { key: `${selectedBank.id}:holder`, label: t("accountName"), value: selectedBank.holder, latin: false, dim: false },
                    { key: `${selectedBank.id}:swift`, label: "SWIFT / BIC", value: selectedBank.swift, latin: true, dim: false },
                    ...selectedBank.currencies.map((c) => ({
                      key: `${selectedBank.id}:iban:${c.code}`,
                      label: `IBAN · ${c.code}`,
                      value: formatIban(c.iban),
                      latin: true,
                      /* The IBANs the donor did not pick stay visible but step
                         back, so the one to copy is unmistakable. */
                      dim: bankCurrencies.length > 1 && c.code !== chosenBankCurrency,
                    })),
                  ].map((row) => (
                    <span key={row.key} className="gf-bank-row" data-dim={row.dim ? "1" : undefined} data-iban={row.key.includes(":iban:") ? "1" : undefined}>
                      <span>
                        <small>{row.label}</small>
                        {/* An identifier is the one place break-all is allowed. */}
                        <b dir={row.latin ? "ltr" : undefined}>{row.value}</b>
                      </span>
                      <button type="button" onClick={() => copy(row.key, row.value.replace(/\s/g, ""))} aria-label={tCommon("share")} className="pay-copy-btn" data-copied={copied === row.key ? "1" : undefined}>
                        {copied === row.key ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path d="M5 15V5a2 2 0 0 1 2-2h8" />
                          </svg>
                        )}
                      </button>
                    </span>
                  ))}

                  <p>{tv("bankReviewNote")}</p>
                </div>
              </div>
            ) : null}

            {method === "card" && !needsOwnCardForm ? (
              <div className="gf-pay-view">
                <div className="gf-redirect-note" data-error={cardRailUnavailable ? "1" : undefined}>
                  {InfoGlyph}
                  <span>{cardRailUnavailable ? t("cardUnavailable") : t("cardOnBankPage")}</span>
                </div>
              </div>
            ) : null}

            {method === "card" && needsOwnCardForm && gateway === "STRIPE" ? (
              /* Stripe's hosted card fields. The number, expiry and CVC are
                 iframes owned by Stripe; this page sees only "complete". */
              <div className="gf-pay-view">
                <div className="pay-stripe gf-stripe">
                  <Elements stripe={getStripePromise()}>
                    <StripePaymentStep ref={stripeRef} onReadyChange={onStripeReady} labelClass="block text-[12.5px] font-extrabold text-[var(--ink)] mb-1" />
                  </Elements>
                </div>
              </div>
            ) : null}

            {method === "card" && needsOwnCardForm && gateway !== "STRIPE" ? (
              <div className="gf-pay-view">
                {/* The live card, mirroring the fields as they are typed.
                    Latin-script data: always LTR. */}
                <div className="gf-cc" aria-hidden="true">
                  <div className="gf-cc-face" dir="ltr">
                    <div className="gf-cc-top">
                      <span className="gf-cc-chip" />
                      <span className="gf-cc-brand">{cardBrand}</span>
                    </div>
                    <div className="gf-cc-number">{cardMasked}</div>
                    <div className="gf-cc-bottom">
                      <span>
                        <i>{tv("ccHolder")}</i>
                        <b>{holderShown}</b>
                      </span>
                      <span>
                        <i>{tv("ccExpires")}</i>
                        <b>{cardExpiry || "MM/YY"}</b>
                      </span>
                    </div>
                  </div>
                </div>
                <label className="gf-field">
                  <span>{tv("cardName")}</span>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name" placeholder={tv("ccNamePlaceholder")} className="pay-field" />
                </label>
                <label className="gf-field">
                  <span>{t("cardNumber")}</span>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(digitsOnly(e.target.value, 19))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    dir="ltr"
                    placeholder="0000 0000 0000 0000"
                    className="pay-field"
                  />
                </label>
                <div className="gf-field-row gf-field-row--keep">
                  <label className="gf-field">
                    <span>{t("cardExpiry")}</span>
                    <input
                      id="cardExpiry"
                      value={cardExpiry}
                      onChange={(e) => {
                        const digits = digitsOnly(e.target.value, 4);
                        setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                      }}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      dir="ltr"
                      placeholder="MM/YY"
                      className="pay-field"
                    />
                  </label>
                  <label className="gf-field">
                    <span>CVC</span>
                    <input
                      value={cardCvc}
                      onChange={(e) => setCardCvc(digitsOnly(e.target.value, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      dir="ltr"
                      placeholder="123"
                      className="pay-field"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {method === "paypal" ? (
              <div className="gf-pay-view">
                <div className="gf-redirect-note">
                  {InfoGlyph}
                  <span>{tv("paypalNote")}</span>
                </div>
              </div>
            ) : null}

            {/* Nothing to pay for: the design sends the donor back to the basket. */}
            {hydrated && !items.length ? (
              <p className="gf-ck-empty">
                {t("emptyCart")}{" "}
                <Link href={miaPath("cart", locale)}>{t("backToCart")}</Link>
              </p>
            ) : null}

            {/* What the plan will do, before the donor confirms: this payment
                is the first instalment, then the same amount at the cadence
                the same next date the consent snapshot records. */}
            {planFrequency && nextChargeText ? (
              <div className="gf-plan-note">
                <b>{tCommon(planFrequency === "DAILY" ? "freqDaily" : planFrequency === "FRIDAY" ? "freqFriday" : "freqMonthly")}</b>
                <span>{tRecurring("firstChargeToday", { cadence: tRecurring(planFrequency === "DAILY" ? "cadenceDaily" : planFrequency === "FRIDAY" ? "cadenceFriday" : "cadenceMonthly") })}</span>
                <small>{tRecurring("nextChargeOn", { date: nextChargeText })}</small>
                {teamSupportCharged > 0 ? <small>{tTeam("title")} · {teamRecurring ? tTeam("recurringNote") : tTeam("oneTimeNote")}</small> : null}
              </div>
            ) : null}

            {belowMinimum ? (
              <span role="alert" className="gf-ck-alert">
                {tGive("belowMinCheckout", { amount: minLabel })}{" "}
                <Link href={miaPath("cart", locale)}>{tGive("editInCart")}</Link>
              </span>
            ) : null}

            <div className="gf-trust-strip">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                {tv("trustEncrypted")}
              </span>
              <Link href={miaPath("refundPolicy", locale)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
                {tv("trustRefund")}
              </Link>
            </div>

            {secure3dOffered ? (
              <label className="gf-3d" data-on={secure3d ? "1" : undefined}>
                <input type="checkbox" checked={secure3d} onChange={(e) => setSecure3d(e.target.checked)} />
                <span className="gf-3d-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                </span>
                <span className="gf-3d-text">
                  <b>{tv("secure3dLabel")}</b>
                  <small>{tv("secure3dHint")}</small>
                </span>
              </label>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !items.length || belowMinimum || (method === "card" && cardRailUnavailable)}
              className={method === "paypal" ? "gf-btn-primary pay-paypal" : "gf-btn-primary mia-card-cta"}
              aria-busy={submitting}
            >
              {/* The amount sits on the button: it is the last place the donor
                  sees what will be charged before confirming. */}
              {submitting ? (
                <>
                  <span className="gf-btn-spinner" aria-hidden="true" />
                  {tSystem("processing")}
                </>
              ) : (
                <>
                  {method === "bank" ? t("ctaBankContinue") : tv("confirm")} · <bdi>{totalLabel}</bdi>
                </>
              )}
            </button>

            {error ? (
              <p role="alert" className="gf-ck-alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

/* The design's redirect-note glyph. */
const InfoGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </svg>
);
