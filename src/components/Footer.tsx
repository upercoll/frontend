import { Link } from "wouter";
import { LifeBuoy } from "lucide-react";
import { RBstar } from "@/components/Art";
import CurrencyMenu from "@/components/CurrencyMenu";

/* Fallback footer — the store pages render their own richer footer (SiteFooter
   in Home.tsx); this one covers the routes that don't, chiefly the 404.
   Payment marks use /payment-icons.png, a real asset, rather than inline
   approximations of brand logos. */

/* Footer surface — one step darker than the page so the page ends on a
   deliberate floor (DESIGN_SYSTEM.md: footer `#0e1527`). */
const F = {
  bg: "#0e1527",
  border: "#223156",
  text: "#ffffff",
  muted: "#b3bbd2",
  faint: "#8a97ba",
  accent: "#2f8cff",
  field: "#17233f",
};

/* Every href below is a route that exists in the router. */
const COLUMNS: Array<{ h: string; links: Array<{ label: string; href: string }> }> = [
  {
    h: "Shop",
    links: [
      { label: "All games", href: "/browse" },
      { label: "Store home", href: "/" },
    ],
  },
  {
    h: "Support",
    links: [
      { label: "Help Centre", href: "/tickets" },
      { label: "Open a ticket", href: "/tickets/new" },
      { label: "Claim Chat", href: "/claim-chat" },
    ],
  },
  {
    h: "Account",
    links: [
      { label: "My profile", href: "/profile" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  {
    h: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refunds" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
];

const linkStyle = { color: F.muted, fontSize: 14, textDecoration: "none" } as const;

export default function Footer() {
  return (
    <footer style={{ background: F.bg, borderTop: `1px solid ${F.border}`, position: "relative", overflow: "hidden" }}>
      <div className="relative px-6 sm:px-10 lg:px-16 py-12 max-w-7xl mx-auto">

        {/* Brand + link columns */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-10">
          <div className="lg:w-72 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: F.field, border: `1px solid ${F.border}` }}>
                <RBstar size={20} color={F.accent} />
              </div>
              <span className="text-3xl font-black tracking-tight" style={{ color: F.text }}>
                RB<span style={{ color: F.accent }}>stars</span>
              </span>
            </div>
            <p className="text-sm" style={{ color: F.muted }}>
              Your trusted marketplace for Roblox game items — secure payments, real verified reviews,
              and 24/7 support.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {COLUMNS.map((c) => (
              <div key={c.h} className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: F.faint }}>
                  {c.h}
                </p>
                {c.links.map((l) => (
                  <Link key={l.href + l.label} href={l.href} style={linkStyle} className="transition-colors duration-200 hover:text-white">
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row: payment marks left, currency picker right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6" style={{ borderTop: `1px solid ${F.border}` }}>
          <div className="flex flex-wrap items-center gap-2">
            <img
              src="/payment-icons.png"
              alt="Visa, Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay"
              className="h-8 rounded-lg object-contain"
            />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: F.faint }}>
              <LifeBuoy size={13} color={F.accent} />
              Support 24/7
            </span>
          </div>

          {/* Converts display prices using live exchange rates; charges stay USD */}
          <CurrencyMenu />
        </div>

        <p className="text-center text-xs mt-8" style={{ color: F.faint }}>
          © 2026 RBstars. All rights reserved. Not affiliated with Roblox Corporation.
        </p>
      </div>
    </footer>
  );
}
