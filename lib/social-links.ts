import type { SupportedLocale } from "@/lib/locales";

export interface SocialLinks {
  instagram: string;
  facebook: string;
  twitter: string;
}

// ToplamVakfi Uluslararası Yardımlaşma Derneği runs one account per network for
// every language, so there is no per-locale variation to resolve any more.
const LINKS: SocialLinks = {
  instagram: "https://www.instagram.com/ToplamVakfi61/",
  facebook: "https://www.facebook.com/ToplamVakfi",
  twitter: "https://twitter.com/ToplamVakfin",
};

export function getSocialLinks(_locale?: SupportedLocale | string): SocialLinks {
  return LINKS;
}
