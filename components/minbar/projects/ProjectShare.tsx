"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Sharing a campaign: the share button in the donation card and the
 * "sharing makes a difference" card in the story column.
 *
 * The button uses the device's own share sheet where there is one (phones),
 * else brings the share card into view. The card offers the link to copy and
 * the networks donors actually use here: WhatsApp, Facebook, X and Telegram.
 * The link shared is the page's own canonical address, read in the browser.
 */

function pageUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

export const SHARE_SECTION_ID = "share";

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const t = useTranslations("projects.tv");
  const onClick = async () => {
    const url = pageUrl();
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        /* The donor closed the sheet: nothing more to do. */
        if ((err as { name?: string })?.name === "AbortError") return;
      }
    }
    const section = document.getElementById(SHARE_SECTION_ID);
    section?.scrollIntoView({ behavior: "smooth", block: "center" });
    section?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
  };
  return (
    <button type="button" className={className} onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {t("share")}
    </button>
  );
}

const NETWORKS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    icon: (
      <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.8l5.1-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.4-.3Z" fill="currentColor" stroke="none" />
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: <path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v1.9H8v3.2h2.6v8.3H14v-8.3h2.6l.4-3.2Z" fill="currentColor" stroke="none" />,
  },
  {
    key: "x",
    label: "X",
    href: (url: string, title: string) => `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    icon: <path d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.4 5.8Zm-1 16.2h1.7L7.3 4.7H5.5Z" fill="currentColor" stroke="none" />,
  },
  {
    key: "telegram",
    label: "Telegram",
    href: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    icon: <path d="M21.4 4.3 18.3 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.5 13 2 11.6c-1-.3-1-1 .2-1.4l17.8-6.9c.8-.3 1.6.2 1.4 1Z" fill="currentColor" stroke="none" />,
  },
] as const;

export function ShareLinks({ title }: { title: string }) {
  const t = useTranslations("projects.tv");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    setUrl(pageUrl());
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url || pageUrl());
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="pd-share-links">
      <button type="button" className="pd-share-net pd-share-net--copy" onClick={copy} aria-live="polite" title={t("copyLink")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {copied ? (
            <path d="M20 6 9 17l-5-5" />
          ) : (
            <>
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </>
          )}
        </svg>
        <span>{copied ? t("copied") : t("copyLink")}</span>
      </button>
      {NETWORKS.map((network) => (
        <a
          key={network.key}
          className={`pd-share-net pd-share-net--${network.key}`}
          href={url ? network.href(url, title) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={network.label}
          title={network.label}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {network.icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
