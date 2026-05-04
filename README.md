# ACF Block Generator

A standalone Vite + React app that generates ACF Pro Gutenberg blocks (matching the RichardMedina agency conventions in the `gutenberg-acf-block` skill) and packages them as a downloadable ZIP.

## What it produces

Each ZIP contains `gutenberg-blocks/{block-slug}/` with:

- `block.json` — block manifest (apiVersion 3, ACF render mode, BEM-aligned)
- `render.php` — PHP template, every field wrapped in empty-check, dynamic `$heading_tag`, section_id-driven id, optional bg_color, optional featured-image fallback for image fields
- `fields.php` — `acf_add_local_field_group()` registration with **globally unique** `field__xxxxxxxxxxxxxxxx` and `group__xxxxxxxxxxxxxxxx` hex keys, `section_id` always first, all images set to `return_format: id`
- `block.css` — BEM scaffold using global CSS vars (`--primary-color`, `--heading-font`, etc.)
- `block.js` — auto-generated when the block name contains `tabs` / `slider` / `accordion` / `faq`, or when "Has custom JS" is toggled on
- `README.md` — install instructions

## Install

```bash
npm install
```

## Develop

```bash
npm run dev
```

Then open http://localhost:5173 — the wizard is the left panel, live preview is the right panel.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. It's a fully static SPA — no server runtime needed.

## Deploy to Synology

Web Station → create a static site pointing at the `dist/` folder (after running `npm run build` locally and uploading), or:

```bash
npm run build
rsync -avz dist/ chardmedina@your-nas:/volume1/web/acf-block-generator/
```

Or run `npm run preview` directly on the NAS if Node is installed:

```bash
npm install --omit=dev
npm run build
npm run preview -- --port 4173
```

Then expose via Web Station reverse proxy at `chardmedina.dscloud.me/acf-gen/` or similar.

## Conventions enforced

These rules from the skill are baked into the generators — you cannot accidentally violate them:

- `acf.renderTemplate` always points to `gutenberg-blocks/{slug}/render.php`
- `section_id` text field is always the first field in `fields.php`
- Every ACF field key is a unique 16-char hex prefixed with `field__` / `group__`
- Image fields always use `return_format: id` and render via `wp_get_attachment_image()`
- Heading rendered via `<<?php echo $heading_tag; ?>>` — never hardcoded
- Every field output is wrapped in an empty-check
- Wrapper divs use `$has_content` flag — no empty wrappers
- Link fields check both `$link` and `! empty( $link['url'] )`
- Repeaters use `if ( have_rows(...) )`
- BEM root class everywhere; no utility classes; no `#id` selectors

## Adding more block templates

The "Blank" template is included for v1. To add a curated template (e.g. "Hero split image+text"):

1. Create `src/lib/templates/heroSplit.js` exporting a `fields` array and any extra options.
2. Register it in `src/lib/templates.js` (you'll need to create this).
3. Add it to the template `<select>` in `App.jsx`.

The generators accept any field schema, so templates are just pre-populated field arrays — no generator changes needed.

## Roadmap

- [ ] Repeater sub-field editor (the schema supports it; UI not yet wired)
- [ ] Global settings pattern (override toggle + `global-fields.php`)
- [ ] More built-in templates (hero split, features grid, FAQ, CTA banner)
- [ ] Export / import block configs as JSON (so you can save presets)
- [ ] Dry-run preview of `functions.php` snippets needed
