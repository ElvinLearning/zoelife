# Zoe Life — Site Concept

A cinematic, scroll-driven concept build for **zoelifehub.com**, prepared by Cozy Digital
for the Tuesday walkthrough with Pastors Kemi & Tayo.

Warm and inviting, not girly — espresso, cream and gold, with a spinning 3D cross as the
centerpiece. Built to grow: courses, academic and career funnels are structured in but
"switched off" until they're ready.

## Run it

No build step. Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`. (Opening `index.html` directly won't work — the 3D
scene is an ES module and needs an HTTP origin.)

## What's in the experience

- **Preloader** — gold cross + counter, curtain reveal.
- **Hero** — WebGL spinning beveled gold cross (Three.js) with light motes, floating
  accents, and mouse parallax. Scrolling spins it faster and sends it away.
- **Marquee** — tilted gold ticker (Abundant life · ζωή · John 10:10).
- **About** — "reads like people": Kemi & Tayo cards + three pillars.
- **The Book** — CSS 3D book that rotates as you scroll; store chips for Amazon, Etsy,
  Gumroad and Selar (KDP-without-Select so all four can coexist).
- **Verse interlude** — John 10:10 over the cross, haloed, front and center.
- **Zoe Family Life** — the sub-brand keeps its own heartbeat (sage accent).
- **Built to grow** — pinned horizontal rail: Courses / Academic / Career / Community
  with "in the works / on the roadmap" badges.
- **Consult** — 20-minute consultation CTA.
- **Contact** — form instead of a public email address.
- Smooth scrolling (Lenis), scroll-scrubbed choreography (GSAP ScrollTrigger), split-text
  reveals, magnetic buttons, custom cursor, film grain, scroll progress bar.
- Respects `prefers-reduced-motion` (static scene, no smoothing, everything readable),
  degrades gracefully without JS, and adapts the 3D composition for portrait screens.

## Stack

Static HTML/CSS/JS. All dependencies vendored — no CDNs, no external requests:

| Piece | Where |
| --- | --- |
| Three.js 0.168 | `vendor/three.module.min.js` |
| GSAP 3.15 + ScrollTrigger | `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js` |
| Lenis 1.3 | `vendor/lenis.min.js` |
| Fraunces + Outfit (OFL) | `fonts/*.woff2` |

## Placeholders to resolve before launch

- **Book title & cover** — "ZOE — the God-kind of life" is a placeholder treatment.
- **Store links** — Amazon / Etsy / Gumroad / Selar chips currently show a "goes live at
  launch" toast; drop in real URLs when listings exist.
- **Contact form** — front-end only; wire to Squarespace form handling, Formspree, or
  Google Workspace once `contact@` exists.
- **Consult booking** — CTA points at the contact form; swap in Calendly/Squarespace
  scheduling when ready.
- **Photos** — monogram avatars stand in for real portraits of Kemi & Tayo.
- **Zoe Family Life socials** — placeholder chips.
