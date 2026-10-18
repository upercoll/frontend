/* RBstars social profiles.
   ─────────────────────────────────────────────────────────────────────────
   The footer only renders a social once it has a real URL, so nothing on the
   site is a dead link. Add a link by filling in `url` — leave it empty to
   keep that entry hidden.

   To add one: paste the full URL (https://…), pick an icon, done. The label
   shows next to the icon on wide screens and is used as the accessible name
   everywhere. */

import { Instagram, MessageCircle, Music2, Twitter, Youtube } from "lucide-react";

export interface SocialLink {
  label: string;
  /** Empty string = hidden from the site until you fill it in. */
  url: string;
  icon: typeof Instagram;
  /** Optional brand colour for the icon — falls back to the muted footer tone. */
  color?: string;
}

export const SOCIALS: SocialLink[] = [
  { label: "Discord", url: "", icon: MessageCircle, color: "#2f7dff" },
  { label: "YouTube", url: "", icon: Youtube },
  { label: "Instagram", url: "", icon: Instagram },
  { label: "TikTok", url: "", icon: Music2 },
  { label: "X", url: "", icon: Twitter },
];

/** Only the entries that actually go somewhere. */
export const LIVE_SOCIALS = SOCIALS.filter((s) => s.url.trim().length > 0);
