# RBstars Design System — "RoGoat" dark navy marketplace

> Source prompt (learned 2026-10-10). Applies to every customer-facing page.
> When asked to build a page "in this exact style": reuse the same header,
> footer, background glows, tokens, radii and components. Content sits in the
> **1096px container** on the dark background. Never white panels.

---

## Brand and mood

A dark, premium-playful gaming marketplace for Roblox items (MM2 knives, pets,
Robux). The UI is calm, flat and navy; all the color and energy come from big
glossy 3D-rendered cartoon art (Pixar-like, soft studio lighting) floating over
the dark background. Trustworthy and fast: Trustpilot stars, delivery
promises, payment logos. No clutter. Lots of empty dark space around a few
strong elements.

## Color tokens

| Token | Value |
|---|---|
| Page background | `#121a2e` flat navy + soft blurred blue glows `#19284a` (top-left), `#1b2c4f` (right edge, fading in/out down the page). Never pure black. |
| Footer background | `#0e1527` |
| Card | gradient `#1c2e4f` → `#1a2848`, 1px border `#2b3c66`, radius 18px |
| Pills / inputs | bg `#1f2f52`, border `#2c3d66` |
| Active pill | bg `#0a5ec4`, border `#1b86ff` |
| Primary blue | `#0a84ff` → `#0a50d6` (90deg gradient) + glow `0 6px 18px rgba(10,110,255,.35)` |
| White button | `#fff` bg, `#0d1530` text |
| Success / price green | `#5fe08e` |
| Headline accent green | `#6cf29b` |
| Trustpilot green | `#1da64f` |
| Warning / open accent (FAQ minus) | `#f2792e` |
| Text | white `#fff`, muted `#a9b3d3`, small-print `#9aa8cb`, footer links `#b3bbd2` |
| Feature orbs | blue `#2f3de0`→`#4a63ff`, purple `#7b1fd8`→`#a13cf0`, teal `#10b8a8`→`#27e3b8`, each with dark ring `#0f1630` |

## Typography

- Headings: **Montserrat 700** — page titles 32-36px, hero 51px with tight
  line-height 1.2, stats numbers 40px, card titles 20px.
- Everything else: **Inter** 400/500/600/700. Body 13-14.5px, small print
  10.5-11px with 14px line-height, buttons 14px bold, nav links 12px semibold.
- Titles are centered for sections; hero and "how it works" are left-aligned.
- Sentence case. No all-caps except footer column headings.

## Layout

- Fixed container **1096px** wide, centered.
- Section rhythm: roughly **100-150px** of empty space between sections.
- Header: logo left, three icon+text links, then language and currency round
  buttons, a Login ghost pill (`#273752`) and a blue Register pill. 31px tall pills.
- Footer: logo + 3 link columns + language/currency pills; thin divider;
  social row (Instagram, X, YouTube, Discord in blue, TikTok); legal text 11px; copyright.

## Signature components

1. **Hero** — big white headline, with a tilted (-2deg) glossy blue sticker
   tag containing the key phrase (white 3px-ish edge, hard bottom shadow
   `0 7px 0 #0848a8`). Muted paragraph, white pill "Shop Now" with store icon,
   Trustpilot row with square green star boxes. Huge floating 3D scene on the
   right with a gentle float animation.
2. **Category pills** — rounded-full, 31px tall, with a 20px round game icon
   on the left.
3. **Product card** — 204x203, centered 110px transparent item render, name
   13.5px, green bold price with muted strikethrough old price, small green
   "-24% OFF" badge top-right (bg `#123a35`, border `#2f9e6c`, radius 7).
4. **Stats row** — three centered columns with a blue icon (50px), large
   number, muted label.
5. **Steps list** — numbered blue circles with white 2px border, dashed
   vertical connector, title + muted description. Video frame on the right:
   3px `#1385ff` border, radius 28, blue glow, play button centered; a 3D
   mascot overlaps the frame's bottom-left corner.
6. **Feature cards** — card fades out toward its bottom, a 76px gradient orb
   with dark ring half-overlaps the top edge, icon inside in a darker shade of
   the orb color.
7. **Reviews** — horizontal marquee of 218x146 cards (`#1e2849`), avatar,
   name, country, time pill, 4/5 green stars, 4-line clamp with "...".
8. **FAQ accordion** — 627px wide rows, pill-shaped (radius 19), blue circle
   "+" on the right; the open row has an orange "-" circle and 12.5px muted
   answer text.
9. **Buttons** — pill, 44px tall, blue gradient, trailing chevron.

## Art direction for imagery

- All characters and props are transparent-background 3D renders with glossy,
  rounded, toy-like forms and warm key light with cool rim light.
- Large decorative props (ice axe, crystal crossbow, voxel tree with rocks and
  grass, wizard with treasure chest) are placed bleeding off the left/right
  page edges, partly cropped, to frame sections.
- Item icons are game renders on transparent PNG with a soft drop shadow.

## Motion

Minimal: one slow float on the hero art, a slow horizontal marquee on reviews,
hover brightens buttons and cards slightly, accordion open/close. Respect
`prefers-reduced-motion`.

## Rules for new pages

- Keep the same header, footer, background glows, tokens and radii.
- Content sits in the 1096px container on the dark background; use cards and
  pills from above, never white panels.
- Each page gets one hero-like moment with a 3D render, one blue CTA, and
  generous empty space.
- Responsive: stack columns under 900px, hide side props under 1100px, keep
  pills and cards at the same radii.

## Image assets

Reference art lives in `public/rogoat/` (hero scene, game item renders,
reviewer avatars, video thumbnail, decorative props: axe, crossbow, tree,
wizard, flag/usd round buttons). Brand logo is `/rb-logo.png`.
