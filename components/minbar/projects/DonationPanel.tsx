"use client";

import { decimalAmount, digitsOnly } from "@/lib/minbar/numeric-input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { shareProgress, useShareWording } from "@/hooks/useShareWording";
import { useProjectPricing } from "@/hooks/useProjectPricing";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import type { MinbarProject } from "@/lib/minbar/projects";

/**
 * The project page's donation sidebar  `.donate-sidebar` of
 * `ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`.
 *
 * Title, funding bar and "NN% complete", six amount pills three-up, the free
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
 */

const AMOUNTS = [100, 200, 300, 500, 700, 1000];

const FREQUENCIES: ReadonlyArray<{ id: CartFreqKey; key: string }> = [
  { id: "once", key: "oneTime" },
  { id: "monthly", key: "monthly" },
  { id: "friday", key: "everyFriday" },
  { id: "daily", key: "daily" },
];

/** Note length that fits the certificate's dedication line. */
const NOTE_MAX = 90;

export default function DonationPanel({ project }: { project: MinbarProject; donorCount?: number }) {
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
  const [freq, setFreq] = useState<CartFreqKey>("once");
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [channels, setChannels] = useState<{ whatsapp: boolean; email: boolean }>({ whatsapp: false, email: false });
  const [giftPhone, setGiftPhone] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [showAmount, setShowAmount] = useState(true);
  const [added, setAdded] = useState(false);
  const [minHint, setMinHint] = useState(false);

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

  const onAddToBasket = () => {
    if (!(amount > 0)) return;
    if (belowMinimum) return setMinHint(true);
    addToCart(buildItem());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div id="pd-aside" className="pd-donate">
      <h3>{tTv("donateTitle")}</h3>

      {hasFinancials ? (
        <>
          <div className="pd-ds-progress" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="pd-ds-meta">
            <span>{tTv("complete", { pct: formatNumber(Math.round(pct)) })}</span>
            <span>{tTv("raisedOfGoal", { raised: format(project.raised), goal: format(project.goal as number) })}</span>
          </div>
        </>
      ) : (
        <div className="pd-ds-meta pd-ds-meta--open">
          <span>
            {progress && progress.sold > 0
              ? tShares("givenSoFar", { count: formatNumber(progress.sold), unit: unitWord(progress.sold) })
              : project.raised > 0
                ? tTv("raisedSoFar", { amount: format(project.raised) })
                : null}
          </span>
          <span>{tTv("ongoing")}</span>
        </div>
      )}
      {progress?.total != null ? (
        <p className="pd-ds-sub">
          {tShares("soldOfTotal", { sold: formatNumber(progress.sold), total: formatNumber(progress.total), unit: unitWord(progress.total) })}
        </p>
      ) : null}

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
      <p className="pd-ds-note">{tTv("secureNote")}</p>
    </div>
  );
}
