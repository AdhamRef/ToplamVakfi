"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn, useSession } from "next-auth/react";
import type { MinbarProjectComment } from "@/lib/minbar/projects";

/**
 * Donors' messages on a project (`Comment` rows with this `campaignId`)  the
 * list the server rendered, and a form for a signed-in visitor to add one
 * through `POST /api/campaigns/:id/comments`. Only a first name and avatar are
 * shown for each message.
 */

const MAX = 1000;

export default function ProjectComments({ projectId, initial }: { projectId: string; initial: MinbarProjectComment[] }) {
  const locale = useLocale();
  const t = useTranslations("ProjectExtras");
  const { data: session, status } = useSession();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateFormatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const row = (await res.json().catch(() => null)) as
        | { id: string; text: string; createdAt: string; user?: { name?: string | null; image?: string | null } }
        | null;
      if (!res.ok || !row?.id) throw new Error("comment-failed");
      setComments((list) => [
        {
          id: row.id,
          text: row.text,
          createdAt: row.createdAt,
          name: (row.user?.name ?? "").trim().split(/\s+/)[0] ?? "",
          image: row.user?.image ?? null,
        },
        ...list,
      ]);
      setText("");
    } catch {
      setError(t("commentFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {status === "authenticated" && session?.user ? (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, padding: "16px 18px", background: "#fff", border: "1px solid #e6eef3", borderRadius: 12 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            maxLength={MAX}
            rows={3}
            placeholder={t("commentPh")}
            aria-label={t("commentPh")}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2eaf0", background: "#fff", fontFamily: "inherit", fontSize: 14.5, lineHeight: 1.8, color: "var(--deep)", resize: "vertical" }}
          />
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span role="status" style={{ fontSize: 12.5, fontWeight: 800, color: "var(--red)" }}>
              {error}
            </span>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="pd-cta"
              style={{ minHeight: 44, padding: "0 22px", border: 0, borderRadius: 999, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: sending || !text.trim() ? 0.6 : 1 }}
            >
              {t("commentSend")}
            </button>
          </span>
        </form>
      ) : status === "unauthenticated" ? (
        <button
          type="button"
          onClick={() => signIn()}
          className="pd-outline-btn"
          style={{ justifySelf: "start", minHeight: 44, padding: "0 20px", borderRadius: 999, border: "1.5px solid #e2eaf0", background: "#fff", color: "var(--deep)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}
        >
          {t("commentSignIn")}
        </button>
      ) : null}

      {comments.length ? (
        <div style={{ display: "grid", gap: 12 }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 12, padding: "16px 18px", background: "#fff", border: "1px solid #e6eef3", borderRadius: 12, boxShadow: "0 12px 28px rgba(2,52,88,.05)" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  /* Quotes and brackets stripped: the URL is user data inside CSS. */
                  background: comment.image ? `center/cover no-repeat url('${comment.image.replace(/['"()\\]/g, "")}')` : "#eaf6fd",
                  color: "var(--deep)",
                  fontWeight: 900,
                }}
              >
                {comment.image ? null : (comment.name || "•").slice(0, 1)}
              </span>
              <span style={{ display: "grid", gap: 5, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 14, fontWeight: 800, color: "var(--deep)" }}>{comment.name}</b>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0077b3" }}>{dateFormatter.format(new Date(comment.createdAt))}</span>
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.9, color: "#33495e", overflowWrap: "anywhere", whiteSpace: "pre-line" }}>{comment.text}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state: a quiet dashed card rather than a bare line. */
        <p style={{ margin: 0, padding: "22px 18px", border: "1px dashed #cfdde8", borderRadius: 12, background: "#fff", textAlign: "center", fontSize: 14, lineHeight: 1.9, color: "var(--muted)" }}>{t("commentsEmpty")}</p>
      )}
    </div>
  );
}
