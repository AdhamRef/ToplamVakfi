/**
 * The piece of homepage media that is configuration rather than content: which
 * cut of the intro film a locale plays. It is keyed by locale in code because
 * the edition, not an editor, chooses it  the Arabic, Turkish and
 * international films are separate recordings, not one film subtitled.
 */

/**
 * The intro video differs by language edition  the Arabic, Turkish and
 * international cuts are separate recordings, not subtitles of one.
 */
export function introVideoId(locale: string): string {
  if (locale === "ar") return "E_TZglHItoY";
  if (locale === "tr") return "G7mgN6jux2s";
  return "3VVMdV5c_RU";
}
