"use client";

import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import { ORG, ORG_TEL, ORG_WHATSAPP } from "@/lib/minbar/org";
import type { MessageSubject } from "@/lib/messages/subjects";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Contact us  `ToplamVakfi-design/Toplum Vakfı Contact.dc.html`: photo banner,
 * then the message form card ("راسلنا") beside a column of contact cards and
 * the map card. Styles: `.fd-ct-*`, `.fd-form`, `.fd-field` in
 * `styles/minbar/pages/about.css`.
 *
 * The design's submit handler only validates; this one also posts to the
 * site's inbox, `POST /api/messages` (the dashboard's Messages screen). The
 * optional phone goes in that API's `contactPhone` field. The KVKK consent
 * box is checked in the browser only, as in the design: the API stores no
 * consent flag and none is invented here.
 */

/**
 * The design's five topics, each mapped onto the inbox's routing enum. Media
 * lands in `GENERAL`: the enum has no press value, and inventing one would
 * write a subject the dashboard cannot filter on.
 */
const SUBJECTS: ReadonlyArray<{ key: string; subject: MessageSubject }> = [
  { key: "subjGeneral", subject: "GENERAL" },
  { key: "subjDonation", subject: "DONATION_ISSUE" },
  { key: "subjVolunteer", subject: "VOLUNTEERING" },
  { key: "subjPartnership", subject: "PARTNERSHIP" },
  { key: "subjMedia", subject: "GENERAL" },
];

const ICONS: Record<string, ReactElement> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
  ),
  whatsapp: <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" />,
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

/** Email, phone, WhatsApp and address, in the design's order. */
const CARDS: ReadonlyArray<{ icon: keyof typeof ICONS; labelKey: string; value: string; href?: string; external?: boolean }> = [
  { icon: "mail", labelKey: "emailCard", value: ORG.email, href: `mailto:${ORG.email}` },
  { icon: "phone", labelKey: "phoneCard", value: ORG.phone, href: ORG_TEL },
  { icon: "whatsapp", labelKey: "whatsappCard", value: ORG.phone, href: ORG_WHATSAPP, external: true },
  { icon: "pin", labelKey: "addressCard", value: ORG.address },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Status = { tone: "ok" | "error"; text: string } | null;

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
  const tAbout = useTranslations("about");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [tried, setTried] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const emailValid = EMAIL_RE.test(email.trim());
  const chosen = SUBJECTS[subjectIndex] ?? SUBJECTS[0];

  const fail = (text: string) => {
    setStatus({ tone: "error", text });
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 350);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setTried(true);

    if (!name.trim() || !email.trim() || !message.trim()) return fail(t("errRequired"));
    if (!emailValid) return fail(t("errEmail"));
    if (!consent) return fail(t("errConsent"));

    setSubmitting(true);
    setStatus(null);
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
          contactPhone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus({ tone: "ok", text: t("success") });
      setName("");
      setEmail("");
      setPhone("");
      setSubjectIndex(0);
      setMessage("");
      setConsent(false);
      setTried(false);
      try {
        track("contact_message_sent", { source: "minbar_contact", subject: chosen.subject, locale });
      } catch {}
    } catch {
      /* Nothing was delivered, so the form keeps what was typed. */
      fail(t("errSend"));
      try {
        track("contact_message_failed", { source: "minbar_contact", subject: chosen.subject, locale });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const required = (
    <>
      {" "}
      <b aria-hidden="true">*</b>
    </>
  );

  return (
    <div className="fd-page fd-p-contact">
      <InnerBanner
        crumbs={[{ label: tAbout("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        crumbLabel={tAbout("crumbLabel")}
        title={t("heroTitle")}
        lead={t("heroSubtitle")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-ct-grid">
          <form onSubmit={onSubmit} noValidate className={`fd-card fd-form${shake ? " fd-shake" : ""}`} aria-labelledby="fd-ct-title">
            <span className="fd-script">{t("formScript")}</span>
            <h2 id="fd-ct-title">{t("formTitle")}</h2>

            <div className="fd-row">
              <div className="fd-field">
                <label htmlFor="ctName">
                  {t("nameLabel")}
                  {required}
                </label>
                <input
                  id="ctName"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={tried && !name.trim() ? true : undefined}
                />
              </div>
              <div className="fd-field">
                <label htmlFor="ctEmail">
                  {t("emailLabel")}
                  {required}
                </label>
                <input
                  id="ctEmail"
                  type="email"
                  required
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={tried && !emailValid ? true : undefined}
                />
              </div>
            </div>

            <div className="fd-row">
              <div className="fd-field">
                <label htmlFor="ctPhone">{t("phoneLabel")}</label>
                <input id="ctPhone" type="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="fd-field">
                <label htmlFor="ctTopic">{t("subjectLabel")}</label>
                {/* The value is the option's index, not its label: a label is
                    translated and would stop matching once it changes. */}
                <select id="ctTopic" value={subjectIndex} onChange={(e) => setSubjectIndex(Number(e.target.value))}>
                  {SUBJECTS.map((option, index) => (
                    <option key={option.key} value={index}>
                      {t(option.key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fd-field">
              <label htmlFor="ctMsg">
                {t("messageLabel")}
                {required}
              </label>
              <textarea id="ctMsg" required value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={tried && !message.trim() ? true : undefined} />
            </div>

            <label className="fd-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={tried && !consent ? true : undefined} />
              <span>
                {t.rich("consent", {
                  link: (chunks) => <Link href={miaPath("privacy", locale)}>{chunks}</Link>,
                })}
              </span>
            </label>

            <button type="submit" disabled={submitting} className="fd-pill">
              <span aria-hidden="true" className="fd-pill-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </span>
              {submitting ? t("sending") : t("send")}
            </button>
            <p className="fd-msg" role="status" aria-live="polite" data-tone={status?.tone}>
              {status?.text}
            </p>
          </form>

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
                <a key={card.labelKey} href={card.href} className="fd-card fd-item" {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {body}
                </a>
              ) : (
                <div key={card.labelKey} className="fd-card fd-item">
                  {body}
                </div>
              );
            })}

            <div className="fd-card fd-map">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z" />
                  <path d="M9 4v13M15 6.5v13" />
                </svg>
                <p>{t("mapNote")}</p>
                <a className="fd-pill" href={ORG.mapUrl} target="_blank" rel="noopener noreferrer">
                  <span className="fd-pill-ico" aria-hidden="true">
                    <span className="fd-arrow">←</span>
                  </span>
                  {t("mapCta")}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
