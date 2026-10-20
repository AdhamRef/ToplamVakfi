import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { miaPath } from "@/lib/minbar/routes";

interface Props {
  params: Promise<{ locale: string }>;
}

/** Never indexed: the address only forwards. */
export const metadata: Metadata = { robots: { index: false, follow: true } };

/**
 * The former Minbar Al-Aqsa "restoring the homes of Al-Quds" programme page.
 *
 * The Toplum Vakfı design has no such page, and its copy belonged to the old
 * organisation, so the address forwards to the projects catalogue  where any
 * restoration campaign that is still published appears with the rest.
 */
export default async function Restoration({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(miaPath("projects", locale));
}
