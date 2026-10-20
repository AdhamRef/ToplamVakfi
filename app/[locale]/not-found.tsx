import { cookies } from "next/headers";
import { messagesFor } from "@/i18n/locale-messages";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import MinbarMessages from "@/components/minbar/MinbarMessages";
import StatusScreen from "@/components/minbar/states/StatusScreen";
import { NotFoundIcon } from "@/components/minbar/states/StatusIcons";

/**
 * 404  `ToplamVakfi-design/Toplum Vakfı 404.dc.html`: the navy band, the
 * code in large brand-blue figures, one line of explanation and one way home.
 *
 * Reached by `notFound()` from a route, or by any address that matches no page.
 * Next.js serves this with a real 404 status, which is what
 * `PRODUCTION_SEO_CONTRACT.md` requires  "لا soft-404".
 *
 * Two constraints shape how this file is written. Next renders the not-found
 * boundary **outside** the `[locale]` segment, so it has neither route params
 * nor a working `getLocale()`  next-intl's server APIs throw "Couldn't find
 * next-intl config file" here, which used to replace this screen with a bare
 * framework fallback. So the locale comes from the `NEXT_LOCALE` cookie, which
 * `proxy.ts` writes onto the request from the URL, and the copy is read
 * straight from the message catalog.
 */

/** The locale for this request, from the cookie middleware sets off the URL. */
async function currentLocale(): Promise<string> {
  try {
    const value = (await cookies()).get("NEXT_LOCALE")?.value;
    return value && isValidLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default async function NotFound() {
  const locale = await currentLocale();
  const messages = messagesFor(locale);
  const tv = ((messages.tvPayment ?? {}) as Record<string, Record<string, string>>).notFound ?? {};
  const system = (messages.system ?? {}) as Record<string, string>;

  return (
    <MinbarMessages locale={locale} namespaces={["system", "tvPayment"]}>
      <StatusScreen
        tone="neutral"
        icon={NotFoundIcon}
        variant="dark"
        code="404"
        title={tv.title ?? system.notFoundTitleFull}
        lead={tv.lead ?? system.notFoundLead}
        primary={{ label: tv.home ?? system.backHomeCta, href: miaPath("home", locale) }}
      />
    </MinbarMessages>
  );
}
