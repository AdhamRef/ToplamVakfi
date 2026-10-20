"use client";

import { useQuietFloatingButtons } from "@/hooks/useQuietFloatingButtons";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { useMinbarCart } from "@/hooks/useMinbarCart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount, useHealLegacyRows } from "@/hooks/useDonationAmount";
import { useShareWording } from "@/hooks/useShareWording";
import { sharePriceFor } from "@/hooks/useProjectPricing";
import {
  cartHasRecurring,
  clearTeamSupport,
  readTeamSupportChoice,
  readTeamSupportRecurring,
  teamSupportIsRecurring,
  writeTeamSupport,
  writeTeamSupportRecurring,
  type CartFreqKey,
  type MinbarCartItem,
} from "@/lib/minbar/cart";
import { fetchGlobalSettings, getCachedGlobalSettings, type GlobalSettings } from "@/lib/global-settings-client";
import { resolveFinalTeamSupportAmounts } from "@/lib/campaign/suggested-team-support";
import { resolveUpsellAmounts } from "@/lib/minbar/cart-upsell";
import type { MinbarProject } from "@/lib/minbar/projects";
import type { MinbarCategoryTitle } from "@/lib/minbar/category-page";

/**
 * Giving basket  `ToplamVakfi-design/Toplum Vakfı Cart.dc.html` (items) and
 * `Toplum Vakfı Empty Cart.dc.html` (nothing in it yet).
 *
 * The governing contract (`DEVELOPER_HANDOFF` § Cart Localization):
 *
 *   CART = LIVE LOCALIZED REFERENCE · CONFIRMED ORDER = IMMUTABLE SNAPSHOT
 *
 * So every row's title is resolved **at render time** from the active locale:
 * `projectId` → the project list → the stored title as a last resort. Switching
 * language re-resolves the labels and must never add, remove, reorder or edit a
 * row. A raw key or `undefined` must never reach the screen.
 *
 * `[BACKEND-INTEGRATION]`: this is client-controlled data. The server
 * re-resolves every id and recomputes amount, currency and availability when the
 * order is created  what is shown here is display state, never the basis for a
 * charge.
 *
 * Layout (`.ct-cart`): the page title, then one white card of rows (title, a
 * fixed frequency tag, the amount field, delete) beside the navy summary
 * (count, one-off / recurring subtotals, total, the way on). The frequency is a
 * tag, not a toggle: it is chosen where the gift is set up. Two things the
 * dashboard drives sit inside that frame: the cross-sell campaigns
 * (`/dashboard/cart-settings`) as a second card under the items, and the
 * "support the team" step inside the summary, before the checkout button.
 */

/** Frequency id → its tag key in `tvPayment.cart`. */
const FREQ_TAG: Record<CartFreqKey, string> = {
  once: "tagOnce",
  daily: "tagDaily",
  friday: "tagFriday",
  monthly: "tagMonthly",
};

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

const LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export default function CartPage({ projects, categories }: { projects: MinbarProject[]; categories: MinbarCategoryTitle[] }) {
  useQuietFloatingButtons();
  const locale = useLocale();
  const t = useTranslations("cart");
  const tv = useTranslations("tvPayment.cart");
  const tCommon = useTranslations("common");
  const tTeam = useTranslations("TeamSupport");
  const { format, formatNumber, formatLocal, code, rate, currency, symbol } = useMinbarMoney();
  const { fromLocal, tooSmall, lineTooSmall, minLocal, minLabel, lineValue, inLocal } = useDonationAmount();
  const tGive = useTranslations("CardGive");
  /* The upsell row whose amount was under the $1 floor, to say so under it. */
  const [upsellMinHint, setUpsellMinHint] = useState<string | null>(null);
  const { unitWordFor, countLabelFor } = useShareWording();
  const { items, replace, remove, hydrated } = useMinbarCart();
  useHealLegacyRows(items, replace, hydrated);

  /* The amount being typed into a row, until it is committed (blur / Enter). */
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [customUpsell, setCustomUpsell] = useState<Record<string, string>>({});

  /* "Support the team"  asked once here, for the whole basket, and sent
     with the order (`lib/minbar/cart.ts` § Team support). The admin switch
     and the quick-pick amounts come from the global settings; until they
     arrive the step is not drawn rather than drawn with placeholder amounts. */
  const [settings, setSettings] = useState<GlobalSettings | null>(() => getCachedGlobalSettings());
  /* `null` until the donor answers  an amount or "no thanks". Nothing is
     pre-selected on their behalf. */
  const [teamSupport, setTeamSupport] = useState<number | null>(null);
  const teamAmount = teamSupport ?? 0;
  const [customTeam, setCustomTeam] = useState("");
  /* Recurring basket: with every instalment (default) or once. */
  const [teamRecurringChoice, setTeamRecurringChoice] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetchGlobalSettings().then((s) => {
      if (live && s) setSettings(s);
    });
    const choice = readTeamSupportChoice();
    setTeamSupport(choice);
    if (choice !== null && choice > 0) setCustomTeam(String(choice));
    setTeamRecurringChoice(readTeamSupportRecurring());
    return () => {
      live = false;
    };
  }, []);
  const chooseTeamRecurring = (value: boolean) => {
    writeTeamSupportRecurring(value);
    setTeamRecurringChoice(value);
  };

  /* The cross-sell rows: the dashboard's chosen campaigns, resolved against
     the published project list (a campaign no longer published drops out),
     else the generic suggestions. */
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const upsellProjects = useMemo(
    () =>
      (settings?.cartUpsell.items ?? [])
        .map((item) => {
          const project = projectById.get(item.campaignId);
          /* A per-currency exception is in the visitor's money; the base list is USD. */
          const local = code !== "USD" && Boolean(item.byCurrency[code]?.length);
          return project ? { project, amounts: resolveUpsellAmounts(item, currency), local } : null;
        })
        .filter((row): row is { project: MinbarProject; amounts: number[]; local: boolean } => row !== null),
    [settings, projectById, currency, code]
  );
  const teamSupportEnabled = settings?.teamSupportEnabled !== false;
  const teamAmounts = useMemo(
    () => resolveFinalTeamSupportAmounts(currency, null, settings?.suggestedTeamSupport ?? null),
    [currency, settings]
  );
  const chooseTeamSupport = (amount: number) => {
    const value = Number.isFinite(amount) && amount > 0 ? amount : 0;
    writeTeamSupport(value);
    setTeamSupport(value);
    if (!teamAmounts.includes(value)) setCustomTeam(value > 0 ? String(value) : "");
    else setCustomTeam("");
  };
  const recurringBasket = cartHasRecurring(items);

  /* A row added from the cross-sell block: scroll it into view and let it
     glow for a moment, so the donor sees where it went. */
  const [addedIndex, setAddedIndex] = useState<number | null>(null);
  const addedTimer = useRef<number | null>(null);
  const announceAdded = (index: number) => {
    setAddedIndex(index);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedIndex(null), 2600);
  };
  useEffect(() => {
    if (addedIndex === null) return;
    const row = document.getElementById(`cart-row-${addedIndex}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [addedIndex]);
  const teamRecurring = teamSupportIsRecurring(items, teamRecurringChoice);

  /** Project slug → its shares setup, for rows given as a number of shares. */
  const sharesBySlug = useMemo(() => new Map(projects.map((p) => [p.slug, p.shares])), [projects]);
  const sharesOf = (item: MinbarCartItem) => (item.projectId ? sharesBySlug.get(item.projectId) ?? null : null);

  /** Project slug → its title in the active locale. */
  const titleBySlug = useMemo(() => new Map(projects.map((p) => [p.slug, p.title])), [projects]);
  /** Category id → its title in the active locale. */
  const categoryTitleById = useMemo(() => new Map(categories.map((c) => [c.id, c.title])), [categories]);

  /**
   * Resolve a row's display title, live, in this order:
   *   projectId  → the CMS title for this locale
   *   categoryId → the category's name for this locale
   *   titleKey   → the translated interface label (generic destinations)
   *   title      → the stored legacy string
   * The last step is what keeps an unresolved v1 row visible instead of blank.
   */
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

  /* What the tag cannot say: a number of shares, and whom a gift is for. */
  const noteLine = (item: MinbarCartItem): string =>
    [
      item.shareCount ? countLabelFor(sharesOf(item), item.shareCount, formatNumber(item.shareCount)) : "",
      item.gift?.recipientName ? tTeam("giftedTo", { name: item.gift.recipientName }) : "",
    ]
      .filter(Boolean)
      .join(" · ");

  /* A sum of rows in the visitor's currency: a line given in that currency
     counts as given (1 TL is 1 TL), every other line (USD) is converted at the
     page's rate  the rule the order is charged by. */
  const sumLabel = (rows: MinbarCartItem[], extraUsd = 0) => {
    if (!inLocal) return format(rows.reduce((sum, item) => sum + item.amount, 0) + extraUsd);
    return formatLocal(rows.reduce((sum, item) => sum + lineValue(item), 0) + lineValue({ amount: extraUsd }));
  };
  const teamCharged = teamSupportEnabled && teamAmount > 0 ? teamAmount : 0;
  const totalLabel = sumLabel(items, teamCharged);
  /* The design's subtotals: one-off, then each recurring cadence present. */
  const subtotals = (["once", "monthly", "friday", "daily"] as const)
    .map((freq) => ({ freq, rows: items.filter((item) => item.freqKey === freq) }))
    .filter((group) => group.rows.length > 0 || (group.freq === "once" && items.length === 0));

  /* With the $1 floor on, a row under it holds the checkout until it is raised. */
  const belowMinimum = items.some(lineTooSmall);
  const raiseToMinimum = (index: number) => {
    if (minLocal == null) return;
    const raised = inLocal ? fromLocal(minLocal) : { usd: minLocal };
    replace(items.map((item, i) => (i === index ? { ...item, amount: raised.usd, currency: "USD", local: "local" in raised ? raised.local : undefined, shareCount: undefined } : item)));
  };

  /** What the row's amount field shows when nothing is being typed. */
  const fieldValue = (item: MinbarCartItem) =>
    String(item.shareCount && sharesOf(item) ? item.shareCount : Math.round(lineValue(item) * 100) / 100);

  const commitEdit = (index: number) => {
    const raw = drafts[index];
    setDrafts((d) => {
      const next = { ...d };
      delete next[index];
      return next;
    });
    if (raw === undefined) return;
    const value = Number(raw);
    /* A shares row is edited as a count and re-priced from the share price, so
       its amount can never drift from count × price. A row whose campaign no
       longer sells shares is edited as a plain amount and loses its count. */
    const edited = (item: MinbarCartItem): MinbarCartItem => {
      const shares = item.shareCount ? sharesOf(item) : null;
      const price = sharePriceFor(shares, code, rate, format, formatLocal);
      if (shares && price) return Number.isInteger(value) ? { ...item, shareCount: value, amount: value * price.usd } : item;
      const given = fromLocal(value);
      return { ...item, amount: given.usd, currency: "USD", local: given.local, shareCount: undefined };
    };
    if (value > 0) replace(items.map((item, i) => (i === index ? edited(item) : item)));
  };

  /* A configured campaign becomes an ordinary project row, so checkout sends
     it as a campaign line like any other. `local`: the figure is in the
     visitor's currency (their exception list, or typed), stored as its USD
     value plus the exact figure. Otherwise USD. */
  const addProjectSuggestion = (project: MinbarProject, amount: number, local: boolean) => {
    if (!(amount > 0)) return;
    const given = local ? fromLocal(amount) : { usd: amount };
    if (tooSmall(given.usd, "local" in given ? given.local : undefined)) {
      setUpsellMinHint(project.id);
      return;
    }
    setUpsellMinHint(null);
    replace([
      ...items,
      { projectId: project.slug, typeKey: "project", freqKey: "once", amount: given.usd, currency: "USD", ...("local" in given && given.local ? { local: given.local } : {}), upsellId: project.id },
    ]);
    announceAdded(items.length);
  };

  /* `add(amount, typed)`: a typed figure is always in the visitor's currency. */
  type UpsellRow = { id: string; label: string; amounts: readonly number[]; localAmounts: boolean; add: (amount: number, typed?: boolean) => void };
  /* Only the dashboard's own campaigns are offered. The old built-in
     fallback rows named the previous foundation's projects, so a basket with
     no configured cross-sell simply shows none. */
  const upsellRows: UpsellRow[] = upsellProjects.map(({ project, amounts, local }) => ({
    id: project.id,
    label: project.title,
    amounts,
    localAmounts: local,
    add: (amount: number, typed?: boolean) => addProjectSuggestion(project, amount, local || Boolean(typed)),
  }));

  const canCheckout = hydrated && items.length > 0 && !belowMinimum;

  /* `Empty Cart.dc.html`: the cart glyph, one line of explanation, one way out. */
  if (hydrated && items.length === 0) {
    return (
      <div className="gf-cart gf-cart-empty">
        <svg className="gf-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="9" cy="21" r="1.3" />
          <circle cx="18" cy="21" r="1.3" />
          <path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" />
        </svg>
        <h1>{tv("emptyTitle")}</h1>
        <p>{tv("emptyText")}</p>
        <Link className="gf-pill" href={miaPath("projects", locale)}>
          {tv("browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="gf-cart">
      <h1 className="gf-wrap gf-cart-title">{tv("title")}</h1>

      <div className="gf-wrap gf-cart-grid">
        <div className="gf-cart-col">
          <section className="gf-card gf-cart-items" aria-label={tv("title")}>
            {/* Before hydration the cart contents are unknown to the server, so the
                card holds its shape rather than flashing the empty state. */}
            {!hydrated ? <div style={{ minHeight: 150 }} /> : null}
            {items.map((item, index) => {
              const recurring = item.freqKey !== "once";
              const note = noteLine(item);
              const shares = item.shareCount ? sharesOf(item) : null;
              const draft = drafts[index];
              return (
                <div
                  key={`${item.projectId ?? item.titleKey ?? item.title}-${index}`}
                  id={`cart-row-${index}`}
                  className={`gf-ct-row${addedIndex === index ? " is-added" : ""}`}
                >
                  <div className="gf-ct-head">
                    <h3>
                      {resolveTitle(item)}
                      {addedIndex === index ? (
                        <span className="cart-added-badge" role="status">
                          {tCommon("added")}
                        </span>
                      ) : null}
                    </h3>
                    <span className={`gf-ct-tag${recurring ? " is-rec" : ""}`}>{tv(FREQ_TAG[item.freqKey] ?? "tagOnce")}</span>
                    {note ? <small className="gf-ct-note">{note}</small> : null}
                    {lineTooSmall(item) ? (
                      <span role="alert" className="gf-ct-min">
                        {tGive("belowMinRow", { amount: minLabel })}
                        <button type="button" onClick={() => raiseToMinimum(index)}>
                          {tGive("raiseToMin", { amount: minLabel })}
                        </button>
                      </span>
                    ) : null}
                  </div>

                  <div className="gf-ct-end">
                    <label className="gf-ct-amt" title={tv("editAmount")}>
                      <span>{shares ? unitWordFor(shares, Number(draft ?? item.shareCount) || 2) : symbol}</span>
                      <input
                        value={draft ?? fieldValue(item)}
                        onChange={(e) => {
                          const next = decimalAmount(e.target.value);
                          setDrafts((d) => ({ ...d, [index]: next }));
                        }}
                        onBlur={() => commitEdit(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape")
                            setDrafts((d) => {
                              const next = { ...d };
                              delete next[index];
                              return next;
                            });
                        }}
                        inputMode="decimal"
                        aria-label={tv("editAmount")}
                      />
                    </label>
                    <button type="button" className="gf-ct-del" onClick={() => remove(index)} aria-label={tv("remove")} title={tv("remove")}>
                      {TRASH}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Cross-sell, in the design's card language (dashboard-driven). */}
          {hydrated && upsellRows.length ? (
            <section className="gf-card gf-upsell" aria-label={t("upsellHeading")}>
              <h2>{t("upsellHeading")}</h2>
              {upsellRows.map((suggestion) => (
                <div key={suggestion.id} className="gf-upsell-row">
                  <b>{suggestion.label}</b>
                  <div className="gf-upsell-amts">
                    {suggestion.amounts.map((value) => (
                      <button key={value} type="button" onClick={() => suggestion.add(value)} className="gf-upsell-amt">
                        <span aria-hidden="true">+</span>
                        <bdi>{suggestion.localAmounts ? formatLocal(value) : format(value)}</bdi>
                      </button>
                    ))}
                    <input
                      value={customUpsell[suggestion.id] ?? ""}
                      onChange={(e) => setCustomUpsell((c) => ({ ...c, [suggestion.id]: decimalAmount(e.target.value) }))}
                      inputMode="decimal"
                      placeholder={t("suggestedAmount")}
                      aria-label={t("suggestedAmount")}
                      className="gf-upsell-input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        suggestion.add(Number(customUpsell[suggestion.id]), true);
                        setCustomUpsell((c) => ({ ...c, [suggestion.id]: "" }));
                      }}
                      aria-label={tCommon("add")}
                      className="gf-upsell-add"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  {upsellMinHint === suggestion.id ? (
                    <span role="alert" className="gf-ct-min">
                      {tGive("minAmount", { amount: minLabel })}
                    </span>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
        </div>

        {/* The navy summary (`.ct-sum`). */}
        <aside id="cart-summary" className="gf-ct-sum" aria-label={tv("summary")}>
          <h2>{tv("summary")}</h2>
          <div className="gf-ct-line">
            <span>{tv("count")}</span>
            <b>{formatNumber(items.length)}</b>
          </div>
          {subtotals.map((group) => (
            <div key={group.freq} className="gf-ct-line">
              <span>{tv(group.freq === "once" ? "sumOnce" : FREQ_TAG[group.freq])}</span>
              <b>{sumLabel(group.rows)}</b>
            </div>
          ))}
          {teamCharged > 0 ? (
            <div className="gf-ct-line">
              <span>{teamRecurring ? tTeam("chosenRecurring", { amount: format(teamCharged) }) : tTeam("title")}</span>
              <b>{format(teamCharged)}</b>
            </div>
          ) : null}
          <div className="gf-ct-total">
            <span>{tv("total")}</span>
            <b>{totalLabel}</b>
          </div>

          {/* Support the team  once per basket, before checkout. With a
              recurring row it rides along with every instalment; with a
              one-time basket it is charged once. Hidden by the admin switch. */}
          {settings && teamSupportEnabled && items.length > 0 ? (
            <div id="cart-team-support" className="gf-team">
              <b>{tTeam("title")}</b>
              <span>{tTeam("lead")}</span>
              <div className="gf-team-pills">
                <button type="button" onClick={() => chooseTeamSupport(0)} aria-pressed={teamSupport === 0} data-on={teamSupport === 0 ? "1" : undefined}>
                  {tTeam("noThanks")}
                </button>
                {teamAmounts.map((value) => (
                  <button key={value} type="button" onClick={() => chooseTeamSupport(value)} aria-pressed={teamSupport === value} data-on={teamSupport === value ? "1" : undefined}>
                    <bdi>{format(value)}</bdi>
                  </button>
                ))}
                <input
                  value={customTeam}
                  onChange={(e) => {
                    const next = decimalAmount(e.target.value);
                    setCustomTeam(next);
                    const n = Number(next);
                    if (n > 0) {
                      writeTeamSupport(n);
                      setTeamSupport(n);
                    } else {
                      /* An emptied field is no answer  the question stands. */
                      clearTeamSupport();
                      setTeamSupport(null);
                    }
                  }}
                  inputMode="decimal"
                  dir="ltr"
                  placeholder={tTeam("customAmount")}
                  aria-label={tTeam("customAmount")}
                  data-on={teamAmount > 0 && !teamAmounts.includes(teamAmount) ? "1" : undefined}
                />
              </div>
              {/* A recurring basket lets the donor decide whether the support
                  rides along with each instalment or is paid once. */}
              {recurringBasket && teamAmount > 0 ? (
                <div className="gf-team-pills">
                  <button type="button" onClick={() => chooseTeamRecurring(true)} aria-pressed={teamRecurring} data-on={teamRecurring ? "1" : undefined}>
                    {tTeam("billWithPlan")}
                  </button>
                  <button type="button" onClick={() => chooseTeamRecurring(false)} aria-pressed={!teamRecurring} data-on={!teamRecurring ? "1" : undefined}>
                    {tTeam("billOnce")}
                  </button>
                </div>
              ) : null}
              <small data-rec={teamRecurring ? "1" : undefined}>{teamRecurring ? tTeam("recurringNote") : tTeam("oneTimeNote")}</small>
            </div>
          ) : null}

          {canCheckout ? (
            <Link className="gf-ct-go" href={miaPath("checkout", locale)}>
              {tv("checkout")}
            </Link>
          ) : (
            <span className="gf-ct-go" aria-disabled="true">
              {tv("checkout")}
            </span>
          )}
          {belowMinimum ? (
            <span role="status" className="gf-ct-warn">
              {tGive("belowMinCheckout", { amount: minLabel })}
            </span>
          ) : null}
          <Link className="gf-ct-more" href={miaPath("projects", locale)}>
            {tv("more")}
          </Link>
          <p className="gf-ct-safe">
            {LOCK}
            {tv("secure")}
          </p>
        </aside>
      </div>
    </div>
  );
}
