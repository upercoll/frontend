import { useLocation } from "wouter";
import { TopNav, SiteFooter } from "./Home";

/* Policy pages the footer actually links to.
   ─────────────────────────────────────────────────────────────────────────
   These are written for how this store really works — digital Roblox items,
   Stripe checkout, automated delivery, ticket-based support — rather than
   pasted boilerplate about a company that doesn't exist behind it. If a
   process changes (new payment provider, new delivery method), change it
   here too: a policy that describes something you don't do is worse than
   none at all. */

const T = {
  bg: "#121a2e",
  card: "#16213b",
  border: "#2b3c66",
  text: "#ffffff",
  body: "#a9b3d3",
  faint: "#8ea0cf",
  accent: "#2f7dff",
};

type Section = { h: string; p: string[] };

function LegalPage({ title, updated, intro, sections }: {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}) {
  const [, navigate] = useLocation();

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <TopNav onHome={() => navigate("/")} />

      <main className="mx-auto px-5" style={{ maxWidth: 820, paddingTop: 56, paddingBottom: 72 }}>
        <h1 className="font-mont font-bold" style={{ color: T.text, fontSize: "clamp(30px, 5vw, 44px)", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p className="mt-3 text-[13px]" style={{ color: T.faint }}>Last updated {updated}</p>

        <p className="mt-7 text-[15px] leading-[1.75]" style={{ color: T.body }}>
          {intro}
        </p>

        <div className="mt-10 space-y-5">
          {sections.map((s, i) => (
            <section
              key={s.h}
              className="rounded-2xl p-6"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <h2 className="flex items-baseline gap-3 font-mont font-bold" style={{ color: T.text, fontSize: 18 }}>
                <span style={{ color: T.accent, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.h}
              </h2>
              {s.p.map((para, j) => (
                <p key={j} className="mt-3 text-[14.5px] leading-[1.75]" style={{ color: T.body }}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <h3 className="font-mont font-bold text-[16px]" style={{ color: T.text }}>Questions?</h3>
          <p className="mt-2 text-[14.5px] leading-[1.75]" style={{ color: T.body }}>
            Open a ticket from the <a href="/tickets" style={{ color: T.accent, textDecoration: "underline" }}>Help Centre</a>{" "}
            or use the live chat. A human reads every one — that's the fastest route for anything about an
            order, a refund or your details.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="18 October 2026"
      intro="This policy explains what RBstars collects, why, and what you can do about it. Short version: we collect what's needed to sell you an item and deliver it in-game, we never sell your data, and card details never touch our servers."
      sections={[
        {
          h: "What we collect",
          p: [
            "Account details: your email address and Roblox username, so we can sign you in and deliver to the right account.",
            "Order records: what you bought, when, the amount paid and the delivery status. These are kept so we can prove delivery and resolve disputes.",
            "Support conversations: whatever you write in a ticket or the live chat, plus any screenshots you attach.",
            "Technical basics: browser, device type and pages visited, used in aggregate to keep the site working. We do not build advertising profiles from this.",
          ],
        },
        {
          h: "Payments",
          p: [
            "Card payments are handled by Stripe. Card numbers, CVCs and expiry dates are entered on Stripe's checkout and never reach our servers — we receive only a payment status and the last four digits for receipts.",
            "We never store full card details, and we never ask for your Roblox password. Anyone asking for it is not us.",
          ],
        },
        {
          h: "How your data is used",
          p: [
            "To take payment, deliver the items you bought and confirm delivery.",
            "To answer support requests and investigate anything that goes wrong.",
            "To send service messages about your order — delivery status, receipts. Marketing messages only if you opt in, and every one has an unsubscribe.",
            "To prevent fraud and abuse, such as chargebacks on items that were already delivered.",
          ],
        },
        {
          h: "Sharing",
          p: [
            "We share the minimum needed with the services that run the store: Stripe for payments, our hosting and database providers, and the email service that sends receipts.",
            "We do not sell or rent your personal data to anyone, and we do not share it for third-party advertising.",
          ],
        },
        {
          h: "Retention and your rights",
          p: [
            "Order and delivery records are kept as long as they're needed for support, fraud prevention and accounting, then deleted.",
            "You can ask for a copy of your data, a correction, or deletion of your account by opening a ticket. We action these as quickly as we can verify the request comes from you.",
            "If you're under 18, get a parent or guardian's permission before using the store.",
          ],
        },
        {
          h: "Cookies and local storage",
          p: [
            "We use what's necessary to keep you signed in and your cart intact, plus a small preference entry so your chosen display currency survives a reload.",
            "No third-party advertising or cross-site tracking cookies are set by this site.",
          ],
        },
      ]}
    />
  );
}

export function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="18 October 2026"
      intro="Everything we sell is a digital item delivered inside a game, so our refund rules are about one thing: did you receive what you paid for? If yes, the sale is final. If no, you get made whole."
      sections={[
        {
          h: "Once an item is delivered, the sale is final",
          p: [
            "Digital items have no return and can't be un-delivered. Once your order shows as delivered — or once you've claimed it through the delivery chat — it isn't eligible for a refund.",
            "This is the same policy every digital goods store uses, and it's what keeps prices low for everyone.",
          ],
        },
        {
          h: "If your order never arrives, you're covered",
          p: [
            "Open a ticket with your order reference. If we can't deliver the item, you get a full refund or a replacement, your choice.",
            "Delivery problems are usually resolved within hours, so give the delivery window a chance before requesting a refund on something that's still on its way.",
          ],
        },
        {
          h: "Wrong or missing items",
          p: [
            "If what arrived isn't what you ordered, tell us in a ticket with a screenshot of your in-game inventory. We'll send the correct item or refund the difference.",
            "Report this as soon as you notice it — reports made long after delivery are much harder to verify.",
          ],
        },
        {
          h: "Accidental purchases",
          p: [
            "Bought the wrong item? If it hasn't been delivered yet, open a ticket straight away and we'll cancel and refund it.",
            "Once delivery has started we can't reverse it, because the item is already in the game.",
          ],
        },
        {
          h: "Duplicate charges and failed payments",
          p: [
            "If your card was charged but no order was created, the money is returned automatically by Stripe, usually within a few days. If it isn't, send us the receipt in a ticket.",
            "Payments that fail or get declined never create an order and are never captured.",
          ],
        },
        {
          h: "Chargebacks",
          p: [
            "Please talk to us before filing a chargeback — almost every case is something we'd fix immediately. A chargeback on an item that was demonstrably delivered is treated as fraud, results in a permanent ban, and we'll contest it with the delivery records.",
          ],
        },
        {
          h: "How to request a refund",
          p: [
            "Open a ticket from the Help Centre with your order reference and a short description. We reply to every request, and legitimate ones are settled quickly.",
          ],
        },
      ]}
    />
  );
}

export function TermsOfUse() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="18 October 2026"
      intro="These terms govern your use of RBstars. By placing an order or creating an account you agree to them. They're written to be readable — if anything here conflicts with what the site actually does, the site's behaviour and our support team take precedence."
      sections={[
        {
          h: "Who can use the store",
          p: [
            "You must be at least 13 years old, and under 18 needs a parent or guardian's consent.",
            "You're responsible for keeping your login secure. Activity on your account is treated as yours.",
          ],
        },
        {
          h: "What you're buying",
          p: [
            "Items are digital goods for Roblox games, delivered to the Roblox username you provide at checkout. Double-check that username — delivering to the wrong account is the most common cause of a stuck order.",
            "Prices, stock levels and discounts can change at any time. The price charged is the one shown at checkout when you confirmed the order.",
            "If a product is priced obviously in error (for example, a $200 item listed at $0.50), we may cancel and refund that order rather than honour it.",
          ],
        },
        {
          h: "Delivery",
          p: [
            "Delivery happens in-game through our automated delivery system or a staff member, depending on the game. Some orders need you to be online and available to claim — the product page says which.",
            "We don't ask for your Roblox password at any point, and you should never give it to anyone claiming to be from RBstars.",
          ],
        },
        {
          h: "Your conduct",
          p: [
            "Don't abuse the site, the support team or the delivery system: no harassment, no automated scraping, no exploiting bugs for free items, no reselling purchased items through us.",
            "Account sharing, fraud, and abusive chargebacks all result in a permanent ban.",
          ],
        },
        {
          h: "Third-party games",
          p: [
            "RBstars is an independent store and isn't affiliated with, endorsed by or sponsored by Roblox Corporation or any game developer. In-game items remain subject to those games' own rules, including any trading restrictions they impose.",
          ],
        },
        {
          h: "Liability",
          p: [
            "We provide the store as-is and work to keep it accurate and available, but we don't guarantee uninterrupted access or that every listing is error-free.",
            "To the extent the law allows, our total liability for any claim about an order is limited to the amount you paid for that order. Nothing here limits rights you have under consumer law.",
          ],
        },
        {
          h: "Changes and contact",
          p: [
            "We'll update these terms as the store changes, and the date at the top of this page always reflects the current version. Continuing to use the store after a change means you accept it.",
            "Anything unclear — open a ticket and ask. We'd rather answer a question than have you guess.",
          ],
        },
      ]}
    />
  );
}
