"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Partnerships  `ToplamVakfi-design/Toplum Vakfı Partners.dc.html`: photo
 * banner (no breadcrumb), the foundation's partners as white rows (name, the
 * nature of the cooperation, country), and the closing "partnership news"
 * button.
 *
 * The design has no form; the site's partnership lead form is kept between
 * the list and the closing button, in the contact page's form card, and still
 * posts to `POST /api/messages` under `PARTNERSHIP`. Styles: `.fd-partner*`,
 * `.fd-form` in `styles/minbar/pages/about.css`.
 */

const PARTNERS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function PartnerPage() {
  const locale = useLocale();
  const t = useTranslations("partner");

  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const emailValid = EMAIL_RE.test(email.trim());

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
          /* The partnership description is optional but the inbox needs a
             body, so a blank one falls back to the form's own title rather
             than to invented text. */
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
    <div className="fd-page fd-p-partner">
      <InnerBanner title={t("heroTitle")} lead={t("metaDescription")} />

      <ul className="fd-partners" aria-label={t("listLabel")}>
        {PARTNERS.map((key) => (
          <li key={key} className="fd-partner-row">
            <div>
              <h3>{t(`${key}.name`)}</h3>
              <span>{t(`${key}.text`)}</span>
            </div>
            <span className="fd-partner-loc">{t(`${key}.country`)}</span>
          </li>
        ))}
      </ul>

      <div className="fd-partner-form">
        {sent ? (
          <div className="fd-card fd-done" role="status">
            <span className="fd-done-ico">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2>{t("sentTitle")}</h2>
            <p>{t("sentText")}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className={`fd-card fd-form${shake ? " fd-shake" : ""}`} aria-labelledby="fd-pt-title">
            <span className="fd-script">{t("formScript")}</span>
            <h2 id="fd-pt-title">{t("formTitle")}</h2>

            <div className="fd-row">
              <div className="fd-field">
                <label htmlFor="ptOrg">
                  {t("fieldOrg")} <b aria-hidden="true">*</b>
                </label>
                <input
                  id="ptOrg"
                  required
                  autoComplete="organization"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  aria-invalid={Boolean(error) && !org.trim() ? true : undefined}
                />
              </div>
              <div className="fd-field">
                <label htmlFor="ptEmail">
                  {t("fieldEmail")} <b aria-hidden="true">*</b>
                </label>
                <input
                  id="ptEmail"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error) && !emailValid ? true : undefined}
                />
              </div>
            </div>

            <div className="fd-field">
              <label htmlFor="ptType">{t("fieldType")}</label>
              <textarea id="ptType" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <button type="submit" disabled={submitting} className="fd-pill">
              <span aria-hidden="true" className="fd-pill-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </span>
              {submitting ? t("submitLabelSending") : t("submitLabel")}
            </button>
            <p className="fd-msg" role="alert" data-tone={error ? "error" : undefined}>
              {error}
            </p>
          </form>
        )}
      </div>

      <div className="fd-cta-band">
        <Link href={miaPath("news", locale)}>
          {t("newsCta")} <span className="fd-arrow" aria-hidden="true">←</span>
        </Link>
      </div>
    </div>
  );
}
