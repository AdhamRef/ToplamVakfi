"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import { TV_FALLBACK_IMAGE, type GivingTarget } from "@/lib/minbar/programs-match";
import GivingBanner from "./GivingBanner";

/**
 * Sadaqah jariyah — `ToplamVakfi-design/Toplum Vakfı Sadaqah Jariyah.dc.html`.
 *
 * Two forms of ongoing charity (a tree, a well), a name for the plaque with a
 * live preview, the design's amounts and a free amount, then "add to cart".
 *
 * Each option gives to a real campaign — the first published one matching it
 * (tree planting / water wells). The plaque name rides on the basket row as
 * the gift's recipient name, the same field the project page's "give in
 * someone's name" uses, so it reaches the order, the receipt and the
 * certificate; no message is sent to anyone (no channels). An option with no
 * matching campaign links to the projects list instead of taking money for a
 * destination that does not exist.
 */

const AMOUNTS = [100, 250, 500, 1000];

export interface SadaqahOption {
  id: "tree" | "well";
  target: GivingTarget | null;
  image: string | null;
}

export default function SadaqahJariyahPage({ options }: { options: SadaqahOption[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvSadaqah");
  const { format, symbol } = useMinbarMoney();
  const { fromLocal } = useDonationAmount();

  const [type, setType] = useState<SadaqahOption["id"]>("tree");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(AMOUNTS[0]);
  const [custom, setCustom] = useState("");

  const option = options.find((o) => o.id === type) ?? options[0];
  const given = custom ? fromLocal(Number(custom)) : { usd: amount };

  const onAdd = () => {
    if (!option?.target || !(given.usd > 0)) return;
    const plaque = name.trim();
    addToCart({
      projectId: option.target.slug,
      title: option.target.title,
      typeKey: "project",
      freqKey: "once",
      amount: given.usd,
      currency: "USD",
      ...("local" in given && given.local ? { local: given.local } : {}),
      ...(plaque
        ? { gift: { recipientName: plaque, recipientPhone: "", recipientEmail: "", message: "", channels: [], showAmount: true } }
        : {}),
    });
    router.push(miaPath("cart", locale));
  };

  return (
    <div className="tvg-page">
      <GivingBanner
        image={options[0]?.image}
        crumbs={[
          { label: t("home"), href: `/${locale}` },
          { label: t("programs"), href: miaPath("programs", locale) },
          { label: t("title") },
        ]}
        crumbAria={t("crumbAria")}
        title={t("title")}
        lead={t("lead")}
      />

      <div className="tvg-sj-intro">
        <p>{t("intro")}</p>
      </div>

      <div className="tvg-container tvg-sj-options" role="radiogroup" aria-label={t("optionsAria")}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={type === o.id} className="tvg-sj-card" onClick={() => setType(o.id)}>
            <span className="tvg-sj-image" style={{ backgroundImage: `url("${o.image || TV_FALLBACK_IMAGE}")` }} />
            <span className="tvg-sj-body">
              <b>{t(o.id === "tree" ? "treeTitle" : "wellTitle")}</b>
              <span>{t(o.id === "tree" ? "treeText" : "wellText")}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="tvg-container tvg-sj-form">
        <h2>{t("formTitle")}</h2>
        <label className="tvg-field">
          <span>{t("nameLabel")}</span>
          <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
        </label>
        <div className="tvg-sj-plaque" aria-live="polite">
          <div>
            <small>{t(type === "tree" ? "plaqueTree" : "plaqueWell")}</small>
            <b>{name.trim() || t("plaqueDefault")}</b>
          </div>
        </div>
        <div className="tvg-chips" role="group" aria-label={t("amountsAria")}>
          {AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={!custom && amount === v}
              onClick={() => {
                setAmount(v);
                setCustom("");
              }}
            >
              <span>{format(v)}</span>
            </button>
          ))}
        </div>
        <label className="tvg-field">
          <span>
            {t("otherLabel")} <span className="tvg-ltr">({symbol})</span>
          </span>
          <input value={custom} onChange={(e) => setCustom(decimalAmount(e.target.value))} inputMode="decimal" placeholder={t("otherPlaceholder")} dir="ltr" />
        </label>
        {option?.target ? (
          <button className="tvg-cta" type="button" onClick={onAdd} disabled={!(given.usd > 0)}>
            {t("addToCart")}
          </button>
        ) : (
          <Link className="tvg-cta" href={miaPath("projects", locale)}>
            {t("browse")}
          </Link>
        )}
        <p className="tvg-trust">{t("secure")}</p>
      </div>
    </div>
  );
}
