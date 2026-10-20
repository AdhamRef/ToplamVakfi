"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { localeDirection } from "@/lib/locales";
import { miaPath, routeForPathname, type MinbarRoute } from "@/lib/minbar/routes";
import ShellIcon from "./ShellIcons";
import { QUICK_DONATE_OPEN_EVENT } from "./quick-donate-styles";
import { SHELL_DRAWER_OPEN_EVENT } from "./shell-events";

/**
 * Phone bottom navigation — `.tv-bnav` in `Toplum Vakfı Header.dc.html`.
 *
 * Home · programmes · a raised «تبرع الآن» · stories · more. The donate button
 * opens the quick donation panel where the page carries it (the panel cancels
 * `QUICK_DONATE_OPEN_EVENT`) and goes to the cart elsewhere, as the design's
 * link does; «المزيد» opens the header's drawer.
 */
export default function MobileBottomNav() {
  const locale = useLocale();
  const t = useTranslations("tvShell");
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const dir = localeDirection(locale);
  const current = routeForPathname(pathname);

  const is = (...routes: MinbarRoute[]) => (current && routes.includes(current) ? "page" : undefined);

  return (
    <nav className="tv-bnav" dir={dir} aria-label={t("bnav.label")}>
      <Link href={miaPath("home", locale)} aria-current={is("home")}>
        <ShellIcon name="home" />
        <span>{t("bnav.home")}</span>
      </Link>
      <Link href={miaPath("programs", locale)} aria-current={is("programs", "programDetail")}>
        <ShellIcon name="grid" />
        <span>{t("bnav.programs")}</span>
      </Link>
      <a
        className="tv-bnav-give"
        href={miaPath("cart", locale)}
        onClick={(event) => {
          event.preventDefault();
          const taken = !window.dispatchEvent(new Event(QUICK_DONATE_OPEN_EVENT, { cancelable: true }));
          if (!taken) router.push(miaPath("cart", locale));
        }}
      >
        <ShellIcon name="heartFill" />
        <span>{t("bnav.donate")}</span>
      </a>
      <Link href={miaPath("stories", locale)} aria-current={is("stories")}>
        <ShellIcon name="play" />
        <span>{t("bnav.stories")}</span>
      </Link>
      <button type="button" onClick={() => window.dispatchEvent(new Event(SHELL_DRAWER_OPEN_EVENT))}>
        <ShellIcon name="more" />
        <span>{t("bnav.more")}</span>
      </button>
    </nav>
  );
}
