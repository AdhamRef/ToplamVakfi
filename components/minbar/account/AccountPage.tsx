"use client";

import { type ReactElement, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import type { MinbarAccountSummary } from "@/lib/minbar/account";
import { useMinbarMoney } from "@/hooks/useMinbarMoney";
import { formatMoney } from "@/lib/minbar/money";
import { Button } from "@/components/minbar/ds";

/**
 * The donor account  ported from `Minbar/حساب المتبرع.dc.html`, laid out as
 * `ToplamVakfi-design/Toplum Vakfı Profile.dc.html`: a navy profile card, a
 * side menu, and white panels (styles in `styles/minbar/pages/reports.css`).
 *
 * The handoff renders whatever props it is handed and an em dash for the rest.
 * This is the signed-in donor's own record: their totals, their donation
 * history with a receipt for each, and their details, editable in place.
 *
 * Only confirmed donations appear. A bank transfer still awaiting a finance
 * officer's match is not yet a donation, and counting it would tell a donor
 * they have given more than they have.
 */

const ICONS: Record<string, ReactElement> = {
  wallet: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 10h18M16 14h2" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 6 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M4 5.5c0-1 .8-1.5 1.6-1.3l2.7.7c.6.15 1 .65 1.1 1.25l.4 2.4c.1.5-.05 1-.4 1.35l-1.3 1.3a13 13 0 0 0 6 6l1.3-1.3c.35-.35.85-.5 1.35-.4l2.4.4c.6.1 1.1.5 1.25 1.1l.7 2.7c.2.8-.3 1.6-1.3 1.6C10.5 21 3 13.5 4 5.5Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9h17M8 3v3M16 3v3" />
    </>
  ),
  pin: <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />,
  receipt: (
    <>
      <path d="M7 3h10l2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5l2-2Z" />
      <path d="M9 9h6M9 13h6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.5 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20.5 5 16l11-11 3 3-11 11-4 1.5Z" />
      <path d="M14 6.5 17.5 10" />
    </>
  ),
};

function Icon({ name, size = 15 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/* The design's profile field: 10px radius, 1.5px hairline, 12px/14px padding. */
const FIELD = {
  width: "100%",
  minHeight: 46,
  border: "1.5px solid #e2eaf0",
  borderRadius: 10,
  padding: "0 14px",
  fontFamily: "inherit",
  fontSize: 13.5,
  color: "#062442",
  background: "#fff",
  boxSizing: "border-box",
} as const;

export default function AccountPage({ summary }: { summary: MinbarAccountSummary }) {
  const locale = useLocale();
  const t = useTranslations("account");
  const tTransfer = useTranslations("transferReceipt");
  const { format, formatNumber } = useMinbarMoney();

  const { profile, donations, pendingTransfers, totalDonatedUSD, donationCount, activeSubscriptions } = summary;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile.name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    birthdate: profile.birthdate ?? "",
    address: profile.address ?? "",
  });
  /* What the read view shows. Kept beside the form so a save updates the page
     without a reload, and a cancel restores what the server last confirmed. */
  const [saved, setSaved] = useState(form);

  const donorName = saved.name.trim() || t("dearDonor");
  const dash = "—";
  const dateFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  /* A past donation is shown in the currency it was actually charged in, never
     re-converted into today's selected currency: the receipt says one number
     and the history must say the same one. */
  const chargedAmount = (amount: number, currency: string) => {
    try {
      return formatMoney(amount, currency, locale);
    } catch {
      return `${currency} ${formatNumber(Math.round(amount))}`;
    }
  };
  const monthFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          birthdate: form.birthdate.trim(),
          /* The design offers one address line; the profile stores country,
             region and city separately, and this is its free-text part. The
             other two are set in the full settings screen. */
          city: form.address.trim(),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(form);
      setEditing(false);
    } catch {
      /* Keep the form open with what was typed so it can be sent again. */
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm(saved);
    setEditing(false);
  };

  const stats: Array<{ icon: string; value: string; label: string }> = [
    { icon: "wallet", value: format(totalDonatedUSD), label: t("totalDonated") },
    { icon: "list", value: formatNumber(donationCount), label: t("donationCount") },
    { icon: "refresh", value: formatNumber(activeSubscriptions), label: t("activeSubs") },
  ];

  const details: Array<{ icon: string; label: string; value: string; ltr?: boolean }> = [
    { icon: "user", label: t("fullName"), value: saved.name.trim() || dash },
    { icon: "mail", label: t("email"), value: saved.email.trim() || dash, ltr: true },
    { icon: "phone", label: t("phone"), value: saved.phone.trim() || dash, ltr: true },
    { icon: "calendar", label: t("birthDate"), value: saved.birthdate.trim() || dash, ltr: true },
    { icon: "pin", label: t("address"), value: saved.address.trim() || dash },
  ];

  /* The design's side menu. Every section stays on the page, so its entries are
     in-page anchors rather than tabs that hide the rest; settings is the one
     entry that leaves, to the full settings screen. */
  const menu: Array<{ href: string; icon: string; label: string }> = [
    { href: "#acx-overview", icon: "wallet", label: t("totalDonated") },
    ...(pendingTransfers.length > 0 ? [{ href: "#acx-transfers", icon: "receipt", label: tTransfer("accountSectionTitle") }] : []),
    { href: "#acx-history", icon: "list", label: t("donationHistory") },
    { href: "#acx-recurring", icon: "refresh", label: t("recurringTitle") },
    { href: "#acx-info", icon: "user", label: t("myInfo") },
  ];

  return (
    <div className="acc-page acx-page">
      <div className="acx-wrap">
        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="acx-hero acc-in">
          <span aria-hidden="true" className="acx-avatar">
            {donorName.trim().charAt(0)}
          </span>
          <div className="acx-hero-info">
            <h1>{donorName}</h1>
            <span>
              {t("memberSince", { date: monthFormat.format(new Date(profile.memberSince)) })}
              {saved.email.trim() ? (
                <>
                  {" — "}
                  <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{saved.email.trim()}</span>
                </>
              ) : null}
            </span>
          </div>

          {/* The handoff points this at the contact page  plainly a placeholder.
              It leads to the real settings screen, where a donor can also change
              their password, country and notification preferences. */}
          <Link href={`/${locale}/profile`} className="acx-badge">
            <Icon name="settings" />
            {t("settings")}
          </Link>
        </div>

        <div className="acx-layout">
          <nav className="acx-side acc-in acc-in-1">
            {menu.map((item, index) => (
              <a key={item.href} href={item.href} className={`acx-side-link${index === 0 ? " is-on" : ""}`}>
                <Icon name={item.icon} size={17} />
                {item.label}
              </a>
            ))}
            <hr />
            <Link href={`/${locale}/profile`} className="acx-side-link">
              <Icon name="settings" size={17} />
              {t("settings")}
            </Link>
          </nav>

          <div className="acx-main">
            <div id="acx-overview" className="acx-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="acx-stat acc-in acc-in-1">
                  <span aria-hidden="true" className="acx-ico">
                    <Icon name={stat.icon} size={17} />
                  </span>
                  <b dir="ltr">{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Bank transfers the finance team has not confirmed yet. Shown
                above the history, apart from it and never in the totals: the
                donor should see where each one stands and what it needs of
                them  a receipt, another receipt, or nothing but patience. */}
            {pendingTransfers.length > 0 ? (
              <div id="acx-transfers" className="acx-panel acc-in">
                <h2>{tTransfer("accountSectionTitle")}</h2>
                <p className="acx-sub">{tTransfer("accountSectionLead")}</p>
                <div className="acx-rows">
                  {pendingTransfers.map((transfer) => {
                    const tone =
                      transfer.status === "REJECTED"
                        ? "rejected"
                        : transfer.status === "UNDER_REVIEW"
                          ? "review"
                          : "pending";
                    const label =
                      transfer.status === "REJECTED"
                        ? tTransfer("statusRejected")
                        : transfer.status === "UNDER_REVIEW"
                          ? tTransfer("statusReview")
                          : tTransfer("statusAwaiting");
                    return (
                      <div key={transfer.donationId} className="acx-row" data-tone={tone}>
                        <span className="acx-row-main">
                          <b>{transfer.titles.length ? transfer.titles.join("، ") : t("dearDonor")}</b>
                          <span className="acx-row-meta">
                            <time dateTime={transfer.createdAt}>{dateFormat.format(new Date(transfer.createdAt))}</time>
                            <span className="acx-status" data-tone={tone}>{label}</span>
                          </span>
                        </span>
                        <b dir="ltr" className="acx-amt" style={{ color: "#5d7187" }}>
                          {chargedAmount(transfer.amount, transfer.currency)}
                        </b>
                        <Link
                          href={miaPath("paymentPending", locale, transfer.donationId)}
                          className={`acx-action${transfer.canUpload ? " is-primary" : ""}`}
                        >
                          {transfer.canUpload ? tTransfer("accountAction") : tTransfer("accountFollow")}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div id="acx-history" className="acx-panel acc-in">
              <h2>{t("donationHistory")}</h2>
              <div className="acx-rows">
                {donations.map((donation) => (
                  <div key={donation.id} className="acx-row">
                    <span className="acx-row-main">
                      <b>{donation.titles.length ? donation.titles.join("، ") : t("dearDonor")}</b>
                      <span className="acx-row-meta">
                        <time dateTime={donation.date}>{dateFormat.format(new Date(donation.date))}</time>
                        {donation.recurring ? (
                          <span className="acx-status" data-tone="recurring">{t("recurringTitle")}</span>
                        ) : null}
                      </span>
                    </span>
                    <b dir="ltr" className="acx-amt">
                      {chargedAmount(donation.amount, donation.currency)}
                    </b>
                    {/* The receipt is the server-generated PDF, not a page: it is
                        the document a donor keeps, and it is issued per donation. */}
                    <a
                      href={`/api/donations/${donation.id}/receipt?locale=${encodeURIComponent(locale)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="acx-action"
                    >
                      <Icon name="receipt" size={13} />
                      {t("receipt")}
                    </a>
                  </div>
                ))}

                {donations.length === 0 ? (
                  <p className="acx-empty">
                    {t("noDonationsYet")}{" "}
                    <Link href={miaPath("projects", locale)} style={{ color: "#0077b3", fontWeight: 800 }}>
                      {t("browseProjects")}
                    </Link>{" "}
                    {t("toStart")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="acx-duo">
              <div id="acx-info" className="acx-panel acc-in acc-in-1">
                <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span aria-hidden="true" className="acx-ico acx-ico--sm">
                    <Icon name="user" size={15} />
                  </span>
                  {t("myInfo")}
                </h2>

                {editing ? (
                  <>
                    <span className="acx-fields">
                      <EditField label={t("fullName")} value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} autoComplete="name" />
                      <EditField label={t("email")} value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" dir="ltr" autoComplete="email" />
                      <EditField label={t("phone")} value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" dir="ltr" autoComplete="tel" />
                      <EditField label={t("birthDate")} value={form.birthdate} onChange={(v) => setForm((f) => ({ ...f, birthdate: v }))} type="date" dir="ltr" />
                      <EditField label={t("address")} value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} autoComplete="address-level2" />
                    </span>
                    <span style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <button type="button" onClick={save} disabled={saving} className="acx-save" style={{ cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                        {t("save")}
                      </button>
                      <button type="button" onClick={cancel} className="acx-cancel">
                        {t("cancel")}
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="acx-details">
                      {details.map((detail) => (
                        <span key={detail.icon} className="acx-detail">
                          <small>{detail.label}</small>
                          <span>
                            <Icon name={detail.icon} size={14} />
                            {detail.ltr ? (
                              <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{detail.value}</span>
                            ) : (
                              detail.value
                            )}
                          </span>
                        </span>
                      ))}
                    </span>
                    <button type="button" onClick={() => setEditing(true)} className="acx-cancel" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                      <Icon name="edit" size={14} />
                      {t("editInfo")}
                    </button>
                  </>
                )}
              </div>

              <div id="acx-recurring" className="acx-panel acx-recurring acc-in acc-in-2">
                <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span aria-hidden="true" className="acx-ico acx-ico--sm">
                    <Icon name="refresh" size={15} />
                  </span>
                  {t("recurringTitle")}
                </h2>
                <p className="acx-sub" style={{ fontSize: 14, lineHeight: 1.8 }}>
                  {activeSubscriptions > 0 ? `${formatNumber(activeSubscriptions)} ${t("activeSubs")}` : t("noActivePlan")}
                </p>
                <Button variant="primary" href={miaPath("recurring", locale)} style={{ whiteSpace: "nowrap", justifySelf: "start" }}>
                  {t("startRecurring")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  dir,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: "ltr";
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#5d7187" }}>{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...FIELD, ...(dir === "ltr" ? { textAlign: "end" as const } : {}) }}
      />
    </label>
  );
}
