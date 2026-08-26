import { motion } from "framer-motion";
import { Star } from "lucide-react";

const links = ["Terms of Service", "Privacy Policy", "Contact", "Help Center"];
const payments = ["Visa", "Mastercard", "Amex", "ApplePay", "Discover", "PayPal"];

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
      <rect width="52" height="28" rx="5" fill="#FFFFFF"/>
      <text x="5" y="18" fill="#231F20" fontSize="8" fontWeight="800" fontFamily="Arial">DISCOVER</text>
      <circle cx="39" cy="14" r="8" fill="#F76F20"/>
    </svg>
  );
}

function PayPalIcon() {
  return (
    <svg width="58" height="28" viewBox="0 0 58 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="58" height="28" rx="5" fill="#F7F9FB"/>
      <text x="7" y="19" fill="#003087" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif">Pay</text>
      <text x="27" y="19" fill="#009CDE" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif">Pal</text>
    </svg>
  );
}

const PaymentIcons: Record<string, () => JSX.Element> = {
  Visa: VisaIcon,
  Mastercard: MastercardIcon,
  Amex: AmexIcon,
  ApplePay: ApplePayIcon,
  Discover: DiscoverIcon,
  PayPal: PayPalIcon,
};

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.257 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
function IconYouTube() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function IconTikTok() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.16 8.16 0 0 0 4.77 1.52V7.02a4.85 4.85 0 0 1-1-.33z" />
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.056a19.902 19.902 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

const socials = [
  { Component: IconX,        label: "X / Twitter" },
  { Component: IconYouTube,  label: "YouTube"     },
  { Component: IconTikTok,   label: "TikTok"      },
  { Component: IconDiscord,  label: "Discord"     },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0F0C2E", borderTop: "1px solid rgba(165,180,252,0.08)" }}>
      <div className="max-w-2xl mx-auto px-4 py-14">

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#312E80" }}>
              <Star size={17} fill="white" color="white" />
            </div>
            <span className="text-2xl font-bold text-white">RB<span style={{ color: "#A5B4FC" }}>stars</span></span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm" style={{ color: "#4B5563" }}>
            Your trusted marketplace for Roblox game items — fast delivery, secure payments, and 24/7 support.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-7">
          {links.map(l => (
            <a
              key={l}
              href="#"
              data-testid={`link-footer-${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm transition-colors duration-200"
              style={{ color: "#6B7280" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#A5B4FC")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-8">
          {socials.map(({ Component, label }) => (
            <motion.a
              key={label}
              href="#"
              aria-label={label}
              data-testid={`link-social-${label.toLowerCase().replace(/\s/g, "-")}`}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(49,46,128,0.4)" }}
              whileTap={{ scale: 0.93 }}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200"
              style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(165,180,252,0.1)", color: "#A5B4FC" }}
            >
              <Component />
            </motion.a>
          ))}
        </div>

        <div className="mb-7">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(165,180,252,0.1)", color: "#A5B4FC" }}>
            <span>🇺🇸</span>
            <span className="font-medium">English</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 items-center">
          {payments.map(p => {
            const Icon = PaymentIcons[p];
            return (
              <div key={p} className="rounded-lg overflow-hidden shadow-sm" style={{ border: "1px solid rgba(165,180,252,0.08)" }}>
                <Icon />
              </div>
            );
          })}
        </div>

        <p className="text-xs" style={{ color: "#374151" }}>
          © 2026 RBstars. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
