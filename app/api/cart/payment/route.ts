import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidLocale } from "@/lib/locales";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { resolveReferralId } from "@/lib/referral-server";
import { userHasDashboardPermission } from "@/lib/dashboard/permissions";
import { inferLocaleFromRequest } from "@/lib/preferred-lang";
import { sanitizeDonationAttribution } from "@/lib/attribution/sanitize";
import { writeAuditLog, auditStreamForRole } from "@/lib/audit-log";
import {
  convertAmountInCurrencyToUsd,
  normalizeDonationCurrencyCode,
} from "@/lib/exchange/convert-amount-in-currency-to-usd";
import {
  countryCodeFromPhone,
  getDonorCountryCodeForSnapshot,
  normalizeDonorCountryCode,
} from "@/lib/donations/donor-country-code";
import { resolveGuestDonor } from "@/lib/users/resolve-guest-donor";
import { completionData } from "@/lib/users/account-claim";
import { createBankTransferClaim } from "@/lib/donations/bank-transfer-claims";
import { BANK_TRANSFER_PROVIDER } from "@/lib/donations/bank-transfer-shared";
import { BANK_ACCOUNTS } from "@/lib/minbar/banks";
import { getUsdBaseRatesForServer } from "@/lib/exchange/rates-service";
import { MIN_DONATION_USD, MIN_DONATION_USD_TOLERANCE, parseLocalAmount } from "@/lib/minbar/donation-amount";
import {
  consentSnapshotFor,
  firstChargeAfterCheckout,
  frequencyOfOrderType,
  isOrderType,
  normalizeTimezone,
  parseScheduleChoice,
  railForFrequency,
  scheduleRuleFor,
} from "@/lib/donations/recurring-schedule";
import { parseMainGateway } from "@/lib/payment-gateway";
import { isFrequencyEnabled } from "@/lib/minbar/frequencies";
import { isAlbarakaConfigured, isAlbarakaRecurringEnabled } from "@/lib/albaraka";
import { isPayPalConfigured, isPayPalRecurringEnabled } from "@/lib/paypal";
import { mintDonationAccessToken } from "@/lib/donations/access-token";
import { giftLineData, parseGiftOrder, type GiftOrderInput } from "@/lib/donations/gift-order";

const PAYMENT_METHODS = new Set(["CARD", "PAYPAL", "BANK_TRANSFER"]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ...(userId && { donorId: userId }),
      ...(!userHasDashboardPermission(session.user, "revenue") && {
        donorId: session.user.id,
      }),
      ...(campaignId && { items: { some: { campaignId } } }),
    };

    // Get total count for pagination
    const total = await prisma.donation.count({ where });

    // Get donations with pagination
    const donations = await prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          include: {
            campaign: {
              select: {
                title: true,
                images: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      donations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const {
      items: itemsIn,
      categoryItems: categoryItemsIn,
      currency: requestedCurrency,
      /* "USD" when the line and team-support amounts are USD figures to be
         converted into the charge currency (the Minbar checkout). */
      amountsIn,
      teamSupport: teamSupportIn = 0,
      /* Recurring basket: false charges the team support once, with the
         first payment, instead of with every instalment (the default). */
      teamSupportRecurring: teamSupportRecurringIn = true,
      coverFees = false,
      type = "ONE_TIME",
      /* The donor's IANA zone, so "Friday" and "the 15th" are their Friday
         and their 15th. Validated below; UTC when absent or invalid. */
      timezone: timezoneIn,
      /* Recurring only: the day (monthly) and local time the donor chose on
         the recurring page, plus their note. Validated below; absent means
         the plan is scheduled from its creation time. */
      schedule: scheduleIn,
      paymentMethod,
      cardDetails = null,
      referralCode,
      locale: donationLocale,
      guest,
      /* Bank transfer only: which published account the donor was shown, and
         the currency of the IBAN they picked. Snapshotted onto the claim so
         the finance review knows where to look. */
      bankSlug,
      bankCurrency,
    } = body;
    /* Where the donor came from (UTM, click ids, landing page) as the browser
       recorded it, whitelisted the same way as `POST /api/donations`. The
       dashboard's "مصدر التبرع" column and the ad conversion events read it. */
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || undefined;
    const adAttribution = sanitizeDonationAttribution({
      ...(body.attribution && typeof body.attribution === "object" && !Array.isArray(body.attribution)
        ? (body.attribution as Record<string, unknown>)
        : {}),
      ...(userAgent ? { user_agent: userAgent } : {}),
      ...(clientIp ? { client_ip: clientIp } : {}),
    }) as Record<string, unknown> | undefined;
    const donationAttribution = adAttribution ? (adAttribution as Prisma.InputJsonValue) : undefined;

    type CartItemIn = {
      campaignId: string;
      amount: number;
      amountUSD?: number;
      /** The figure as the donor gave it, in their currency (`amountsIn: "USD"`). */
      local?: unknown;
      shareCount?: number;
      /** Given in someone else's name; validated into `giftsByIndex` below. */
      gift?: unknown;
    };
    type CategoryItemIn = { categoryId: string; amount: number; local?: unknown };

    /* A line gives either to a campaign or to a category as a whole (a
       category page's donation box may target the category itself). The
       lists are independent; an order needs at least one line of either kind. */
    const items: CartItemIn[] = Array.isArray(itemsIn) ? itemsIn : [];
    const categoryItems: CategoryItemIn[] = Array.isArray(categoryItemsIn) ? categoryItemsIn : [];

    // Validate required fields
    if ((!items.length && !categoryItems.length) || !requestedCurrency || !paymentMethod) {
      return NextResponse.json(
        { error: "Items, currency, and payment method are required" },
        { status: 400 }
      );
    }
    if (!PAYMENT_METHODS.has(String(paymentMethod))) {
      return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
    }
    /* One type for the whole order: `ONE_TIME`, or the plan's cadence 
       `DAILY | FRIDAY | MONTHLY`, exactly as the donor chose it. Anything else
       is refused rather than coerced; the old code turned every recurring
       choice into MONTHLY (`DEPLOYED_VS_DESIGN_AUDIT.md` § P0.2). */
    if (!isOrderType(type)) {
      return NextResponse.json({ error: "Unsupported donation type" }, { status: 400 });
    }
    /* Only the ways of giving the site offers (config/donation-frequencies.ts). */
    const ORDER_FREQ = { ONE_TIME: "once", DAILY: "daily", FRIDAY: "friday", MONTHLY: "monthly" } as const;
    if (!isFrequencyEnabled(ORDER_FREQ[type])) {
      return NextResponse.json({ error: "This donation frequency is not available" }, { status: 400 });
    }
    const frequency = frequencyOfOrderType(type);
    const timezone = normalizeTimezone(timezoneIn);
    /* Never let a malformed schedule fall back to a different one silently:
       the donor would be charged on a day they did not pick. */
    const scheduleChoice = parseScheduleChoice(frequency ? scheduleIn : null);
    if (!scheduleChoice.ok) {
      return NextResponse.json({ error: scheduleChoice.error }, { status: 400 });
    }
    const isBankTransfer = paymentMethod === "BANK_TRANSFER";
    /* A transfer is a one-off act by the donor; nothing can be charged again
       tomorrow, on Friday or next month. The checkout hides the option for a
       recurring basket, and this is the server's half of that rule. */
    if (isBankTransfer && frequency) {
      return NextResponse.json({ error: "Bank transfer cannot be used for a recurring donation" }, { status: 400 });
    }
    /* PayPal is refused before an order exists when the server cannot take
       it: a PENDING row the donor can never pay helps nobody. */
    const isPayPal = paymentMethod === "PAYPAL";
    if (isPayPal && !(frequency ? isPayPalRecurringEnabled() : isPayPalConfigured())) {
      return NextResponse.json(
        { error: frequency ? "Recurring donations with PayPal are not available at the moment" : "PayPal is not available at the moment" },
        { status: 400 }
      );
    }
    const lineOk = (line: { amount: unknown }) =>
      typeof line?.amount === "number" && Number.isFinite(line.amount) && line.amount > 0;
    if (!items.every(lineOk) || !categoryItems.every(lineOk)) {
      return NextResponse.json({ error: "Every line needs a positive amount" }, { status: 400 });
    }

    /* A campaign line may be a gift: the recipient is named and, per channel
       chosen, reachable. Refused as a whole rather than silently dropped 
       the donor was promised the recipient would be told. */
    const giftsByIndex: Array<GiftOrderInput | null> = [];
    for (const item of items) {
      const parsed = parseGiftOrder(item.gift);
      if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
      giftsByIndex.push(parsed.gift);
    }

    /* "Support the team" belongs to the order, asked once in the basket. The
       amount is the browser's choice but the switch is the admin's: with the
       step turned off nothing is added whatever the request says. */
    const teamSupportSettings = await prisma.globalSettings.findFirst({
      orderBy: { createdAt: "asc" },
      select: { teamSupportEnabled: true, allowAnyAmount: true },
    });
    const teamSupportAllowed = teamSupportSettings?.teamSupportEnabled !== false;

    /* The Minbar checkout sends its basket as it stores it (`amountsIn: "USD"`):
       each line's USD value, plus `local`  the figure exactly as the donor
       gave it in their currency, when they did. The order is charged in the
       donor's currency: a line given in that currency is charged as given (so
       1 TL is 1 TL), any other is converted from USD at the server's rate. The
       lines used to be sent as raw USD figures labelled with the donor's
       currency, so a $1 row shown as ≈49 TL was charged 1 TL. Callers that
       send amounts already in `currency` (no `amountsIn`) are taken as they
       are. */
    const amountsInUsd = amountsIn === "USD";
    // Stored on the donation as given here; `DEFAULT` (no currency chosen) is USD,
    // and a stored `DEFAULT` broke the card gateways that convert it later.
    const currency: string = normalizeDonationCurrencyCode(requestedCurrency);
    const chargeCode = normalizeDonationCurrencyCode(currency);
    let usdToCharge = 1;
    let rates: Record<string, number> = {};
    const needsRates =
      amountsInUsd &&
      (chargeCode !== "USD" || [...items, ...categoryItems].some((line) => parseLocalAmount(line.local)));
    if (needsRates) {
      try {
        rates = await getUsdBaseRatesForServer();
        const rate = chargeCode === "USD" ? 1 : rates[chargeCode];
        if (!(typeof rate === "number" && rate > 0)) throw new Error(`no rate for ${chargeCode}`);
        usdToCharge = rate;
      } catch (e) {
        console.error("[cart/payment] charge currency rate:", e);
        return NextResponse.json(
          { error: "Exchange rate unavailable. Please try again in a moment." },
          { status: 503 }
        );
      }
    }
    const toCharge = (usd: number) => Math.round(usd * usdToCharge * 100) / 100;
    if (amountsInUsd) {
      /* Off (the default), every donation line is worth at least a dollar;
         the basket and checkout say so first, this is the server's half. */
      const allowAnyAmount = teamSupportSettings?.allowAnyAmount === true;
      for (const line of [...items, ...categoryItems]) {
        /* Given in the charge currency: charged as given. Given in another one
           (the donor switched currency since): that figure, converted. */
        const local = parseLocalAmount(line.local);
        const localRate = local ? rates[local.currency] : undefined;
        line.amount =
          local && local.currency === chargeCode
            ? local.amount
            : local && typeof localRate === "number" && localRate > 0
              ? toCharge(local.amount / localRate)
              : toCharge(line.amount);
        const usdValue = line.amount / usdToCharge;
        if (!allowAnyAmount && usdValue < MIN_DONATION_USD * MIN_DONATION_USD_TOLERANCE) {
          return NextResponse.json(
            { error: "Each donation must be at least 1 USD or its equivalent", code: "BELOW_MINIMUM" },
            { status: 400 }
          );
        }
      }
    }

    const teamSupport =
      teamSupportAllowed && typeof teamSupportIn === "number" && Number.isFinite(teamSupportIn) && teamSupportIn > 0
        ? toCharge(teamSupportIn)
        : 0;
    /* What each later instalment carries. The first payment (the donation
       created below) always includes the full amount. */
    const planTeamSupport = teamSupportRecurringIn === false ? 0 : teamSupport;

    // Resolve donor
    let donorId: string;
    let donorName: string | null = null;

    if (session?.user?.id) {
      donorId = session.user.id;
      donorName = session.user.name ?? null;
      /* The form also carries what a signed-in donor typed. It completes their
         own record  most were imported from the old site with gaps, a phone
         or a surname missing  and never replaces a field already filled. The
         account's email is theirs and is not touched. */
      if (guest) {
        const me = await prisma.user.findUnique({
          where: { id: donorId },
          select: { name: true, phone: true, countryCode: true, verifiedAt: true },
        });
        if (me) {
          const typedName = [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim();
          const typedPhone = typeof guest.phone === "string" && guest.phone.replace(/D/g, "").length >= 7 ? guest.phone : null;
          const data = completionData(me, {
            name: typedName || null,
            phone: typedPhone,
            countryCode: normalizeDonorCountryCode(guest.countryCode) ?? countryCodeFromPhone(typedPhone ?? undefined) ?? null,
          });
          if (Object.keys(data).length) await prisma.user.update({ where: { id: donorId }, data });
          donorName = donorName ?? (me.name || typedName || null);
        }
      }
    } else if (guest) {
      const guestPhone = guest.phone || undefined;
      const guestCountry =
        normalizeDonorCountryCode(guest.countryCode) ?? countryCodeFromPhone(guestPhone) ?? undefined;
      const resolved = await resolveGuestDonor(
        prisma,
        {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          countryCode: guestCountry ?? null,
          city: guest.city ?? null,
          region: guest.region ?? null,
        },
        { preferredLang: inferLocaleFromRequest(request, donationLocale) ?? null }
      );
      donorId = resolved.donorId;
      donorName = resolved.donorName;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const donorCountrySnapshot =
      session?.user?.id
        ? (await getDonorCountryCodeForSnapshot(prisma, donorId)) ?? undefined
        : normalizeDonorCountryCode(guest?.countryCode) ??
          countryCodeFromPhone(guest?.phone) ??
          ((await getDonorCountryCodeForSnapshot(prisma, donorId)) ?? undefined);

    // Card payments are handled via PayFor 3D Secure redirect flow (we do not store PAN/CVV).

    // Calculate totals
    const totalAmount = [...items, ...categoryItems].reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );
    const fees = (totalAmount + teamSupport) * 0.03;
    const finalTotalAmount = totalAmount + teamSupport + (coverFees ? fees : 0);

    const currencyNorm = normalizeDonationCurrencyCode(currency);
    let donationTotalUsd: number;
    try {
      donationTotalUsd = await convertAmountInCurrencyToUsd(finalTotalAmount, currencyNorm);
    } catch (e) {
      console.error("[cart/payment] convert total to USD:", e);
      return NextResponse.json(
        { error: "Exchange rate unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    let itemsResolved: Array<{
      campaignId: string;
      amount: number;
      amountUSD: number;
      shareCount?: number;
      gift: GiftOrderInput | null;
    }>;
    let categoryItemsResolved: Array<{ categoryId: string; amount: number; amountUSD: number }>;

    try {
      [itemsResolved, categoryItemsResolved] = await Promise.all([
        Promise.all(
          items.map(async (item, index) => ({
            campaignId: item.campaignId,
            amount: item.amount,
            amountUSD: await convertAmountInCurrencyToUsd(item.amount, currencyNorm),
            ...(item.shareCount != null && item.shareCount > 0
              ? { shareCount: Math.floor(item.shareCount) }
              : {}),
            gift: giftsByIndex[index] ?? null,
          }))
        ),
        Promise.all(
          categoryItems.map(async (item) => ({
            categoryId: item.categoryId,
            amount: item.amount,
            amountUSD: await convertAmountInCurrencyToUsd(item.amount, currencyNorm),
          }))
        ),
      ]);
    } catch (e) {
      console.error("[cart/payment] convert lines to USD:", e);
      return NextResponse.json(
        { error: "Exchange rate unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    // Verify all campaigns exist and are active
    if (items.length) {
      const campaignIds = items.map((item) => item.campaignId);
      const campaigns = await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
      });

      /* Against DISTINCT ids: two basket rows for the same project are one
         campaign row, and comparing with `items.length` refused that whole
         order as "not found". */
      if (campaigns.length !== new Set(campaignIds).size) {
        return NextResponse.json(
          { error: "One or more campaigns not found" },
          { status: 404 }
        );
      }

      if (campaigns.some((campaign) => !campaign.isActive)) {
        return NextResponse.json(
          { error: "One or more campaigns are not active" },
          { status: 400 }
        );
      }
    }

    // Verify all categories exist and are not archived (unset isActive is active)
    if (categoryItems.length) {
      const categoryIds = categoryItems.map((item) => item.categoryId);
      if (categoryIds.some((id) => !/^[0-9a-fA-F]{24}$/.test(String(id)))) {
        return NextResponse.json({ error: "One or more categories not found" }, { status: 404 });
      }
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, isActive: true },
      });

      // Distinct ids, as for campaigns: the same category twice is one row.
      if (categories.length !== new Set(categoryIds).size) {
        return NextResponse.json({ error: "One or more categories not found" }, { status: 404 });
      }

      if (categories.some((category) => category.isActive === false)) {
        return NextResponse.json({ error: "One or more categories are not active" }, { status: 400 });
      }
    }

    /* The nested writes for both kinds of line, shared by the three creates
       below; a kind with no lines is left out of the write altogether. */
    const campaignLines = itemsResolved.length
      ? {
          items: {
            create: itemsResolved.map((item) => ({
              campaignId: item.campaignId,
              amount: item.amount,
              amountUSD: item.amountUSD,
              ...(item.shareCount != null && item.shareCount > 0 ? { shareCount: item.shareCount } : {}),
              ...giftLineData(item.gift),
            })),
          },
        }
      : {};
    /* The plan's copy of the lines carries no gift: the recipient is told
       once, off the first (paid) donation, and later instalments are plain. */
    const planCampaignLines = itemsResolved.length
      ? {
          items: {
            create: itemsResolved.map((item) => ({
              campaignId: item.campaignId,
              amount: item.amount,
              amountUSD: item.amountUSD,
              ...(item.shareCount != null && item.shareCount > 0 ? { shareCount: item.shareCount } : {}),
            })),
          },
        }
      : {};
    const categoryLines = categoryItemsResolved.length
      ? {
          categoryItems: {
            create: categoryItemsResolved.map((item) => ({
              categoryId: item.categoryId,
              amount: item.amount,
              amountUSD: item.amountUSD,
            })),
          },
        }
      : {};

    const referralId = await resolveReferralId(referralCode);

    const validLocale =
      donationLocale && isValidLocale(String(donationLocale).toLowerCase())
        ? String(donationLocale).toLowerCase()
        : null;

    if (frequency) {
      /* A card plan runs on the main gateway (Stripe) at every cadence
         (`railForFrequency`). The Albaraka check below only matters if a
         plan were ever routed there again: refusing is what stops a donor
         being promised a cadence nothing will ever charge. */
      const settings = await prisma.globalSettings.findFirst({
        orderBy: { createdAt: "asc" },
        select: { mainGateway: true },
      });
      /* A PayPal plan is billed by PayPal at any cadence (its wallet is
         vaulted at the first instalment); a card plan's rail follows the
         cadence and the main gateway. */
      const rail = isPayPal ? ("PAYPAL" as const) : railForFrequency(frequency, parseMainGateway(settings?.mainGateway));
      if (rail === "ALBARAKA" && !(isAlbarakaConfigured() && isAlbarakaRecurringEnabled())) {
        return NextResponse.json(
          { error: "Recurring donations at this frequency are not available at the moment" },
          { status: 400 }
        );
      }

      /* The plan's own clock: ONE rule  the donor's chosen day and time
         from which the first `nextBillingDate` and the consent record are
         both computed, so the three cannot disagree. `nextBillingDate` is
         re-derived from the same rule when the first instalment settles;
         `consentSnapshot` is never rewritten. */
      const now = new Date();
      const rule = scheduleRuleFor(frequency, now, timezone, scheduleChoice.value);
      const nextBilling = firstChargeAfterCheckout(rule, now, timezone);
      const consent = consentSnapshotFor({
        frequency,
        amount: finalTotalAmount,
        currency,
        timezone,
        rail,
        locale: validLocale,
        now,
        rule,
        notes: scheduleChoice.value?.notes ?? null,
      });

      const result = await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.create({
          data: {
            status: "ACTIVE",
            amount: totalAmount,
            amountUSD: donationTotalUsd,
            currency,
            teamSupport: planTeamSupport,
            coverFees,
            paymentMethod,
            cardDetails: paymentMethod === "CARD" ? cardDetails : null,
            donorId: donorId,
            referralId: referralId ?? undefined,
            frequency,
            timezone,
            provider: rail,
            /* Plain data, but Prisma's `InputJsonValue` does not accept a
               named interface without the cast. */
            scheduleRule: rule as unknown as Prisma.InputJsonValue,
            consentSnapshot: consent as unknown as Prisma.InputJsonValue,
            nextBillingDate: nextBilling,
            /* Stamped when the first instalment actually settles  by the
               Stripe webhook or the Albaraka callback  never optimistically. */
            lastBillingDate: null,
            ...planCampaignLines,
            ...categoryLines,
          },
        });

        const donation = await tx.donation.create({
          data: {
            accessToken: mintDonationAccessToken(),
            amount: totalAmount,
            amountUSD: donationTotalUsd,
            teamSupport,
            coverFees,
            currency,
            fees: coverFees ? fees : 0,
            totalAmount: finalTotalAmount,
            status: "PAID",
            locale: validLocale ?? undefined,
            donorCountryCode: donorCountrySnapshot,
            donorId: donorId,
            referralId: referralId ?? undefined,
            subscriptionId: sub.id,
            paymentMethod,
            ...(isPayPal ? { provider: "PAYPAL" } : {}),
            cardDetails: null,
            ...(donationAttribution ? { attribution: donationAttribution } : {}),
            ...campaignLines,
            ...categoryLines,
          },
          include: {
            donor: { select: { name: true, email: true } },
            items: { include: { campaign: { select: { title: true } } } },
            categoryItems: { include: { category: { select: { name: true } } } },
          },
        });

        if (validLocale) {
          const donor = await tx.user.findUnique({
            where: { id: donorId },
            select: { preferredLang: true },
          });
          if (donor && donor.preferredLang == null) {
            await tx.user.update({
              where: { id: donorId },
              data: { preferredLang: validLocale },
            });
          }
        }

        return { subscription: sub, donation };
      }, { timeout: 15000 });

      const d = result.donation;
      const actorRole = session?.user?.role ?? "DONOR";
      await writeAuditLog({
        actorId: donorId,
        actorName: donorName,
        actorRole,
        action: "DONATION_RECURRING_CHECKOUT_START",
        messageAr: `${donorName ?? "متبرع"} بدأ عملية دفع تبرعًا ${frequency === "DAILY" ? "يوميًا" : frequency === "FRIDAY" ? "أسبوعياً" : "شهريًا"} عبر السلة (≈ ${donationTotalUsd.toFixed(0)} USD لكل دورة)`,
        entityType: "Donation",
        entityId: d.id,
        metadata: { amountUSD: donationTotalUsd, via: "cart_payment", status: "PENDING", provider: rail, frequency, timezone, nextChargeAt: consent.nextChargeAt },
        stream: auditStreamForRole(actorRole),
      });

      return NextResponse.json({
        success: true,
        subscription: result.subscription,
        donation: result.donation,
      });
    }

    /* The bank account the donor was shown, resolved server-side so the name
       on the claim is the published one and not whatever the browser sent. */
    let bankSnapshot: { slug: string; name: string } | null = null;
    if (isBankTransfer && typeof bankSlug === "string" && bankSlug.trim()) {
      const match = BANK_ACCOUNTS.find((account) => account.id === bankSlug.trim());
      if (match) bankSnapshot = { slug: match.id, name: match.name };
    }

    const donation = await prisma.$transaction(async (tx) => {
      const d = await tx.donation.create({
        data: {
          accessToken: mintDonationAccessToken(),
          amount: totalAmount,
          amountUSD: donationTotalUsd,
          teamSupport,
          coverFees,
          currency,
          fees: coverFees ? fees : 0,
          totalAmount: finalTotalAmount,
          /* PAID with no paidAt is the site's "قيد التأكيد" state. A card
             order is stamped by the gateway's webhook; a bank transfer by a
             finance officer from the dashboard. Neither counts anywhere before. */
          status: "PAID",
          locale: validLocale ?? undefined,
          donorCountryCode: donorCountrySnapshot,
          donorId: donorId,
          referralId: referralId ?? undefined,
          paymentMethod,
          cardDetails: null,
          ...(isBankTransfer
            ? { provider: BANK_TRANSFER_PROVIDER, providerTxnResult: "Pending" }
            : isPayPal
              ? { provider: "PAYPAL" }
              : {}),
          ...(donationAttribution ? { attribution: donationAttribution } : {}),
          ...campaignLines,
          ...categoryLines,
        },
        include: {
          donor: { select: { name: true, email: true } },
          items: { include: { campaign: { select: { title: true } } } },
          categoryItems: { include: { category: { select: { name: true } } } },
        },
      });

      if (validLocale) {
        const donor = await tx.user.findUnique({
          where: { id: donorId },
          select: { preferredLang: true },
        });
        if (donor && donor.preferredLang == null) {
          await tx.user.update({
            where: { id: donorId },
            data: { preferredLang: validLocale },
          });
        }
      }

      const claim = isBankTransfer
        ? await createBankTransferClaim(tx, {
            donationId: d.id,
            bankSlug: bankSnapshot?.slug ?? null,
            bankName: bankSnapshot?.name ?? null,
            bankCurrency: typeof bankCurrency === "string" ? bankCurrency : null,
          })
        : null;

      return { ...d, claim };
    }, { timeout: 15000 });

    const { claim, ...donationRow } = donation;
    const actorRole = session?.user?.role ?? "DONOR";
    await writeAuditLog({
      actorId: donorId,
      actorName: donorName,
      actorRole,
      action: isBankTransfer ? "DONATION_BANK_TRANSFER_CHECKOUT_START" : "DONATION_ONE_TIME_CHECKOUT_START",
      messageAr: isBankTransfer
        ? `${donorName ?? "متبرع"} سجّل تبرعًا بالتحويل البنكي عبر السلة (≈ ${donationTotalUsd.toFixed(0)} USD)  بانتظار الإيصال`
        : `${donorName ?? "متبرع"} بدأ عملية دفع تبرعًا لمرة واحدة عبر السلة (≈ ${donationTotalUsd.toFixed(0)} USD)`,
      entityType: "Donation",
      entityId: donationRow.id,
      metadata: { amountUSD: donationTotalUsd, via: "cart_payment", status: "PENDING", provider: isBankTransfer ? BANK_TRANSFER_PROVIDER : isPayPal ? "PAYPAL" : "PAYFOR" },
      stream: auditStreamForRole(actorRole),
    });

    return NextResponse.json({
      success: true,
      donation: donationRow,
      /* The guest's key to the upload page; a signed-in owner does not need
         it but is handed it all the same, which keeps the redirect uniform. */
      ...(claim ? { bankTransfer: { accessToken: claim.accessToken } } : {}),
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json(
      { error: "Failed to create donation" },
      { status: 500 }
    );
  }
}
