/* ─────────────────────────────────────────────────────────────────────────
   RBstars visual system.

   Four motifs, no more. Each one exists because it comes from the subject
   (Roblox in-game items delivered by bot), never as decoration:

     1. RBstar     → the brand mark (RB*stars*)
     2. Blocky     → the customer (a Roblox avatar)
     3. Parcel/Mailbox → the delivery mechanism
     4. Item tile  → the unit of commerce

   Nothing here is a blob, an orb, a gradient wash, or a generic SaaS shape.
   ───────────────────────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════════════════
   1. RBstar — brand mark
   A fat, rounded 5-point star (inner radius deliberately high so it reads
   as friendly rather than celestial). Stroke-joined so the points soften.
══════════════════════════════════════════════════════════════════════ */

export const STAR_PATH =
  "M100 0 L125.9 64.4 L195.1 69.1 L141.9 113.6 L158.8 180.9 " +
  "L100 144 L41.2 180.9 L58.2 113.6 L4.9 69.1 L74.1 64.4 Z";

/* Star artwork is authored in a 200×200 box centred on (100, 90.45).
   This places it at (cx, cy) with the requested half-width. */
export const starAt = (cx: number, cy: number, r: number) => {
  const s = r / 95;
  return `translate(${cx} ${cy}) scale(${s}) translate(-100 -90.45)`;
};

export function RBstar({
  size = 24,
  color = "#2f8cff",
  className = "",
}: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="-9 -9 218 218"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={STAR_PATH}
        fill={color}
        stroke={color}
        strokeWidth="13"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   2. (removed) — a hand-drawn "Roblox-shaped customer" used to live here.

   It was rounded rectangles with a smile, and it read as a generic blob
   person rather than anything resembling a Roblox avatar. A shape that
   fails to say what it is says something worse: that the art is filler.
   Identity now comes from a real Roblox avatar where one exists, and from
   the person's own initial on a brand tint where one doesn't — which at
   least identifies them. Do not reintroduce a drawn character here.
══════════════════════════════════════════════════════════════════════ */

/* The item tile — the unit of commerce, and also the honest "no artwork yet"
   mark. A placeholder drawn from this site's own vocabulary rather than a
   letter on a coloured square. */
export function ItemTileGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect x="6.5" y="6.5" width="35" height="35" rx="9" fill="none" stroke="#566f9e" strokeWidth="3" />
      <rect x="15" y="16" width="18" height="6" rx="3" fill="#3a4f7a" />
      <rect x="15" y="27" width="13" height="6" rx="3" fill="#566f9e" />
    </svg>
  );
}

/* Compact mailbox glyph — the delivery motif at icon size. Gold flag up means
   "you have mail", which is the whole promise of this store. */
export function MailboxGlyph({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 34 32" width={size} height={size * (32 / 34)} className={className} aria-hidden="true" focusable="false">
      <rect x="12" y="22" width="4" height="7" fill="#0a84ff" />
      <rect x="8" y="27" width="12" height="4" rx="2" fill="#0a84ff" />
      <rect x="2" y="8" width="24" height="15" rx="7" fill="#2f8cff" stroke="#0a84ff" strokeWidth="2" />
      <rect x="8" y="14" width="12" height="4" rx="2" fill="#0a50d6" />
      <rect x="25" y="4" width="2.5" height="11" rx="1.25" fill="#0a84ff" />
      <rect x="27" y="3" width="6" height="7" rx="2.5" fill="#FFC53D" />
    </svg>
  );
}

/* A support ticket, drawn as the object it actually is: a stub with a
   perforation and a paid-for gold stub end. Support pages illustrate a
   ticket — not a headset icon, which would say nothing about what's inside. */
export function TicketStub({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 46" className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="58" height="36" rx="7" fill="#16213c" stroke="#0a84ff" strokeWidth="3" />
      <path
        d="M44 7 v5 M44 16 v5 M44 25 v5 M44 34 v5"
        stroke="#0a84ff" strokeWidth="2.6" strokeLinecap="round"
      />
      <rect x="50" y="16" width="7" height="14" rx="3.5" fill="#FFC53D" />
      <rect x="11" y="14" width="24" height="5" rx="2.5" fill="#0a84ff" opacity="0.75" />
      <rect x="11" y="25" width="16" height="5" rx="2.5" fill="#2f8cff" />
    </svg>
  );
}

/* A conversation. Chat and claim pages are about what people said to each
   other, so the empty state shows the exchange itself. */
export function SpeechBubble({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} aria-hidden="true" focusable="false">
      <path
        d="M10 5 H54 a7 7 0 0 1 7 7 V32 a7 7 0 0 1 -7 7 H24 L12 48 L15 37 H10 a7 7 0 0 1 -7 -7 V12 a7 7 0 0 1 7 -7 Z"
        fill="#16213c" stroke="#0a84ff" strokeWidth="3" strokeLinejoin="round"
      />
      <rect x="16" y="15" width="32" height="5" rx="2.5" fill="#2f8cff" />
      <rect x="16" y="25" width="19" height="5" rx="2.5" fill="#0a84ff" opacity="0.7" />
    </svg>
  );
}

/* ── Display case ──────────────────────────────────────────────────────
   The product artwork's home. Flat stage + corner ticks: a frame that says
   "this item is on display" instead of a radial glow that says nothing. */
export function DisplayStage({
  children,
  className = "",
  style,
}: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ticks = [
    { style: { top: 14, left: 14 }, rot: 0 },
    { style: { top: 14, right: 14 }, rot: 90 },
    { style: { bottom: 14, right: 14 }, rot: 180 },
    { style: { bottom: 14, left: 14 }, rot: 270 },
  ] as const;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{ background: "#16213c", border: "3px solid #2a3a60", ...style }}
    >
      {ticks.map((t, i) => (
        <svg
          key={i}
          width="26" height="26" viewBox="0 0 26 26" fill="none"
          className="absolute pointer-events-none"
          style={{ ...t.style, transform: `rotate(${t.rot}deg)` } as React.CSSProperties}
          aria-hidden="true"
        >
          <path d="M3.5 13 V6 A2.5 2.5 0 0 1 6 3.5 H13" stroke="#2f8cff" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      ))}
      <div className="relative w-full h-full flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ── Empty mailbox ─────────────────────────────────────────────────────
   "Product not found" told in our own vocabulary: flag down, interior
   empty, the star that would have been there is greyed out. */
export function EmptyMailbox({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} role="img" aria-label="Nothing here — this item is not available">
      <rect x="1.5" y="1.5" width="237" height="197" rx="24" fill="#16213c" stroke="#2a3a60" strokeWidth="3" />
      <rect x="30" y="158" width="180" height="20" rx="10" fill="#1b2745" />
      {/* flag down = nothing arrived */}
      <rect x="184" y="74" width="8" height="38" rx="4" fill="#2f4069" />
      <rect x="189" y="104" width="30" height="19" rx="7" fill="#3a4d78" />
      {/* mailbox, muted to say "inactive" */}
      <rect x="94" y="150" width="54" height="14" rx="7" fill="#26365a" />
      <rect x="112" y="118" width="18" height="46" rx="5" fill="#26365a" />
      <rect x="52" y="62" width="136" height="66" rx="22" fill="#3a4d78" stroke="#2f4069" strokeWidth="3" />
      <rect x="78" y="76" width="84" height="34" rx="13" fill="#1f2e4d" />
      {/* the star that isn't there */}
      <path d={STAR_PATH} transform={starAt(120, 32, 22)} fill="#33456f" stroke="#33456f" strokeWidth="13" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   3. Delivery scene — the hero illustration
   Reads left→right, which is the actual order of operations:
   your items get packed → travel → land in your mailbox, flag up.
   Only two things move, and each one means something.
══════════════════════════════════════════════════════════════════════ */

export function DeliveryScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 440 360"
      className={className}
      role="img"
      aria-label="Your items are packed into a parcel and delivered straight to your mailbox"
    >
      {/* stage */}
      <rect x="1.5" y="1.5" width="437" height="357" rx="28" fill="#16213c" stroke="#2a3a60" strokeWidth="3" />
      {/* ground */}
      <rect x="24" y="298" width="392" height="46" rx="23" fill="#1b2745" />

      {/* ── items, packed and travelling ── */}
      {/* Speed streaks stay put: the parcel moves through them, which is what
          makes the travel read instead of the whole cluster drifting. */}
      <path d="M6 216 H20" stroke="#2f8cff" strokeWidth="6" strokeLinecap="round" />
      <path d="M4 240 H18" stroke="#2f8cff" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <path d="M7 264 H19" stroke="#2f8cff" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
      <g className="rb-drift">
        <rect x="24" y="196" width="88" height="88" rx="18" fill="#FFC85A" stroke="#F59E0B" strokeWidth="3" />
        <rect x="60" y="206" width="16" height="68" rx="4" fill="#F59E0B" />
        <rect x="34" y="232" width="68" height="16" rx="4" fill="#F59E0B" />
        <path d={STAR_PATH} transform={starAt(68, 240, 17)} fill="#2f8cff" stroke="#2f8cff" strokeWidth="13" strokeLinejoin="round" />
      </g>

      {/* ── the mailbox ── */}
      <rect x="198" y="292" width="66" height="16" rx="8" fill="#0a84ff" />
      <rect x="221" y="210" width="20" height="96" rx="6" fill="#0a84ff" />
      <rect x="154" y="124" width="156" height="94" rx="26" fill="#2f8cff" stroke="#0a84ff" strokeWidth="3" />
      <rect x="154" y="156" width="156" height="7" fill="#0a84ff" opacity="0.3" />
      <rect x="186" y="168" width="92" height="16" rx="8" fill="#0a50d6" />

      {/* the delivered letter, standing in the slot */}
      <g transform="rotate(-7 233 140)">
        <rect x="196" y="112" width="74" height="56" rx="10" fill="#1b2745" stroke="#38497a" strokeWidth="3" />
        <rect x="208" y="126" width="44" height="6" rx="3" fill="#38497a" />
        <rect x="208" y="140" width="54" height="6" rx="3" fill="#2a3a60" />
      </g>

      {/* flag up = you have mail */}
      <rect x="304" y="112" width="9" height="54" rx="4.5" fill="#0a84ff" />
      <rect x="310" y="106" width="40" height="26" rx="7" fill="#FFC53D" />

      {/* brand signal: delivered */}
      <g className="rb-pulse">
        <path d={STAR_PATH} transform={starAt(233, 54, 30)} fill="#FFC53D" stroke="#FFC53D" strokeWidth="13" strokeLinejoin="round" />
      </g>

    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   4. Step diagrams — how it works
   Three panels, one grammar (same stage, same palette, same line weight),
   each explaining a real stage of the actual flow.
══════════════════════════════════════════════════════════════════════ */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-auto block" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="317" height="177" rx="24" fill="#16213c" stroke="#2a3a60" strokeWidth="3" />
      {children}
    </svg>
  );
}

/* ① Choose — a shelf of item tiles, one being tapped. */
function ChooseDiagram() {
  const cols = [66, 134, 202];
  const rows = [40, 108];
  return (
    <Stage>
      {rows.map((y) =>
        cols.map((x) => {
          const chosen = x === 66 && y === 40;
          return (
            <g key={`${x}-${y}`}>
              <rect
                x={x} y={y} width="52" height="52" rx="11"
                fill={chosen ? "#2f8cff" : "#1b2745"}
                stroke={chosen ? "#0a84ff" : "#38497a"}
                strokeWidth="3"
              />
              {/* price tag = this is a product, not a shape */}
              <rect x={x + 14} y={y + 30} width="24" height="11" rx="5.5" fill={chosen ? "#1b2745" : "#2f8cff"} opacity={chosen ? 0.9 : 0.18} />
              <rect x={x + 14} y={y + 14} width="24" height="7" rx="3.5" fill={chosen ? "#1b2745" : "#2a3a60"} />
            </g>
          );
        }),
      )}
      {/* tap ripple on the chosen tile — shows the interaction, not a ring for looks */}
      <circle cx="92" cy="66" r="32" fill="none" stroke="#2f8cff" strokeWidth="3" opacity="0.4" />
      <circle cx="92" cy="66" r="42" fill="none" stroke="#2f8cff" strokeWidth="3" opacity="0.16" />
      <circle cx="92" cy="66" r="13" fill="#1b2745" />
      <path d="M92 60 v12 M86 66 h12" stroke="#2f8cff" strokeWidth="3.5" strokeLinecap="round" />
    </Stage>
  );
}

/* ② Checkout — a card, and a shield because money changes hands. */
function CheckoutDiagram() {
  return (
    <Stage>
      <rect x="52" y="44" width="180" height="104" rx="16" fill="#2f8cff" />
      <rect x="52" y="66" width="180" height="26" fill="#0a84ff" />
      <rect x="70" y="104" width="34" height="26" rx="5" fill="#FFC85A" />
      <rect x="116" y="110" width="94" height="8" rx="4" fill="#1b2745" opacity="0.6" />
      <rect x="116" y="124" width="62" height="8" rx="4" fill="#1b2745" opacity="0.4" />
      {/* shield = secure, because this is the step where payment happens */}
      <path d="M232 92 L266 104 V132 C266 150 252 160 232 166 C212 160 198 150 198 132 V104 Z"
        fill="#2ED3A0" stroke="#1FB88C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M216 130 l11 11 l21 -23" fill="none" stroke="#1b2745" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </Stage>
  );
}

/* ③ Claim — your blocky self, at the mailbox, item received. */
function ClaimDiagram() {
  return (
    <Stage>
      <rect x="28" y="160" width="264" height="18" rx="9" fill="#1b2745" />

      {/* mailbox */}
      <rect x="90" y="154" width="44" height="12" rx="6" fill="#0a84ff" />
      <rect x="104" y="132" width="16" height="30" fill="#0a84ff" />
      <rect x="52" y="58" width="120" height="74" rx="20" fill="#2f8cff" stroke="#0a84ff" strokeWidth="3" />
      <rect x="52" y="84" width="120" height="6" fill="#0a84ff" opacity="0.3" />
      <rect x="76" y="94" width="68" height="13" rx="6.5" fill="#0a50d6" />
      <rect x="86" y="50" width="52" height="44" rx="8" fill="#1b2745" stroke="#38497a" strokeWidth="3" />
      <rect x="95" y="62" width="30" height="5" rx="2.5" fill="#38497a" />
      <rect x="95" y="73" width="38" height="5" rx="2.5" fill="#2a3a60" />
      <rect x="168" y="50" width="7" height="40" rx="3.5" fill="#0a84ff" />
      <rect x="173" y="45" width="28" height="19" rx="6" fill="#FFC53D" />

      {/* delivered */}
      <g className="rb-pulse">
        <path d={STAR_PATH} transform={starAt(112, 26, 20)} fill="#FFC53D" stroke="#FFC53D" strokeWidth="13" strokeLinejoin="round" />
      </g>

    </Stage>
  );
}

export function StepDiagram({ n }: { n: 1 | 2 | 3 }) {
  if (n === 1) return <ChooseDiagram />;
  if (n === 2) return <CheckoutDiagram />;
  return <ClaimDiagram />;
}
