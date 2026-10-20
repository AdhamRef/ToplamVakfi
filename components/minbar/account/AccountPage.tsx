"use client";

import { type ReactElement, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarAccountSummary } from "@/lib/minbar/account";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { formatMoney } from "@/lib/minbar/money";

/**
 * The donor account  `ToplamVakfi-design/Toplum Vakfı Profile.dc.html`: the
 * navy profile card (initials, greeting, member-since and email, the
 * supporter badge), a side menu of tabs, and the white panels each tab shows.
 *
 * Everything is the signed-in donor's own record: their totals, their
 * donation history with a receipt for each, their documents, and their
 * details, editable in place. The design's "saved projects" tab is not drawn:
 * the site keeps no saved-projects list, and an empty tab would promise one.
 *
 * Only confirmed donations are counted. A bank transfer still awaiting a
 * finance officer's match is listed apart (status "under review" / "rejected")
 * and never added to the totals: counting it would tell a donor they have
 * given more than they have.
 */

type Tab = "overview" | "history" | "certs" | "settings";

const ICONS: Record<Tab | "logout", ReactElement> = {
  overview: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  certs: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.98 19a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

type Row = {
  key: string;
  title: string;
  amount: string;
  date: string;
  dateIso: string;
  status: "done" | "recurring" | "pending" | "awaiting" | "rejected";
  action: { label: string; href: string; external?: boolean } | null;
};

export default function AccountPage({ summary }: { summary: MinbarAccountSummary }) {
  const locale = useLocale();
  const t = useTranslations("tvPayment.profile");
  const { format, formatNumber } = useMinbarMoney();

  const { profile, donations, pendingTransfers, totalDonatedUSD, donationCount, activeSubscriptions } = summary;
  const [tab, setTab] = useState<Tab>("overview");

  /* The design asks for first and family name; the account stores one name.
     Split on the first space for the form, joined again when saved. */
  const [firstInit = "", ...restInit] = (profile.name ?? "").trim().split(/\s+/);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<"ok" | "error" | null>(null);
  const [form, setForm] = useState({
    first: firstInit,
    last: restInit.join(" "),
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    birthdate: profile.birthdate ?? "",
    address: profile.address ?? "",
  });
  /* What the card shows. Kept beside the form so a save updates the page
     without a reload. */
  const [saved, setSaved] = useState(form);
  const fullName = `${saved.first} ${saved.last}`.trim();

  const initials = [saved.first, saved.last]
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join(".");
  const monthFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" });
  /* Numeric dates with Latin digits, as the design's table prints them. */
  const dateFormat = new Intl.DateTimeFormat(`${locale}-u-nu-latn`, { year: "numeric", month: "2-digit", day: "2-digit" });

  /* A past donation is shown in the currency it was actually charged in, never
     re-converted into today's selected currency: the receipt says one number
     and the history must say the same one. */
  const charged = (amount: number, currency: string) => {
    try {
      return formatMoney(amount, currency, locale);
    } catch {
      return `${currency} ${formatNumber(Math.round(amount))}`;
    }
  };
  const titleOf = (titles: string[]) => (titles.length ? titles.join("، ") : t("generalFund"));

  const settledRows: Row[] = donations.map((d) => ({
    key: d.id,
    title: titleOf(d.titles),
    amount: charged(d.amount, d.currency),
    date: dateFormat.format(new Date(d.date)),
    dateIso: d.date,
    status: d.recurring ? "recurring" : "done",
    /* The receipt is the server-generated PDF: the document a donor keeps. A
       plan is managed from the full settings screen. */
    action: d.recurring
      ? { label: t("manage"), href: `/${locale}/profile` }
      : { label: t("receipt"), href: `/api/donations/${d.id}/receipt?locale=${encodeURIComponent(locale)}`, external: true },
  }));
  const pendingRows: Row[] = pendingTransfers.map((p) => ({
    key: `transfer-${p.donationId}`,
    title: titleOf(p.titles),
    amount: charged(p.amount, p.currency),
    date: dateFormat.format(new Date(p.createdAt)),
    dateIso: p.createdAt,
    status: p.status === "REJECTED" ? "rejected" : p.status === "UNDER_REVIEW" ? "pending" : "awaiting",
    action: { label: t("details"), href: miaPath("paymentPending", locale, p.donationId) },
  }));
  const allRows = [...pendingRows, ...settledRows].sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const latest = allRows.slice(0, 3);

  const projectsSupported = new Set(donations.flatMap((d) => d.titles)).size;

  const statusLabel: Record<Row["status"], string> = {
    done: t("statusDone"),
    recurring: t("statusRecurring"),
    pending: t("statusPending"),
    awaiting: t("statusAwaiting"),
    rejected: t("statusRejected"),
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSavedNote(null);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.first.trim()} ${form.last.trim()}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          birthdate: form.birthdate.trim(),
          /* The profile stores country, region and city separately; this
             one line is its free-text part. The others are set in the full
             settings screen. */
          city: form.address.trim(),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(form);
      setSavedNote("ok");
    } catch {
      /* Keep what was typed so it can be sent again. */
      setSavedNote("error");
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: t("tabOverview") },
    { id: "history", label: t("tabHistory") },
    { id: "certs", label: t("tabCerts") },
    { id: "settings", label: t("tabSettings") },
  ];
  const logout = () => signOut({ callbackUrl: miaPath("home", locale) });

  const table = (rows: Row[], withActions: boolean) =>
    rows.length ? (
      <table className="gf-history">
        <thead>
          <tr>
            <th>{t("colProject")}</th>
            <th>{t("colAmount")}</th>
            <th>{t("colDate")}</th>
            <th>{t("colStatus")}</th>
            {withActions ? <th aria-label={t("colAction")} /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td data-label={t("colProject")}>{row.title}</td>
              <td data-label={t("colAmount")} className="amt">
                <bdi>{row.amount}</bdi>
              </td>
              <td data-label={t("colDate")} className="date">
                <time dateTime={row.dateIso}>{row.date}</time>
              </td>
              <td data-label={t("colStatus")}>
                <span className={`gf-status-pill is-${row.status}`}>{statusLabel[row.status]}</span>
              </td>
              {withActions ? (
                <td className="gf-row-actions">
                  {row.action ? (
                    row.action.external ? (
                      <a href={row.action.href} target="_blank" rel="noopener noreferrer">
                        {row.action.label}
                      </a>
                    ) : (
                      <Link href={row.action.href}>{row.action.label}</Link>
                    )
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="gf-pf-empty">
        {t("empty")} <Link href={miaPath("projects", locale)}>{t("browse")}</Link>
      </p>
    );

  return (
    <div className="gf-profile">
      {/* ── Profile card (`.ph-card`) ───────────────────────────────────── */}
      <section className="gf-pf-hero">
        <div className="gf-ph-card">
          <span className="gf-ph-avatar" aria-hidden="true">
            {initials || "✦"}
          </span>
          <div className="gf-ph-info">
            <h1>{fullName ? t("hello", { name: fullName }) : t("helloDonor")}</h1>
            <span>
              {t("memberSince", { date: monthFormat.format(new Date(profile.memberSince)) })}
              {saved.email.trim() ? (
                <>
                  {" — "}
                  <bdi>{saved.email.trim()}</bdi>
                </>
              ) : null}
            </span>
          </div>
          {donationCount > 0 ? <span className="gf-ph-badge">{t("badge")}</span> : null}
        </div>
      </section>

      <div className="gf-pf-layout">
        <aside className="gf-pf-side">
          <div role="tablist" aria-label={t("menuLabel")} className="gf-pf-tabs">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`pf-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`pf-panel-${item.id}`}
                data-tab={item.id}
                className={tab === item.id ? "is-active" : undefined}
                onClick={() => setTab(item.id)}
              >
                <Icon name={item.id} />
                {item.label}
              </button>
            ))}
          </div>
          <hr />
          <button type="button" className="gf-pf-logout" onClick={logout}>
            <Icon name="logout" />
            {t("logout")}
          </button>
        </aside>

        <div className="gf-pf-content">
          {tab === "overview" ? (
            <section role="tabpanel" id="pf-panel-overview" aria-labelledby="pf-tab-overview">
              <div className="gf-stat-grid">
                <div className="gf-stat-card">
                  <b dir="ltr">{format(totalDonatedUSD)}</b>
                  <span>{t("statTotal")}</span>
                </div>
                <div className="gf-stat-card">
                  <b dir="ltr">{formatNumber(projectsSupported)}</b>
                  <span>{t("statProjects")}</span>
                </div>
                <div className="gf-stat-card">
                  <b dir="ltr">{formatNumber(activeSubscriptions)}</b>
                  <span>{t("statMonthly")}</span>
                </div>
              </div>
              <div className="gf-pf-panel">
                <h2>{t("latestTitle")}</h2>
                <p className="gf-pf-sub">{t("latestSub", { count: latest.length })}</p>
                {table(latest, false)}
              </div>
            </section>
          ) : null}

          {tab === "history" ? (
            <section role="tabpanel" id="pf-panel-history" aria-labelledby="pf-tab-history">
              <div className="gf-pf-panel">
                <h2>{t("historyTitle")}</h2>
                <p className="gf-pf-sub">{t("historySub")}</p>
                {table(allRows, true)}
              </div>
            </section>
          ) : null}

          {tab === "certs" ? (
            <section role="tabpanel" id="pf-panel-certs" aria-labelledby="pf-tab-certs">
              <div className="gf-pf-panel">
                <h2>{t("certsTitle")}</h2>
                <p className="gf-pf-sub">{t("certsSub")}</p>
                {donations.length ? (
                  donations.map((d) => (
                    <div key={d.id} className="gf-cert-rows">
                      <div className="gf-cert-row">
                        <div>
                          <b>{t("certThanks", { title: titleOf(d.titles) })}</b>
                          <span>{t("issuedOn", { date: dateFormat.format(new Date(d.date)) })}</span>
                        </div>
                        <Link href={miaPath("thanksCertificate", locale, d.id)}>{t("view")}</Link>
                      </div>
                      <div className="gf-cert-row">
                        <div>
                          <b>{t("certReceipt", { title: titleOf(d.titles) })}</b>
                          <span>
                            {dateFormat.format(new Date(d.date))} · <bdi>{charged(d.amount, d.currency)}</bdi>
                          </span>
                        </div>
                        <a href={`/api/donations/${d.id}/receipt?locale=${encodeURIComponent(locale)}`} target="_blank" rel="noopener noreferrer">
                          {t("downloadPdf")}
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="gf-pf-empty">
                    {t("empty")} <Link href={miaPath("projects", locale)}>{t("browse")}</Link>
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {tab === "settings" ? (
            <section role="tabpanel" id="pf-panel-settings" aria-labelledby="pf-tab-settings">
              <div className="gf-pf-panel">
                <h2>{t("personalTitle")}</h2>
                <div className="gf-pf-fields">
                  <Field label={t("firstName")} value={form.first} onChange={(v) => setForm((f) => ({ ...f, first: v }))} autoComplete="given-name" />
                  <Field label={t("lastName")} value={form.last} onChange={(v) => setForm((f) => ({ ...f, last: v }))} autoComplete="family-name" />
                  <Field label={t("email")} value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" ltr autoComplete="email" />
                  <Field label={t("phone")} value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" ltr autoComplete="tel" />
                  <Field label={t("birthDate")} value={form.birthdate} onChange={(v) => setForm((f) => ({ ...f, birthdate: v }))} type="date" ltr />
                  <Field label={t("address")} value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} autoComplete="address-level2" />
                </div>
                <div className="gf-pf-save-row">
                  <button type="button" className="gf-save-btn" onClick={save} disabled={saving} aria-busy={saving}>
                    {t("save")}
                  </button>
                  {savedNote ? (
                    <span role="status" className={savedNote === "ok" ? "is-ok" : "is-error"}>
                      {savedNote === "ok" ? t("savedOk") : t("savedError")}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="gf-pf-panel">
                <h2>{t("securityTitle")}</h2>
                <div className="gf-toggle-row">
                  <div>
                    <b>{t("securityRow")}</b>
                    <span>{t("securityRowText")}</span>
                  </div>
                  <Link href={`/${locale}/profile`}>{t("manage")}</Link>
                </div>
                <div className="gf-toggle-row">
                  <div>
                    <b>{t("plansRow")}</b>
                    <span>{t("plansRowText")}</span>
                  </div>
                  <Link href={miaPath("recurring", locale)}>{t("startPlan")}</Link>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* On phones the sign-out sits at the very bottom, not in the tab grid. */}
      <div className="gf-pf-logout-row">
        <button type="button" className="gf-pf-logout is-wide" onClick={logout}>
          <Icon name="logout" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ltr = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  ltr?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="gf-field">
      <span>{label}</span>
      <input type={type} dir={ltr ? "ltr" : undefined} value={value} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
