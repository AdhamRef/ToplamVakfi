"use client";
/* eslint-disable @next/next/no-img-element -- the brand mark is a fixed local asset served through the image proxy. */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection } from "@/lib/locales";
import { miaPath, type MinbarRoute } from "@/lib/minbar/routes";
import { ORG, ORG_TEL, ORG_WHATSAPP } from "@/lib/minbar/org";
import { imageSrcSet, imageUrl } from "@/lib/minbar/image-url";
import ShellIcon from "./ShellIcons";

/**
 * Site footer — `ToplamVakfi-design/Toplum Vakfı Footer.dc.html`.
 *
 * A wave from the page background into navy, then four columns — newsletter,
 * contact (from `ORG`) with the social accounts, quick links, the brand mark
 * with the tagline — and a closing rule with the legal links and the
 * copyright. The WhatsApp button floats at the inline-end edge.
 *
 * The newsletter form is a message to the team (`POST /api/messages`, subject
 * GENERAL), so a subscription lands in the dashboard inbox like any other.
 */

const QUICK_LINKS: ReadonlyArray<readonly [MinbarRoute, string]> = [
  ["about", "about"],
  ["programs", "programs"],
  ["reports", "impact"],
  ["transparency", "transparency"],
  ["news", "news"],
  ["contact", "contact"],
];

const LEGAL_LINKS: ReadonlyArray<readonly [MinbarRoute, string]> = [
  ["privacy", "privacy"],
  ["terms", "terms"],
  ["refundPolicy", "refund"],
  ["paymentDetails", "paymentDetails"],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Footer() {
  const locale = useLocale();
  const dir = localeDirection(locale);
  const t = useTranslations("tvShell.footer");

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value) || state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "GENERAL",
          body: `Newsletter subscription: ${value}`,
          guestEmail: value,
          locale,
        }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  const social = [
    { href: ORG.social.facebook, label: t("facebook"), icon: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13v-2c0-.6.4-1 1-1z" /></svg> },
    { href: ORG.social.instagram, label: t("instagram"), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.2" cy="6.8" r="1" /></svg> },
    { href: ORG.social.x, label: t("x"), icon: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 3H21l-6.6 7.6L21.7 21H16l-4.5-6-5.2 6H3.9l7.1-8.1L2.7 3h5.8l4.1 5.5z" /></svg> },
    { href: ORG.social.youtube, label: t("youtube"), icon: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 7.5v9l7.5-4.5z" /></svg> },
  ];

  return (
    <footer className="tv-foot" dir={dir}>
      <svg className="tv-foot-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H1440 V14 C 1100 44, 760 44, 520 26 S 160 4, 0 22 Z" fill="#f4f8fb" />
      </svg>
      <div className="tv-foot-in">
        <div className="tv-foot-grid">
          <div className="tv-foot-news">
            <h4>{t("newsTitle")}</h4>
            <p>{t("newsLead")}</p>
            {state === "done" ? (
              <p className="tv-foot-news-done" role="status">
                <ShellIcon name="check" />
                {t("subscribed")}
              </p>
            ) : (
              <form onSubmit={subscribe}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (state === "error") setState("idle");
                  }}
                  placeholder={t("emailPlaceholder")}
                  aria-label={t("emailLabel")}
                  autoComplete="email"
                  dir="auto"
                />
                <button type="submit" disabled={state === "sending"} aria-busy={state === "sending"}>
                  {state === "sending" ? t("subscribing") : t("subscribe")}
                </button>
              </form>
            )}
            {state === "error" ? (
              <p className="tv-foot-news-error" role="alert">
                {t("subscribeError")}
              </p>
            ) : null}
          </div>

          <div>
            <h4>{t("contactTitle")}</h4>
            <div className="tv-foot-contact">
              <a href={`mailto:${ORG.email}`}>
                <ShellIcon name="mail" />
                <span dir="ltr">{ORG.email}</span>
              </a>
              <a href={ORG_TEL}>
                <ShellIcon name="phone" />
                <span dir="ltr">{ORG.phone}</span>
              </a>
              <span>
                <ShellIcon name="pin" />
                <span dir="ltr">{ORG.address}</span>
              </span>
            </div>
            <div className="tv-foot-social">
              {social.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>{t("quickLinks")}</h4>
            <nav className="tv-foot-links" aria-label={t("quickLinks")}>
              {QUICK_LINKS.map(([route, key]) => (
                <Link key={key} href={miaPath(route, locale)}>
                  {t(key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="tv-foot-brand">
            <span>
              <img
                src={imageUrl("/toplum/logo-mark.png", 128)}
                srcSet={imageSrcSet("/toplum/logo-mark.png", [128, 256])}
                sizes="48px"
                alt={ORG.legalName}
                width={48}
                height={62}
                loading="lazy"
                decoding="async"
              />
            </span>
            <b>{t("tagline")}</b>
          </div>
        </div>

        <div className="tv-foot-legal">
          <nav aria-label={t("legal")}>
            {LEGAL_LINKS.map(([route, key]) => (
              <Link key={key} href={miaPath(route, locale)}>
                {t(key)}
              </Link>
            ))}
          </nav>
          <span className="tv-foot-copy">{t("copyright", { year: new Date().getFullYear() })}</span>
        </div>
      </div>

      <a className="tv-wa" href={ORG_WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")} title={t("whatsapp")}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
        </svg>
      </a>
    </footer>
  );
}
