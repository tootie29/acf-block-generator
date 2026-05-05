import { uid } from './utils.js'
import { defaultFieldConfig } from './fieldTypes.js'
import ctaDesktop from '../assets/templates/cta-desktop.png'
import ctaMobile from '../assets/templates/cta-mobile.png'

// Build a field with a fresh React _uid + the type's default config, then merge
// any overrides on top. Used by template `fields()` factories so every call
// produces a brand-new field set with unique _uids.
function makeField(type, overrides = {}) {
  return {
    _uid: uid(),
    ...defaultFieldConfig(type),
    ...overrides,
  }
}

export const TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank — minimal markup, just your fields',
    description: 'Empty starting point. Add fields manually below.',
    preview: null,
    suggestedSlug: '',
    suggestedHeadingTag: null,
    fields: () => [],
  },

  {
    id: 'cta',
    label: 'CTA Template — eyebrow, headline, copy, button',
    description:
      'Centered call-to-action section: eyebrow label, italic headline, paragraph, and button. Matches the agency CTA pattern (desktop + mobile).',
    preview: {
      desktop: ctaDesktop,
      mobile: ctaMobile,
      caption: 'Centered CTA — italic headline + pill button',
    },
    suggestedSlug: 'cta-template',
    suggestedHeadingTag: 'h2',
    fields: () => [
      makeField('true_false', {
        name: 'show_arrows',
        label: 'Show down-arrows decoration',
        instructions:
          'Decorative animated chevrons above the eyebrow. Renders as inline SVG (no asset upload).',
        default_value: 1,
        ui_on_text: 'Show',
        ui_off_text: 'Hide',
        width: 100,
      }),
      makeField('text', {
        name: 'eyebrow',
        label: 'Eyebrow',
        placeholder: 'Request an assessment',
        instructions: 'Small uppercase label above the headline. Optional.',
        width: 100,
      }),
      makeField('textarea', {
        name: 'heading_title',
        label: 'Heading',
        rows: 2,
        placeholder: 'Not sure which condition is causing your symptoms?',
        instructions:
          'Main headline. Renders inside the heading tag chosen in step 2 (h1 for hero, h2 for inner).',
        width: 100,
        required: true,
      }),
      makeField('wysiwyg', {
        name: 'description',
        label: 'Description',
        instructions: 'Supporting paragraph below the headline. Optional.',
        toolbar: 'basic',
        width: 100,
      }),
      makeField('link', {
        name: 'cta_button',
        label: 'CTA Button',
        instructions: 'Primary button. Leave empty to hide the button.',
        width: 100,
      }),
      makeField('image', {
        name: 'bg_image',
        label: 'Background image (decorative)',
        instructions:
          'Optional faded background image behind the section. Decorative — alt text not required.',
        imageSize: 'full',
        width: 100,
      }),
    ],

    // Renders BEFORE the iterated fields inside .{slug}__inner.
    // The animated chevrons are gated on the $show_arrows ACF field.
    extraRender: ({ slug }) => `    <?php if ( $show_arrows ) : ?>
      <div class="${slug}__arrows" aria-hidden="true">
        <svg viewBox="0 0 18 31" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path class="${slug}__arrows-chevron" d="M1 1l8 8 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="${slug}__arrows-chevron" d="M1 11l8 8 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="${slug}__arrows-chevron" d="M1 21l8 8 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    <?php endif; ?>`,

    // Appended to the generated stylesheet — overrides the generic scaffold
    // with CTA-specific centered layout, pill button, faded bg image, and
    // chevron-fall animation.
    extraCss: ({ slug }) => `
/* ═══════════════════════════════════════════════════════════════════
 * CTA Template — centered callout + animated chevrons
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} {
  position: relative;
  overflow: hidden;
  background-color: #d8f1ec; /* fallback if bg_color not set */
  text-align: center;
}

.${slug} .${slug}__bg-image-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.${slug} .${slug}__bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
  mix-blend-mode: luminosity;
}

.${slug}__inner {
  position: relative;
  z-index: 1;
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.${slug}__arrows {
  width: 18px;
  height: 31px;
  color: #3089bc;
  display: flex;
  justify-content: center;
}

.${slug}__arrows svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.${slug}__arrows-chevron {
  opacity: 0;
  transform: translateY(-8px);
  animation: ${slug}-chevron-fall 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.${slug}__arrows-chevron:nth-child(1) { animation-delay: 0s; }
.${slug}__arrows-chevron:nth-child(2) { animation-delay: 0.18s; }
.${slug}__arrows-chevron:nth-child(3) { animation-delay: 0.36s; }

@keyframes ${slug}-chevron-fall {
  0%   { opacity: 0; transform: translateY(-8px); }
  35%  { opacity: 1; transform: translateY(0); }
  70%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .${slug}__arrows-chevron {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

.${slug}__eyebrow {
  font-family: var(--heading-font, "Lato", sans-serif);
  font-weight: 700;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.56px;
  text-transform: uppercase;
  color: #05356a;
  margin: 0;
}

.${slug}__heading {
  font-family: var(--heading-font, "Lato", sans-serif);
  font-weight: 900;
  font-style: italic;
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.2;
  color: #000;
  margin: 0;
  text-transform: capitalize;
  max-width: 880px;
}

.${slug} .wysiwyg--content {
  max-width: 600px;
  color: #404040;
  font-size: 16px;
  line-height: 24px;
}

.${slug}__cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 22px 40px;
  background-color: #3089bc;
  border: 1px solid #3089bc;
  border-radius: 999px;
  color: #fff;
  font-family: var(--heading-font, "Lato", sans-serif);
  font-weight: 700;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0.36px;
  text-transform: uppercase;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.${slug}__cta-button:hover,
.${slug}__cta-button:focus-visible {
  background-color: #246d99;
  border-color: #246d99;
  transform: translateY(-1px);
}

.${slug}__cta-button:focus-visible {
  outline: 2px solid #05356a;
  outline-offset: 3px;
}

@media (max-width: 767px) {
  .${slug}__inner { gap: 20px; }
  .${slug}__cta-button { width: 100%; padding: 18px 28px; }
}
`,
  },
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}
