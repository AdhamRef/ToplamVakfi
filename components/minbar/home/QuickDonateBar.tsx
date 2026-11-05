"use client";

import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { formatMoney } from "@/lib/minbar/money";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import QuickCauseSelect, { type QuickCause } from "@/components/minbar/shell/QuickCauseSelect";
import {
  quickAllowedProjects,
  quickInitialDestination,
  quickTitleKey,
  resolveQuickAmounts,
  type QuickDonationConfig,
  type QuickGenericDestination,
  type QuickProject,
} from "@/lib/minbar/quick-donation";

/**
 * The quick-donation disc in the hero  the Toplum Vakfı design's «دائرة
 * الخير» (`ToplamVakfi-design/Toplum Vakfı Homepage.dc.html`, `.th-ring`).
 * Everything it offers is set from the dashboard (`/dashboard/quick-donation`)
 * and arrives as `config`; see `lib/minbar/quick-donation.ts` for the shape and
 * the defaults. It used to be a bar pinned to the bottom of the viewport; the
 * same choices now sit in one circle beside the headline:
 *
 *        التبرع السريع
 *      [−]   US$300   [+]
 *   مرة واحدة · يوميًا · شهريًا
 *   [ destination ▾ ] [مبلغ آخر]
 *     $100 $300 $500 $700
 *      [ ♥ تبرّع الآن ]
 *
 *   · The destination is ONE select (`shell/QuickCauseSelect`, shared with the
 *     bar on the other pages)  the generic intentions first, then the
 *     projects the dashboard allows under a group heading.
 *   · − / + step through the presets (or by 10 in the free field), and each
 *     says which amount it will pick. The arc around the disc traces how far
 *     up the presets the choice is.
 *   · The disc is a fixed size (ToplamVakfi-design/CLAUDE.md: no aspect-ratio
 *     on a circle with dynamic content); every row is short enough for the
 *     chord at its own height, and long labels ellipsize.
 *
 * Money. Presets are USD and shown converted to the visitor's currency, the
 * way every figure on the site is  UNLESS the dashboard gave that currency
 * its own presets, in which case those are shown as they are and go to the
 * cart in that currency. The free field is always in the visitor's currency:
 * the symbol beside it is what they see, so that is what they give.
 *
 * Everything held here is an identifier, never a displayed string: the
 * destination is a project slug or a generic key, the frequency is
 * `once`/`daily`/`friday`/`monthly`. Storing a label would send Arabic text to
 * the cart from a French session the moment the labels were translated.
 *
 * The donate action adds to the basket and routes to the cart  the same path
 * as "add to basket" on a project card.
 *
 * On a phone a circle cannot hold these controls at a usable size, so the same
 * markup is drawn as a full-width card and the orbits and arc are dropped
 * (`.tv-ring` in `styles/minbar/pages/home.css`).
 */

const FREQ_KEY: Record<CartFreqKey, string> = {
  once: "oneTime",
  daily: "daily",
  friday: "everyFriday",
  monthly: "monthly",
};

/** The generic destinations: their i18n namespace and key. */
const GENERIC: Record<QuickGenericDestination, { ns: "common" | "navigation" | "homepage"; key: string }> = {
  "where-needed": { ns: "common", key: "whereNeedGreatest" },
  zakat: { ns: "navigation", key: "zakat" },
  "gaza-relief": { ns: "homepage", key: "gazaReliefGroup" },
};

/** What − / + move a free amount by, in the visitor's currency. */
const FREE_STEP = 10;

const Heart = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" />
  </svg>
);

export default function QuickDonateBar({ config, projects }: { config: QuickDonationConfig; projects: QuickProject[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const tHome = useTranslations("homepage");
  const tNav = useTranslations("navigation");
  const tRing = useTranslations("tvHome.ring");
  const { format, currency: selectedCurrency, symbol } = useMinbarMoney();
  const dir = (LOCALES as Record<string, { direction?: "rtl" | "ltr" }>)[locale]?.direction ?? "rtl";

  /* ── What the dashboard allows ─────────────────────────────────────── */

  /** The visitor's currency code, for the free field and any preset override. */
  const visitorCode = selectedCurrency && selectedCurrency !== "DEFAULT" ? selectedCurrency : "USD";
  const presets = resolveQuickAmounts(config, visitorCode);
  const suggested = Math.min(config.suggestedIndex, presets.amounts.length - 1);

  const shownProjects = useMemo(() => quickAllowedProjects(config, projects), [config, projects]);

  const label = (g: QuickGenericDestination) => {
    const { ns, key } = GENERIC[g];
    return ns === "common" ? t(key) : ns === "navigation" ? tNav(key) : tHome(key);
  };

  /** The default destination as an option value: a generic id or a project slug. */
  const initialDestination = useMemo(() => quickInitialDestination(config, shownProjects), [config, shownProjects]);

  /* ── State ──────────────────────────────────────────────────────────── */

  const [destination, setDestination] = useState<string>(initialDestination);
  const [freq, setFreq] = useState<CartFreqKey>(config.defaultFrequency);
  const [amount, setAmount] = useState<number>(presets.amounts[suggested]);
  /** "" = a preset is selected; digits = the free field is in use. */
  const [custom, setCustom] = useState("");

  /* If the visitor changes currency to one with its own presets, the chosen
     preset may no longer exist; fall back to the suggested one. */
  useEffect(() => {
    if (!custom && !presets.amounts.includes(amount)) setAmount(presets.amounts[suggested]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presets.currency]);

  const isGeneric = (config.genericDestinations as string[]).includes(destination);

  /* The total and the currency it is in  see "Money" above. */
  const total = custom ? Number(custom) : amount;
  const totalCurrency = custom ? visitorCode : presets.currency;
  const showMoney = (value: number, code: string) => (code === "USD" ? format(value) : formatMoney(value, code, locale));
  const totalText = showMoney(total || 0, totalCurrency);
  const canGive = total > 0;

  const submit = () => {
    if (!canGive) return;
    addToCart(
      isGeneric
        ? {
            titleKey: quickTitleKey(destination),
            typeKey: "project",
            freqKey: freq,
            amount: total,
            currency: totalCurrency,
          }
        : { projectId: destination, typeKey: "project", freqKey: freq, amount: total, currency: totalCurrency }
    );
    router.push(miaPath("cart", locale));
  };

  if (!config.enabled) return null;

  const hasDestinations = config.genericDestinations.length + shownProjects.length > 1;
  const hasFrequencies = config.frequencies.length > 1;

  /* ── The stepper ──────────────────────────────────────────────────────
     On a preset it moves to the neighbouring preset; in the free field it
     moves the typed amount by FREE_STEP. Each button is labelled with the
     amount it will pick, so it needs no copy of its own. */
  const presetIndex = custom ? -1 : presets.amounts.indexOf(amount);
  const stepTarget = (direction: 1 | -1): { value: number; code: string } | null => {
    if (custom) {
      const next = Math.max(0, Number(custom) + direction * FREE_STEP);
      return next > 0 ? { value: next, code: visitorCode } : null;
    }
    const at = presetIndex + direction;
    return at >= 0 && at < presets.amounts.length ? { value: presets.amounts[at], code: presets.currency } : null;
  };
  const step = (direction: 1 | -1) => {
    const target = stepTarget(direction);
    if (!target) return;
    if (custom) setCustom(String(target.value));
    else setAmount(target.value);
  };
  const stepButton = (direction: 1 | -1) => {
    const target = stepTarget(direction);
    return (
      <button
        type="button"
        className="tv-ring-sb"
        onClick={() => step(direction)}
        disabled={!target}
        aria-label={target ? showMoney(target.value, target.code) : undefined}
      >
        <span aria-hidden="true">{direction === 1 ? "+" : "−"}</span>
      </button>
    );
  };

  /** The arc around the disc: how far up the presets the choice is. */
  const arc = custom
    ? 100
    : Math.round(((Math.max(0, presetIndex) + 1) / Math.max(1, presets.amounts.length)) * 100);

  const generics: QuickCause[] = config.genericDestinations.map((g) => ({ value: g, label: label(g) }));
  const projectCauses: QuickCause[] = shownProjects.map((p) => ({ value: p.slug, label: p.title, meta: p.regionLabel, image: p.image }));
  /* The dashboard's own title for this language, else the site copy. */
  const title = config.titles[locale]?.trim() || tRing("title");

  /* The disc's selected state is the dark-surface pick: brand fill, navy text
     (ToplamVakfi-design/CLAUDE.md), so it keys off `data-on`, not the light
     `data-chip` treatment the rest of the site uses. */
  return (
    <section id="quick" className="tv-ring" aria-labelledby="quick-title" data-freqs={config.frequencies.length}>
      <span aria-hidden="true" className="tv-ring-orbit tv-ring-orbit--1"><i /><i /></span>
      <span aria-hidden="true" className="tv-ring-orbit tv-ring-orbit--2"><i /><i /><i /></span>
      <svg className="tv-ring-arc" viewBox="0 0 340 340" aria-hidden="true">
        <circle cx="170" cy="170" r="166" pathLength="100" style={{ strokeDasharray: `${arc} 100` }} />
      </svg>

      <div className="tv-ring-disc">
        <h2 id="quick-title" className="tv-ring-title">{title}</h2>
        <span className="tv-ring-sub">{tRing("sub")}</span>

        <div className="tv-ring-step">
          {stepButton(-1)}
          <output className="tv-ring-amt" dir="ltr" aria-live="polite">{totalText}</output>
          {stepButton(1)}
        </div>

        {hasFrequencies ? (
          <div className="tv-ring-freq" role="group" aria-label={tRing("freqLabel")}>
            {config.frequencies.map((f) => (
              <button key={f} type="button" data-on={freq === f ? "true" : "false"} aria-pressed={freq === f} onClick={() => setFreq(f)}>
                {t(FREQ_KEY[f])}
              </button>
            ))}
          </div>
        ) : null}

        {hasDestinations || config.allowCustomAmount ? (
          <div className="tv-ring-row">
            {hasDestinations ? (
              <QuickCauseSelect
                value={destination}
                onChange={setDestination}
                generics={generics}
                projects={projectCauses}
                genericsHeading={tHome("projectSelectLabel")}
                projectsHeading={tNav("projects")}
                caption={tRing("destLabel")}
                dir={dir}
                tone="dark"
              />
            ) : null}
            {config.allowCustomAmount ? (
              <label className="tv-ring-free" data-active={custom ? "true" : "false"}>
                <small dir="ltr">{symbol}</small>
                <input
                  value={custom}
                  onChange={(e) => setCustom(decimalAmount(e.target.value))}
                  inputMode="numeric"
                  placeholder={t("freeAmount")}
                  aria-label={t("freeAmount")}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="tv-ring-presets" role="group" aria-label={t("amount")}>
          {presets.amounts.map((value) => {
            const active = !custom && amount === value;
            return (
              <button
                key={value}
                type="button"
                data-on={active ? "true" : "false"}
                aria-pressed={active}
                onClick={() => { setAmount(value); setCustom(""); }}
              >
                <span dir="ltr">{showMoney(value, presets.currency)}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="tv-ring-go" onClick={submit} disabled={!canGive}>
          <Heart />
          {tRing("go")}
        </button>
      </div>
    </section>
  );
}
