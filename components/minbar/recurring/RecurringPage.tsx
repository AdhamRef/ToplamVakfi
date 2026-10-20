"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuietFloatingButtons } from "@/hooks/useQuietFloatingButtons";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey, type CartRecurringSchedule } from "@/lib/minbar/cart";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import { TV_FALLBACK_IMAGE, type GivingTarget } from "@/lib/minbar/programs-match";

/**
 * Monthly giving — `ToplamVakfi-design/Toplum Vakfı Monthly Giving.dc.html`.
 *
 * The hero holds the sentence and the plan builder side by side; below it the
 * three steps, the six causes, "your giving, in your hands" and the FAQ.
 *
 * Behaviour kept from the previous recurring page:
 *  - The plan always gives to a real campaign. The design's six causes are
 *    offered first, each bound to the first published campaign matching it
 *    ("where the need is greatest" to the top-priority campaign); every other
 *    published campaign follows under "other projects".
 *  - Cadences: the design's weekly (stored as `friday`) and monthly, plus the
 *    daily plan the site already offered.
 *  - The optional charge schedule — a day of the month (monthly) and a local
 *    time, plus notes — is collected as structure and sent on the row as
 *    `schedule`; the server validates it and builds the plan's rule. It is
 *    tucked in a disclosure: left closed, no schedule is sent and the plan is
 *    scheduled from its creation, which is what the design's "starts as soon
 *    as you subscribe" says. Nothing here computes a charge date.
 *  - A typed amount is in the donor's own currency and kept exactly
 *    (`fromLocal`); the chips are USD, shown converted.
 */

const AMOUNTS = [25, 50, 75, 100];

type Freq = Exclude<CartFreqKey, "once">;
const FREQS: ReadonlyArray<{ id: Freq; word: string; amount: string; builder: string; cta: string }> = [
  { id: "friday", word: "weekly", amount: "amountWeekly", builder: "builderWeekly", cta: "ctaWeekly" },
  { id: "monthly", word: "monthly", amount: "amountMonthly", builder: "builderMonthly", cta: "ctaMonthly" },
  { id: "daily", word: "daily", amount: "amountDaily", builder: "builderDaily", cta: "ctaDaily" },
];

/** Days 1–28 only: every month has them, so a plan can never skip a month. */
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export type RecurringCauseId = "orphans" | "education" | "relief" | "water" | "quran" | "needed";

export interface RecurringCause {
  id: RecurringCauseId;
  /** The campaign the cause gives to; a cause without one is not offered in the builder. */
  target: GivingTarget | null;
  image: string | null;
  /** Where the cause card leads. */
  href: string;
}

export interface RecurringPageProps {
  causes: RecurringCause[];
  /** Every published campaign (slug + title), for "other projects". */
  projects: GivingTarget[];
}

function scheduleOf(freq: Freq, monthDay: number, localTime: string, notes: string): CartRecurringSchedule {
  const match = /^(\d{1,2}):(\d{2})$/.exec(localTime);
  const hour = match ? Math.min(23, Number(match[1])) : 14;
  const minute = match ? Math.min(59, Number(match[2])) : 30;
  const note = notes.trim();
  return { hour, minute, ...(freq === "monthly" ? { dayOfMonth: monthDay } : {}), ...(note ? { notes: note } : {}) };
}

const ICON_EDIT = <path d="M4 20h4L19 9l-4-4L4 16z" />;
const ICON_PAUSE = (
  <>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </>
);
const ICON_RECEIPT = (
  <>
    <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
    <path d="M14 3.5v5h5M9 13h6M9 17h4" />
  </>
);

export default function RecurringPage({ causes, projects }: RecurringPageProps) {
  useQuietFloatingButtons();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("recurring");
  const { format, symbol, formatNumber } = useMinbarMoney();
  const { fromLocal, labelOf } = useDonationAmount();

  /* Builder options: the bound causes, then every campaign. Values are
     prefixed so a cause and a campaign sharing a slug stay distinct. */
  const options = useMemo(() => {
    const list: Array<{ value: string; label: string; target: GivingTarget; group: "cause" | "project" }> = [];
    for (const cause of causes) {
      if (cause.target) list.push({ value: `cause:${cause.id}`, label: t(`mg.causes.${cause.id}.title`), target: cause.target, group: "cause" });
    }
    for (const project of projects) list.push({ value: `project:${project.slug}`, label: project.title, target: project, group: "project" });
    return list;
  }, [causes, projects, t]);

  const [choice, setChoice] = useState<string>(options[0]?.value ?? "");
  const [freq, setFreq] = useState<Freq>("monthly");
  const [amount, setAmount] = useState(AMOUNTS[0]);
  const [custom, setCustom] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [localTime, setLocalTime] = useState("14:30");
  const [monthDay, setMonthDay] = useState(1);
  const [notes, setNotes] = useState("");

  const selected = options.find((o) => o.value === choice) ?? options[0] ?? null;
  const given = custom ? fromLocal(Number(custom)) : { usd: amount };
  const f = FREQS.find((x) => x.id === freq) ?? FREQS[1];

  const onStart = () => {
    if (!(given.usd > 0) || !selected) return;
    addToCart({
      projectId: selected.target.slug,
      title: selected.target.title,
      typeKey: "recurring",
      freqKey: freq,
      amount: given.usd,
      currency: "USD",
      ...("local" in given && given.local ? { local: given.local } : {}),
      // Only a schedule the donor actually set; otherwise the plan runs from its creation.
      ...(scheduleOpen ? { schedule: scheduleOf(freq, monthDay, localTime, notes) } : {}),
    });
    router.push(miaPath("cart", locale));
  };

  const causeOptions = options.filter((o) => o.group === "cause");
  const projectOptions = options.filter((o) => o.group === "project");

  return (
    <div className="tvg-page mia-recurring-page">
      {/* ── Hero: the sentence beside the plan builder ─────────────────── */}
      <div id="plan" className="tvg-mg-hero">
        <div className="tvg-mg-hero-img" aria-hidden="true" />
        <div className="tvg-container tvg-mg-hero-in">
          <div className="tvg-mg-hero-text">
            <span className="tvg-mg-kicker">{t("mg.kicker")}</span>
            <h1>
              {t("title1")} <em>{t("title2")}</em>
            </h1>
            <p className="tvg-mg-source">{t("mg.source")}</p>
            <p className="tvg-mg-lede">{t("lead")}</p>
          </div>

          <aside className="tvg-mg-builder mia-donation-builder">
            <h2>{t(`mg.${f.builder}`)}</h2>

            <div className="tvg-mg-freq" role="group" aria-label={t("mg.freqAria")} style={{ ["--tvg-n" as string]: FREQS.length }}>
              {FREQS.map((x) => (
                <button key={x.id} type="button" aria-pressed={freq === x.id} onClick={() => setFreq(x.id)}>
                  {t(`mg.${x.word}`)}
                </button>
              ))}
            </div>

            <div className="tvg-mg-field">
              <span id="tvg-mg-amt">{t(`mg.${f.amount}`)}</span>
              <div className="tvg-mg-amounts" role="group" aria-labelledby="tvg-mg-amt">
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
                <label className="tvg-mg-custom">
                  <span>{symbol}</span>
                  <input value={custom} onChange={(e) => setCustom(decimalAmount(e.target.value))} inputMode="decimal" placeholder={t("mg.other")} aria-label={t("mg.other")} />
                </label>
              </div>
            </div>

            <div className="tvg-mg-field">
              <label htmlFor="tvg-mg-fund">{t("mg.fundLabel")}</label>
              <span className="tvg-mg-select">
                <select id="tvg-mg-fund" value={selected?.value ?? ""} onChange={(e) => setChoice(e.target.value)} disabled={!options.length}>
                  {!options.length ? <option value="">{t("mg.noProjects")}</option> : null}
                  {causeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  {projectOptions.length ? (
                    <optgroup label={t("mg.otherProjects")}>
                      {projectOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </span>
            </div>

            {/* The optional schedule. Stored as structure, never as a sentence. */}
            <details className="tvg-mg-more" open={scheduleOpen} onToggle={(e) => setScheduleOpen((e.currentTarget as HTMLDetailsElement).open)}>
              <summary>{t("mg.scheduleToggle")}</summary>
              <div className="tvg-mg-more-in">
                <p>{t("mg.scheduleHint")}</p>
                <div className="tvg-mg-more-row">
                  {freq === "monthly" ? (
                    <label className="tvg-field">
                      <span>{t("mg.dayOfMonth")}</span>
                      <span className="tvg-mg-select">
                        <select value={String(monthDay)} onChange={(e) => setMonthDay(Number(e.target.value))}>
                          {MONTH_DAYS.map((d) => (
                            <option key={d} value={d}>
                              {formatNumber(d)}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>
                  ) : null}
                  <label className="tvg-field">
                    <span>{t("mg.timeOfDay")}</span>
                    <input type="time" value={localTime} onChange={(e) => setLocalTime(e.target.value)} dir="ltr" />
                  </label>
                </div>
                <label className="tvg-field">
                  <span>{t("mg.notes")}</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} placeholder={t("mg.notesPlaceholder")} />
                </label>
              </div>
            </details>

            <div className="tvg-mg-summary" aria-live="polite">
              <b>{labelOf(given)}</b>
              <span>
                <em>{t(`mg.${f.word}`)}</em> · <em>{selected?.label ?? "—"}</em> · <em>{t("mg.startsNow")}</em>
              </span>
            </div>

            <button className="tvg-cta tvg-mg-cta" type="button" onClick={onStart} disabled={!selected || !(given.usd > 0)}>
              {t(`mg.${f.cta}`)}
            </button>
            <p className="tvg-mg-fine">{t("mg.fine")}</p>
          </aside>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <div className="tvg-mg-sec">
        <div className="tvg-container">
          <h2 className="tvg-mg-h2">{t("mg.howTitle")}</h2>
          <p className="tvg-mg-intro">{t("mg.howIntro")}</p>
          <div className="tvg-mg-steps">
            {[1, 2, 3].map((n) => (
              <article key={n} className="tvg-mg-step">
                <h3>{t(`mg.step${n}Title`)}</h3>
                <p>{t(`mg.step${n}Text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── Where your giving goes ───────────────────────────────────── */}
      <div className="tvg-mg-sec">
        <div className="tvg-container">
          <h2 className="tvg-mg-h2">{t("mg.whereTitle")}</h2>
          <p className="tvg-mg-intro">{t("mg.whereIntro")}</p>
          <div className="tvg-mg-causes">
            {causes.map((cause) => (
              <Link key={cause.id} className="tvg-mg-cause" href={cause.href} style={{ backgroundImage: `url("${cause.image || TV_FALLBACK_IMAGE}")` }}>
                <h3>{t(`mg.causes.${cause.id}.title`)}</h3>
                <p>{t(`mg.causes.${cause.id}.text`)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── In your hands + FAQ ──────────────────────────────────────── */}
      <div className="tvg-mg-sec">
        <div className="tvg-container tvg-mg-control">
          <div>
            <h2 className="tvg-mg-h2">{t("mg.controlTitle")}</h2>
            <p className="tvg-mg-intro">{t("mg.controlIntro")}</p>
            <ul className="tvg-mg-ctl-list">
              {[ICON_EDIT, ICON_PAUSE, ICON_RECEIPT].map((icon, i) => (
                <li key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    {icon}
                  </svg>
                  <span>
                    <b>{t(`mg.ctl${i + 1}Title`)}</b>
                    {t(`mg.ctl${i + 1}Text`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="tvg-mg-h2">{t("mg.faqTitle")}</h2>
            <p className="tvg-mg-intro">{t("mg.faqIntro")}</p>
            <div className="tvg-faq">
              <details open>
                <summary>{t("mg.faq1q")}</summary>
                <p>{t("mg.faq1a")}</p>
              </details>
              <details>
                <summary>{t("mg.faq2q")}</summary>
                <p>{t("mg.faq2a")}</p>
              </details>
              <details>
                <summary>{t("mg.faq3q")}</summary>
                <p>{t.rich("mg.faq3a", { link: (chunks) => <Link href={miaPath("zakatCalculator", locale)}>{chunks}</Link> })}</p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
