"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { ORG } from "@/lib/minbar/org";
import { LEGAL_DOCS, type LegalBlock, type LegalDoc, type LegalDocId } from "./legalContent";

/**
 * The shared legal template: `ToplamVakfi-design/Toplum Vakfı Terms.dc.html`
 * and its siblings (Privacy Policy, Donation Agreement, Refund Policy). One
 * 720px reading column on the page background: the title, a lead paragraph,
 * small section headings with paragraphs or lists, and the way back to
 * Reports & transparency. Also used by the cookie policy and the
 * accessibility statement. Styles: `.lgx-*` in `styles/minbar/pages/reports.css`.
 */
export default function LegalPage({ doc }: { doc: LegalDocId }) {
  const t = useTranslations("tvLegal");
  const locale = useLocale();
  const { group, blocks }: LegalDoc = LEGAL_DOCS[doc];
  const values = { org: ORG.legalName, email: ORG.email };

  const render = (block: LegalBlock, index: number) => {
    switch (block.type) {
      case "h2":
        return (
          <h2 key={index} id={block.id} className={`lgx-h2${block.divider ? " lgx-h2--divider" : ""}`}>
            {t(block.key, values)}
          </h2>
        );
      case "h3":
        return (
          <h3 key={index} className="lgx-h3">
            {t(block.key, values)}
          </h3>
        );
      case "p":
        return (
          <p key={index} className="lgx-p">
            {t(block.key, values)}
          </p>
        );
      case "ul":
        return (
          <ul key={index} className="lgx-ul">
            {block.keys.map((key) => (
              <li key={key}>{t(key, values)}</li>
            ))}
          </ul>
        );
    }
  };

  return (
    <div className="lgx-page">
      <h1 className="lgx-h1">{t(`${group}.title`, values)}</h1>
      <p className="lgx-p">{t(`${group}.intro`, values)}</p>
      {blocks.map(render)}
      <Link href={miaPath("transparency", locale)} className="lgx-back">
        <span aria-hidden="true">←</span> {t("back")}
      </Link>
    </div>
  );
}
