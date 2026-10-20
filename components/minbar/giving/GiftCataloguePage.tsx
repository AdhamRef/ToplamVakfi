"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { TV_FALLBACK_IMAGE, type GivingTarget } from "@/lib/minbar/programs-match";
import GivingBanner from "./GivingBanner";

/**
 * Gift catalogue — `ToplamVakfi-design/Toplum Vakfı Gift Catalogue.dc.html`.
 *
 * Six priced gifts, each with "give this gift" (add and open the basket) and
 * "add to cart" (add and stay), and a dedication field under the grid.
 *
 * The prices are the design's indicative values (the page says so in its
 * note); a gift is added as a donation of that amount to the first published
 * campaign matching it (food baskets, wells, education, trees, Qur’an, winter
 * clothing). The dedication rides on the row as the gift recipient's name —
 * the project page's own "give in someone's name" field — so the receipt and
 * certificate carry it; no message is sent to anyone. A gift with no matching
 * campaign links to the projects list instead.
 */

export type GiftId = "food" | "well" | "bag" | "tree" | "mushaf" | "winter";

export interface GiftItem {
  id: GiftId;
  /** Indicative value, USD. */
  price: number;
  target: GivingTarget | null;
  image: string | null;
}

export default function GiftCataloguePage({ gifts, bannerImage }: { gifts: GiftItem[]; bannerImage: string | null }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvGifts");
  const { format } = useMinbarMoney();
  const [recipient, setRecipient] = useState("");
  const [added, setAdded] = useState<GiftId | null>(null);

  const add = (gift: GiftItem) => {
    if (!gift.target) return false;
    const name = recipient.trim();
    addToCart({
      projectId: gift.target.slug,
      title: gift.target.title,
      typeKey: "project",
      freqKey: "once",
      amount: gift.price,
      currency: "USD",
      ...(name ? { gift: { recipientName: name, recipientPhone: "", recipientEmail: "", message: "", channels: [], showAmount: true } } : {}),
    });
    return true;
  };

  return (
    <div className="tvg-page">
      <GivingBanner image={bannerImage} title={t("title")} lead={t("lead")} />

      <div className="tvg-container">
        <div className="tvg-gc-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v5h1" />
          </svg>
          <p>{t("note")}</p>
        </div>

        <div className="tvg-gc-grid">
          {gifts.map((gift) => (
            <article key={gift.id} className="tvg-gc-card">
              <div className="tvg-gc-img" style={{ backgroundImage: `url("${gift.image || TV_FALLBACK_IMAGE}")` }} />
              <div className="tvg-gc-body">
                <h3>{t(`${gift.id}.title`)}</h3>
                <p>{t(`${gift.id}.text`)}</p>
                <div className="tvg-gc-price">
                  <b>{format(gift.price)}</b>
                  <span>{t(`${gift.id}.unit`)}</span>
                </div>
                <div className="tvg-gc-actions">
                  {gift.target ? (
                    <>
                      <button
                        className="tvg-gc-btn"
                        type="button"
                        onClick={() => {
                          if (add(gift)) router.push(miaPath("cart", locale));
                        }}
                      >
                        {t("donate")}
                      </button>
                      <button
                        className="tvg-gc-cart"
                        type="button"
                        aria-live="polite"
                        onClick={() => {
                          if (!add(gift)) return;
                          setAdded(gift.id);
                          window.setTimeout(() => setAdded((cur) => (cur === gift.id ? null : cur)), 1500);
                        }}
                      >
                        {added === gift.id ? t("added") : t("add")}
                      </button>
                    </>
                  ) : (
                    <Link className="tvg-gc-btn" href={miaPath("projects", locale)}>
                      {t("browse")}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="tvg-gc-dedicate">
          <h2>{t("dedicateTitle")}</h2>
          <p>{t("dedicateText")}</p>
          <div className="tvg-field" style={{ marginBottom: 0 }}>
            <label htmlFor="tvg-gc-name">{t("dedicateLabel")}</label>
            <input id="tvg-gc-name" type="text" maxLength={80} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={t("dedicatePlaceholder")} />
          </div>
        </div>
      </div>
    </div>
  );
}
