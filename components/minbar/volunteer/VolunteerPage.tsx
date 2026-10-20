"use client";

import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { miaPath } from "@/lib/minbar/routes";
import ZakatBanner from "@/components/minbar/banners/ZakatBanner";
import TravelBanner from "@/components/minbar/banners/TravelBanner";
import IbadanBanner from "@/components/minbar/banners/IbadanBanner";
import InnerBanner from "@/components/minbar/about/InnerBanner";

/**
 * Volunteer with us  ported from `Minbar/تطوع معنا.dc.html`. The Toplum design
 * has no volunteer page, so it takes the shared inner-page template of the
 * other foundation pages (photo banner, icon cards, form card); styles
 * (`.fd-*`) live in `styles/minbar/pages/about.css`.
 *
 * TRANSLATION GAP: this is the only page in the handoff written in hard-coded
 * Arabic  `Minbar/i18n/<lang>/` ships no `volunteer.json` in any of the 19
 * languages. Every string that had a reviewed key elsewhere uses it (name,
 * email, phone, "Volunteering Field", the received line, send / sending / send
 * another); the rest live in a new `volunteer` namespace whose non-Arabic
 * entries are an English rendering awaiting a translator.
 *
 * The handoff's `submitApplication()` is a placeholder timer. This posts to
 * `POST /api/messages` under the `VOLUNTEERING` subject.
 */

const TRACKS: ReadonlyArray<{ icon: string; title: string; text: string }> = [
  { icon: "translate", title: "track1Title", text: "track1Text" },
  { icon: "media", title: "track2Title", text: "track2Text" },
  { icon: "remote", title: "track3Title", text: "track3Text" },
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
      <path d="M12 4.5v-1M9 6l-1-1M15 6l1-1" />
    </>
  ),
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

export default function VolunteerPage() {
  const locale = useLocale();
  const t = useTranslations("volunteer");
  const tCommon = useTranslations("common");
  const tContact = useTranslations("contact");
  const tPartner = useTranslations("partner");
  const tNav = useTranslations("navigation");

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

  const emailValid = EMAIL_RE.test(email);
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
      /* The inbox has a phone column but none for country or volunteering
         track, and both are answers the applicant actually gave  so they lead
         the message body rather than being dropped on the way to the team. */
      const lines = [
        `${tCommon("volunteerField")}: ${chosenTitle}`,
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

  return (
    <div className="vl-page fd-page">
      <InnerBanner
        id="hero"
        crumbs={[{ label: tNav("home"), href: miaPath("home", locale) }, { label: t("heroTitle") }]}
        title={t("heroTitle")}
        lead={t("heroSubtitle")}
      />

      <div className="fd-main">
        <div className="fd-wrap fd-stack" style={{ gap: 30 }}>
          <div>
            <h2 className="fd-h2">{tCommon("volunteerFields")}</h2>
            <div className="fd-cards">
              {TRACKS.map((item) => (
                <article key={item.title} className="fd-card vl-track vl-in">
                  <span aria-hidden="true" className="fd-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[item.icon]}
                    </svg>
                  </span>
                  <h3>{t(item.title)}</h3>
                  <p>{t(item.text)}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="fd-narrow" style={{ width: "100%" }}>
            {submitted ? (
              <div className="fd-card fd-done" role="status">
                <span className="vl-pop fd-done-ico">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h2>{tCommon("volunteerReceived")}</h2>
                <p>{t("receivedNote", { field: chosenTitle })}</p>
                <button type="button" onClick={reset} className="vl-again fd-ghost">
                  {tContact("sendAnother")}
                </button>
              </div>
            ) : (
              <form id="vform" onSubmit={onSubmit} noValidate className={`fd-card fd-form vl-in vl-in-2${shake ? " vl-shake" : ""}`}>
                <h2>{t("formTitle")}</h2>

                <div className="fd-pair vl-pair">
                  <label>
                    <span className="fd-label">{tContact("nameLabel")}</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      aria-invalid={Boolean(error) && !name.trim()}
                      style={field(Boolean(error) && !name.trim())}
                    />
                  </label>
                  <label>
                    <span className="fd-label">{t("countryLabel")}</span>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" style={field(false)} />
                  </label>
                  <label>
                    <span className="fd-label">{tContact("emailLabel")}</span>
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
                  <label>
                    <span className="fd-label">{tContact("phoneLabel")}</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" type="tel" autoComplete="tel" style={field(false)} />
                  </label>
                </div>

                <label>
                  <span className="fd-label">{tCommon("volunteerField")}</span>
                  {/* The value is the track's index, not its title: a title is
                      translated and would stop matching once it changes. */}
                  <select value={trackIndex} onChange={(e) => setTrackIndex(Number(e.target.value))} style={{ ...field(false), cursor: "pointer" }}>
                    {TRACKS.map((item, index) => (
                      <option key={item.title} value={index}>
                        {t(item.title)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="fd-label">{t("bioLabel")}</span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    style={{ ...field(false), minHeight: 120, padding: "12px 14px", resize: "vertical" }}
                  />
                </label>

                {error ? (
                  <span role="alert" className="fd-error">
                    {error}
                  </span>
                ) : null}

                <button type="submit" disabled={submitting} className="vl-submit fd-pill">
                  <span aria-hidden="true" className="fd-pill-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                    </svg>
                  </span>
                  {submitting ? tPartner("submitLabelSending") : tPartner("submitLabel")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ZakatBanner />
      <TravelBanner />
      <IbadanBanner />
    </div>
  );
}
