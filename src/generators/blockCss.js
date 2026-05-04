// Generate a BEM-scaffolded stylesheet.css using the agency's global CSS
// variables AND the canonical typography token scale (sourced from the
// agency Figma file). Typography vars are scoped to the block's root
// selector (.{slug}) so each block carries its own copy without polluting
// :root or affecting other blocks / the rest of the page.
// Mobile breakpoint is fixed at max-width 767px.

export function generateBlockCss(schema) {
  const { slug, fields, options } = schema

  // Pull element selectors from fields for stub blocks
  const elementSelectors = fields
    .map((f) => `.${slug}__${f.name.replace(/_/g, '-')}`)
    .filter((sel, i, arr) => arr.indexOf(sel) === i)

  const elementStubs = elementSelectors
    .map((sel) => `${sel} {\n  /* ${sel} styles */\n}`)
    .join('\n\n')

  return `/**
 * Block: ${slug}
 * BEM root: .${slug}
 *
 * Uses agency global CSS variables:
 *   --primary-color, --secondary-color, --tertiary-color,
 *   --heading-font, --paragraph-font
 *
 * Typography tokens (declared on .${slug}) follow the agency Figma scale.
 * They are scoped to this block — won't leak outside .${slug}.
 *
 * Layout contract (agency standard):
 *   - body is 100% width with max-width 1920px (set globally in the theme)
 *   - section (.${slug}) is always 100% width
 *   - section padding scales: 100px 6% (default desktop ≥ 1280px),
 *     80px 60px (≤ 1279px), 60px 40px (≤ 1024px), 40px 20px (≤ 767px)
 *   - .${slug}__inner is always 100% width, flex column, gap 60px
 */

.${slug} {
  /* ── Typography scale (block-scoped) ──────────────────────────────────── */
  --font-size-h1: 50px;     --line-height-h1: 60px;
  --font-size-h2: 44px;     --line-height-h2: 56px;
  --font-size-h3: 36px;     --line-height-h3: 48px;
  --font-size-h4: 30px;     --line-height-h4: 42px;
  --font-size-h5: 24px;     --line-height-h5: 32px;
  --font-size-h6: 18px;     --line-height-h6: 26px;
  --font-size-par: 18px;    --line-height-par: 26px;
  --font-size-button: 20px; --line-height-button: 20px;
  --font-size-label: 16px;  --line-height-label: 24px;

  /* ── Block layout ─────────────────────────────────────────────────────── */
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

.${slug}__inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.${slug}__heading {
  font-family: var(--heading-font, inherit);
  font-size: var(--font-size-h1);
  line-height: var(--line-height-h1);
  margin: 0;
  color: var(--primary-color, #111);
}

.${slug} img {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

${elementStubs}

/* ---- WYSIWYG content vertical rhythm (scoped to .${slug}) ---- */
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

/* ---- ≤ 1279px ---- */
@media (max-width: 1279px) {
  .${slug} {
    padding: 80px 60px;
  }
}

/* ---- ≤ 1024px ---- */
@media (max-width: 1024px) {
  .${slug} {
    padding: 60px 40px;
  }
}

/* ---- ≤ 767px (mobile) ---- */
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
    /* button + label intentionally not overridden — same on both breakpoints */

    /* Layout */
    padding: 40px 20px;
  }
}

/* ---- Align overrides ---- */
.${slug}.alignwide,
.${slug}.alignfull {
  max-width: unset;
  margin-left: unset;
  margin-right: unset;
}

/* ---- Editor-only overrides ---- */
.editor-styles-wrapper .${slug} {
  /* Prevent editor chrome bleeding into block layout */
}
`
}
