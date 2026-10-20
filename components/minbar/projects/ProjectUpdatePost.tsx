"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { MinbarProjectUpdate } from "@/lib/minbar/projects";
import ProjectVideo from "./ProjectVideo";

/**
 * One campaign update  the design's `.update-item` card: the date in brand
 * ink over the text (`ToplamVakfi-design/Toplum Vakfı Project - *.dc.html`).
 * The update's own title, photo or video follow when it has them; long text
 * folds behind "read more" so the list stays scannable.
 */

const FOLD_AT = 320;

export default function ProjectUpdatePost({ update, projectTitle }: { update: MinbarProjectUpdate; projectTitle: string }) {
  const locale = useLocale();
  const tExtras = useTranslations("ProjectExtras");
  const [open, setOpen] = useState(false);

  const long = update.text.length > FOLD_AT;
  const text = long && !open ? `${update.text.slice(0, FOLD_AT).trimEnd()}…` : update.text;
  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(update.createdAt));

  return (
    <article className="pd-update">
      <time dateTime={update.createdAt}>{date}</time>
      {update.title ? <b>{update.title}</b> : null}
      {update.text ? (
        <p>
          {text}
          {long ? (
            <>
              {" "}
              <button type="button" onClick={() => setOpen((v) => !v)} className="pd-update-more">
                {open ? tExtras("showLess") : tExtras("readMore")}
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {update.videoUrl ? (
        <ProjectVideo url={update.videoUrl} title={update.title || projectTitle} />
      ) : null}
      {update.image ? (
        // A field photo at its own proportions, capped so a portrait shot does not take over the list.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={update.image} alt={update.videoUrl ? "" : update.title || projectTitle} loading="lazy" className="pd-update-img" />
      ) : null}
    </article>
  );
}
