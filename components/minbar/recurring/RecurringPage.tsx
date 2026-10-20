"use client";

import { decimalAmount } from "@/lib/minbar/numeric-input";
import { useQuietFloatingButtons } from "@/hooks/useQuietFloatingButtons";
import { useState, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useMessages, useTranslations } from "next-intl";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Button } from "@/components/minbar/ds";
import { LOCALES } from "@/lib/locales";
import { miaPath } from "@/lib/minbar/routes";
import { addToCart, type CartFreqKey, type CartRecurringSchedule } from "@/lib/minbar/cart";
import { verseBlock } from "@/lib/minbar/quran";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import type { MinbarProject } from "@/lib/minbar/projects";

/**
 * Recurring giving  ported from `Minbar/التبرع الدوري.dc.html`.
 *
 * The flow the handoff specifies:
 *   Fund → Frequency → Amount → Currency → Timing → Review → Payment
 *
 * Timing is the part with real backend weight. `DONATION_LOGIC_SPEC §1.3` and
 * the Recurring Time Contract require a plan to store its **timezone**, its
 * schedule type, and its schedule rule *as structure*  `{dayOfMonth: 15}`, not
 * "the fifteenth"  with `nextChargeAt` computed on the server.
 *
 * This form collects that structure  the day of the month (monthly) and a
 * local time  and puts it on the cart row as `schedule`; the order sends it
 * and the server validates it and builds the plan's rule from it. It never
 * computes a charge date: `RECURRING_DONATION_FLOW_MAP.md` forbids relying on
 * the donor's browser clock for a withdrawal.
 *
 * A prayer-time option is deliberately not offered: no scheduler resolves
 * prayer times, and offering it would promise a charge time nothing honours.
 *
 * The cart stores `freqKey` (`once`/`daily`/`friday`/`monthly`); the backend
 * normalises that to the official `donationMode`/`frequency` pair and never
 * reuses `freqKey` in an external API.
 */

const AMOUNTS = [25, 50, 100, 250, 500];

const FREQUENCIES: ReadonlyArray<{ id: Exclude<CartFreqKey, "once">; labelKey: string; icon: ReactElement }> = [
  {
    id: "monthly",
    labelKey: "freqMonthly",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    id: "friday",
    labelKey: "freqFriday",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
      </>
    ),
  },
  {
    id: "daily",
    labelKey: "freqDaily",
    icon: (
      <>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
      </>
    ),
  },
];

const BENEFITS = [
  { id: "sustain", image: "/minbar/assets/icon-recurring-sustain.png" },
  { id: "duty", image: "/minbar/assets/icon-recurring-duty.png" },
  { id: "fund", image: "/minbar/assets/icon-recurring-fund.png" },
  { id: "habit", image: "/minbar/assets/icon-recurring-habit.png" },
] as const;

/**
 * Funds a recurring plan can serve. `ibadan` and `travel` take their titles
 * from `navigation`, where those two projects are already named.
 */
const SERVED: ReadonlyArray<{ id: string; titleNs: "recurring" | "navigation"; titleKey: string }> = [
  { id: "aqsa", titleNs: "recurring", titleKey: "fund_aqsa" },
  { id: "relief", titleNs: "recurring", titleKey: "fund_relief" },
  { id: "homes", titleNs: "recurring", titleKey: "fund_homes" },
  { id: "chairs", titleNs: "recurring", titleKey: "fund_chairs" },
  { id: "quran", titleNs: "recurring", titleKey: "fund_quran" },
  { id: "families", titleNs: "recurring", titleKey: "fund_families" },
  { id: "ibadan", titleNs: "navigation", titleKey: "ibadanProject" },
  { id: "travel", titleNs: "navigation", titleKey: "travelProject" },
];

/** Days 1–28 only: every month has them, so a plan can never skip a month. */
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/**
 * The cart row's schedule: the chosen day (monthly plans only) and the local
 * time as hour and minute. An unparseable time falls back to the default.
 */
function scheduleOf(freq: Exclude<CartFreqKey, "once">, monthDay: number, localTime: string, notes: string): CartRecurringSchedule {
  const match = /^(\d{1,2}):(\d{2})$/.exec(localTime);
  const hour = match ? Math.min(23, Number(match[1])) : 14;
  const minute = match ? Math.min(59, Number(match[2])) : 30;
  const note = notes.trim();
  return { hour, minute, ...(freq === "monthly" ? { dayOfMonth: monthDay } : {}), ...(note ? { notes: note } : {}) };
}

export interface RecurringPageProps {
  projects: MinbarProject[];
}

export default function RecurringPage({ projects }: RecurringPageProps) {
  useQuietFloatingButtons();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("recurring");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const { format, formatNumber } = useMinbarMoney();
  const { fromLocal, labelOf } = useDonationAmount();
  const messages = useMessages() as { quran?: Record<string, { ar?: string; label?: string; t?: string }> };
  const verse = verseBlock(messages.quran ?? {}, "baqarah_261", locale);

  const dir = (LOCALES as Record<string, { direction?: "rtl" | "ltr" }>)[locale]?.direction ?? "rtl";
  // Every option is a real project; the first one is chosen until the donor picks another.
  const [projectSlug, setProjectSlug] = useState<string | null>(projects[0]?.slug ?? null);
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<Exclude<CartFreqKey, "once">>("monthly");
  const [localTime, setLocalTime] = useState("14:30");
  const [monthDay, setMonthDay] = useState(1);
  const [notes, setNotes] = useState("");

  /* The chips are USD; a typed figure is in the donor's own currency and is
     kept exactly (the basket enforces the $1 floor when it is on). */
  const given = custom ? fromLocal(Number(custom)) : { usd: amount };
  const value = given.usd;
  const selectedProject = projects.find((p) => p.slug === projectSlug) ?? null;

  const onDonate = () => {
    if (!(value > 0) || !selectedProject) return;
    addToCart({
      projectId: selectedProject.slug,
      title: selectedProject.title,
      typeKey: "recurring",
      freqKey: freq,
      amount: value,
      currency: "USD",
      ...("local" in given && given.local ? { local: given.local } : {}),
      // The chosen day and local time; the server builds the plan's rule from it.
      schedule: scheduleOf(freq, monthDay, localTime, notes),
    });
    router.push(miaPath("cart", locale));
  };

  const stepBadge = (n: number) => (
    <span aria-hidden="true" className="rc-step-n">
      {formatNumber(n)}
    </span>
  );

  return (
    <div className="mia-recurring-page" style={{ position: "relative" }}>
      <div className="gv-page">
        {/* ── Hero: the sentence beside the plan builder (Monthly Giving) ───── */}
        <section id="plan" className="rc-hero">
          <div className="rc-hero-img" aria-hidden="true" />
          <div className="gv-wrap rc-hero-in">
            <div className="rc-hero-text">
              <span className="rc-kicker">{tNav("recurring")}</span>
              <h1>
                {t("title1")} <em>{t("title2")}</em>
              </h1>
              <p className="rc-lede">{t("lead")}</p>
              <p className="rc-lede">{t("investmentLead")}</p>
              {/* Al-Baqarah 261  the verse on multiplied reward, set as the
                  design's sourced quotation. Arabic always. */}
              <blockquote className="rc-source">
                <span className="rc-source-ar" dir="rtl">
                  {verse.arabic}
                </span>
                {verse.translation ? (
                  <>
                    <span className="rc-source-tr">{verse.translation}</span>
                    <span className="rc-source-ref">{verse.attribution}</span>
                  </>
                ) : null}
              </blockquote>
            </div>

            {/* minmax(0,1fr): without it the track grows to the longest fund name
                in the select, and on a phone the whole form ran off both edges. */}
            <div className="rc-builder mia-donation-builder">
              {/* Step 1  fund */}
              <div>
                <span className="gv-label">
                  {stepBadge(1)}
                  {t("chooseFund")}
                </span>
                <PlanSelect
                  value={projectSlug ?? undefined}
                  onChange={setProjectSlug}
                  label={t("chooseFund")}
                  dir={dir}
                  variant="fund"
                  disabled={!projects.length}
                  display={selectedProject ? <ProjectOption title={selectedProject.title} image={selectedProject.image} /> : t("chooseFund")}
                  options={projects.map((project) => ({
                    value: project.slug,
                    text: project.title,
                    content: <ProjectOption title={project.title} image={project.image} meta={project.regionLabel} />,
                  }))}
                />
              </div>

              {/* Step 2  amount */}
              <div>
                <span className="gv-label">
                  {stepBadge(2)}
                  {t("setAmount")}
                </span>
                <div className="rc-amounts">
                  {AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setAmount(v);
                        setCustom("");
                      }}
                      data-pick={amount === v && !custom ? "1" : ""}
                      aria-pressed={amount === v && !custom}
                      className="rc-amt gv-chip"
                    >
                      <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                        {format(v)}
                      </span>
                    </button>
                  ))}
                  <input
                    value={custom}
                    onChange={(e) => setCustom(decimalAmount(e.target.value))}
                    inputMode="decimal"
                    placeholder={t("amountPlaceholder")}
                    aria-label={t("amountPlaceholder")}
                    className="rc-input gv-input"
                  />
                </div>
              </div>

              {/* Step 3  frequency */}
              <div>
                <span className="gv-label">
                  {stepBadge(3)}
                  {tCommon("frequency")}
                </span>
                <div className="gv-seg">
                  {FREQUENCIES.map((f) => (
                    <button key={f.id} type="button" onClick={() => setFreq(f.id)} aria-pressed={freq === f.id} className="rc-seg">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {f.icon}
                      </svg>
                      {tCommon(f.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule. Stored as structure  a day number and a wall-clock
                  time  never as a sentence. */}
              <div className="rc-schedule">
                <span className="gv-label" style={{ margin: 0 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0077b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  {t("schedule")}
                </span>

                {freq === "monthly" ? (
                  <div>
                    <span className="gv-label" style={{ color: "#5d7187", fontSize: 11.5 }}>
                      {t("dayOfMonth")}
                    </span>
                    <PlanSelect
                      value={String(monthDay)}
                      onChange={(v) => setMonthDay(Number(v))}
                      label={t("dayOfMonth")}
                      dir={dir}
                      variant="day"
                      display={formatNumber(monthDay)}
                      options={MONTH_DAYS.map((d) => ({ value: String(d), text: formatNumber(d), content: formatNumber(d) }))}
                    />
                  </div>
                ) : null}

                <div>
                  <span className="gv-label" style={{ color: "#5d7187", fontSize: 11.5 }}>
                    {t("timeOfDay")}
                  </span>
                  <div className="gv-affix rc-time" style={{ background: "#fff" }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0077b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    <input type="time" value={localTime} onChange={(e) => setLocalTime(e.target.value)} dir="ltr" aria-label={t("localTime")} />
                  </div>
                </div>
              </div>

              <label style={{ display: "block" }}>
                <span className="gv-label">{t("notes")}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={tCommon("notesPlaceholder")}
                  className="rc-input gv-input"
                />
              </label>

              <div className="gv-summary" aria-live="polite">
                <b dir="ltr">{labelOf(given)}</b>
                <span>{t("amountPerX", { freq: tCommon(FREQUENCIES.find((f) => f.id === freq)?.labelKey ?? "freqMonthly") })}</span>
              </div>

              <button type="button" className="gv-cta" onClick={onDonate} disabled={!selectedProject}>
                {t("createPlan")}
              </button>

              <p className="gv-fine">{t("privacyNote")}</p>
            </div>
          </div>
        </section>

        {/* ── Why give regularly (the design's step cards) ─────────────────── */}
        <section id="benefits" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2" style={{ marginBottom: 22 }}>
              {t("whyIt")}
            </h2>
            <div className="rc-steps">
              {BENEFITS.map((benefit) => (
                <div key={benefit.id} className="gv-card gv-lift rc-step">
                  <span className="gv-ico">
                    <span aria-hidden="true" style={{ backgroundImage: `url(${benefit.image})` }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="gv-h3">{t(`benefit_${benefit.id}`)}</h3>
                    <p className="gv-text">{t(`benefitDesc_${benefit.id}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Funds a plan serves (the design's "where your giving goes") ──── */}
        <section id="projects" className="gv-sec">
          <div className="gv-wrap">
            <h2 className="gv-h2">{t("fundsServed")}</h2>
            <p className="gv-intro">{t("fundsLead")}</p>
            <div className="rc-causes">
              {SERVED.map((fund) => (
                <div key={fund.id} className="rc-cause">
                  <span className="gv-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />
                    </svg>
                  </span>
                  <h3>{fund.titleNs === "navigation" ? tNav(fund.titleKey) : t(fund.titleKey)}</h3>
                  <p>{t(`fundDesc_${fund.id}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What recurring giving is, beside its film ────────────────────── */}
        <section id="what" className="gv-sec">
          <div className="gv-wrap rc-control">
            <div className="gv-card rc-what">
              <span className="gv-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 className="gv-h2" style={{ fontSize: "clamp(20px,2vw,24px)", marginBottom: 10 }}>
                  {t("whatIsIt")}
                </h2>
                <p className="gv-text" style={{ fontSize: 14.5, lineHeight: 2 }}>
                  {t("whatIsText")}
                </p>
              </div>
            </div>

            {/* The video's own thumbnail sits behind the lazy iframe, so the box
                is never a bare black rectangle while YouTube loads. */}
            <span className="rc-video mia-responsive-video gv-video" style={{ background: "#062442 url(https://i.ytimg.com/vi/K65JuQ8Nz9g/hqdefault.jpg) center / cover no-repeat" }}>
              <iframe
                src="https://www.youtube.com/embed/K65JuQ8Nz9g?si=TCfoRDQ9caOL53Wi"
                title={t("whatIsIt")}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </span>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────────────── */}
        <section className="gv-sec">
          <div className="gv-wrap">
            <div className="gv-band">
              <div className="gv-band-copy">
                <h2>{t("ctaHeading")}</h2>
                <p>{t("ctaText")}</p>
              </div>
              <div className="gv-band-actions">
                <Button variant="primary" size="lg" href="#plan" style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {t("createPlan")}
                </Button>
                <Button variant="outline" size="lg" href={miaPath("waqf", locale)} style={{ whiteSpace: "nowrap", borderRadius: 999 }}>
                  {t("waqfProjects")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface PlanSelectOption {
  value: string;
  /** Plain text for type-ahead and the screen-reader value. */
  text: string;
  content: ReactNode;
}

/**
 * The form's listbox: the site's Radix Select (`mia-sel-*`, as in the quick
 * donate bar), portaled so the list is never clipped by the builder card. It
 * carries `mia-scope` itself to keep the site's tokens and fonts outside the
 * page tree, and takes the trigger's width so it fits a phone screen.
 */
function PlanSelect({
  value,
  onChange,
  label,
  dir,
  variant,
  display,
  options,
  disabled,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  label: string;
  dir: "rtl" | "ltr";
  variant: "fund" | "day";
  display: ReactNode;
  options: PlanSelectOption[];
  disabled?: boolean;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} dir={dir} disabled={disabled}>
      <SelectPrimitive.Trigger className={`mia-sel-trigger rc-sel-trigger rc-sel-${variant}`} aria-label={label}>
        <SelectPrimitive.Value>{display}</SelectPrimitive.Value>
        <SelectPrimitive.Icon className="mia-sel-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={`mia-scope mia-sel-content rc-sel-content rc-sel-${variant}`} dir={dir} position="popper" sideOffset={6} collisionPadding={12}>
          <SelectPrimitive.ScrollUpButton className="mia-sel-scroll" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="mia-sel-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} textValue={option.text} className="mia-sel-item">
                <SelectPrimitive.ItemText>{option.content}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="mia-sel-check">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="mia-sel-scroll" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** A project in the fund list: its cover, its title, and where it is. */
function ProjectOption({ title, image, meta }: { title: string; image: string | null; meta?: string | null }) {
  return (
    <span className="rc-sel-project">
      <span className="rc-sel-thumb" aria-hidden="true" style={image ? { backgroundImage: `url("${image}")` } : undefined} />
      <span className="rc-sel-name">
        <span className="rc-sel-title">{title}</span>
        {meta ? <span className="rc-sel-meta">{meta}</span> : null}
      </span>
    </span>
  );
}
