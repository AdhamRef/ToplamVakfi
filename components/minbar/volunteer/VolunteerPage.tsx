"use client";

import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Volunteer with us. The Toplum design has no volunteer page, so this one is
 * built from the shared inner-page system of the other foundation pages:
 * photo banner (lead line from the About page's volunteering card), the
 * volunteering areas as icon cards, and the application in the contact page's
 * form card. Styles: `styles/minbar/pages/about.css`.
 *
 * The application posts to `POST /api/messages` under `VOLUNTEERING`; the
 * phone goes in `contactPhone`, and the country and chosen area lead the
 * message body (the inbox has no columns for them).
 */

const TRACKS: ReadonlyArray<{ icon: string; title: string; text: string }> = [
  { icon: "translate", title: "track1Title", text: "track1Text" },
  { icon: "media", title: "track2Title", text: "track2Text" },
  { icon: "tech", title: "track3Title", text: "track3Text" },
  { icon: "remote", title: "track4Title", text: "track4Text" },
  { icon: "agent", title: "track5Title", text: "track5Text" },
];

const ICONS: Record<string, ReactElement> = {
  translate: (
    <>
      <path d="M4 5h9M8 3v2M6.5 8.5C7.5 11 10 13.5 13 14.5M11 8.5c-1 2.5-3.5 5-6.5 6" />
      <path d="m14 20 4-9 4 9M15.3 17h5.4" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="m10 8 4 2.5-4 2.5V8Z" />
    </>
  ),
  tech: (
    <>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
    </>
  ),
  remote: (
    <>
      <rect x="2" y="4" width="14" height="10" rx="2" />
      <path d="M6 20h6M9 14v6" />
      <path d="M17 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4" />
    </>
  ),
  agent: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
    </>
  ),
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function VolunteerPage() {
  const locale = useLocale();
  const t = useTranslations("volunteer");
  const tAbout = useTranslations("about");

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trackIndex, setTrackIndex] = useState(0);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const emailValid = EMAIL_RE.test(email.trim());
  const chosen = TRACKS[trackIndex] ?? TRACKS[0];
  const chosenTitle = t(chosen.title);

  const fail = () => {
    setError(t("errorValidation"));
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 350);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!name.trim() || !emailValid) {
      fail();
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const lines = [
        `${t("fieldLabel")}: ${chosenTitle}`,
        country.trim() ? `${t("countryLabel")}: ${country.trim()}` : null,
        bio.trim(),
      ].filter(Boolean);

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "VOLUNTEERING",
          body: lines.join("\n"),
          locale,
          guestName: name.trim(),
          guestEmail: email.trim(),
          contactPhone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setSubmitted(true);
      try {
        track("volunteer_application_sent", { source: "minbar_volunteer", locale });
      } catch {}
    } catch {
      /* Nothing was delivered, so the form keeps what was typed. */
      fail();
      try {
        track("volunteer_application_failed", { source: "minbar_volunteer", locale });
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setName("");
    setCountry("");
    setEmail("");
    setPhone("");
    setTrackIndex(0);
    setBio("");
    setSubmitted(false);
    setError("");
  };

  const star = (
    <>
      {" "}
      <b aria-hidden="true">*</b>
    </>
  );

  return (
    <div className="fd-page fd-p-volunteer">
      <InnerBanner
        crumbs={[{ label: tAbout("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        crumbLabel={tAbout("crumbLabel")}
        title={t("heroTitle")}
        lead={t("heroSubtitle")}
      />

      <div className="fd-main">
        <div className="fd-wrap">
          <section aria-labelledby="fd-vl-fields">
            <h2 id="fd-vl-fields" className="fd-h2">
              {t("fieldsTitle")}
            </h2>
            <ul className="fd-cards">
              {TRACKS.map((item) => (
                <li key={item.title} className="fd-card">
                  <span aria-hidden="true" className="fd-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[item.icon]}
                    </svg>
                  </span>
                  <h3>{t(item.title)}</h3>
                  <p>{t(item.text)}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="fd-narrow">
            {submitted ? (
              <div className="fd-card fd-done" role="status">
                <span className="fd-done-ico">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h2>{t("received")}</h2>
                <p>{t("receivedNote", { field: chosenTitle })}</p>
                <button type="button" onClick={reset} className="fd-ghost">
                  {t("sendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className={`fd-card fd-form${shake ? " fd-shake" : ""}`} aria-labelledby="fd-vl-title">
                <span className="fd-script">{t("script")}</span>
                <h2 id="fd-vl-title">{t("formTitle")}</h2>

                <div className="fd-row">
                  <div className="fd-field">
                    <label htmlFor="vlName">
                      {t("nameLabel")}
                      {star}
                    </label>
                    <input
                      id="vlName"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={Boolean(error) && !name.trim() ? true : undefined}
                    />
                  </div>
                  <div className="fd-field">
                    <label htmlFor="vlCountry">{t("countryLabel")}</label>
                    <input id="vlCountry" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>
                <div className="fd-row">
                  <div className="fd-field">
                    <label htmlFor="vlEmail">
                      {t("emailLabel")}
                      {star}
                    </label>
                    <input
                      id="vlEmail"
                      type="email"
                      required
                      dir="ltr"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(error) && !emailValid ? true : undefined}
                    />
                  </div>
                  <div className="fd-field">
                    <label htmlFor="vlPhone">{t("phoneLabel")}</label>
                    <input id="vlPhone" type="tel" dir="ltr" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="fd-field">
                  <label htmlFor="vlTrack">{t("fieldLabel")}</label>
                  {/* The value is the area's index, not its translated title. */}
                  <select id="vlTrack" value={trackIndex} onChange={(e) => setTrackIndex(Number(e.target.value))}>
                    {TRACKS.map((item, index) => (
                      <option key={item.title} value={index}>
                        {t(item.title)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fd-field">
                  <label htmlFor="vlBio">{t("bioLabel")}</label>
                  <textarea id="vlBio" value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <button type="submit" disabled={submitting} className="fd-pill">
                  <span aria-hidden="true" className="fd-pill-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                    </svg>
                  </span>
                  {submitting ? t("sending") : t("submit")}
                </button>
                <p className="fd-msg" role="alert" data-tone={error ? "error" : undefined}>
                  {error}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
