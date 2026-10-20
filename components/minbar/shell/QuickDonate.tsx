"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";
import { miaPath, NOINDEX_ROUTES, routeForPathname } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import type { MinbarProject } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import ShellIcon from "./ShellIcons";
import { QUICK_DONATE_OPEN_EVENT } from "./quick-donate-styles";
import { QUICK_DONATE_CLOSED_KEY } from "./shell-events";

/**
 * Quick donation bar — `.tv-qd` in `Toplum Vakfı Header.dc.html`.
 *
 * Desktop: a permanent pill-shaped bar floating at the foot of every page
 * (cause · three amounts · other amount · «تبرع الآن»). Phone: hidden until the
 * bottom navigation's «تبرع الآن» opens it as a panel above the bar, with a
 * close button.
 *
 * Not shown where the page already is the donation flow (cart, checkout,
 * payment states, receipts, the account) nor on the homepage, whose own
 * donation dock takes this place.
 *
 * Giving: the cause is "where the need is greatest" or one of the real
 * published projects (fetched once the bar is shown); presets are USD and
 * displayed in the visitor's currency; a typed amount is taken in the
 * visitor's currency, exactly as the home quick bar does. Submitting adds the
 * line to the basket and goes to the cart — never straight to checkout.
 */

const PRESETS = [50, 100, 250];
const DEFAULT_PRESET = 100;
const PHONE = "(max-width: 760px)";

interface RegionGroup {
  region: string;
  label: string;
  items: MinbarProject[];
}

export interface QuickDonateProps {
  /** Overrides the quick-pick amounts (USD). */
  amounts?: number[];
}

export default function QuickDonate({ amounts = PRESETS }: QuickDonateProps) {
  const locale = useLocale();
  const dir = localeDirection(locale);
  const t = useTranslations("tvShell");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { format, code, symbol } = useMinbarMoney();

  const route = routeForPathname(pathname);
  const allowed = route !== "home" && !(route && NOINDEX_ROUTES.has(route));

  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<RegionGroup[]>([]);
  const [fund, setFund] = useState("");
  const [amount, setAmount] = useState(amounts.includes(DEFAULT_PRESET) ? DEFAULT_PRESET : amounts[0]);
  const [custom, setCustom] = useState("");

  /* Desktop: shown on arrival unless hidden this session. Phone: closed until asked. */
  useEffect(() => {
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
    setOpen(!window.matchMedia(PHONE).matches && !closed);
  }, [allowed, pathname]);

  /* The bottom navigation's «تبرع الآن» toggles the phone panel. */
  useEffect(() => {
    if (!allowed) return;
    const onOpen = (event: Event) => {
      event.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_DONATE_OPEN_EVENT, onOpen);
  }, [allowed]);

  /* The footer leaves room for the bar while it is on screen. */
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.setAttribute("data-qd", "on");
    else root.removeAttribute("data-qd");
    return () => root.removeAttribute("data-qd");
  }, [open]);

  /* Real causes: the published projects, fetched once the bar is shown. */
  useEffect(() => {
    if (!open || groups.length) return;
    let cancelled = false;
    fetch(`/api/minbar/projects?locale=${encodeURIComponent(locale)}`)
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data: { groups?: RegionGroup[] }) => {
        if (!cancelled) setGroups(Array.isArray(data.groups) ? data.groups : []);
      })
      .catch(() => {
        /* "where the need is greatest" stays available */
      });
    return () => {
      cancelled = true;
    };
  }, [open, groups.length, locale]);

  if (!allowed || !open) return null;

  const close = () => {
    setOpen(false);
    if (!window.matchMedia(PHONE).matches) {
      try {
        window.sessionStorage.setItem(QUICK_DONATE_CLOSED_KEY, "1");
      } catch {
        /* not remembered */
      }
    }
  };

  const typed = Number(custom);
  const give = () => {
    const usePreset = !(typed > 0);
    const value = usePreset ? amount : typed;
    if (!(value > 0)) return;
    const project = fund ? groups.flatMap((g) => g.items).find((p) => p.slug === fund) : undefined;
    addToCart({
      projectId: project ? project.slug : undefined,
      titleKey: project ? undefined : "whereNeedGreatest",
      title: project?.title,
      typeKey: "project",
      freqKey: "once",
      amount: value,
      currency: usePreset ? "USD" : code,
    });
    router.push(miaPath("cart", locale));
  };

  return (
    <div className="tv-qd" role="region" aria-label={t("qd.label")} dir={dir}>
      <div className="tv-qd-in">
        <span className="tv-qd-label">
          <ShellIcon name="heart" />
          {t("qd.label")}
        </span>
        <select className="tv-qd-fund" aria-label={t("qd.fund")} value={fund} onChange={(event) => setFund(event.target.value)}>
          <option value="">{t("qd.whereNeed")}</option>
          {groups.map((group) =>
            group.items.length ? (
              <optgroup key={group.region} label={group.label}>
                {group.items.map((project) => (
                  <option key={project.slug} value={project.slug}>
                    {project.title}
                  </option>
                ))}
              </optgroup>
            ) : null
          )}
        </select>
        <div className="tv-qd-amts" role="group" aria-label={t("qd.amount")}>
          {amounts.map((value) => (
            <button
              key={value}
              type="button"
              className={!(typed > 0) && amount === value ? "on" : undefined}
              aria-pressed={!(typed > 0) && amount === value}
              onClick={() => {
                setAmount(value);
                setCustom("");
              }}
            >
              {format(value, { maximumFractionDigits: 0 })}
            </button>
          ))}
        </div>
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
        <button type="button" className="tv-qd-go" onClick={give}>
          {t("qd.go")}
        </button>
        <button type="button" className="tv-qd-x" onClick={close} aria-label={t("qd.hide")}>
          <ShellIcon name="close" />
        </button>
      </div>
    </div>
  );
}
