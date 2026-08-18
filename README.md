# Zoe Life site concept

A cinematic, interactive concept for Zoe Life, prepared by Cozy Digital for review with Pastors Tayo and Kemi Akinyemi.

The enhanced direction preserves the partner build's strongest ideas: the deep espresso world, gold cross, locally rendered WebGL scene, editorial typography and deliberate motion. It now uses verified Zoe Life copy, current-site photography, the real public founders photograph and the two book covers already shown on the live site.

## Run it locally

The site has no build step. Serve the folder from an HTTP origin because the Three.js scene is an ES module.

```bash
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/
```

## Run the checks

```bash
python3 tests/check_site.py
```

The no-dependency test covers:

- Local assets and runtime dependencies
- Current-site asset provenance
- Semantic structure and form labels
- Mock form safety
- The actual founders image and both verified book covers
- Five season controls, four focus controls and three pathways
- Removal of unconfirmed offers, marketplaces and roadmap claims
- Reduced-motion support
- No raw window scroll listener
- No hidden-by-default main content
- No em dash or en dash characters in visible page copy

## Experience

### Cinematic hero

A local Three.js scene renders the gold cross, halo, light motes and subtle pointer movement. ScrollTrigger moves the cross between the hero and John 10:10 interlude. Reduced-motion users receive one calm static frame.

### Season selector

Visitors can choose Building, Waiting, Growing, Healing or Leading. The selected season changes the photograph, guidance, large letter and possible starting pathway.

### Three pathways

The site organizes Zoe Life's proposed work into:

- Relationships and Family
- Academic and Career
- Faith and Life Resources

The content remains grounded in public service areas from the current site: biblical coaching, teaching, speaking, books and resources, courses, workshops and church partnerships.

### Pathfinder

The reflection tool pairs a season with a Spiritual, Relational, Personal or Professional focus. It returns one possible starting pathway without presenting an assessment, diagnosis or promised outcome.

### Founders

The about section uses a clean crop of Tayo and Kemi from Zoe Life's current public contact-page graphic. The preferred original photograph and production permission still need confirmation.

### Resources

The interactive book display uses only the two verified public titles:

- A 7-Day Gratitude Devotional, by Kemi Akinyemi
- Questions Every Christian Couple Should Discuss Before Marriage, by Tayo and Kemi Akinyemi

Prices, release dates, purchase links and availability are intentionally absent until confirmed.

### Contact

The contact form is a local review interaction. It validates the fields and confirms that nothing was sent or stored. It has no action, method, API call or external form service.

## Stack

Static HTML, CSS and JavaScript. All runtime dependencies are local.

| Piece | Location |
| --- | --- |
| Three.js 0.168 | `vendor/three.module.min.js` |
| GSAP and ScrollTrigger | `vendor/gsap.min.js`, `vendor/ScrollTrigger.min.js` |
| Lenis | `vendor/lenis.min.js` |
| Fraunces and Outfit | `fonts/*.woff2` |
| Current-site content record | `docs/current-site-content.md` |
| Current-site asset provenance | `assets/current-site/manifest.json` |

## Content boundaries

This remains an internal concept. It does not claim prices, packages, testimonials, metrics, credentials, outcomes, guarantees, live booking, launch dates or product availability.

A free 20-minute consultation was discussed but is not presented as available because it has not been confirmed. The contact form sends and stores nothing. No deployment or production connection is included.
