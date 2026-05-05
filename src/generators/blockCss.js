// Generates stylesheet.css scaffold for an ACF block.
import { getTemplate } from '../lib/templates.js'
//
// Conventions enforced here:
//   - All custom CSS variables are scoped to .{slug} (block-local).
//   - Breakpoints are max-width cascade, desktop-first. Each later
//     breakpoint overrides the earlier ones for properties that change.
//   - WYSIWYG vertical-rhythm rules are scoped to .{slug} so they don't
//     leak to other blocks or to header / footer / sidebar regions.

export function generateBlockCss(schema) {
  const { slug, fields, options } = schema

  // Per-field BEM stubs (one selector per unique field, deduped)
  const elementSelectors = fields
    .map((f) => `.${slug}__${f.name.replace(/_/g, '-')}`)
    .filter((sel, i, arr) => arr.indexOf(sel) === i)

  // Each stub is parent-scoped (.{slug} .{slug}__element) so it can never
  // leak to siblings or other blocks that happen to share an element name.
  const elementStubs = elementSelectors
    .map((sel) => `.${slug} ${sel} {\n  /* ${sel} styles */\n}`)
    .join('\n\n')

  // Template-level CSS extras (e.g. CTA layout + chevron animation)
  const template = getTemplate(schema.template)
  const extraCss = template?.extraCss ? template.extraCss(schema) : ''

  return `/**
 * Block: ${slug}
 * BEM root: .${slug}
 *
 * ──── Layout contract ─────────────────────────────────────────────
 *   body              100% width, max-width 1920px (set globally in theme)
 *   .${slug}              section, always 100% width; padding scales w/ breakpoint
 *   .${slug}__inner       always 100% width; flex column; gap 60px
 *
 * ──── Breakpoints (max-width, desktop-first cascade) ──────────────
 *   Desktop          ≥ 1280px  (default values)
 *   Small desktop    ≤ 1279px
 *   Tablet           ≤ 1024px
 *   Mobile           ≤ 767px  (also overrides typography tokens)
 *
 * ──── Typography ──────────────────────────────────────────────────
 *   Tokens --font-size-h1..h6, --font-size-par/button/label and
 *   matching --line-height-* are declared on .${slug} so they cascade
 *   only inside this block. Mobile redefines them inside the ≤ 767px
 *   media query — no per-element font-size overrides needed.
 *
 * ──── Global vars expected from theme ─────────────────────────────
 *   --primary-color, --secondary-color, --tertiary-color
 *   --heading-font, --paragraph-font
 */

/* ═══════════════════════════════════════════════════════════════════
 * 1 · Block root — typography tokens + layout
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} {
  /* Typography scale (block-scoped) */
  --font-size-h1: 50px;     --line-height-h1: 60px;
  --font-size-h2: 44px;     --line-height-h2: 56px;
  --font-size-h3: 36px;     --line-height-h3: 48px;
  --font-size-h4: 30px;     --line-height-h4: 42px;
  --font-size-h5: 24px;     --line-height-h5: 32px;
  --font-size-h6: 18px;     --line-height-h6: 26px;
  --font-size-par: 18px;    --line-height-par: 26px;
  --font-size-button: 20px; --line-height-button: 20px;
  --font-size-label: 16px;  --line-height-label: 24px;

  /* Layout */
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 100px 6%;
  font-family: var(--paragraph-font, system-ui, sans-serif);
  font-size: var(--font-size-par);
  line-height: var(--line-height-par);
  color: var(--primary-color, #111);
}

.${slug} *,
.${slug} *::before,
.${slug} *::after {
  box-sizing: border-box;
}

/* ═══════════════════════════════════════════════════════════════════
 * 2 · Inner wrapper — flex column with consistent gap
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} .${slug}__inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

/* ═══════════════════════════════════════════════════════════════════
 * 3 · Default heading style
 *      .${slug}__heading is applied to the first field whose name
 *      contains "title". Wrapping tag is dynamic ($heading_tag): h1
 *      for hero blocks, h2 for inner blocks.
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} .${slug}__heading {
  font-family: var(--heading-font, inherit);
  font-size: var(--font-size-h1);
  line-height: var(--line-height-h1);
  margin: 0;
  color: var(--primary-color, #111);
}

/* Image reset */
.${slug} img {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* ═══════════════════════════════════════════════════════════════════
 * 4 · Per-field BEM stubs — fill in styles for each ACF field
 * ═══════════════════════════════════════════════════════════════════ */
${elementStubs || '/* No custom fields yet — stubs will appear here. */'}

/* ═══════════════════════════════════════════════════════════════════
 * 5 · WYSIWYG vertical rhythm (scoped to .${slug})
 *      Headings: 32px top, 0 bottom · :first-child resets to 0
 *      Body elements: 16px top, 0 bottom · :first-child resets to 0
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} .wysiwyg--content h1,
.${slug} .wysiwyg--content h2,
.${slug} .wysiwyg--content h3,
.${slug} .wysiwyg--content h4,
.${slug} .wysiwyg--content h5,
.${slug} .wysiwyg--content h6 {
  margin-top: 32px;
  margin-bottom: 0;
}
.${slug} .wysiwyg--content h1:first-child,
.${slug} .wysiwyg--content h2:first-child,
.${slug} .wysiwyg--content h3:first-child,
.${slug} .wysiwyg--content h4:first-child,
.${slug} .wysiwyg--content h5:first-child,
.${slug} .wysiwyg--content h6:first-child {
  margin-top: 0;
}
.${slug} .wysiwyg--content p,
.${slug} .wysiwyg--content ul,
.${slug} .wysiwyg--content ol,
.${slug} .wysiwyg--content blockquote,
.${slug} .wysiwyg--content pre,
.${slug} .wysiwyg--content code,
.${slug} .wysiwyg--content table,
.${slug} .wysiwyg--content img,
.${slug} .wysiwyg--content iframe,
.${slug} .wysiwyg--content video,
.${slug} .wysiwyg--content audio,
.${slug} .wysiwyg--content embed,
.${slug} .wysiwyg--content object {
  margin-top: 16px;
  margin-bottom: 0;
}
.${slug} .wysiwyg--content p:first-child,
.${slug} .wysiwyg--content ul:first-child,
.${slug} .wysiwyg--content ol:first-child,
.${slug} .wysiwyg--content blockquote:first-child,
.${slug} .wysiwyg--content pre:first-child,
.${slug} .wysiwyg--content code:first-child,
.${slug} .wysiwyg--content table:first-child,
.${slug} .wysiwyg--content img:first-child,
.${slug} .wysiwyg--content iframe:first-child,
.${slug} .wysiwyg--content video:first-child,
.${slug} .wysiwyg--content audio:first-child,
.${slug} .wysiwyg--content embed:first-child,
.${slug} .wysiwyg--content object:first-child {
  margin-top: 0;
}

/* ═══════════════════════════════════════════════════════════════════
 * 6 · Gutenberg align-wide / align-full
 * ═══════════════════════════════════════════════════════════════════ */
.${slug}.alignwide,
.${slug}.alignfull {
  max-width: unset;
  margin-left: unset;
  margin-right: unset;
}

/* ═══════════════════════════════════════════════════════════════════
 * 7 · Editor-only overrides (block-editor iframe / preview)
 * ═══════════════════════════════════════════════════════════════════ */
.editor-styles-wrapper .${slug} {
  /* Prevent editor chrome from bleeding into block layout */
}

/* ═══════════════════════════════════════════════════════════════════
 * 8 · Responsive — Small desktop (≤ 1279px)
 * ═══════════════════════════════════════════════════════════════════ */
@media (max-width: 1279px) {
  .${slug} {
    padding: 80px 60px;
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * 9 · Responsive — Tablet (≤ 1024px)
 * ═══════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .${slug} {
    padding: 60px 40px;
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * 10 · Responsive — Mobile (≤ 767px)
 *       Also redefines typography tokens inside .${slug} so any
 *       descendant using var(--font-size-h2) etc. responds automatically.
 * ═══════════════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
  .${slug} {
    /* Typography overrides */
    --font-size-h1: 42px;   --line-height-h1: 50px;
    --font-size-h2: 34px;   --line-height-h2: 46px;
    --font-size-h3: 30px;   --line-height-h3: 42px;
    --font-size-h4: 24px;   --line-height-h4: 36px;
    --font-size-h5: 20px;   --line-height-h5: 28px;
    --font-size-h6: 16px;   --line-height-h6: 24px;
    --font-size-par: 16px;  --line-height-par: 24px;
    /* button + label intentionally not overridden */

    /* Layout */
    padding: 40px 20px;
  }
}
${extraCss}`
}
