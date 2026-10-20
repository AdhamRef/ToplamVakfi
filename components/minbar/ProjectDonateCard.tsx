"use client";

import { decimalAmount, digitsOnly } from "@/lib/minbar/numeric-input";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { flyToCart } from "@/lib/minbar/cart-feedback";
import GiveFrequencyDialog, { type GiveIntent } from "@/components/minbar/GiveFrequencyDialog";
import type { MinbarProject } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { shareProgress, useShareWording } from "@/hooks/useShareWording";
import { useProjectPricing } from "@/hooks/useProjectPricing";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import { cssImage } from "@/lib/minbar/image-url";

/**
 * The site's project card  `.proj-card` of `ToplamVakfi-design/Toplum Vakfı
 * Projects.dc.html` (styles: `styles/minbar/pages/projects.css`, `tvpc-*`).
 *
 * The photograph on top, then the title, a two-line summary, the
 * "NN% complete" row over the funding bar, three quick amounts beside a free
 * field (the first preselected, as drawn), and the two actions: "give to this
 * project" and "+ add to cart".
 *
 * Every figure is the campaign's own: the percentage and bar only when it has
 * a fixed goal, the goal (and what has been raised, when anything has) as the
 * row's meta. The design's state badges (urgent / paused) are not drawn: no
 * campaign field says either, and a paused campaign is not published at all.
 *
 * "Give" opens `GiveFrequencyDialog` (the campaign's recommended cadence
 * badged), which then donates now or adds to the basket. "+ Add to cart" adds
 * a one-time gift straight away, with the toast and the coin flying to the
 * header. Only identifiers reach the cart  `projectId`, a numeric USD amount
 * and the exact local figure  because the cart resolves titles live.
 *
 * A سهوم (shares) campaign shows its share price beside the title, and its
 * chips are share counts: the row added is count × price and carries the count.
 */

const QUICK_AMOUNTS = [100, 300, 500, 700];

export interface ProjectDonateCardProps {
  project: MinbarProject;
  /** Fixed track width for rail layouts; omit inside a grid. */
  width?: number;
  /** Optional chip over the photograph (a host page's category name). */
  tag?: string;
}

export default function ProjectDonateCard({ project, width, tag }: ProjectDonateCardProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const tGive = useTranslations("CardGive");
  const tCard = useTranslations("projects.tv");
  const { format, formatNumber } = useMinbarMoney();
  const { fromLocal, fromChip, labelOf, tooSmall, minLabel } = useDonationAmount();
  const shares = project.shares;
  const { t: tShares, unitWord, countLabel } = useShareWording(shares);

  const { chips: amountChips, sharePrice } = useProjectPricing(project, QUICK_AMOUNTS, { card: true });

  /* Three chips and the free field, as drawn. The chips are the campaign's
     card picks (dashboard), else the defaults, or for a shares campaign its
     card share counts. Amount chips carry USD with a label that may be an
     admin's figure in the visitor's currency; picked by position. */
  const options = shares
    ? shares.cardCounts.slice(0, 3).map((count) => ({ value: count, label: countLabel(count, formatNumber(count)) }))
    : amountChips.slice(0, 3).map((c) => ({ value: c.usd, label: c.label }));

  /* The design preselects the first amount. */
  const [picked, setPicked] = useState<number | null>(0);
  const [custom, setCustom] = useState("");
  /* Bumped on each attempt without a usable amount; keys the chip row so the
     shake replays every time. */
  const [nudge, setNudge] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
  }, []);

  const href = miaPath("projectDetail", locale, project.slug);
  const chosen = custom ? Number(custom) : picked != null ? options[picked]?.value ?? 0 : 0;
  const shareCount = shares && Number.isInteger(chosen) && chosen > 0 ? chosen : 0;
  /* What the donor is giving: a typed figure is in their own currency, and an
     admin's per-currency chip or share price is kept exactly, so 1 TL stays
     1 TL. `amount` is its USD value, which the basket stores. */
  const given = shares
    ? fromChip(sharePrice, shareCount)
    : custom
      ? fromLocal(Number(custom))
      : picked != null
        ? fromChip(amountChips[picked])
        : { usd: 0 };
  const amount = given.usd;
  const amountLabel = labelOf(given);
  const hasFinancials = project.goal != null && project.goal > 0;
  const pct = hasFinancials ? Math.min((project.raised / (project.goal as number)) * 100, 100) : 0;
  const progress = shares ? shareProgress(shares, project.raised, hasFinancials ? project.goal : null) : null;

  /* Nothing picked, or (with the $1 floor on) less than the floor. */
  const belowMinimum = amount > 0 && tooSmall(amount, given.local);
  const missingAmount = nudge > 0 && (!(amount > 0) || belowMinimum);
  const ready = amount > 0 && !belowMinimum;

  const openDialog = () => {
    if (!ready) {
      setNudge((n) => n + 1);
      return;
    }
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const add = (freq: CartFreqKey) =>
    addToCart({
      projectId: project.slug,
      title: project.title,
      typeKey: "project",
      freqKey: freq,
      amount,
      currency: "USD",
      ...(given.local ? { local: given.local } : {}),
      ...(shareCount ? { shareCount } : {}),
    });

  const confirmAdded = (freq: CartFreqKey, origin: HTMLElement) => {
    flyToCart(origin.getBoundingClientRect());
    const cadence = freq === "once" ? null : t(freq === "friday" ? "everyFriday" : freq);
    toast.custom(
      (toastState) => (
        <div className={`fq-toast${toastState.visible ? "" : " fq-toast--out"}`} role="status">
          <span className="fq-toast-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span className="fq-toast-text">
            <b>{tGive("toastTitle")}</b>
            <small>
              {project.title} · <span dir="ltr">{amountLabel}</span>
              {cadence ? ` · ${cadence}` : ""}
            </small>
          </span>
          <Link href={miaPath("cart", locale)} className="fq-toast-cta" onClick={() => toast.dismiss(toastState.id)}>
            {tGive("toastCta")}
          </Link>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const onConfirm = (freq: CartFreqKey, intent: GiveIntent, origin: HTMLElement) => {
    add(freq);
    setDialogOpen(false);
    if (intent === "donate") {
      router.push(miaPath("cart", locale));
      return;
    }
    confirmAdded(freq, origin);
  };

  /* "+ Add to cart": a one-time gift, straight into the basket. */
  const onAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!ready) {
      setNudge((n) => n + 1);
      return;
    }
    add("once");
    confirmAdded("once", event.currentTarget);
    setAdded(true);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div className="pdc-card tvpc" style={width ? { flex: `0 0 ${width}px`, width } : undefined}>
      <span className="pdc-media tvpc-media">
        {project.image ? (
          <span role="img" aria-label={project.title} className="pdc-img tvpc-img" style={{ backgroundImage: cssImage(project.image, 600) }} />
        ) : null}
        {tag ? <span className="tvpc-state tvpc-state--tag">{tag}</span> : null}
      </span>

      {/* The whole card opens the campaign. Hidden from the keyboard and screen
          readers: the title link below is the accessible way in. */}
      <Link href={href} aria-hidden="true" tabIndex={-1} className="pdc-stretch tvpc-stretch" />

      <div className="pdc-body tvpc-body">
        <div className="tvpc-head">
          <h3 className="tvpc-title">
            <Link href={href}>{project.title}</Link>
          </h3>
          {shares ? (
            /* The price of one share sits beside the name it buys. */
            <span className="pdc-share-price">
              {tShares("pricePer", { price: sharePrice?.label ?? format(shares.priceUSD), unit: unitWord(1) })}
            </span>
          ) : null}
        </div>
        {project.text ? <p className="tvpc-text">{project.text}</p> : null}

        <div className="tvpc-progress-wrap">
          {hasFinancials ? (
            <>
              <div className="tvpc-progress-row">
                <b>{tCard("complete", { pct: formatNumber(Math.round(pct)) })}</b>
                <span className="tvpc-meta">
                  {project.raised > 0 ? (
                    tCard("raisedOfGoal", { raised: format(project.raised), goal: format(project.goal as number) })
                  ) : (
                    tCard("goalMeta", { goal: format(project.goal as number) })
                  )}
                </span>
              </div>
              <span className="tvpc-bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </span>
            </>
          ) : progress && progress.sold > 0 ? (
            /* No target to draw a bar against, but the count given so far still
               tells the donor the campaign is moving. */
            <div className="tvpc-progress-row tvpc-progress-row--solo">
              <b>{tShares("givenSoFar", { count: formatNumber(progress.sold), unit: unitWord(progress.sold) })}</b>
            </div>
          ) : project.raised > 0 ? (
            <div className="tvpc-progress-row tvpc-progress-row--solo">
              <b>{tCard("raisedSoFar", { amount: format(project.raised) })}</b>
            </div>
          ) : null}
        </div>

        <div key={nudge} className={`tvpc-amounts-row${missingAmount ? " pdc-shake" : ""}`}>
          <div className="pdc-amounts tvpc-amounts">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                className={picked === index && !custom ? "active" : undefined}
                aria-pressed={picked === index && !custom}
                onClick={() => {
                  setPicked(index);
                  setCustom("");
                }}
              >
                {shares ? option.label : <span dir="ltr">{option.label}</span>}
              </button>
            ))}
          </div>
          <div className="tvpc-custom">
            <input
              value={custom}
              onChange={(e) => {
                const next = shares ? digitsOnly(e.target.value).replace(/^0+/, "").slice(0, 6) : decimalAmount(e.target.value);
                setCustom(next);
                if (next) setPicked(null);
              }}
              inputMode={shares ? "numeric" : "decimal"}
              placeholder={shares ? tGive("otherCount") : tGive("otherAmount")}
              aria-label={shares ? tShares("customCountPh") : t("freeAmount")}
              className="pdc-custom"
            />
          </div>
        </div>
        {missingAmount ? (
          <span className="pdc-hint tvpc-hint" role="alert">
            {belowMinimum ? tGive("minAmount", { amount: minLabel }) : shares ? tGive("pickCountFirst") : tGive("pickAmountFirst")}
          </span>
        ) : null}

        <div className="tvpc-actions">
          <button type="button" onClick={openDialog} className="mia-card-cta tvpc-btn">
            {shares && ready ? (
              /* A shares gift shows its total on the button. The brackets stay
                 in the sentence's direction; only the amount is isolated. */
              <span>
                {tCard("donate")} (<span dir="ltr" style={{ unicodeBidi: "isolate" }}>{amountLabel}</span>)
              </span>
            ) : (
              tCard("donate")
            )}
          </button>
          <button type="button" onClick={onAddToCart} className="tvpc-cart" title={t("addToCart")} aria-live="polite">
            {added ? tCard("added") : tCard("addToCart")}
          </button>
        </div>
      </div>

      <GiveFrequencyDialog
        open={dialogOpen}
        projectTitle={project.title}
        amountLabel={amountLabel}
        recommended={project.recommendedFrequency}
        onConfirm={onConfirm}
        onClose={closeDialog}
      />
    </div>
  );
}
