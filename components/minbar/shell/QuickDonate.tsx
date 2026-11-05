"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";
import { miaPath, NOINDEX_ROUTES, routeForPathname } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { formatMoney } from "@/lib/minbar/money";
import type { MinbarProject } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import {
  quickAllowedProjects,
  quickInitialDestination,
  quickTitleKey,
  resolveQuickAmounts,
  type QuickDonationConfig,
  type QuickGenericDestination,
} from "@/lib/minbar/quick-donation";
import QuickCauseSelect, { type QuickCause } from "./QuickCauseSelect";
import ShellIcon from "./ShellIcons";
import { QUICK_DONATE_OPEN_EVENT } from "./quick-donate-styles";
import { QUICK_DONATE_CLOSED_KEY } from "./shell-events";

/**
 * Quick donation bar — `.tv-qd` in `Toplum Vakfı Header.dc.html`.
 *
 * Everything it offers is the dashboard's (`/dashboard/quick-donation`), the
 * same document the homepage disc reads: whether it shows per device, the
 * amounts, the frequencies, the destinations and the title.
 *
 * Desktop: a bar floating at the foot of every page (cause · frequency ·
 * amounts · other amount · «تبرع الآن»). Phone: a flat bar fixed above the
 * bottom navigation, one row saying what will be given with the button beside
 * it; the row or the navigation's «تبرع» unfolds the rest above it.
 *
 * Not shown where the page already is the donation flow (cart, checkout,
 * payment states, receipts, the account), on a campaign page, which has its own
 * donation panel, nor on the homepage, which has the disc.
 *
 * Money follows the disc: presets are USD and shown converted, unless the
 * dashboard gave the visitor's currency its own; a typed amount is in the
 * visitor's currency. Submitting adds the line to the basket and goes to the
 * cart — never straight to checkout.
 */

const PHONE = "(max-width: 760px)";

const FREQ_KEY: Record<CartFreqKey, string> = {
  once: "freqOnce",
  daily: "freqDaily",
  friday: "freqFriday",
  monthly: "freqMonthly",
};

const GENERIC_KEY: Record<QuickGenericDestination, string> = {
  "where-needed": "whereNeed",
  zakat: "zakat",
  "gaza-relief": "gazaRelief",
};

interface RegionGroup {
  region: string;
  label: string;
  items: MinbarProject[];
}

export default function QuickDonate({ config }: { config: QuickDonationConfig }) {
  const locale = useLocale();
  const dir = localeDirection(locale);
  const t = useTranslations("tvShell");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { format, code, symbol, currency } = useMinbarMoney();

  const route = routeForPathname(pathname);
  /* A campaign page has its own donation panel, which answers the bottom
     navigation's «تبرع» itself; a second, generic panel there would compete. */
  const allowed = config.enabled && route !== "home" && route !== "projectDetail" && !(route && NOINDEX_ROUTES.has(route));

  const visitorCode = currency && currency !== "DEFAULT" ? currency : code;
  const presets = resolveQuickAmounts(config, visitorCode);
  const suggested = Math.min(config.suggestedIndex, presets.amounts.length - 1);

  const [open, setOpen] = useState(false);
  /* Phone only: the amounts and the cause, unfolded above the row. */
  const [expanded, setExpanded] = useState(false);
  const [groups, setGroups] = useState<RegionGroup[]>([]);
  /* null until the visitor picks one: the default may be a project still loading. */
  const [chosen, setChosen] = useState<string | null>(null);
  const [freq, setFreq] = useState<CartFreqKey>(config.defaultFrequency);
  const [picked, setPicked] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  /* Shown on arrival where the dashboard keeps the dock for this device, unless hidden this session. */
  useEffect(() => {
    setExpanded(false);
    if (!allowed) {
      setOpen(false);
      return;
    }
    let closed = false;
    try {
      closed = window.sessionStorage.getItem(QUICK_DONATE_CLOSED_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    const dock = window.matchMedia(PHONE).matches ? config.dockMobile : config.dockDesktop;
    setOpen(dock && !closed);
  }, [allowed, pathname, config.dockMobile, config.dockDesktop]);

  /* The bottom navigation's «تبرع» unfolds the bar. With the phone dock off it
     is left uncancelled, and the navigation goes to the cart. */
  useEffect(() => {
    if (!allowed || !config.dockMobile) return;
    const onOpen = (event: Event) => {
      event.preventDefault();
      setOpen(true);
      setExpanded((v) => !v);
    };
    window.addEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
  }, [allowed, config.dockMobile]);

  /* The footer and the WhatsApp button leave room for the bar while it is on screen. */
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.setAttribute("data-qd", "on");
    else root.removeAttribute("data-qd");
    return () => root.removeAttribute("data-qd");
  }, [open]);

  /* Real causes: the published projects the dashboard allows, fetched once the bar is shown. */
  const wantsProjects = config.projectsMode !== "none";
  useEffect(() => {
    if (!open || !wantsProjects || groups.length) return;
    let cancelled = false;
    fetch(`/api/minbar/projects?locale=${encodeURIComponent(locale)}`)
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data: { groups?: RegionGroup[] }) => {
        if (!cancelled) setGroups(Array.isArray(data.groups) ? data.groups : []);
      })
      .catch(() => {
        /* the generic destinations stay available */
      });
    return () => {
      cancelled = true;
    };
  }, [open, wantsProjects, groups.length, locale]);

  /* A campaign filed under two regions is listed in both groups; the select lists it once. */
  const projects = useMemo(() => {
    const bySlug = new Map(groups.flatMap((g) => g.items).map((p) => [p.slug, p]));
    return quickAllowedProjects(config, [...bySlug.values()]);
  }, [groups, config]);

  if (!allowed || !open) return null;

  const close = () => {
    setOpen(false);
    setExpanded(false);
    try {
      window.sessionStorage.setItem(QUICK_DONATE_CLOSED_KEY, "1");
    } catch {
      /* not remembered */
    }
  };

  const generics: QuickCause[] = config.genericDestinations.map((g) => ({ value: g, label: t(`qd.${GENERIC_KEY[g]}`) }));
  const projectCauses: QuickCause[] = projects.map((p) => ({ value: p.slug, label: p.title, meta: p.regionLabel, image: p.image }));
  const fund = chosen ?? quickInitialDestination(config, projects);
  const causeLabel = [...generics, ...projectCauses].find((c) => c.value === fund)?.label ?? "";
  const hasCauses = generics.length + projectCauses.length > 1;

  const preset = picked !== null && presets.amounts.includes(picked) ? picked : presets.amounts[suggested];
  const typed = config.allowCustomAmount ? Number(custom) : 0;
  const usingTyped = typed > 0;
  const value = usingTyped ? typed : preset;
  const valueCurrency = usingTyped ? visitorCode : presets.currency;
  const showMoney = (amount: number, money: string) => (money === "USD" ? format(amount, { maximumFractionDigits: 0 }) : formatMoney(amount, money, locale));

  const give = () => {
    if (!(value > 0)) return;
    const isGeneric = (config.genericDestinations as string[]).includes(fund);
    addToCart({
      projectId: isGeneric ? undefined : fund,
      titleKey: isGeneric ? quickTitleKey(fund) : undefined,
      typeKey: "project",
      freqKey: freq,
      amount: value,
      currency: valueCurrency,
    });
    router.push(miaPath("cart", locale));
  };

  const label = config.titles[locale]?.trim() || t("qd.label");

  return (
    <div className="tv-qd" role="region" aria-label={label} dir={dir} data-expanded={expanded ? "true" : "false"}>
      <div className="tv-qd-in">
        <span className="tv-qd-label">
          <ShellIcon name="heart" />
          {label}
        </span>

        <div className="tv-qd-body" id="tv-qd-body">
          <div className="tv-qd-sheet-head">
            <b>{label}</b>
            <button type="button" className="tv-qd-x" onClick={close} aria-label={t("qd.hide")}>
              <ShellIcon name="close" />
            </button>
          </div>
          {hasCauses ? (
            <div className="tv-qd-fund">
              <QuickCauseSelect
                value={fund}
                onChange={setChosen}
                generics={generics}
                projects={projectCauses}
                genericsHeading={t("qd.fund")}
                projectsHeading={t("nav.projects")}
                caption={t("qd.fund")}
                dir={dir}
                tone="light"
              />
            </div>
          ) : null}
          {config.frequencies.length > 1 ? (
            <div className="tv-qd-freq" role="group" aria-label={t("qd.freq")}>
              {config.frequencies.map((f) => (
                <button key={f} type="button" className={freq === f ? "on" : undefined} aria-pressed={freq === f} onClick={() => setFreq(f)}>
                  {t(`qd.${FREQ_KEY[f]}`)}
                </button>
              ))}
            </div>
          ) : null}
          <div className="tv-qd-amts" role="group" aria-label={t("qd.amount")} data-count={presets.amounts.length}>
            {presets.amounts.map((amount) => (
              <button
                key={amount}
                type="button"
                className={!usingTyped && preset === amount ? "on" : undefined}
                aria-pressed={!usingTyped && preset === amount}
                onClick={() => {
                  setPicked(amount);
                  setCustom("");
                }}
              >
                {showMoney(amount, presets.currency)}
              </button>
            ))}
          </div>
          {config.allowCustomAmount ? (
            <label className="tv-qd-custom">
              <span>{symbol}</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={custom}
                placeholder={t("qd.other")}
                aria-label={t("qd.other")}
                onChange={(event) => setCustom(event.target.value)}
              />
            </label>
          ) : null}
        </div>

        {/* Phone only: the row that says what the button will give. */}
        <button type="button" className="tv-qd-sum" aria-expanded={expanded} aria-controls="tv-qd-body" onClick={() => setExpanded((v) => !v)}>
          <span className="tv-qd-sum-text">
            <b dir="ltr">{showMoney(value, valueCurrency)}</b>
            <small>{causeLabel}</small>
          </span>
          <svg className="tv-qd-sum-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>

        <button type="button" className="tv-qd-go" onClick={give} disabled={!(value > 0)}>
          {t("qd.go")}
        </button>
        <button type="button" className="tv-qd-x tv-qd-x--bar" onClick={close} aria-label={t("qd.hide")}>
          <ShellIcon name="close" />
        </button>
      </div>
    </div>
  );
}
