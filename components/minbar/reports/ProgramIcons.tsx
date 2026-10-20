import type { ReactElement } from "react";

/**
 * Glyphs for the six programmes  drawn to match what each programme does,
 * carried from `progIcon()` in `Minbar/إنجازات وتقارير المؤسسة.dc.html`.
 */
export const PROGRAM_ICONS: Record<string, ReactElement> = {
  utensils: <path d="M7 3v8a2 2 0 1 0 4 0V3M9 11v10M17 3v18M14 3v6a3 3 0 0 0 3 3" />,
  droplets: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  tent: (
    <>
      <path d="M4 20 12 4l8 16" />
      <path d="M8 20 12 11l4 9" />
      <path d="M2 20h20" />
    </>
  ),
  "graduation-cap": (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    </>
  ),
  home: <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z" />,
  "heart-pulse": (
    <path d="M12 20.5S3.5 15.2 3.5 9a4.7 4.7 0 0 1 8.5-2.7A4.7 4.7 0 0 1 20.5 9c0 1-.2 1.9-.6 2.7H16l-2 3-2.5-5-1.5 2H7" />
  ),
  /* The remaining glyphs head the report's figure cards and documents, drawn
     in the same 24px, 1.7-stroke hand as the six programmes above. */
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  hands: (
    <>
      <path d="M12 20.5S4 15.6 4 10a4 4 0 0 1 8-1.3A4 4 0 0 1 20 10c0 5.6-8 10.5-8 10.5Z" />
      <path d="M9 11h6" />
    </>
  ),
  landmark: (
    <>
      <path d="M5 20v-8a7 7 0 0 1 14 0v8" />
      <path d="M12 5V3M3 20h18M10 20v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.4 3 5.2" />
    </>
  ),
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  pin: (
    <>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4M10 12h6M10 16h4" />
    </>
  ),
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
};

export function ProgramIcon({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PROGRAM_ICONS[name]}
    </svg>
  );
}
