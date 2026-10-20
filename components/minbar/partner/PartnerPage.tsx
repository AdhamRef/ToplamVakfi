"use client";

import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Become a partner  ported from `Minbar/كن شريكا.dc.html`, laid out on the
 * Toplum inner-page template (`ToplamVakfi-design/Toplum Vakfı Partners.dc.html`):
 * the photo banner, the partnership tracks as white list rows, and the lead
 * form card beside them. Styles (`.fd-*`) live in `styles/minbar/pages/about.css`.
 *
 * Three partnership tracks, then a short lead form. The handoff's `submitLead()`
 * is a placeholder timer; this posts to `POST /api/messages` under the
 * `PARTNERSHIP` subject, which routes it to the same inbox the dashboard reads.
 */

const TRACKS: ReadonlyArray<{ icon: string; title: string; text: string }> = [
  { icon: "company", title: "trackCompanyTitle", text: "trackCompanyText" },
  { icon: "organization", title: "trackOrgTitle", text: "trackOrgText" },
  { icon: "donor", title: "trackDonorTitle", text: "trackDonorText" },
];

const ICONS: Record<string, ReactElement> = {
  company: (
    <>
      <rect x="4" y="9" width="7" height="12" />
      <rect x="13" y="4" width="7" height="17" />
      <path d="M7 13h1M7 17h1M16 8h1M16 12h1M16 16h1" />
    </>
  ),
  organization: (
    <>
      <circle cx="7" cy="8" r="2.6" />
      <circle cx="17" cy="8" r="2.6" />
      <path d="M2.5 20c.6-3 2.3-4.7 4.5-4.7s3.9 1.7 4.5 4.7M12.5 20c.6-3 2.3-4.7 4.5-4.7s3.9 1.7 4.5 4.7" />
    </>
  ),
  donor: <path d="M12 21s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z" />,
};

const EMAIL_RE = /\S+@\S+\.\S+/;

function field(invalid: boolean) {
  return {
    width: "100%",
    minHeight: 46,
    border: `1.5px solid ${invalid ? "#b3261e" : "#e3edf4"}`,
    borderRadius: 10,
    padding: "0 14px",
    fontSize: 14,
    background: "#fbfdff",
    color: "#062442",
    boxSizing: "border-box" as const,
    unicodeBidi: "plaintext" as const,
  };
}

export default function PartnerPage() {
  const locale = useLocale();
  const t = useTranslations("partner");
  const tNav = useTranslations("navigation");

  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const emailValid = EMAIL_RE.test(email);

  const fail = () => {
    setError(t("errorValidation"));
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 350);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!org.trim() || !emailValid) {
      fail();
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "PARTNERSHIP",
          /* The description of the proposed partnership is optional in the
             design but the inbox needs a body, so a blank one falls back to
             the form's own title rather than to invented text. The substance
             is then the organisation name and the address to reply to. */
          body: message.trim() || t("formTitle"),
          locale,
          guestName: org.trim(),
          guestEmail: email.trim(),
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
      try {
        track("partner_lead_sent", { source: "minbar_partner", locale });
      } catch {}
    } catch {
      /* Nothing was delivered, so the form keeps what was typed. */
      fail();
      try {
        track("partner_lead_failed", { source: "minbar_partner", locale });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-page fd-page">
      {/* The handoff computes the eyebrow and then never places it. It is
          translated in all 19 languages, so it sits above the title. */}
      <InnerBanner
        crumbs={[{ label: tNav("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        eyebrow={t("eyebrow")}
        title={t("heroTitle")}
        lead={t("metaDescription")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-two">
          <div className="pt-in">
            <h2 className="fd-h2">{t("tracksTitle")}</h2>
            <div className="fd-rows">
              {TRACKS.map((item) => (
                <article key={item.title} className="fd-card fd-track-row pt-track">
                  <span aria-hidden="true" className="fd-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[item.icon]}
                    </svg>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{t(item.title)}</h3>
                    <p>{t(item.text)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="fd-card fd-done" role="status">
              <span className="pt-pop fd-done-ico">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h2>{t("sentTitle")}</h2>
              <p>{t("sentText")}</p>
            </div>
          ) : (
            <form id="pform" onSubmit={onSubmit} noValidate className={`fd-card fd-form pt-in pt-in-2${shake ? " pt-shake" : ""}`}>
              <h2>{t("formTitle")}</h2>

              <div className="fd-pair pt-pair">
                <label>
                  <span className="fd-label">{t("fieldOrg")}</span>
                  <input
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    autoComplete="organization"
                    aria-invalid={Boolean(error) && !org.trim()}
                    style={field(Boolean(error) && !org.trim())}
                  />
                </label>
                <label>
                  <span className="fd-label">{t("fieldEmail")}</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    aria-invalid={Boolean(error) && !emailValid}
                    style={field(Boolean(error) && !emailValid)}
                  />
                </label>
              </div>

              <label>
                <span className="fd-label">{t("fieldType")}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  style={{ ...field(false), minHeight: 120, padding: "12px 14px", resize: "vertical" }}
                />
              </label>

              {error ? (
                <span role="alert" className="fd-error">
                  {error}
                </span>
              ) : null}

              <button type="submit" disabled={submitting} className="pt-submit fd-pill">
                <span aria-hidden="true" className="fd-pill-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </span>
                {submitting ? t("submitLabelSending") : t("submitLabel")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
