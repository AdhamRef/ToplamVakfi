"use client";
/* eslint-disable @next/next/no-img-element -- small thumbnails served through the image proxy. */

import type { ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { imageUrl } from "@/lib/minbar/image-url";

/**
 * The cause picker both quick donations share: the homepage disc and the bar
 * on every other page. A real listbox (Radix): keyboard-navigable, mirrored for
 * RTL, in a portal so the disc or the bar never clips it.
 *
 * Each option carries its picture or an icon, the title on up to two lines and
 * the campaign's region under it, so a long list can be read at a glance. The
 * trigger shows the same picture and the caption saying what is being chosen.
 * Styles: `.qc-*` in `styles/minbar/toplum.css`.
 */

export interface QuickCause {
  value: string;
  label: string;
  meta?: string | null;
  image?: string | null;
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

const Heart = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" />
  </svg>
);

function Thumb({ image }: { image?: string | null }) {
  return (
    <span className="qc-thumb" aria-hidden="true">
      {image ? <img src={imageUrl(image, 96)} alt="" loading="lazy" decoding="async" /> : <Heart />}
    </span>
  );
}

function Option({ cause }: { cause: QuickCause }) {
  return (
    <SelectPrimitive.Item value={cause.value} className="qc-item">
      <Thumb image={cause.image} />
      <span className="qc-item-text">
        <SelectPrimitive.ItemText>{cause.label}</SelectPrimitive.ItemText>
        {cause.meta ? <small>{cause.meta}</small> : null}
      </span>
      <SelectPrimitive.ItemIndicator className="qc-check">
        <Check />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export default function QuickCauseSelect({
  value,
  onChange,
  generics,
  projects,
  genericsHeading,
  projectsHeading,
  caption,
  dir,
  tone,
}: {
  value: string;
  onChange: (value: string) => void;
  generics: QuickCause[];
  projects: QuickCause[];
  genericsHeading: string;
  projectsHeading: string;
  /** What is being chosen: the trigger's small line and its accessible name. */
  caption: string;
  dir: "rtl" | "ltr";
  /** `dark` sits on the navy disc, `light` on the white bar. */
  tone: "dark" | "light";
}) {
  const selected: QuickCause | undefined = [...generics, ...projects].find((c) => c.value === value);
  const heading = (text: string, items: QuickCause[]): ReactNode =>
    items.length ? (
      <SelectPrimitive.Group>
        <SelectPrimitive.Label className="qc-group">{text}</SelectPrimitive.Label>
        {items.map((cause) => (
          <Option key={cause.value} cause={cause} />
        ))}
      </SelectPrimitive.Group>
    ) : null;

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} dir={dir}>
      <SelectPrimitive.Trigger className="qc-trigger" data-tone={tone} aria-label={caption}>
        <Thumb image={selected?.image} />
        <span className="qc-trigger-text">
          <small>{caption}</small>
          <SelectPrimitive.Value>{selected?.label ?? ""}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon className="qc-chevron">
          <Chevron />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="mia-scope qc-content" dir={dir} position="popper" sideOffset={8} collisionPadding={12}>
          <SelectPrimitive.ScrollUpButton className="qc-scroll" aria-hidden="true">
            <Chevron />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="qc-viewport">
            {heading(genericsHeading, generics)}
            {heading(projectsHeading, projects)}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="qc-scroll" aria-hidden="true">
            <Chevron />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
