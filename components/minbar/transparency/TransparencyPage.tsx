"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { TRANSPARENCY_BANNER_IMAGE, TRANSPARENCY_DOCS, TRANSPARENCY_UPDATED } from "@/lib/minbar/achievements";
import TrustBanner from "@/components/minbar/reports/TrustBanner";

/**
 * Reports & transparency  `ToplamVakfi-design/Toplum Vakfı Transparency.dc.html`.
 *
 * Banner, the four trust points, the official registration (from `ORG`), the
 * policy documents, the published financial reports (none yet: the design's
 * empty state) and the page's last-updated note.
 */

const TRUST_ICONS: ReadonlyArray<{ id: string; icon: ReactElement }> = [
  { id: "registered", icon: <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /> },
  {
    id: "secure",
    icon: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    id: "reports",
    icon: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </>
    ),
  },
  {
    id: "policies",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
];

export default function TransparencyPage() {
  const locale = useLocale();
  const t = useTranslations("tvTransparency");

  const updated = new Intl.DateTimeFormat(`${locale}-u-nu-latn`, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${TRANSPARENCY_UPDATED}T00:00:00Z`),
  );

  return (
    <div className="tvt-page">
      <TrustBanner image={TRANSPARENCY_BANNER_IMAGE} title={t("title")} lead={t("lead")} />

      <div className="tvt-container tvt-trust">
        {TRUST_ICONS.map((item) => (
          <div key={item.id} className="tvt-trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {item.icon}
            </svg>
            <span>{t(`trust.${item.id}`, { year: String(ORG.foundedYear) })}</span>
          </div>
        ))}
      </div>

      <div className="tvt-container tvt-docs">
        <h2>{t("registration.title")}</h2>
        <p>
          {t("registration.text", {
            org: ORG.legalName,
            date: ORG.registeredOn,
            number: ORG.licenseNumber,
          })}
        </p>

        <h2>{t("docs.title")}</h2>
        <div className="tvt-docs-list">
          {TRANSPARENCY_DOCS.map((doc) => (
            <Link key={doc.id} className="tvt-doc" href={`${miaPath(doc.route, locale)}${doc.hash ? `#${doc.hash}` : ""}`}>
              <span>{t(`docs.${doc.id}`)}</span>
              <span aria-hidden="true" className="tvt-doc-arrow">↗</span>
            </Link>
          ))}
        </div>

        <h2>{t("financial.title")}</h2>
        <div className="tvt-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 8h6M9 12h6M9 16h3" />
          </svg>
          <div>{t("financial.empty")}</div>
        </div>
        <p className="tvt-updated">{t("updated", { date: updated })}</p>
      </div>
    </div>
  );
}
