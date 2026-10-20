"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { miaPath } from "@/lib/minbar/routes";
import { CTA_ROUTES } from "@/lib/minbar/blog-cta";

/**
 * The dark call that closes every article  originally the `ctaFor()` block in
 * `Minbar/تفاصيل المقال.dc.html`, now set as the Toplum design's rounded navy
 * band (blog.css: `.ed-cta-box`) with the CTA-gradient pill and an outline pill.
 *
 * The handoff picks one of eleven calls from the article's category, so a piece
 * about Zakat ends on the Zakat rail and a piece about Gaza ends on Gaza relief.
 * All eleven are reviewed in `blog.cta.*` in 19 languages.
 *
 * Which of the eleven this article gets is decided by `ctaKeyFor` in
 * `lib/minbar/blog-cta.ts`  a server-safe module, because the article route
 * makes that decision server-side.
 */

export default function ArticleCta({ ctaKey }: { ctaKey: string }) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const routes = CTA_ROUTES[ctaKey] ?? CTA_ROUTES.iman;

  return (
    <section className="ed-cta-band">
      <div className="ed-wrap">
        <div className="ed-cta-box">
          <span aria-hidden="true" className="art-cta-pattern" />
          <div className="ed-cta-row art-cta-row">
            <div className="ed-cta-copy art-cta-copy">
              <span className="ed-cta-eyebrow">{t(`cta.${ctaKey}.eyebrow`)}</span>
              <b>{t(`cta.${ctaKey}.title`)}</b>
            </div>
            <div className="ed-cta-btns">
              <Link href={miaPath(routes.secondary, locale)} className="ed-outline art-cta-secondary">
                {t(`cta.${ctaKey}.secondary`)}
              </Link>
              <Link href={miaPath(routes.primary, locale)} className="ed-pill art-cta-primary">
                {t(`cta.${ctaKey}.primary`)}
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="art-cta-arrow">
                    <path d="M10 6l6 6-6 6" />
                  </svg>
                </i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
