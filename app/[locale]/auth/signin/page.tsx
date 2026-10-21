'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { miaPath } from '@/lib/minbar/routes';
import { ORG } from '@/lib/minbar/org';

const LOGO_URL = '/toplum/logo-mark.png';

/* One Google step covers both signing in and signing up: the first sign-in
   creates the donor account. Styles: `styles/minbar/pages/auth.css`. */
const PERKS = ['perkHistory', 'perkReceipts', 'perkRecurring', 'perkFaster'] as const;

export default function SignIn() {
  const locale = useLocale();
  const t = useTranslations('SignInPage');

  return (
    <div className="tva">
      <div className="tva-wrap">
        <section className="tva-story">
          <span className="tva-story-pattern" aria-hidden="true" />
          <div className="tva-story-in">
            <span className="tva-chip">{t('storyKicker')}</span>
            <h2 className="tva-story-title">{t('storyTitle')}</h2>
            <p className="tva-story-sub">{t('storySub')}</p>

            <ul className="tva-perks">
              {PERKS.map((key, i) => (
                <li key={key}>
                  <span className="tva-perk-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <b>{t(`${key}Title`)}</b>
                    <small>{t(`${key}Desc`)}</small>
                  </span>
                </li>
              ))}
            </ul>

            <div className="tva-facts">
              <div>
                <b dir="ltr">{ORG.foundedYear}</b>
                <small>{t('factFounded')}</small>
              </div>
              <div>
                <b dir="ltr">{ORG.licenseNumber}</b>
                <small>{t('factLicense')}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="tva-card">
          <Image src={LOGO_URL} alt={t('logoAlt')} width={64} height={64} className="tva-logo" priority />
          <h1 className="tva-title">{t('title')}</h1>
          <p className="tva-welcome">{t('welcome')}</p>

          <div className="tva-tabs" aria-hidden="true">
            <span>{t('tabSignIn')}</span>
            <span className="tva-tabs-plus">+</span>
            <span>{t('tabSignUp')}</span>
          </div>

          <div className="tva-google">
            <GoogleSignInButton callbackUrl={miaPath('account', locale)} locale={locale} text="continue_with" width={300} />
          </div>
          <p className="tva-hint">{t('oneStep')}</p>

          <div className="tva-or">
            <span>{t('orContinue')}</span>
          </div>

          <div className="tva-alt">
            <Link href={miaPath('projects', locale)} className="tva-alt-go">
              {t('donateNow')}
            </Link>
            <Link href={miaPath('contact', locale)} className="tva-alt-help">
              {t('needHelp')}
            </Link>
          </div>

          <p className="tva-legal">
            {t.rich('legal', {
              terms: (chunks) => <Link href={miaPath('terms', locale)}>{chunks}</Link>,
              privacy: (chunks) => <Link href={miaPath('privacy', locale)}>{chunks}</Link>,
            })}
          </p>
          <p className="tva-secure">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {t('secure')}
          </p>
        </section>
      </div>
    </div>
  );
}
