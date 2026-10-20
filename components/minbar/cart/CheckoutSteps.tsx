"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface CheckoutStep {
  n: number;
  label: string;
  current: boolean;
  /** Whether the donor may go there yet. A current step is never a link. */
  enabled: boolean;
  href?: string;
  onSelect?: () => void;
  /** Shown with a check instead of its number. Defaults to "comes before the current step". */
  done?: boolean;
}

/**
 * The cart → details → confirmation rail shared by `/cart`, `/checkout` and the
 * thank-you page. A step is a link (or a button, for one reached by an action
 * rather than a URL) only once the donor has what it needs; otherwise it's
 * shown muted.
 *
 * Toplum Vakfı checkout bar (`Payment Info.dc.html` § `.ck-bar`): numbered
 * dots joined by hairlines on one side, an optional security cue (`trailing`)
 * on the other. A step already passed shows a check.
 */
export function CheckoutSteps({
  id,
  steps,
  trailing,
  maxWidth = 1240,
}: {
  id: string;
  steps: CheckoutStep[];
  /** The security cue at the opposite end of the bar. */
  trailing?: ReactNode;
  /** Matches the width of the content below the bar. */
  maxWidth?: number;
}) {
  const currentIndex = steps.findIndex((s) => s.current);
  return (
    <div className="gf-steps-bar" style={{ maxWidth, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <ol id={id} style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
        {steps.map((step, i) => {
          const done = step.done ?? (currentIndex >= 0 && i < currentIndex);
          const lit = step.current || done;
          const content = (
            <>
              <span className="cart-step-n" aria-hidden={done ? true : undefined}>
                {done ? (
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  step.n
                )}
              </span>
              <span className="cart-step-label">{step.label}</span>
            </>
          );
          const clickable = !step.current && step.enabled;
          const state = step.current ? "current" : done ? "done" : "todo";
          return (
            <li key={step.n} style={{ display: "contents" }}>
              {clickable && step.href ? (
                <Link href={step.href} className="cart-step" data-state={state} data-lit={lit ? "1" : "0"}>
                  {content}
                </Link>
              ) : clickable && step.onSelect ? (
                <button type="button" onClick={step.onSelect} className="cart-step" data-state={state} data-lit={lit ? "1" : "0"}>
                  {content}
                </button>
              ) : (
                <span
                  className="cart-step is-static"
                  data-state={state}
                  data-lit={lit ? "1" : "0"}
                  data-locked={!step.current && !step.enabled && !done ? "1" : undefined}
                  aria-current={step.current ? "step" : undefined}
                  aria-disabled={step.current ? undefined : true}
                >
                  {content}
                </span>
              )}
              {i < steps.length - 1 ? <span aria-hidden="true" className="cart-step-line" /> : null}
            </li>
          );
        })}
      </ol>
      {trailing ? <span className="gf-secure">{trailing}</span> : null}
    </div>
  );
}
