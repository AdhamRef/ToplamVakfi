"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import type { GivingTarget } from "@/lib/minbar/programs-match";
import GivingBanner from "./GivingBanner";

/**
 * Religious occasions — `ToplamVakfi-design/Toplum Vakfı Religious Occasions.dc.html`.
 *
 * Three tabs (kaffarah, fasting fidyah, aqiqah), each an explanation with the
 * design's "consult a scholar" note beside a small giving form.
 *
 * Kaffarah and fidyah take a number of days/cases; the chosen amount is per
 * day/case, so the total is shown and added as amount × count. Each occasion
 * gives to the first published campaign matching it (expiation / feeding
 * campaigns for kaffarah and fidyah, aqiqah/sacrifice campaigns for aqiqah).
 * The baby's name for an aqiqah rides on the row as its gift recipient name,
 * so the receipt and certificate carry it; nothing is sent to anyone. An
 * occasion with no matching campaign links to the projects list instead.
 */

type OccasionId = "kaffarah" | "fidya" | "aqiqah";

const AMOUNTS: Record<OccasionId, number[]> = {
  kaffarah: [50, 100, 200],
  fidya: [10, 30, 60],
  aqiqah: [120, 240],
};

const TAB_KEY: Record<OccasionId, string> = { kaffarah: "tabKaffarah", fidya: "tabFidya", aqiqah: "tabAqiqah" };

export default function ReligiousOccasionsPage({
  targets,
  image,
}: {
  targets: Record<OccasionId, GivingTarget | null>;
  image: string | null;
}) {
  const locale = useLocale();
  const t = useTranslations("tvOccasions");
  const [active, setActive] = useState<OccasionId>("kaffarah");
  const ids: OccasionId[] = ["kaffarah", "fidya", "aqiqah"];

  return (
    <div className="tvg-page">
      <GivingBanner image={image} title={t("title")} lead={t("lead")} />

      <div className="tvg-container">
        <div className="tvg-ro-tabs" role="tablist" aria-label={t("tabsAria")}>
          {ids.map((id) => (
            <button
              key={id}
              id={`ro-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active === id}
              aria-controls={`ro-panel-${id}`}
              onClick={() => setActive(id)}
            >
              {t(TAB_KEY[id])}
            </button>
          ))}
        </div>
      </div>

      {ids.map((id) => (
        <div key={id} id={`ro-panel-${id}`} role="tabpanel" aria-labelledby={`ro-tab-${id}`} hidden={active !== id}>
          <Panel id={id} target={targets[id]} locale={locale} />
        </div>
      ))}
    </div>
  );
}

function Panel({ id, target, locale }: { id: OccasionId; target: GivingTarget | null; locale: string }) {
  const t = useTranslations("tvOccasions");
  const router = useRouter();
  const { format } = useMinbarMoney();
  const amounts = AMOUNTS[id];
  const [amount, setAmount] = useState(amounts[0]);
  const [count, setCount] = useState("1");
  const [babyName, setBabyName] = useState("");

  const counted = id !== "aqiqah";
  const times = counted ? Math.max(1, Math.min(999, Math.floor(Number(count) || 1))) : 1;
  const total = amount * times;

  const onGive = () => {
    if (!target || !(total > 0)) return;
    const name = babyName.trim();
    addToCart({
      projectId: target.slug,
      title: target.title,
      typeKey: "project",
      freqKey: "once",
      amount: total,
      currency: "USD",
      ...(id === "aqiqah" && name
        ? { gift: { recipientName: name, recipientPhone: "", recipientEmail: "", message: "", channels: [], showAmount: true } }
        : {}),
    });
    router.push(miaPath("cart", locale));
  };

  return (
    <div className="tvg-ro-panel">
      <div className="tvg-ro-info">
        <h2>{t(`${id}Title`)}</h2>
        <p>{t(`${id}Text`)}</p>
        <p className="tvg-disclaimer">{t(`${id}Note`)}</p>
      </div>
      <div className="tvg-ro-form">
        {counted ? (
          <label className="tvg-field">
            <span>{t(`${id}Count`)}</span>
            <input type="number" min={1} max={999} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/[^\d]/g, "").slice(0, 3))} dir="ltr" />
          </label>
        ) : (
          <label className="tvg-field">
            <span>{t("aqiqahName")}</span>
            <input type="text" maxLength={80} value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder={t("aqiqahPlaceholder")} />
          </label>
        )}
        <div className="tvg-chips" role="group" aria-label={t("amountsAria")}>
          {amounts.map((v) => (
            <button key={v} type="button" aria-pressed={amount === v} onClick={() => setAmount(v)}>
              <span>{format(v)}</span>
            </button>
          ))}
        </div>
        {counted && times > 1 ? (
          <p className="tvg-ro-total" aria-live="polite">
            {t("total", { amount: format(total) })}
          </p>
        ) : null}
        {target ? (
          <button className="tvg-cta" type="button" onClick={onGive}>
            {t(`${id}Cta`)}
          </button>
        ) : (
          <Link className="tvg-cta" href={miaPath("projects", locale)}>
            {t("browse")}
          </Link>
        )}
      </div>
    </div>
  );
}
