"use client";

import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import { ORG, ORG_TEL, ORG_WHATSAPP } from "@/lib/minbar/org";
import type { MessageSubject } from "@/lib/messages/subjects";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Contact us  ported from `Minbar/تواصل معنا.dc.html`, laid out as
 * `ToplamVakfi-design/Toplum Vakfı Contact.dc.html`: the photo banner, then the
 * message form card beside a column of contact cards. Styles (`.fd-*`) live in
 * `styles/minbar/pages/about.css`.
 *
 * The handoff's `submitTicket()` is a 900ms `setTimeout` placeholder. This
 * version posts to the site's real inbox, `POST /api/messages`, which is what
 * the dashboard's Messages screen reads  so a message sent here is a message
 * an admin actually receives.
 */

/**
 * The five subjects the design offers, each mapped onto the inbox's routing
 * enum. Press and "other" both land in `GENERAL`: the enum has no press value,
 * and inventing one here would write a subject the dashboard cannot filter on.
 * The reader still sees the five distinct labels.
 */
const SUBJECTS: ReadonlyArray<{ key: string; subject: MessageSubject }> = [
  { key: "subjDonation", subject: "DONATION_ISSUE" },
  { key: "subjProject", subject: "CAMPAIGN_SUPPORT" },
  { key: "subjPartnership", subject: "PARTNERSHIP" },
  { key: "subjMedia", subject: "GENERAL" },
  { key: "subjOther", subject: "GENERAL" },
];

const ICONS: Record<string, ReactElement> = {
  pin: (
    <>
      <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6.5 8-6.5" />
    </>
  ),
  phone: (
    <path d="M6.6 10.5a13.5 13.5 0 0 0 6.9 6.9l2.3-2.3a1.5 1.5 0 0 1 1.5-.37 11 11 0 0 0 3.4.55 1.5 1.5 0 0 1 1.5 1.5V20a1.5 1.5 0 0 1-1.5 1.5A17.5 17.5 0 0 1 3 4.5 1.5 1.5 0 0 1 4.5 3h2.4a1.5 1.5 0 0 1 1.5 1.5 11 11 0 0 0 .55 3.4 1.5 1.5 0 0 1-.37 1.5Z" />
  ),
  whatsapp: <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" />,
};

/**
 * Email, phone, WhatsApp and address, in the design's order. Each value
 * carries its own direction: an email and a phone number stay LTR inside an
 * Arabic page, and the isolation keeps a leading `+` from being pushed to the
 * wrong end of the number. The first three are links; the address is not.
 */
const CARDS: ReadonlyArray<{ icon: keyof typeof ICONS; labelKey: string; value: string; href?: string; external?: boolean }> = [
  { icon: "mail", labelKey: "emailLabel", value: ORG.email, href: `mailto:${ORG.email}` },
  { icon: "phone", labelKey: "phoneLabel", value: ORG.phone, href: ORG_TEL },
  { icon: "whatsapp", labelKey: "whatsappLabel", value: ORG.phone, href: ORG_WHATSAPP, external: true },
  { icon: "pin", labelKey: "addressLabel", value: ORG.address },
];

const EMAIL_RE = /\S+@\S+\.\S+/;

function fieldStyle(invalid: boolean) {
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
    /* The field can hold Arabic or Latin text; `plaintext` lets each entry
       align by its own first strong character rather than by the page. */
    unicodeBidi: "plaintext" as const,
  };
}

function Glyph({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations("contact");
  const tNav = useTranslations("navigation");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const emailValid = EMAIL_RE.test(email);
  const chosen = SUBJECTS[subjectIndex] ?? SUBJECTS[0];

  const fail = (text: string) => {
    setError(text);
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 350);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!name.trim() || !emailValid || !message.trim()) {
      fail(!emailValid && email.trim() ? t("errEmail") : t("errRequired"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: chosen.subject,
          body: message.trim(),
          locale,
          guestName: name.trim(),
          guestEmail: email.trim(),
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setSubmitted(true);
      try {
        track("contact_message_sent", { source: "minbar_contact", subject: chosen.subject, locale });
      } catch {}
    } catch {
      /* The message was not delivered, so the form stays filled in: the sender
         can press send again without retyping what they wrote. */
      fail(t("errRequired"));
      try {
        track("contact_message_failed", { source: "minbar_contact", subject: chosen.subject, locale });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setSubjectIndex(0);
    setMessage("");
    setSubmitted(false);
    setError("");
  };

  return (
    <div className="cf-page fd-page">
      <InnerBanner
        id="hero"
        crumbs={[{ label: tNav("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        title={t("heroTitle")}
        lead={t("heroSubtitle")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-ct-grid">
          {submitted ? (
            <div className="fd-card fd-done" role="status">
              <span className="cf-pop fd-done-ico">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h2>{t("received")}</h2>
              <p>{t("receivedNote", { subject: t(chosen.key) })}</p>
              <button type="button" onClick={reset} className="cf-again fd-ghost">
                {t("sendAnother")}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className={`fd-card fd-form cf-in cf-in-2${shake ? " cf-shake" : ""}`}>
              <h2>{t("formTitle")}</h2>

              <div className="fd-pair cf-pair">
                <label>
                  <span className="fd-label">{t("nameLabel")}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    autoComplete="name"
                    aria-invalid={Boolean(error) && !name.trim()}
                    style={fieldStyle(Boolean(error) && !name.trim())}
                  />
                </label>
                <label>
                  <span className="fd-label">{t("emailLabel")}</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    dir="ltr"
                    placeholder="email@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(error) && !emailValid}
                    style={fieldStyle(Boolean(error) && !emailValid)}
                  />
                </label>
              </div>

              <label>
                <span className="fd-label">{t("subjectLabel")}</span>
                {/* The selected value is the option's index, not its label: a
                    label is translated and would stop matching once it changes. */}
                <select value={subjectIndex} onChange={(e) => setSubjectIndex(Number(e.target.value))} style={{ ...fieldStyle(false), cursor: "pointer" }}>
                  {SUBJECTS.map((option, index) => (
                    <option key={option.key} value={index}>
                      {t(option.key)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="fd-label">{t("messageLabel")}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder={t("messagePlaceholder")}
                  aria-invalid={Boolean(error) && !message.trim()}
                  style={{ ...fieldStyle(Boolean(error) && !message.trim()), minHeight: 130, padding: "12px 14px", resize: "vertical" }}
                />
              </label>

              {error ? (
                <span role="alert" className="fd-error">
                  {error}
                </span>
              ) : null}

              <button type="submit" disabled={submitting} className="cf-submit fd-pill">
                <span aria-hidden="true" className="fd-pill-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </span>
                {submitting ? t("sending") : t("sendMessage")}
              </button>
            </form>
          )}

          <aside className="fd-aside">
            {CARDS.map((card) => {
              const body = (
                <>
                  <span aria-hidden="true" className={`fd-ico${card.icon === "whatsapp" ? " fd-ico-green" : ""}`}>
                    <Glyph name={card.icon} />
                  </span>
                  <span className="fd-item-text">
                    <small>{t(card.labelKey)}</small>
                    <b dir="ltr">{card.value}</b>
                  </span>
                </>
              );
              return card.href ? (
                <a
                  key={card.labelKey}
                  href={card.href}
                  className="fd-card fd-item cf-in"
                  {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {body}
                </a>
              ) : (
                <div key={card.labelKey} className="fd-card fd-item cf-in">
                  {body}
                </div>
              );
            })}
          </aside>
        </div>
      </div>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}
