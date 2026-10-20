"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { localeDirection } from "@/lib/locales";
import type { PublicSearchItem } from "@/lib/minbar/public-search";

/**
 * The header's search field (`.tv-search-field` in `Toplum Vakfı Header.dc.html`):
 * a full-width bar that drops under the header when the magnifier is pressed,
 * and submits to the search results page. While the visitor types, the first
 * live matches from `/api/minbar/search` are listed under the field.
 */
export default function HeaderSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const locale = useLocale();
  const t = useTranslations("tvShell");
  const router = useRouter();
  const direction = localeDirection(locale);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PublicSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (wrapRef.current?.contains(target)) return;
      if (target.closest?.(".tv-search")) return; // the toggle handles itself
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      void fetch(`/api/minbar/search?locale=${encodeURIComponent(locale)}&q=${encodeURIComponent(query.trim())}`, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("search");
          return (await response.json()) as { items: PublicSearchItem[] };
        })
        .then((result) => {
          if (!abort.signal.aborted) setItems(result.items);
        })
        .catch(() => {
          if (!abort.signal.aborted) setFailed(true);
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, [locale, open, query]);

  const short = query.trim().length < 2;
  const submit = () => {
    const q = query.trim().slice(0, 90);
    onClose();
    router.push(`/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };
  const typeLabel = (type: PublicSearchItem["type"]) =>
    type === "project" ? t("typeProject") : type === "news" ? t("typeNews") : t("typeArticle");

  return (
    <div ref={wrapRef} id="tv-search-field" className={`tv-search-field${open ? " open" : ""}`} dir={direction} hidden={!open}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          maxLength={90}
          autoComplete="off"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          onChange={(event) => {
            setQuery(event.target.value);
            setItems([]);
          }}
        />
        <button type="submit">{t("search")}</button>
      </form>
      {!short ? (
        <div className="tv-search-results" aria-live="polite">
          {loading ? (
            <p>{t("searching")}</p>
          ) : failed ? (
            <p>{t("searchFailed")}</p>
          ) : !items.length ? (
            <p>{t("searchEmpty")}</p>
          ) : (
            items.slice(0, 6).map((item) => (
              <Link key={item.id} href={item.href} onClick={onClose}>
                <small>{typeLabel(item.type)}</small>
                <b>{item.title}</b>
              </Link>
            ))
          )}
          {items.length ? (
            <button type="button" className="tv-search-all" onClick={submit}>
              {t("searchAll")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
