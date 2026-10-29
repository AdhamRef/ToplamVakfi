"use client";
/* eslint-disable @next/next/no-img-element -- the brand mark is a fixed local asset served through the image proxy. */

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, SUPPORTED_LOCALES, localeDirection, type SupportedLocale } from "@/lib/locales";
import { SUPPORTED_CURRENCY_OPTIONS } from "@/lib/supported-currencies";
import { CURRENCY_COOKIE_UPDATED_EVENT } from "@/components/CurrencyFromUrlSync";
import { miaPath, routeForPathname, type MinbarRoute } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { useMinbarCartCount } from "@/hooks/useMinbarCart";
import { CART_BUMP_EVENT, CART_TARGET_ATTR } from "@/lib/minbar/cart-feedback";
import type { NavCategory } from "@/lib/minbar/categories";
import { imageSrcSet, imageUrl } from "@/lib/minbar/image-url";
import HeaderSearch from "./HeaderSearch";
import ShellIcon, { type ShellIconName } from "./ShellIcons";
import {
  LANG_CHOSEN_KEY,
  SHELL_DRAWER_OPEN_EVENT,
} from "./shell-events";

/**
 * Site header — `ToplamVakfi-design/Toplum Vakfı Header.dc.html`.
 *
 * One fixed bar, measured into the spacer below it: logo · language pill ·
 * currency · nav with the design's dropdown groups · search · profile · cart ·
 * «تبرع الآن». Nothing sits above it: the "this site is available in …" bar
 * and the homepage announcement strip were removed.
 *
 * Under 829px the nav moves into the drawer; under 761px the bottom navigation
 * (`MobileBottomNav`) carries home / programmes / donate / stories / more, and
 * the header keeps only the logo with language + currency on one side and
 * profile + cart on the other.
 *
 * Kept from the previous header: the cart badge and its bump on
 * `CART_BUMP_EVENT` (and `CART_TARGET_ATTR`, the coin's landing point), the
 * account routing (sign-in with a callback for guests), the admin dashboard
 * door, `linkOverrides` from the dashboard, the currency cookie shared with
 * the rest of the app, and a language switch that keeps the visitor on the
 * same page.
 */

type NavKey = "about" | "programs" | "impact" | "stories" | "partners" | "contact";

interface SubLink {
  route: MinbarRoute;
  /** Anchor on the target page, without `#`. */
  hash?: string;
  /** Key under `tvShell.nav`. */
  key: string;
  icon: ShellIconName;
}

interface NavGroup {
  key: NavKey;
  route: MinbarRoute;
  /** Two-column panel (`.tv-sub--2`). */
  wide?: boolean;
  sub?: readonly SubLink[];
}

/** The design's navigation, in its order and grouping. */
const NAV: readonly NavGroup[] = [
  {
    key: "about",
    route: "about",
    wide: true,
    sub: [
      { route: "ourStory", key: "ourStory", icon: "story" },
      { route: "about", hash: "vision", key: "vision", icon: "eye" },
      { route: "about", hash: "mission", key: "message", icon: "send" },
      { route: "about", hash: "purpose", key: "mission", icon: "flag" },
      { route: "about", hash: "goals", key: "goals", icon: "target" },
      { route: "presidentLetter", key: "presidentLetter", icon: "person" },
      { route: "board", key: "board", icon: "people" },
    ],
  },
  {
    key: "programs",
    route: "programs",
    wide: true,
    sub: [
      { route: "programs", hash: "values", key: "values", icon: "sprout" },
      { route: "programs", hash: "human", key: "human", icon: "people" },
      { route: "programs", hash: "youth", key: "youth", icon: "trend" },
      { route: "programs", hash: "community", key: "community", icon: "heart" },
      { route: "projects", key: "hope", icon: "star" },
    ],
  },
  {
    key: "impact",
    route: "reports",
    sub: [
      { route: "reports", key: "impact", icon: "chart" },
      { route: "transparency", key: "transparency", icon: "doc" },
      { route: "news", key: "news", icon: "news" },
    ],
  },
  { key: "stories", route: "stories" },
  { key: "partners", route: "partner" },
  { key: "contact", route: "contact" },
];

/** Which top-level item lights for the current page (a submenu match lights its parent). */
const ACTIVE_OF: Partial<Record<MinbarRoute, NavKey>> = {
  about: "about",
  ourStory: "about",
  presidentLetter: "about",
  board: "about",
  programs: "programs",
  programDetail: "programs",
  projects: "programs",
  projectDetail: "programs",
  reports: "impact",
  transparency: "impact",
  news: "impact",
  stories: "stories",
  partner: "partners",
  contact: "contact",
};

/** The drawer's list, as the design orders it. */
const DRAWER: ReadonlyArray<readonly [MinbarRoute, string]> = [
  ["about", "about"],
  ["programs", "programs"],
  ["projects", "projects"],
  ["news", "allNews"],
  ["reports", "impact"],
  ["stories", "ourStories"],
  ["partner", "partners"],
  ["contact", "contact"],
];

/** The design offers these three; any other currency already in the cookie stays listed. */
const DESIGN_CURRENCIES = ["USD", "EUR", "TRY"];

type Dropdown = { id: "lang" | "curr"; top: number; side: number } | null;

export interface HeaderProps {
  /** Route key of the current page; derived from the pathname when absent. */
  active?: MinbarRoute;
  /** Kept for callers; the WhatsApp line comes from `ORG`. */
  whatsappNumber?: string;
  /**
   * Dashboard-editable link overrides, keyed by the nav key
   * (`about`, `programs`, `impact`, `stories`, `partners`, `contact`, `donate`).
   */
  linkOverrides?: Record<string, string>;
  /** Whether a donor session exists — drives where the account icon points. */
  signedIn?: boolean;
  /** An ADMIN session gets a direct door to the dashboard. */
  isAdmin?: boolean;
  /** Kept for callers; the design's menus are fixed and do not list categories. */
  categories?: NavCategory[];
}

export default function Header({ active, linkOverrides, signedIn = false, isAdmin = false }: HeaderProps) {
  const locale = useLocale() as SupportedLocale;
  const dir = localeDirection(locale);
  const t = useTranslations("tvShell");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const route = active ?? routeForPathname(pathname);
  const activeKey = route ? ACTIVE_OF[route] : undefined;

  const [currency, setCurrency] = useState("USD");
  const [dropdown, setDropdown] = useState<Dropdown>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const basket = useMinbarCartCount();

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const spacerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const href = useCallback(
    (r: MinbarRoute, key?: string, hash?: string) =>
      (key && !hash && linkOverrides?.[key]) || `${miaPath(r, locale)}${hash ? `#${hash}` : ""}`,
    [linkOverrides, locale]
  );

  /* ── Cart: the bump and the "added" toast ───────────────────────────── */
  const [cartBump, setCartBump] = useState(false);
  const [toast, setToast] = useState(false);
  const lastCount = useRef<number | null>(null);
  useEffect(() => {
    let timer = 0;
    let frame = 0;
    const onBump = () => {
      setCartBump(false);
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setCartBump(true);
        timer = window.setTimeout(() => setCartBump(false), 600);
      });
    };
    window.addEventListener(CART_BUMP_EVENT, onBump);
    return () => {
      window.removeEventListener(CART_BUMP_EVENT, onBump);
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, []);
  /* The design notifies on every add. The basket count rising is the one
     signal every add path shares; the cart and checkout pages show the basket
     themselves, so they stay quiet. */
  useEffect(() => {
    const previous = lastCount.current;
    lastCount.current = basket;
    if (previous === null || basket <= previous) return;
    if (route === "cart" || route === "checkout") return;
    setToast(true);
    const timer = window.setTimeout(() => setToast(false), 3200);
    return () => window.clearTimeout(timer);
  }, [basket, route]);

  /* ── The spacer reserves exactly the fixed stack's height ───────────── */
  useEffect(() => {
    const stack = stackRef.current;
    const spacer = spacerRef.current;
    if (!stack || !spacer) return;
    let applied = -1;
    const sync = () => {
      const next = Math.ceil(stack.getBoundingClientRect().height);
      if (Math.abs(next - applied) < 0.5) return;
      applied = next;
      requestAnimationFrame(() => {
        spacer.style.height = `${next}px`;
        document.documentElement.style.setProperty("--mia-head-h", `${next}px`);
      });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    if (observer) observer.observe(stack);
    else sync();
    window.addEventListener("resize", sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  /* ── Currency: the cookie the rest of the app reads ─────────────────── */
  useEffect(() => {
    const sync = () => {
      const saved = Cookies.get("currency");
      setCurrency(!saved || saved === "DEFAULT" ? "USD" : saved);
    };
    sync();
    window.addEventListener(CURRENCY_COOKIE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CURRENCY_COOKIE_UPDATED_EVENT, sync);
  }, []);

  /* ── Panels close on navigation, outside click and Escape ───────────── */
  useEffect(() => {
    setDrawerOpen(false);
    setDropdown(null);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener(SHELL_DRAWER_OPEN_EVENT, open);
    return () => window.removeEventListener(SHELL_DRAWER_OPEN_EVENT, open);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      setDropdown(null);
      setSearchOpen(false);
    };
    /* React listens on `document` too (app router), so a trigger's
       stopPropagation cannot stop this listener: without the guard the click
       that opens a menu closes it again in the same tick. */
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-tv-dd]")) return;
      setDropdown(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    root.setAttribute("data-mia-drawer", "open");
    return () => {
      root.style.overflow = previous;
      root.removeAttribute("data-mia-drawer");
    };
  }, [drawerOpen]);

  /* Changing language keeps the visitor on the same page. */
  const selectLocale = (code: string) => {
    setDropdown(null);
    setDrawerOpen(false);
    try {
      window.localStorage.setItem(LANG_CHOSEN_KEY, code);
    } catch {
      /* not remembered; the switch still happens */
    }
    if (code === locale) return;
    const rest = pathname.replace(new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`), "");
    router.push(`/${code}${rest || ""}${window.location.search}${window.location.hash}`);
  };

  const selectCurrency = (code: string) => {
    Cookies.set("currency", code, { expires: 365 });
    setCurrency(code);
    setDropdown(null);
    window.dispatchEvent(new CustomEvent(CURRENCY_COOKIE_UPDATED_EVENT, { detail: { code } }));
  };

  /* Menus are fixed under their trigger, aligned to its inline-start edge. */
  const toggleDropdown = (id: "lang" | "curr") => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (dropdown?.id === id) {
      setDropdown(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const side = dir === "rtl" ? Math.max(8, window.innerWidth - rect.right) : Math.max(8, rect.left);
    setDropdown({ id, top: rect.bottom + 8, side });
  };

  const currencyOptions = SUPPORTED_CURRENCY_OPTIONS.filter((c) => DESIGN_CURRENCIES.includes(c.code) || c.code === currency);
  const currencySymbol = SUPPORTED_CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? "$";
  const accountHref = signedIn
    ? miaPath("account", locale)
    : `/auth/signin?callbackUrl=${encodeURIComponent(miaPath("account", locale))}`;
  const donateHref = linkOverrides?.donate || miaPath("projects", locale);
  const cartHref = miaPath("cart", locale);
  const cartClass = `${basket > 0 ? " tv-cart-full" : ""}${cartBump ? " tv-bump" : ""}`;
  const langName = (code: SupportedLocale) => LOCALES[code].nativeLabel;

  const cartBadge = (className: string) => (
    <span className={`${className}${basket > 0 ? " show" : ""}`} aria-hidden={basket > 0 ? undefined : true}>
      {basket}
    </span>
  );

  return (
    <>
      <div ref={spacerRef} className="mia-head-spacer tv-head-spacer" aria-hidden="true" />

      <div ref={stackRef} className="tv-header-root" dir={dir}>
        <header className="tv-header">
          <div className="tv-header-shell">
            <div className="tv-header-row">
              <div className="tv-brand-lang">
                <Link className="tv-brand" href={miaPath("home", locale)} aria-label={ORG.legalName}>
                  <img
                    className="tv-brand-logo"
                    src={imageUrl("/toplum/logo-mark.png", 64)}
                    srcSet={imageSrcSet("/toplum/logo-mark.png", [64, 128])}
                    sizes="34px"
                    alt={ORG.legalName}
                    width={31}
                    height={40}
                  />
                </Link>
                <button
                  className="tv-lang"
                  type="button"
                  onClick={toggleDropdown("lang")}
                  data-tv-dd=""
                  aria-label={t("language")}
                  title={t("language")}
                  aria-expanded={dropdown?.id === "lang"}
                  aria-haspopup="menu"
                >
                  <ShellIcon name="globe" />
                  <span className="tv-dd-label" lang={locale}>{langName(locale)}</span>
                </button>
                <button
                  className="tv-curr"
                  type="button"
                  onClick={toggleDropdown("curr")}
                  data-tv-dd=""
                  aria-label={t("currency")}
                  title={t("currency")}
                  aria-expanded={dropdown?.id === "curr"}
                  aria-haspopup="menu"
                >
                  <span className="tv-curr-symbol" dir="ltr">{currencySymbol}</span>
                </button>
              </div>

              <nav className="tv-nav" aria-label={t("mainNav")}>
                {NAV.map((group) =>
                  group.sub ? (
                    <div className="tv-ni" key={group.key}>
                      <Link
                        href={href(group.route, group.key)}
                        className={activeKey === group.key ? "active" : undefined}
                        aria-current={activeKey === group.key ? "page" : undefined}
                        aria-haspopup="true"
                      >
                        {t(`nav.${group.key}`)}
                        <ShellIcon name="caret" className="tv-caret" />
                      </Link>
                      <div className={`tv-sub${group.wide ? " tv-sub--2" : ""}`}>
                        <div className="tv-sub-head">
                          <b>{t(`nav.${group.key}`)}</b>
                          <Link className="tv-sub-all" href={href(group.route, group.key)}>
                            {t("viewAll")}
                          </Link>
                        </div>
                        <div className="tv-sub-grid">
                          {group.sub.map((item) => (
                            <Link key={item.key + (item.hash ?? "")} href={href(item.route, undefined, item.hash)}>
                              <i aria-hidden="true">
                                <ShellIcon name={item.icon} />
                              </i>
                              {t(`nav.${item.key}`)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={group.key}
                      href={href(group.route, group.key)}
                      className={activeKey === group.key ? "active" : undefined}
                      aria-current={activeKey === group.key ? "page" : undefined}
                    >
                      {t(`nav.${group.key}`)}
                    </Link>
                  )
                )}
              </nav>

              <div className="tv-mcluster">
                <div className="tv-actions">
                  <div className="tv-icon-group">
                    <button
                      className="tv-search"
                      type="button"
                      aria-label={t("search")}
                      aria-expanded={searchOpen}
                      aria-controls="tv-search-field"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSearchOpen((v) => !v);
                      }}
                    >
                      <ShellIcon name="search" />
                    </button>
                    {isAdmin ? (
                      /* Outside the localized tree: no locale prefix. */
                      <Link className="tv-icon-btn" href="/dashboard" aria-label={t("dashboard")} title={t("dashboard")}>
                        <ShellIcon name="dashboard" />
                      </Link>
                    ) : null}
                    <Link className="tv-icon-btn tv-profile" href={accountHref} aria-label={t("profile")} title={t("profile")}>
                      <ShellIcon name="person" />
                    </Link>
                    <Link
                      className={`tv-icon-btn tv-cart${cartClass}`}
                      href={cartHref}
                      aria-label={basket > 0 ? `${t("cart")} (${basket})` : t("cart")}
                      title={t("cart")}
                      {...{ [CART_TARGET_ATTR]: "" }}
                    >
                      <ShellIcon name="cart" />
                      {cartBadge("tv-icon-badge")}
                    </Link>
                  </div>
                  <Link className="tv-donate-top" href={donateHref}>
                    <span className="dn-full">{t("donateNow")}</span>
                    <span className="dn-short">{t("donateShort")}</span>
                  </Link>
                </div>

                <div className="tv-mrail">
                  <Link className="tv-mrail-btn tv-mhome" href={miaPath("home", locale)} aria-label={t("homePage")} title={t("home")}>
                    <ShellIcon name="home" />
                  </Link>
                  <button
                    className="tv-mrail-btn tv-mrail-lang"
                    type="button"
                    onClick={toggleDropdown("lang")}
                  data-tv-dd=""
                    aria-label={t("language")}
                    aria-expanded={dropdown?.id === "lang"}
                    aria-haspopup="menu"
                  >
                    <ShellIcon name="globe" />
                  </button>
                  <button
                    className="tv-mrail-btn tv-mrail-curr"
                    type="button"
                    onClick={toggleDropdown("curr")}
                  data-tv-dd=""
                    aria-label={t("currency")}
                    aria-expanded={dropdown?.id === "curr"}
                    aria-haspopup="menu"
                  >
                    <span dir="ltr">{currencySymbol}</span>
                  </button>
                  <Link className="tv-mrail-btn tv-mrail-profile" href={accountHref} aria-label={t("profile")}>
                    <ShellIcon name="person" />
                  </Link>
                  <Link
                    className={`tv-mrail-btn tv-mrail-cart${cartClass}`}
                    href={cartHref}
                    aria-label={basket > 0 ? `${t("cart")} (${basket})` : t("cart")}
                  >
                    <ShellIcon name="cart" />
                    {cartBadge("tv-mrail-badge")}
                  </Link>
                </div>
                <button
                  className="tv-mobile-menu"
                  type="button"
                  aria-label={t("openMenu")}
                  aria-expanded={drawerOpen}
                  aria-controls="tv-drawer"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDrawerOpen(true);
                  }}
                >
                  <ShellIcon name="menu" />
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <HeaderSearch open={searchOpen} onClose={closeSearch} />

      {dropdown ? (
        <div
          className="tv-dropdown-menu open"
          data-tv-dd=""
          role="menu"
          dir={dir}
          style={dir === "rtl" ? { top: dropdown.top, right: dropdown.side } : { top: dropdown.top, left: dropdown.side }}
          onClick={(event) => event.stopPropagation()}
        >
          {dropdown.id === "lang"
            ? SUPPORTED_LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={code === locale}
                  lang={code}
                  dir={LOCALES[code].direction}
                  className={code === locale ? "on" : undefined}
                  onClick={() => selectLocale(code)}
                >
                  {langName(code)}
                </button>
              ))
            : currencyOptions.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={c.code === currency}
                  dir="ltr"
                  className={c.code === currency ? "on" : undefined}
                  onClick={() => selectCurrency(c.code)}
                >
                  {c.code} {c.symbol}
                </button>
              ))}
        </div>
      ) : null}

      <div
        className={`tv-drawer-overlay${drawerOpen ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
      />
      <nav
        id="tv-drawer"
        className={`tv-drawer${drawerOpen ? " open" : ""}`}
        dir={dir}
        aria-label={t("mainNav")}
        aria-hidden={drawerOpen ? undefined : true}
        inert={drawerOpen ? undefined : true}
      >
        <div className="tv-drawer-head">
          <img className="tv-brand-logo" src={imageUrl("/toplum/logo-mark.png", 64)} alt={ORG.legalName} width={29} height={38} />
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label={t("close")}>
            ✕
          </button>
        </div>
        {DRAWER.map(([r, key]) => (
          <Link key={key} href={href(r, key)} onClick={() => setDrawerOpen(false)}>
            {t(`nav.${key}`)}
          </Link>
        ))}
        <div className="tv-drawer-group">
          <span>{t("myAccount")}</span>
          <Link href={cartHref} onClick={() => setDrawerOpen(false)}>
            {t("cart")}
          </Link>
          <Link href={accountHref} onClick={() => setDrawerOpen(false)}>
            {t("profile")}
          </Link>
          <Link href={`/${locale}/search`} onClick={() => setDrawerOpen(false)}>
            {t("searchPage")}
          </Link>
          {isAdmin ? (
            <Link href="/dashboard" onClick={() => setDrawerOpen(false)}>
              {t("dashboard")}
            </Link>
          ) : null}
        </div>
        <div className="tv-drawer-picks">
          <select aria-label={t("language")} value={locale} onChange={(event) => selectLocale(event.target.value)}>
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code} lang={code}>
                {langName(code)}
              </option>
            ))}
          </select>
          <select aria-label={t("currency")} value={currency} onChange={(event) => selectCurrency(event.target.value)}>
            {currencyOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.symbol}
              </option>
            ))}
          </select>
        </div>
        <Link className="tv-drawer-donate" href={donateHref} onClick={() => setDrawerOpen(false)}>
          {t("donateNow")}
        </Link>
      </nav>

      <div className={`tv-toast${toast ? " show" : ""}`} role="status" aria-live="polite" dir={dir}>
        {toast ? (
          <>
            <span className="tv-toast-ic" aria-hidden="true">
              <ShellIcon name="check" />
            </span>
            <span className="tv-toast-tx">
              <b>{t("toast.added")}</b>
            </span>
            <Link className="tv-toast-go" href={cartHref} onClick={() => setToast(false)}>
              {t("toast.viewCart")} (<span dir="ltr">{basket}</span>)
            </Link>
          </>
        ) : null}
      </div>
    </>
  );
}
