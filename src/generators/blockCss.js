// Generate a sensible BEM scaffold using the agency's global CSS variables.
// Per the wizard's option 4.5: CSS refers to --primary-color, --secondary-color,
// --tertiary-color, --heading-font, --paragraph-font.

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
 */

.${slug} {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem);
  font-family: var(--paragraph-font, system-ui, sans-serif);
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
  font-size: clamp(1.75rem, 4vw, 3rem);
  line-height: 1.15;
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

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .${slug} {
    /* tablet adjustments */
  }
}

/* ---- Desktop ---- */
@media (min-width: 1024px) {
  .${slug} {
    /* desktop adjustments */
  }
}

/* ---- Wide ---- */
@media (min-width: 1280px) {
  .${slug} {
    /* wide adjustments */
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
