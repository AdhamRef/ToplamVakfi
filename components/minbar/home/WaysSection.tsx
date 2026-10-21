"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { addToCart, type CartFreqKey } from "@/lib/minbar/cart";
import { isFrequencyEnabled } from "@/lib/minbar/frequencies";
import { flyToCart } from "@/lib/minbar/cart-feedback";
import { cssImage } from "@/lib/minbar/image-url";
import { decimalAmount } from "@/lib/minbar/numeric-input";
import type { MinbarProject } from "@/lib/minbar/projects";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { useDonationAmount } from "@/hooks/useDonationAmount";
import { useProjectPricing } from "@/hooks/useProjectPricing";
import ProjectDonateCard from "@/components/minbar/ProjectDonateCard";
import {
  GIFT_AMOUNTS,
  GIFT_OCCASIONS,
  MONTHLY_AMOUNTS,
  WAYS_ACHIEVEMENTS,
  WAYS_SPONSORSHIPS,
  WAYS_TABS,
  WAYS_TAB_ICON,
  homeNumber,
  type GiftOccasion,
  type HomeZakatTarget,
  type WaysTab,
} from "@/lib/minbar/home-content";
import { Icon } from "./HomeIntro";

/**
 * «طرق العطاء»  `.ways-giving` of `ToplamVakfi-design/Toplum Vakfı
 * Homepage.dc.html`: one tabbed section holding every way to give.
 *
 *   المشاريع    the dashboard's projects list (lib/minbar/home-layout): the
 *               amount campaigns as the design's project cards (the site's
 *               `ProjectDonateCard`, which is that card), then the سهوم
 *               campaigns as «تبرّع بقيمة محددة» unit cards  a price per unit,
 *               a quantity and the total.
 *   إنجازاتنا   the catalogue's four headline figures, linking to the impact page.
 *   الكفالات    the three sponsorships, each opening its programme page.
 *   تبرع شهري   a regular gift to one of the listed projects.
 *   الزكاة      the 2.5% calculator, giving to the zakat category.
 *   إهداء       a gift in someone's name, with the certificate preview.
 *
 * Every basket row carries identifiers only (project slug or category id,
 * USD amount, the exact local figure), as everywhere on the site, so the
 * server re-prices it at checkout.
 */

const NO_AMOUNTS: readonly number[] = [];

/* The regular-giving tab and its weekly/monthly switch follow
   config/donation-frequencies.ts. */
const CAN_WEEKLY = isFrequencyEnabled("friday");
const CAN_MONTHLY = isFrequencyEnabled("monthly");
const TABS = WAYS_TABS.filter((id) => id !== "monthly" || CAN_WEEKLY || CAN_MONTHLY);
const ARROW = <span className="tv-arrow" aria-hidden="true">←</span>;

export default function WaysSection({ projects, images, zakat }: { projects: MinbarProject[]; images: string[]; zakat: HomeZakatTarget }) {
  const t = useTranslations("tvHome.ways");
  const baseId = useId();
  const [tab, setTab] = useState<WaysTab>("projects");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = TABS.indexOf(tab);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let next = -1;
    if (event.key === "ArrowRight") next = rtl ? at - 1 : at + 1;
    else if (event.key === "ArrowLeft") next = rtl ? at + 1 : at - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    const target = (next + TABS.length) % TABS.length;
    setTab(TABS[target]);
    tabRefs.current[target]?.focus();
  };

  const tabLabel: Record<WaysTab, string> = {
    projects: t("tabProjects"),
    units: t("tabUnits"),
    sponsor: t("tabSponsor"),
    monthly: t("tabMonthly"),
    zakat: t("tabZakat"),
    gift: t("tabGift"),
  };

  return (
    <section className="ways-giving" id="ways" aria-labelledby={`${baseId}-title`}>
      <div className="container">
        <div className="wg-head">
          <h2 id={`${baseId}-title`}>{t("title")}</h2>
          <p>{t("lead")}</p>
        </div>
        <div className="wg-tabs" role="tablist" aria-label={t("tabsLabel")} onKeyDown={onKey}>
          {TABS.map((id, i) => (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-controls={`${baseId}-panel-${id}`}
              aria-selected={tab === id}
              tabIndex={tab === id ? 0 : -1}
              className={tab === id ? "wg-tab active" : "wg-tab"}
              onClick={() => setTab(id)}
            >
              <Icon name={WAYS_TAB_ICON[id]} />
              {tabLabel[id]}
            </button>
          ))}
        </div>
      </div>

      {TABS.map((id) => (
        <div
          key={id}
          className="wg-panel"
          id={`${baseId}-panel-${id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${id}`}
          hidden={tab !== id}
        >
          {tab === id ? (
            id === "projects" ? (
              <ProjectsPanel projects={projects} images={images} />
            ) : id === "units" ? (
              <AchievementsPanel images={images} />
            ) : id === "sponsor" ? (
              <SponsorPanel images={images} />
            ) : id === "monthly" ? (
              <MonthlyPanel projects={projects} />
            ) : id === "zakat" ? (
              <ZakatPanel target={zakat} />
            ) : (
              <GiftPanel projects={projects} />
            )
          ) : null}
        </div>
      ))}
    </section>
  );
}

/* ── المشاريع ─────────────────────────────────────────────────────────────── */

function ProjectsPanel({ projects, images }: { projects: MinbarProject[]; images: string[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.ways");
  const amountProjects = projects.filter((p) => !p.shares);
  const unitProjects = projects.filter((p) => p.shares);
  const all = miaPath("projects", locale);

  return (
    <>
      <div className="container wg-bar">
        <span>{t("projectsBar")}</span>
        <Link href={all}>
          {t("allProjects")} {ARROW}
        </Link>
      </div>
      {amountProjects.length ? (
        <section className="priority-projects">
          <div className="container">
            <div className="pp-grid">
              {amountProjects.map((project) => (
                <ProjectDonateCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {unitProjects.length ? (
        <>
          <div className="container wg-bar wg-bar--units">
            <span>{t("unitsBar")}</span>
            <Link href={all}>
              {t("allProjects")} {ARROW}
            </Link>
          </div>
          <div className="container">
            <div className="wg-units">
              {unitProjects.map((project, i) => (
                <UnitCard key={project.id} project={project} fallbackImage={images[i % images.length]} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!projects.length ? <p className="container wg-empty">{t("noProjects")}</p> : null}
    </>
  );
}

/** One «تبرّع بقيمة محددة» card: a سهوم campaign, priced per unit. */
function UnitCard({ project, fallbackImage }: { project: MinbarProject; fallbackImage: string }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvHome.ways");
  const { fromChip } = useDonationAmount();
  const tRing = useTranslations("tvHome.ring");
  const { sharePrice } = useProjectPricing(project, NO_AMOUNTS, { card: true });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const given = fromChip(sharePrice, qty);
  const { format, formatLocal } = useMinbarMoney();
  const totalLabel = given.local ? formatLocal(given.local.amount) : format(given.usd);
  const href = miaPath("projectDetail", locale, project.slug);

  const add = () =>
    addToCart({
      projectId: project.slug,
      title: project.title,
      typeKey: "project",
      freqKey: "once",
      amount: given.usd,
      currency: "USD",
      ...(given.local ? { local: given.local } : {}),
      shareCount: qty,
    });

  const onAdd = (origin: HTMLElement) => {
    if (!(given.usd > 0)) return;
    add();
    flyToCart(origin);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1500);
  };

  const onGive = () => {
    if (!(given.usd > 0)) return;
    add();
    router.push(miaPath("cart", locale));
  };

  return (
    <div className="wg-unit">
      <Link href={href} className="wg-unit-img" style={{ backgroundImage: cssImage(project.image || fallbackImage, 600) }} aria-hidden="true" tabIndex={-1} />
      <div className="wg-unit-body">
        <div className="wg-unit-top">
          <b className="wg-price">{sharePrice?.label ?? ""}</b>
        </div>
        <h3>
          <Link href={href}>{project.title}</Link>
        </h3>
        {project.regionLabel ? <span className="wg-where">{t("where", { place: project.regionLabel })}</span> : null}
        <p>{project.text}</p>
        <div className="wg-qty">
          <span>{t("qty")}</span>
          <div className="wg-stepper">
            <button type="button" className="wg-minus" aria-label={tRing("decrease")} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
              −
            </button>
            <output className="wg-count" aria-live="polite">
              {homeNumber(locale, qty)}
            </output>
            <button type="button" className="wg-plus" aria-label={tRing("increase")} onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={qty >= 99}>
              +
            </button>
          </div>
        </div>
        <div className="wg-total">
          {t("total")} <b>{totalLabel}</b>
        </div>
        <div className="wg-actions">
          <button type="button" className="wg-add" onClick={(e) => onAdd(e.currentTarget)} aria-live="polite">
            {added ? t("added") : t("addToCart")}
          </button>
          <button type="button" className="wg-give" onClick={onGive}>
            {t("giveNow")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── إنجازاتنا ───────────────────────────────────────────────────────────── */

function AchievementsPanel({ images }: { images: string[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.ways");
  return (
    <div className="container">
      <div className="wg-bar">
        <span>{t("achievementsBar")}</span>
        <Link href={miaPath("reports", locale)}>
          {t("achievementsMore")} {ARROW}
        </Link>
      </div>
      <div className="ac-grid">
        {WAYS_ACHIEVEMENTS.map((a, i) => (
          <article key={a.title} className="ac-card">
            <div className="ac-img" style={{ backgroundImage: cssImage(images[i % images.length], 700) }} />
            <div className="ac-body">
              <b>+{homeNumber(locale, a.value)}</b>
              <h3>{t(a.title)}</h3>
              <p>{t(a.text)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── الكفالات ────────────────────────────────────────────────────────────── */

function SponsorPanel({ images }: { images: string[] }) {
  const locale = useLocale();
  const t = useTranslations("tvHome.ways");
  const { format } = useMinbarMoney();
  return (
    <div className="container">
      <div className="wg-sponsors">
        {WAYS_SPONSORSHIPS.map((s, i) => (
          <div key={s.title} className="wg-spons">
            <div className="wg-spons-img" style={{ backgroundImage: cssImage(images[(i + 1) % images.length], 600) }} />
            <div className="wg-spons-body">
              <h3>{t(s.title)}</h3>
              <p>{t(s.text)}</p>
              <div className="wg-spons-foot">
                <b>
                  <span dir="ltr">{format(s.price)}</span> {s.monthly ? <small>{t("perMonth")}</small> : null}
                </b>
                <Link className="wg-spons-btn" href={miaPath("programDetail", locale, s.program)}>
                  {t("sponsorCta")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── تبرع شهري ───────────────────────────────────────────────────────────── */

function MonthlyPanel({ projects }: { projects: MinbarProject[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvHome.monthly");
  const { format, formatLocal, symbol } = useMinbarMoney();
  const { fromLocal } = useDonationAmount();
  const [weekly, setWeekly] = useState(!CAN_MONTHLY);
  const [amount, setAmount] = useState<number>(MONTHLY_AMOUNTS[0]);
  const [custom, setCustom] = useState("");
  const [fund, setFund] = useState(projects[0]?.slug ?? "");
  const project = projects.find((p) => p.slug === fund) ?? null;

  const given = custom ? fromLocal(Number(custom)) : { usd: amount };
  const label = "local" in given && given.local ? formatLocal(given.local.amount) : format(given.usd);
  const freq: CartFreqKey = weekly ? "friday" : "monthly";

  const start = () => {
    if (!project) {
      router.push(miaPath("recurring", locale));
      return;
    }
    if (!(given.usd > 0)) return;
    addToCart({
      projectId: project.slug,
      title: project.title,
      typeKey: "recurring",
      freqKey: freq,
      amount: given.usd,
      currency: "USD",
      ...("local" in given && given.local ? { local: given.local } : {}),
    });
    router.push(miaPath("cart", locale));
  };

  return (
    <section className="rg">
      <div className="container rg-card">
        <div className="rg-text">
          <span className="rg-kicker">{t("kicker")}</span>
          <h2>
            <Accented text={t("title")} accent={t("titleAccent")} />
          </h2>
          <p className="rg-source">{t("source")}</p>
          <p className="rg-lede">{t("lede")}</p>
          <Link className="rg-more" href={miaPath("recurring", locale)}>
            {t("more")} {ARROW}
          </Link>
        </div>
        <div className="rg-box">
          {CAN_WEEKLY && CAN_MONTHLY ? (
            <div className="rg-freq" role="group" aria-label={t("freqLabel")}>
              <button type="button" className={weekly ? "active" : undefined} aria-pressed={weekly} onClick={() => setWeekly(true)}>
                {t("weekly")}
              </button>
              <button type="button" className={!weekly ? "active" : undefined} aria-pressed={!weekly} onClick={() => setWeekly(false)}>
                {t("monthly")}
              </button>
            </div>
          ) : null}
          <span className="rg-label" id="rgAmtLabel">
            {weekly ? t("amountWeekly") : t("amountMonthly")}
          </span>
          <div className="rg-amounts" role="group" aria-labelledby="rgAmtLabel">
            {MONTHLY_AMOUNTS.map((value) => {
              const on = !custom && amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={on ? "active" : undefined}
                  aria-pressed={on}
                  onClick={() => {
                    setAmount(value);
                    setCustom("");
                  }}
                >
                  {format(value)}
                </button>
              );
            })}
          </div>
          <label className="rg-custom">
            <span>{symbol}</span>
            <input value={custom} onChange={(e) => setCustom(decimalAmount(e.target.value))} inputMode="decimal" placeholder={t("other")} aria-label={t("other")} />
          </label>
          {projects.length ? (
            <>
              <label className="rg-label" htmlFor="rgFund">
                {t("fund")}
              </label>
              <select className="rg-fund" id="rgFund" value={fund} onChange={(e) => setFund(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="rg-sum">
            <b>{label}</b>
            <span>
              <em>{weekly ? t("weekly") : t("monthly")}</em>
              {project ? (
                <>
                  {" · "}
                  <em>{project.title}</em>
                </>
              ) : null}
            </span>
          </div>
          <button className="rg-cta" type="button" onClick={start}>
            {weekly ? t("ctaWeekly") : t("ctaMonthly")}
          </button>
          <p className="rg-fine">{t("fine")}</p>
        </div>
      </div>
    </section>
  );
}

/** A sentence with one phrase set apart; plain when the phrase is not in it. */
function Accented({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em>{accent}</em>
      {text.slice(at + accent.length)}
    </>
  );
}

/* ── الزكاة ──────────────────────────────────────────────────────────────── */

function ZakatPanel({ target }: { target: HomeZakatTarget }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvHome.zakat");
  const { formatLocal, symbol } = useMinbarMoney();
  const { fromLocal } = useDonationAmount();
  const [wealth, setWealth] = useState("");
  const due = Math.round(Math.max(0, Number(wealth) || 0) * 0.025 * 100) / 100;

  const donate = () => {
    if (!(due > 0)) return;
    if (!target) {
      router.push(miaPath("zakat", locale));
      return;
    }
    const given = fromLocal(due);
    addToCart({ ...target, typeKey: "zakat", freqKey: "once", amount: given.usd, currency: "USD", ...(given.local ? { local: given.local } : {}) });
    router.push(miaPath("cart", locale));
  };

  return (
    <section className="zakat-mini">
      <div className="container zm-inner">
        <div className="zm-head">
          <h2>{t("title")}</h2>
        </div>
        <div className="zm-card">
          <div className="zm-row">
            <div className="zm-col">
              <label htmlFor="zmWealth">{t("wealth")}</label>
              <div className="zm-field">
                <span>{symbol}</span>
                <input id="zmWealth" inputMode="decimal" placeholder="0" value={wealth} onChange={(e) => setWealth(decimalAmount(e.target.value))} />
              </div>
            </div>
            <div className="zm-col zm-col-out">
              <span className="zm-out-label">{t("due")}</span>
              <b className="zm-out" aria-live="polite">
                <small>{symbol}</small>
                <i>{homeNumber(locale, due)}</i>
              </b>
            </div>
            <div className="zm-col zm-col-cta">
              <button className="zm-cta" type="button" disabled={!(due > 0)} onClick={donate}>
                {due > 0 ? t("ctaWith", { amount: formatLocal(due) }) : t("cta")}
              </button>
            </div>
          </div>
          <Link className="zm-link" href={miaPath("zakatCalculator", locale)}>
            {t("full")} {ARROW}
          </Link>
          <p className="zm-nisab">{t("nisab")}</p>
        </div>
      </div>
    </section>
  );
}

/* ── إهداء ───────────────────────────────────────────────────────────────── */

const OCCASION_KEYS: Record<GiftOccasion, { label: string; message: string; cert: string }> = {
  gift: { label: "occGift", message: "msgGift", cert: "certThanks" },
  soul: { label: "occSoul", message: "msgSoul", cert: "certJariyah" },
  healing: { label: "occHealing", message: "msgHealing", cert: "certThanks" },
};

function GiftPanel({ projects }: { projects: MinbarProject[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tvHome.gift");
  const { format, symbol } = useMinbarMoney();
  const { fromLocal } = useDonationAmount();
  const [occasion, setOccasion] = useState<GiftOccasion>("gift");
  const [amount, setAmount] = useState<number>(GIFT_AMOUNTS[0]);
  const [custom, setCustom] = useState("");
  const [dest, setDest] = useState(projects[0]?.slug ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const keys = OCCASION_KEYS[occasion];
  const project = useMemo(() => projects.find((p) => p.slug === dest) ?? null, [projects, dest]);

  const submit = () => {
    const who = name.trim();
    if (!who) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    if (!project) {
      router.push(miaPath("giftCatalogue", locale));
      return;
    }
    const given = custom ? fromLocal(Number(custom)) : { usd: amount };
    if (!(given.usd > 0)) return;
    const mail = email.trim();
    addToCart({
      projectId: project.slug,
      title: project.title,
      typeKey: "project",
      freqKey: "once",
      amount: given.usd,
      currency: "USD",
      ...("local" in given && given.local ? { local: given.local } : {}),
      gift: {
        recipientName: who,
        recipientPhone: "",
        recipientEmail: mail,
        message: message.trim() || t(keys.message),
        channels: mail ? ["email"] : [],
        showAmount: false,
      },
    });
    router.push(miaPath("cart", locale));
  };

  return (
    <section className="gift-sec">
      <div className="container">
        <div className="gift-card">
          <div className="gift-text">
            <h2>{t("title")}</h2>
            <p>{t("lead")}</p>
          </div>
          <div className="gift-preview" aria-hidden="true">
            <span className="gp-label">{t("preview")}</span>
            <div className="gp-sheet">
              <span className="gp-frame" />
              <span className="gp-weave" />
              <span className="gp-rule-box" />
              <span className="gp-wash" />
              <span className="gp-cnr tr" />
              <span className="gp-cnr tl" />
              <span className="gp-cnr br" />
              <span className="gp-cnr bl" />
              <div className="gp-body">
                {/* eslint-disable-next-line @next/next/no-img-element -- the small logo mark in /public */}
                <img className="gp-logo" src="/toplum/logo-mark.png" alt="" width={26} height={26} loading="lazy" />
                <b className="gp-title">{t(keys.cert)}</b>
                <span className="gp-rule" />
                <span className="gp-to">{t("certTo")}</span>
                <b className="gp-name">{name.trim() || t("namePlaceholderPreview")}</b>
                <span className="gp-msg">{message.trim() || t(keys.message)}</span>
                <div className="gp-foot">
                  <span className="gp-sign" />
                  <span className="gp-seal">
                    <i>{ORG.licenseNumber}</i>
                  </span>
                  <span className="gp-sign" />
                </div>
              </div>
            </div>
          </div>
          <form
            className="gift-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            noValidate
          >
            <div className="gift-occasions" role="group" aria-label={t("occasionsLabel")}>
              {GIFT_OCCASIONS.map((o) => (
                <button key={o} type="button" className={occasion === o ? "active" : undefined} aria-pressed={occasion === o} onClick={() => setOccasion(o)}>
                  {t(OCCASION_KEYS[o].label)}
                </button>
              ))}
            </div>
            <div className="gift-amounts" role="group" aria-label={t("amountsLabel")}>
              {GIFT_AMOUNTS.map((value) => {
                const on = !custom && amount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={on ? "active" : undefined}
                    aria-pressed={on}
                    onClick={() => {
                      setAmount(value);
                      setCustom("");
                    }}
                  >
                    {format(value)}
                  </button>
                );
              })}
              <label className="gift-custom">
                <span>{symbol}</span>
                <input value={custom} onChange={(e) => setCustom(decimalAmount(e.target.value))} inputMode="decimal" placeholder={t("other")} aria-label={t("other")} />
              </label>
            </div>
            {projects.length > 1 ? (
              <select className="gift-dest" value={dest} onChange={(e) => setDest(e.target.value)} aria-label={t("destination")}>
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError(false);
              }}
              placeholder={t("name")}
              aria-label={t("name")}
              aria-invalid={nameError || undefined}
              aria-describedby={nameError ? "giftNameError" : undefined}
              className={nameError ? "is-invalid" : undefined}
              autoComplete="off"
            />
            {nameError ? (
              <span id="giftNameError" className="gift-error" role="alert">
                {t("nameRequired")}
              </span>
            ) : null}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} aria-label={t("email")} autoComplete="off" />
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("message")} aria-label={t("message")} maxLength={60} />
            <button type="submit" className="gift-submit">
              {t("submit")}
            </button>
            <p className="gift-fine">{t("fine")}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
