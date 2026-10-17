import { Link } from "wouter";
import { LifeBuoy } from "lucide-react";
import { RBstar } from "@/components/Art";

/* Payment marks keep their official brand colours — they are the one place
   on a dark footer where recognisable colour is worth more than harmony.
   Discover/PayPal use light tiles by design, so they carry their own border. */

function VisaIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="28" rx="5" fill="#1A1F71"/>
      <text x="7" y="19" fill="white" fontSize="12" fontWeight="800" fontFamily="Arial" letterSpacing="1">VISA</text>
    </svg>
  );
}
function MastercardIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="28" rx="5" fill="#252525"/>
      <circle cx="17" cy="14" r="8" fill="#EB001B"/>
      <circle cx="27" cy="14" r="8" fill="#F79E1B"/>
      <path d="M22 7.3a8 8 0 0 1 0 13.4A8 8 0 0 1 22 7.3z" fill="#FF5F00"/>
    </svg>
  );
}
function AmexIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="28" rx="5" fill="#2E77BC"/>
      <text x="5" y="19" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial" letterSpacing="0.5">AMEX</text>
    </svg>
  );
}
function ApplePayIcon() {
  return (
    <svg width="52" height="28" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="52" height="28" rx="5" fill="#1D1D1F"/>
      <path d="M15.5 8.5c.7-.8 1.1-1.9 1-3-.9.05-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3zm.9 1.4c-1.5-.1-2.8.85-3.5.85-.7 0-1.8-.8-3-.8C8.4 10 7 11 6.3 12.5c-1.4 2.4-.4 6 1 7.9.7.95 1.5 2 2.6 2 1 0 1.4-.65 2.7-.65 1.25 0 1.6.65 2.7.65 1.1 0 1.85-1 2.55-1.95.8-1.1 1.1-2.15 1.1-2.2-.05 0-2.15-.85-2.2-3.2 0-2 1.65-2.95 1.7-3-.95-1.4-2.4-1.55-2.9-1.6l-.15.4z" fill="white"/>
      <text x="22" y="18" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial">Pay</text>
    </svg>
  );
}
function DiscoverIcon() {
  return (
    <svg width="52" height="28" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="52" height="28" rx="5" fill="#FFFFFF" stroke="#2a3a60"/>
      <text x="5" y="18" fill="#231F20" fontSize="8" fontWeight="800" fontFamily="Arial">DISCOVER</text>
      <circle cx="39" cy="14" r="8" fill="#F76F20"/>
    </svg>
  );
}
function PayPalIcon() {
  return (
    <svg width="58" height="28" viewBox="0 0 58 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="58" height="28" rx="5" fill="#F7F9FB" stroke="#2a3a60"/>
      <text x="7" y="19" fill="#003087" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif">Pay</text>
      <text x="27" y="19" fill="#009CDE" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif">Pal</text>
    </svg>
  );
}

const PaymentIcons: Record<string, () => JSX.Element> = {
  Visa: VisaIcon, Mastercard: MastercardIcon, Amex: AmexIcon,
  ApplePay: ApplePayIcon, Discover: DiscoverIcon, PayPal: PayPalIcon,
};
const payments = ["Visa", "Mastercard", "Amex", "ApplePay", "Discover", "PayPal"];

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
  fieldBorder: "#2b3c66",
};

export default function Footer() {
  return (
    <footer style={{ background: F.bg, borderTop: `1px solid ${F.border}`, position: "relative", overflow: "hidden" }}>
      <div className="relative px-6 sm:px-10 lg:px-16 py-12 max-w-7xl mx-auto">

        {/* Top row: brand left, support + policy links right */}
        <div className="flex flex-col sm:flex-row justify-between gap-10 mb-10">

          {/* Left — brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: F.field, border: `1px solid ${F.border}` }}>
                <RBstar size={20} color={F.accent} />
              </div>
              <span className="text-3xl font-black tracking-tight" style={{ color: F.text }}>
                RB<span style={{ color: F.accent }}>stars</span>
              </span>
            </div>
            <p className="text-sm max-w-md" style={{ color: F.muted }}>
              Your trusted marketplace for Roblox game items — secure payments, real verified reviews, and 24/7 support.
            </p>
          </div>

          {/* Right — support first, then the rest of the policy links */}
          <div className="flex flex-col gap-3 sm:items-end sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: F.faint }}>Support</p>
            <Link
              href="/tickets"
              className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:opacity-80"
              style={{ color: F.text }}
            >
              <LifeBuoy size={15} color={F.accent} />
              Help Centre
            </Link>

            {/* Socials / policy destinations are listed in the client blueprint,
                but no URLs or policy copy exist yet — they are wired up as soon
                as either is supplied, so nothing here is a dead link. */}
          </div>
        </div>

        {/* Bottom row: payment marks left, language right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6" style={{ borderTop: `1px solid ${F.border}` }}>
          <div className="flex flex-wrap items-center gap-2">
            <img
              src="/payment-icons.png"
              alt="Visa, Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay"
              className="h-8 rounded-lg object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: F.field, border: `1px solid ${F.border}`, color: F.text }}>
            <span>🇺🇸</span>
            <span className="font-medium">English</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: F.faint }}>
          © 2026 RBstars. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
