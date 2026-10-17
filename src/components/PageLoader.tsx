import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RBstar } from "@/components/Art";
import { P } from "@/lib/storefront";
import { DEFAULT_LOADER_LINES, fetchPublicContent } from "@/lib/publicContent";

/* ── Page loader ─────────────────────────────────────────────────────────
   The old loader was a 34px star and one line of text on an otherwise
   empty navy screen — no header, no structure, no indication anything was
   happening. This is the branded version:

     orbit ring + a gold star travelling it · pulsing mark with a bloom
     · wordmark with a light sweep · indeterminate bar · cycling site copy

   Purely presentational: it fires no requests, so swapping it in cannot
   change a page's data-loading behaviour or request count.

   `full` renders a viewport-height screen (pages that don't show a header
   while loading); pass `full={false}` to sit it under an existing header
   as a 60vh panel.

   The cycling copy is owner-editable (Admin → Site Content → Loading Screen).
   It is fetched once per page load and cached in lib/publicContent, so no
   matter how many loaders mount this fires at most ONE request and never
   blocks render: the defaults paint immediately and swap in when the response
   lands. Pass `lines` to override both. */

const DEFAULT_LINES = DEFAULT_LOADER_LINES;

export default function PageLoader({
  label,
  lines,
  full = true,
}: {
  /** shown as "Loading {label}…" */
  label?: string;
  /** copy that cycles beneath the bar; pass `[]` to hide. Defaults to the
      owner-set copy from Admin → Site Content → Loading Screen. */
  lines?: string[];
  /** viewport-height screen vs. a panel under an existing header */
  full?: boolean;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [adminLines, setAdminLines] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPublicContent().then(c => { if (alive && c?.loader?.length) setAdminLines(c.loader); });
    return () => { alive = false; };
  }, []);

  const active = lines ?? adminLines ?? DEFAULT_LINES;
  const showLines = active.length > 0;
  const idx = showLines ? i % active.length : 0;

  useEffect(() => {
    if (reduce || active.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % active.length), 2600);
    return () => clearInterval(t);
  }, [reduce, active.length]);

  return (
    <div className={"pl" + (full ? " pl--screen" : " pl--panel")} style={{ background: P.bg }}>
      <style>{PL_CSS}</style>

      <div className="pl-inner" role="status" aria-live="polite">
        {/* ── orbit mark ── */}
        <div className="pl-mark">
          <svg className="pl-ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke={P.borderStrong}
              strokeWidth="2.5"
              strokeDasharray="2 13"
              strokeLinecap="round"
            />
          </svg>

          {/* gold star riding the ring */}
          <span className="pl-orbit" aria-hidden="true"><i /></span>

          {/* bloom behind the mark */}
          <span className="pl-bloom" aria-hidden="true" />

          <motion.span
            className="pl-star"
            aria-hidden="true"
            animate={reduce ? undefined : { scale: [1, 1.07, 1], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          >
            <RBstar size={78} color={P.star} />
          </motion.span>
        </div>

        {/* ── wordmark with a light sweep ── */}
        <div className="pl-word">RBstars</div>

        {/* ── indeterminate progress ── */}
        <div className="pl-bar" aria-hidden="true"><i /></div>

        <p className="pl-label">{label ? `Loading ${label}…` : "Loading…"}</p>

        {showLines && (
          <div className="pl-lines" aria-hidden="true">
            {active.map((t, n) => (
              <span key={n} className={n === idx ? "on" : ""}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PL_CSS = `
.pl{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
  font-family:Inter,system-ui,sans-serif;color:#fff}
.pl--screen{min-height:100vh;min-height:100dvh}
.pl--panel{min-height:60vh}
/* one soft bloom so the screen matches the shop's lit-navy language
   instead of reading as a flat empty page */
.pl::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(760px 520px at 50% 34%,rgba(47,140,255,.17),transparent 70%),
             radial-gradient(520px 380px at 50% 78%,rgba(255,197,61,.07),transparent 72%)}
.pl-inner{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 24px}

.pl-mark{position:relative;width:186px;height:186px;display:grid;place-items:center}
.pl-ring{position:absolute;inset:0;width:100%;height:100%;animation:plspin 16s linear infinite;opacity:.85}
.pl-orbit{position:absolute;inset:0;animation:plspin 3.4s linear infinite}
.pl-orbit i{position:absolute;left:50%;top:5px;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;
  background:#FFC53D;box-shadow:0 0 16px 4px rgba(255,197,61,.55)}
.pl-bloom{position:absolute;width:132px;height:132px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,197,61,.34),rgba(255,197,61,0) 66%);
  animation:plpulse 2.8s ease-in-out infinite}
.pl-star{position:relative;display:block;line-height:0;filter:drop-shadow(0 10px 26px rgba(255,197,61,.34))}

.pl-word{margin-top:24px;font:800 34px/1 Montserrat,Inter,sans-serif;letter-spacing:-.6px;
  background:linear-gradient(100deg,#fff 34%,#ffd75a 50%,#fff 66%);
  background-size:230% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:plsweep 3s linear infinite}

.pl-bar{position:relative;width:244px;height:4px;margin-top:24px;border-radius:99px;background:#1b2745;overflow:hidden}
.pl-bar i{position:absolute;top:0;bottom:0;width:40%;border-radius:99px;
  background:linear-gradient(90deg,rgba(10,132,255,0),#0a84ff 42%,#FFC53D 76%,rgba(255,197,61,0));
  animation:pltravel 1.3s cubic-bezier(.4,0,.2,1) infinite}

.pl-label{margin-top:16px;font-size:13.5px;font-weight:600;letter-spacing:.01em;color:#a9b3d3}

.pl-lines{position:relative;width:min(80vw,430px);height:17px;margin-top:12px}
.pl-lines span{position:absolute;inset:0;font:800 11px/17px Inter,sans-serif;letter-spacing:.15em;
  color:#8a97ba;opacity:0;transform:translateY(7px);transition:opacity .5s ease,transform .5s ease}
.pl-lines span.on{opacity:1;transform:none}

@keyframes plspin{to{transform:rotate(360deg)}}
@keyframes plpulse{0%,100%{transform:scale(.88);opacity:.6}50%{transform:scale(1.14);opacity:1}}
@keyframes plsweep{0%{background-position:140% 0}100%{background-position:-40% 0}}
@keyframes pltravel{0%{left:-42%}100%{left:102%}}

@media (prefers-reduced-motion:reduce){
  .pl-ring,.pl-orbit,.pl-bloom,.pl-word,.pl-bar i{animation:none}
  .pl-bar i{left:0;width:100%;opacity:.75}
  .pl-lines span{transition:none}
}
`;
