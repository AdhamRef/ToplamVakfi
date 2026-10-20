/**
 * The "continue" arrow, kept here because other pages import it from this
 * path (categories, projects, zakat). The homepage itself no longer uses the
 * Minbar landing and verse band that lived in this file; see `HomeHero.tsx`.
 *
 * It mirrors with the reading direction (`.mia-arrow-next`).
 */
export function ArrowGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mia-arrow-next"
    >
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}
