"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { decimalAmount, parseAmount } from "@/lib/minbar/numeric-input";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import type { ZakatCartTarget } from "@/lib/minbar/programs-zakat";
import GivingBanner from "@/components/minbar/giving/GivingBanner";

/**
 * Zakat calculator — `ToplamVakfi-design/Toplum Vakfı Zakat Calculator.dc.html`.
 *
 * The design's five fields beside a sticky result card, then "about
 * calculating zakat" and the not-a-fatwa note. The calculation is the
 * design's and the handoff's:
 *   assets = cash + gold/silver value + investments + debts owed to you
 *   net    = max(0, assets − debts due from you)
 *   due    = net × 2.5%
 * plus the nisāb check the calculator always carried: when the donor enters
 * today's price per gram (gold 85 g, or silver 595 g), the threshold is
 * computed and nothing is due below it. With no price entered no threshold is
 * invented — the result is the design's net × 2.5% and the nisāb condition is
 * stated under it.
 *
 * Every figure is in the visitor's currency; "give your zakat" adds the result
 * as a zakat row (`typeKey: "zakat"`, kept separate in the basket, on the
 * receipt and in disbursement) to the zakat category bound to the zakat page.
 *
 * `[BACKEND-INTEGRATION]`: `rates` is the seam for a daily metal-price API; a
 * supplied rate pre-fills the field and the donor can still override it.
 */

type NisabMode = "gold" | "silver";

const GOLD_GRAMS = 85;
const SILVER_GRAMS = 595;
const ZAKAT_RATE = 0.025;

const FIELDS = [
  { id: "cash", tone: undefined },
  { id: "gold", tone: undefined },
  { id: "stocks", tone: undefined },
  { id: "owed", tone: "owed" },
  { id: "due", tone: "due" },
] as const;

export interface ZakatCalculatorProps {
  /** Where the zakat row goes (see `lib/minbar/programs-zakat.ts`). */
  target: ZakatCartTarget;
  /** Optional daily rates per gram, in the visitor's currency. */
  rates?: { gold?: number; silver?: number };
  bannerImage?: string | null;
}

export default function ZakatCalculator({ target, rates, bannerImage }: ZakatCalculatorProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("zakat");
  const { formatLocal, symbol, code } = useMinbarMoney();

  const [values, setValues] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<NisabMode>("gold");
  const [goldRate, setGoldRate] = useState(rates?.gold ? String(rates.gold) : "");
  const [silverRate, setSilverRate] = useState(rates?.silver ? String(rates.silver) : "");

  /** Tolerant parse: an empty or malformed field contributes zero, not NaN. */
  const num = (x: string | undefined) => {
    const v = parseAmount(x);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };
  const n = (key: string) => num(values[key]);

  const assets = n("cash") + n("gold") + n("stocks") + n("owed");
  const net = Math.max(0, assets - n("due"));
  const rate = num(mode === "gold" ? goldRate : silverRate);
  const nisab = rate > 0 ? rate * (mode === "gold" ? GOLD_GRAMS : SILVER_GRAMS) : 0;
  const hasNisab = nisab > 0;
  const aboveNisab = hasNisab && net >= nisab;
  const due = hasNisab && !aboveNisab ? 0 : net * ZAKAT_RATE;
  const dueRounded = Math.round(due * 100) / 100;

  const onDonate = () => {
    if (!(dueRounded > 0)) return;
    addToCart({ ...target, typeKey: "zakat", freqKey: "once", amount: dueRounded, currency: code });
    router.push(miaPath("cart", locale));
  };

  return (
    <div className="tvg-page">
      <GivingBanner image={bannerImage} title={t("calcTitle")} lead={t("calcLead")} />

      <div className="tvg-container tvg-zk-wrap">
        <div className="tvg-zk-form">
          <h2>{t("zk.formTitle")}</h2>
          <p>{t("zk.formText")}</p>

          {FIELDS.map((field) => (
            <label key={field.id} className="tvg-zk-field" data-tone={field.tone}>
              <span>{t(`zk.${field.id}`)}</span>
              <span className="tvg-zk-input">
                <span>{symbol}</span>
                <input
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: decimalAmount(e.target.value, 12) }))}
                  inputMode="decimal"
                  placeholder="0"
                />
              </span>
              {field.id === "due" ? <span className="tvg-zk-hint">{t("zk.dueHint")}</span> : null}
            </label>
          ))}

          {/* The nisāb check: optional, from today's price per gram. */}
          <div className="tvg-zk-nisab">
            <h3>{t("zk.nisabTitle")}</h3>
            <p>{t("zk.nisabHint")}</p>
            <div className="tvg-zk-modes" role="group" aria-label={t("zk.nisabTitle")}>
              {(["gold", "silver"] as NisabMode[]).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {t(m === "gold" ? "zk.nisabGold" : "zk.nisabSilver")}
                </button>
              ))}
            </div>
            <label className="tvg-zk-field" style={{ marginBottom: 0 }}>
              <span>{t(mode === "gold" ? "zk.rateGold" : "zk.rateSilver")}</span>
              <span className="tvg-zk-input">
                <span>{symbol}</span>
                <input
                  value={mode === "gold" ? goldRate : silverRate}
                  onChange={(e) => {
                    const v = decimalAmount(e.target.value, 12);
                    if (mode === "gold") setGoldRate(v);
                    else setSilverRate(v);
                  }}
                  inputMode="decimal"
                  placeholder="0"
                />
              </span>
              {hasNisab ? <span className="tvg-zk-hint">{t("zk.nisabValue", { amount: formatLocal(nisab) })}</span> : null}
            </label>
          </div>
        </div>

        <div className="tvg-zk-result" aria-live="polite">
          <div className="tvg-zk-rl">{t("zk.resultLabel")}</div>
          <div className="tvg-zk-rv">{formatLocal(dueRounded)}</div>
          <div className="tvg-zk-formula">{t("zk.formula")}</div>
          {hasNisab && net > 0 ? (
            <div className="tvg-zk-verdict" data-above={aboveNisab ? "1" : "0"}>
              {aboveNisab ? t("zk.above") : t("zk.below")}
            </div>
          ) : null}
          <button className="tvg-cta" type="button" onClick={onDonate} disabled={!(dueRounded > 0)}>
            {t("zk.cta")}
          </button>
          <div className="tvg-zk-note">
            <b>{t("zk.noteLabel")}</b> {t("zk.noteText")}
          </div>
        </div>
      </div>

      <div className="tvg-zk-explain">
        <h3>{t("zk.explainTitle")}</h3>
        <p>{t("zk.explainText")}</p>
        <p className="tvg-disclaimer">{t("zk.disclaimer")}</p>
      </div>
    </div>
  );
}
