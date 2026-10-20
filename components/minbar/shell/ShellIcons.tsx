/**
 * The shell's icons, drawn exactly as in `Toplum Vakfı Header.dc.html` and
 * `Toplum Vakfı Footer.dc.html` (24px grid, currentColor). Decorative only:
 * every control that carries one also carries a text label or aria-label.
 */

export type ShellIconName =
  | "story"
  | "eye"
  | "send"
  | "flag"
  | "target"
  | "person"
  | "people"
  | "sprout"
  | "trend"
  | "heart"
  | "star"
  | "chart"
  | "doc"
  | "news"
  | "globe"
  | "search"
  | "cart"
  | "home"
  | "menu"
  | "grid"
  | "heartFill"
  | "play"
  | "more"
  | "caret"
  | "close"
  | "check"
  | "mail"
  | "phone"
  | "pin"
  | "dashboard";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

export default function ShellIcon({ name, className, size }: { name: ShellIconName; className?: string; size?: number }) {
  const box = { viewBox: "0 0 24 24", className, width: size, height: size, "aria-hidden": true as const, focusable: "false" as const };
  switch (name) {
    case "story":
      return <svg {...box} {...STROKE}><path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z" /><path d="M5 18a2 2 0 0 1 2-2h11" /></svg>;
    case "eye":
      return <svg {...box} {...STROKE}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></svg>;
    case "send":
      return <svg {...box} {...STROKE}><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></svg>;
    case "flag":
      return <svg {...box} {...STROKE}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
    case "target":
      return <svg {...box} {...STROKE}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg>;
    case "person":
      return <svg {...box} {...STROKE}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c1.4-3.6 4.4-5.6 7.5-5.6s6.1 2 7.5 5.6" /></svg>;
    case "people":
      return <svg {...box} {...STROKE}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18.5 14.8c1.6.7 2.5 2.4 2.5 5.2" /></svg>;
    case "sprout":
      return <svg {...box} {...STROKE}><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.2-5-5.5-5 0 3 2.2 5 5.5 5z" /></svg>;
    case "trend":
      return <svg {...box} {...STROKE}><path d="M3 17 9 11l4 4 8-8M15 7h6v6" /></svg>;
    case "heart":
      return <svg {...box} {...STROKE}><path d="M12 20s-7.2-4.6-9.4-9.2C1.2 7.8 3 5 6 5c2 0 3.3 1.1 4 2.3.7-1.2 2-2.3 4-2.3 3 0 4.8 2.8 3.4 5.8C19.2 15.4 12 20 12 20z" /></svg>;
    case "star":
      return <svg {...box} {...STROKE}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>;
    case "chart":
      return <svg {...box} {...STROKE}><path d="M4 4v16h16M8 15l3.5-4 3 2.5L20 7" /></svg>;
    case "doc":
      return <svg {...box} {...STROKE}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" /><path d="M14 3.5v5h5M9 13h6M9 16.5h6" /></svg>;
    case "news":
      return <svg {...box} {...STROKE}><rect x="4" y="4.5" width="13" height="15" rx="1.5" /><path d="M17 8.5h2.5V18a1.5 1.5 0 0 1-3 0M7.5 8.5h6M7.5 12h6M7.5 15.5h4" /></svg>;
    case "globe":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.6-3.5-9s1-6.5 3.5-9z" /></svg>;
    case "search":
      return <svg {...box} {...STROKE}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "cart":
      return <svg {...box} {...STROKE}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M3 4h2l2.4 12.2a1.8 1.8 0 0 0 1.8 1.5h7.9a1.8 1.8 0 0 0 1.77-1.47L21 8H6" /></svg>;
    case "home":
      return <svg {...box} {...STROKE} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.2 12 3.5l9 6.7V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z" /></svg>;
    case "menu":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h11" /></svg>;
    case "more":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "grid":
      return <svg {...box} {...STROKE}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
    case "dashboard":
      return <svg {...box} {...STROKE} strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 1 1 16 0" /><path d="m12 13 4-4" /><path d="M4 17h16" /></svg>;
    case "heartFill":
      return <svg {...box} fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" /></svg>;
    case "play":
      return <svg {...box} {...STROKE}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>;
    case "caret":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></svg>;
    case "close":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case "check":
      return <svg {...box} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case "mail":
      return <svg {...box} {...STROKE}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg>;
    case "phone":
      return <svg {...box} {...STROKE}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></svg>;
    case "pin":
      return <svg {...box} {...STROKE}><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>;
  }
}
