"use client";

import { offeredFrequencies } from "@/lib/minbar/frequencies";
import { decimalAmount, digitsOnly } from "@/lib/minbar/numeric-input";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { QUICK_DONATE_OPEN_EVENT } from "@/components/minbar/shell/quick-donate-styles";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { shareProgress, useShareWording } from "@/hooks/useShareWording";
import { useProjectPricing } from "@/hooks/useProjectPricing";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import type { MinbarProject, MinbarProjectDonations, MinbarRecentDonation } from "@/lib/minbar/projects";
import { ShareButton } from "./ProjectShare";

/**
 * The project page's donation card, laid out like a GoFundMe campaign's: the
 * progress ring with what has been raised, the goal and how many donations,
 * then the giving controls, the share button and the latest donations.
 *
 * The giving controls are `.donate-sidebar` of
 * `ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`: the amount pills
 * three-up (the campaign's own suggestions), the free
 * amount field with the currency at its start, the "give as a gift" pill
 * that opens the recipient's name, then "donate now" beside "add to cart" and
 * the secure-giving note.
 *
 * Kept from the site's giving flow, styled in the same pill language:
 *  - how often to give (one-time / monthly / every Friday / daily), a quiet
 *    segmented row under the amounts  recurring gifts start here;
 *  - the gift's delivery: once a recipient's name is written, the optional
 *    WhatsApp / email notice, a message and "show the amount" ride on the row
 *    as before (the certificate is generated server-side after payment).
 *
 * Only identifiers reach the cart (`projectId`, `freqKey`, numeric USD amount
 * and the exact local figure). "Donate now" adds and routes to the basket.
 * On a سهوم (shares) campaign the pills are share counts and the row carries
 * the count.
 *
 * The latest donations are real paid gifts, newest first, with the largest
 * one marked. Donors never chose to be named, so each is shown as an
 * anonymous benefactor with the amount and when.
 */

const AMOUNTS = [100, 200, 300, 500, 700, 1000];

/* Only the frequencies enabled in `config/donation-frequencies.ts`. */
const FREQUENCIES = offeredFrequencies<{ id: CartFreqKey; key: string }>([
  { id: "once", key: "oneTime" },
  { id: "monthly", key: "monthly" },
  { id: "friday", key: "everyFriday" },
  { id: "daily", key: "daily" },
]);

/** Note length that fits the certificate's dedication line. */
const NOTE_MAX = 90;

/** Rows in the latest-donations list. */
const RECENT_ROWS = 5;

const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function timeAgo(iso: string, now: number, locale: string): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of TIME_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, "minute");
}

export default function DonationPanel({
  project,
  donorCount = 0,
  donations = { recent: [], top: null },
}: {
  project: MinbarProject;
  donorCount?: number;
  donations?: MinbarProjectDonations;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const tCart = useTranslations("cart");
  const tTv = useTranslations("projects.tv");
  const tGive = useTranslations("CardGive");
  const { symbol: currencyMark, format, formatNumber } = useMinbarMoney();
  const { fromLocal, fromChip, labelOf, tooSmall, minLabel } = useDonationAmount();
  const shares = project.shares;
  const { t: tShares, unitWord, countLabel } = useShareWording(shares);

  const { chips: amountChips, sharePrice } = useProjectPricing(project, AMOUNTS);

  const options = shares
    ? shares.counts.map((count) => ({ value: count, label: countLabel(count, formatNumber(count)) }))
    : amountChips.map((c) => ({ value: c.usd, label: c.label }));

  const [picked, setPicked] = useState(0);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<CartFreqKey>(FREQUENCIES[0]?.id ?? "once");
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [channels, setChannels] = useState<{ whatsapp: boolean; email: boolean }>({ whatsapp: false, email: false });
  const [giftPhone, setGiftPhone] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [showAmount, setShowAmount] = useState(true);
  const [added, setAdded] = useState(false);
  const [minHint, setMinHint] = useState(false);
  /* "2 hours ago" is worked out in the browser only, so the server's render
     and the first client render agree. */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  /* The largest gift first, then the newest, without repeating it. */
  const rows: Array<{ donation: MinbarRecentDonation; top: boolean }> = [
    ...(donations.top ? [{ donation: donations.top, top: true }] : []),
    ...donations.recent.filter((d) => d.id !== donations.top?.id).map((donation) => ({ donation, top: false })),
  ].slice(0, RECENT_ROWS);

  const chosen = custom ? Number(custom) : options[picked]?.value ?? 0;
  const shareCount = shares && Number.isInteger(chosen) && chosen > 0 ? chosen : 0;
  /* A typed figure is in the donor's own currency and an admin's per-currency
     chip or share price is kept exactly; `amount` is the USD value stored. */
  const given = shares ? fromChip(sharePrice, shareCount) : custom ? fromLocal(Number(custom)) : fromChip(amountChips[picked]);
  const amount = given.usd;
  const belowMinimum = amount > 0 && tooSmall(amount, given.local);
  const hasFinancials = project.goal != null && project.goal > 0;
  const pct = hasFinancials ? Math.min((project.raised / (project.goal as number)) * 100, 100) : 0;
  const progress = shares ? shareProgress(shares, project.raised, hasFinancials ? project.goal : null) : null;
  const giftReady =
    giftOpen && giftName.trim().length > 0 && (channels.whatsapp ? giftPhone.trim() : true) && (channels.email ? giftEmail.trim() : true);

  /* The dedication rides on the row itself. Only a complete one (a name, and
     contact details for every chosen channel) is attached. */
  const buildItem = () => ({
    projectId: project.slug,
    title: project.title,
    typeKey: "project" as const,
    freqKey: freq,
    amount,
    currency: "USD",
    ...(given.local ? { local: given.local } : {}),
    ...(shareCount ? { shareCount } : {}),
    ...(giftReady
      ? {
          gift: {
            recipientName: giftName.trim(),
            recipientPhone: channels.whatsapp ? giftPhone.trim() : "",
            recipientEmail: channels.email ? giftEmail.trim() : "",
            message: giftNote.trim(),
            channels: [...(channels.whatsapp ? ["whatsapp" as const] : []), ...(channels.email ? ["email" as const] : [])],
            showAmount,
          },
        }
      : {}),
  });

  const onDonate = () => {
    if (!(amount > 0)) return;
    if (belowMinimum) return setMinHint(true);
    addToCart(buildItem());
    router.push(miaPath("cart", locale));
  };

  /* The phone bottom navigation's «تبرع» gives to this campaign, with the
     amount, frequency and gift chosen here. Below the minimum it brings the
     panel into view so the hint is seen. */
  const fromBottomNav = useRef(onDonate);
  useEffect(() => {
    fromBottomNav.current = () => {
      if (belowMinimum) document.getElementById("pd-aside")?.scrollIntoView({ behavior: "smooth", block: "center" });
      onDonate();
    };
  });
  useEffect(() => {
    const onOpen = (event: Event) => {
      event.preventDefault();
      fromBottomNav.current();
    };
    window.addEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
  }, []);

  const onAddToBasket = () => {
    if (!(amount > 0)) return;
    if (belowMinimum) return setMinHint(true);
    addToCart(buildItem());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div id="pd-aside" className="pd-donate">
      {/* ── Summary: ring, raised, goal, donations ─────────────────────── */}
      <div className="pd-sum">
        {hasFinancials ? (
          <span className="pd-ring" role="img" aria-label={tTv("complete", { pct: formatNumber(Math.round(pct)) })}>
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle className="pd-ring-track" cx="22" cy="22" r="19" />
              <circle className="pd-ring-fill" cx="22" cy="22" r="19" pathLength={100} strokeDasharray={`${Math.max(pct, 0.5)} 100`} />
            </svg>
            <b aria-hidden="true">{formatNumber(Math.round(pct))}%</b>
          </span>
        ) : (
          <span className="pd-ring pd-ring--open" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.1 4 6.9 4c2 0 3.5 1 5.1 3 1.6-2 3.1-3 5.1-3 3.8 0 6 4 4.5 7.6C19.5 16.4 12 21 12 21Z" />
            </svg>
          </span>
        )}
        <div className="pd-sum-text">
          {hasFinancials || project.raised > 0 ? (
            <p className="pd-sum-raised">
              <b dir="ltr">{format(project.raised)}</b> <span>{tTv("raisedWord")}</span>
            </p>
          ) : (
            <p className="pd-sum-raised pd-sum-raised--first">{tTv("beFirst")}</p>
          )}
          <p className="pd-sum-goal">{hasFinancials ? tTv("ofGoal", { goal: format(project.goal as number) }) : tTv("ongoing")}</p>
          {donorCount > 0 ? <p className="pd-sum-count">{tTv("donationsCount", { count: formatNumber(donorCount), n: donorCount })}</p> : null}
        </div>
      </div>
      {!hasFinancials && progress && progress.sold > 0 ? (
        <p className="pd-ds-sub pd-ds-sub--open">{tShares("givenSoFar", { count: formatNumber(progress.sold), unit: unitWord(progress.sold) })}</p>
      ) : null}
      {progress?.total != null ? (
        <p className="pd-ds-sub">
          {tShares("soldOfTotal", { sold: formatNumber(progress.sold), total: formatNumber(progress.total), unit: unitWord(progress.total) })}
        </p>
      ) : null}

      <h3 className="pd-ds-title">{tTv("donateTitle")}</h3>

      {shares ? (
        <span className="pd-ds-price">{tShares("pricePer", { price: sharePrice?.label ?? format(shares.priceUSD), unit: unitWord(1) })}</span>
      ) : null}

      <div className="pd-ds-amounts" role="group" aria-label={shares ? tShares("chooseCount", { unit: unitWord(2) }) : tCart("chooseAmount")}>
        {options.map((option, index) => {
          const active = picked === index && !custom;
          return (
            <button
              key={index}
              type="button"
             
              aria-pressed={active}
              className={active ? "active" : undefined}
              onClick={() => {
                setPicked(index);
                setCustom("");
                setMinHint(false);
              }}
            >
              {shares ? option.label : <span dir="ltr">{option.label}</span>}
            </button>
          );
        })}
      </div>
      <label className="pd-ds-custom">
        {shares ? null : <span aria-hidden="true">{currencyMark}</span>}
        <input
          value={custom}
          /* Whole shares only; a count has no leading zero. */
          onChange={(e) => {
            setCustom(shares ? digitsOnly(e.target.value).replace(/^0+/, "").slice(0, 6) : decimalAmount(e.target.value));
            setMinHint(false);
          }}
          inputMode={shares ? "numeric" : "decimal"}
          placeholder={shares ? tShares("customCountPh") : tTv("otherAmount")}
          aria-label={shares ? tShares("customCountPh") : tTv("otherAmount")}
          className="pd-custom"
        />
      </label>

      <div className="pd-ds-freq" role="radiogroup" aria-label={t("frequency")}>
        {FREQUENCIES.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={freq === f.id} onClick={() => setFreq(f.id)}>
            {t(f.key)}
          </button>
        ))}
      </div>

      {/* ── Gift (`.ds-gift`) ───────────────────────────────────────────── */}
      <button type="button" className={`pd-ds-gift${giftOpen ? " checked" : ""}`} aria-expanded={giftOpen} onClick={() => setGiftOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M3 12h18M12 8v13M8 8a2.5 2.5 0 1 1 0-5c1.5 0 3 1.5 4 5-1 0 2.5 0 4-5a2.5 2.5 0 1 1 0 5" />
        </svg>
        <span>{tTv("giftToggle")}</span>
      </button>
      {giftOpen ? (
        <div className="pd-ds-gift-field">
          <input value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder={tTv("giftNamePh")} aria-label={tTv("giftNamePh")} />
          {giftName.trim() ? (
            <div className="pd-ds-gift-more">
              <span className="pd-ds-gift-label">{tCart("certSendMethod")}</span>
              <div className="pd-ds-gift-channels">
                <button type="button" aria-pressed={channels.whatsapp} onClick={() => setChannels((c) => ({ ...c, whatsapp: !c.whatsapp }))}>
                  {tCart("sendViaWhatsapp")}
                </button>
                <button type="button" aria-pressed={channels.email} onClick={() => setChannels((c) => ({ ...c, email: !c.email }))}>
                  {tCart("giftChannelEmail")}
                </button>
              </div>
              {channels.whatsapp ? (
                <input
                  value={giftPhone}
                  onChange={(e) => setGiftPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder={tCart("recipientWhatsapp")}
                  aria-label={tCart("recipientWhatsapp")}
                />
              ) : null}
              {channels.email ? (
                <input value={giftEmail} onChange={(e) => setGiftEmail(e.target.value)} type="email" dir="ltr" placeholder="name@example.com" aria-label={tCart("giftChannelEmail")} />
              ) : null}
              <input
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value.slice(0, NOTE_MAX))}
                maxLength={NOTE_MAX}
                placeholder={tCart("writeYourMessagePh")}
                aria-label={tCart("giftMessage")}
              />
              <label className="pd-ds-check">
                <input type="checkbox" checked={showAmount} onChange={(e) => setShowAmount(e.target.checked)} />
                <span>{tCart("showAmountOnCert")}</span>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {minHint && belowMinimum ? (
        <span role="alert" className="pd-ds-hint">
          {tGive("minAmount", { amount: minLabel })}
        </span>
      ) : null}

      <div className="pd-ds-btns">
        <button type="button" onClick={onDonate} className="mia-card-cta pd-cta pd-ds-btn">
          {shares && shareCount && !belowMinimum ? (
            <span>
              {tTv("donateNow")} (<span dir="ltr" style={{ unicodeBidi: "isolate" }}>{labelOf(given)}</span>)
            </span>
          ) : (
            tTv("donateNow")
          )}
        </button>
        <button type="button" onClick={onAddToBasket} className={`pd-cart-btn pd-ds-cart${added ? " is-added" : ""}`} aria-live="polite">
          {added ? tTv("added") : tTv("addToCartPlain")}
        </button>
      </div>
      <ShareButton title={project.title} className="pd-ds-share" />
      <p className="pd-ds-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        {tTv("secureNote")}
      </p>

      {/* ── Latest donations ───────────────────────────────────────────── */}
      <div className="pd-recent">
        <p className="pd-recent-head">
          <span className="pd-recent-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 17 6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </span>
          {rows.length ? tTv("recentTitle") : tTv("recentEmpty")}
        </p>
        {rows.length ? (
          <ul className="pd-recent-list">
            {rows.map(({ donation, top }) => (
              <li key={donation.id} className="pd-recent-row">
                <span className="pd-recent-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.1 4 6.9 4c2 0 3.5 1 5.1 3 1.6-2 3.1-3 5.1-3 3.8 0 6 4 4.5 7.6C19.5 16.4 12 21 12 21Z" />
                  </svg>
                </span>
                <span className="pd-recent-text">
                  <b>{tTv("anonymousDonor")}</b>
                  <small>
                    <span dir="ltr" className="pd-recent-amount">{format(donation.amount)}</span>
                    {donation.recurring ? <em className="pd-recent-badge">{tTv("recurringBadge")}</em> : null}
                    <span aria-hidden="true"> · </span>
                    <span>{top ? tTv("topDonation") : now != null ? timeAgo(donation.createdAt, now, locale) : tTv("recentDonation")}</span>
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
