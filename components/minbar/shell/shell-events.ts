/**
 * Window events the shell's pieces use to talk to each other without
 * importing one another (the header, the bottom navigation and the quick
 * donation bar are separate client islands).
 */

/** The bottom navigation's «المزيد» opens the header's drawer. */
export const SHELL_DRAWER_OPEN_EVENT = "tv:drawer-open";

/** localStorage: the visitor dismissed the "this site is available in …" bar. */
export const LANG_SUGGEST_DISMISSED_KEY = "tv_lang_dismissed";

/** localStorage: the visitor picked a language themselves. */
export const LANG_CHOSEN_KEY = "tv_lang";

/** localStorage: the visitor closed the homepage announcement strip. */
export const ALERT_CLOSED_KEY = "tv_alert_closed";

/** sessionStorage: the visitor hid the quick donation bar (phones). */
export const QUICK_DONATE_CLOSED_KEY = "tv_qd_closed";
