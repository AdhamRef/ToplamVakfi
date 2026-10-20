"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";

/**
 * FAQ  `ToplamVakfi-design/Toplum Vakfı FAQ.dc.html`: a narrow column with
 * the page title, six questions as an accordion (one open at a time, as in
 * the design), and a link to the contact page for anything else. The design
 * has no banner and no category tabs.
 *
 * Each question is a real button (`aria-expanded` / `aria-controls`), and the
 * answer animates to its own height so a long translation is never clipped.
 * Styles: `.fd-faq*` in `styles/minbar/pages/about.css`.
 */

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default function FaqPage() {
  const locale = useLocale();
  const t = useTranslations("tvFaq");
  const base = useId();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="fd-page fd-p-faq">
      <div className="fd-faq">
        <h1>{t("title")}</h1>

        {FAQ_KEYS.map((key) => {
          const isOpen = open === key;
          const qId = `${base}-${key}-q`;
          const aId = `${base}-${key}-a`;
          return (
            <div key={key} className="fd-faq-item">
              <h2>
                <button
                  type="button"
                  id={qId}
                  className="fd-faq-q"
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => setOpen(isOpen ? null : key)}
                >
                  <span>{t(`${key}.q`)}</span>
                  <svg className="fd-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h2>
              <div id={aId} role="region" aria-labelledby={qId} className="fd-faq-a" data-open={isOpen ? "1" : undefined}>
                <div aria-hidden={!isOpen}>
                  <p>{t(`${key}.a`)}</p>
                </div>
              </div>
            </div>
          );
        })}

        <Link className="fd-faq-back" href={miaPath("contact", locale)}>
          <span className="fd-arrow" aria-hidden="true">
            ←
          </span>{" "}
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
