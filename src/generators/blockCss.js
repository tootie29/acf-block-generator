// Generate a BEM-scaffolded stylesheet.css using the agency's global CSS
// variables AND the canonical typography token scale (sourced from the
// agency Figma file). Every generated block ships with the same :root
// scaffold so font sizes stay consistent across the site without requiring
// any theme-level setup. Mobile breakpoint is fixed at max-width 767px.

const TYPOGRAPHY_SCAFFOLD = `/* ─────────────────────────────────────────────────────────────────────────
 * Typography scale — agency design-system tokens
 * Mobile breakpoint: 767px and below
 * Desktop / tablet: 768px and above (default values at :root)
 * ───────────────────────────────────────────────────────────────────────── */
:root {
  --font-size-h1: 50px;     --line-height-h1: 60px;
  --font-size-h2: 44px;     --line-height-h2: 56px;
  --font-size-h3: 36px;     --line-height-h3: 48px;
  --font-size-h4: 30px;     --line-height-h4: 42px;
  --font-size-h5: 24px;     --line-height-h5: 32px;
  --font-size-h6: 18px;     --line-height-h6: 26px;
  --font-size-par: 18px;    --line-height-par: 26px;
  --font-size-button: 20px; --line-height-button: 20px;
  --font-size-label: 16px;  --line-height-label: 24px;
}

@media (max-width: 767px) {
  :root {
    --font-size-h1: 42px;   --line-height-h1: 50px;
    --font-size-h2: 34px;   --line-height-h2: 46px;
    --font-size-h3: 30px;   --line-height-h3: 42px;
    --font-size-h4: 24px;   --line-height-h4: 36px;
    --font-size-h5: 20px;   --line-height-h5: 28px;
    --font-size-h6: 16px;   --line-height-h6: 24px;
    --font-size-par: 16px;  --line-height-par: 24px;
    /* button + label intentionally not overridden — same on both breakpoints */
  }
}`

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
 * Typography tokens (declared below) follow the agency Figma scale.
 * Mobile breakpoint: max-width 767px.
 */

${TYPOGRAPHY_SCAFFOLD}

.${slug} {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem);
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

.${slug}__content {
  max-width: 1200px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

/* ---- Mobile ---- */
@media (max-width: 767px) {
  .${slug} {
    /* mobile adjustments */
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
