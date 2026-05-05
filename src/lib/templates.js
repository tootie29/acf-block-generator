import { uid } from './utils.js'
import { defaultFieldConfig } from './fieldTypes.js'
import ctaDesktop from '../assets/templates/cta-desktop.png'
import ctaMobile from '../assets/templates/cta-mobile.png'
import repeatableImageContentDesktop from '../assets/templates/repeatable-image-content-desktop.png'
import repeatableImageContentMobile from '../assets/templates/repeatable-image-content-mobile.png'

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
    // chevron-fall animation. Every child selector is parent-scoped under
    // .{slug} so nothing can leak to other blocks or sections.
    extraCss: ({ slug }) => `
/* ═══════════════════════════════════════════════════════════════════
 * CTA Template — centered callout + animated chevrons
 *   All selectors below are scoped under .${slug} (BEM with parent
 *   ancestor) so styles cannot affect any other block or section.
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

.${slug} .${slug}__inner {
  position: relative;
  z-index: 1;
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.${slug} .${slug}__arrows {
  width: 18px;
  height: 31px;
  color: #3089bc;
  display: flex;
  justify-content: center;
}

.${slug} .${slug}__arrows svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.${slug} .${slug}__arrows-chevron {
  opacity: 0;
  transform: translateY(-8px);
  animation: ${slug}-chevron-fall 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.${slug} .${slug}__arrows-chevron:nth-child(1) { animation-delay: 0s; }
.${slug} .${slug}__arrows-chevron:nth-child(2) { animation-delay: 0.18s; }
.${slug} .${slug}__arrows-chevron:nth-child(3) { animation-delay: 0.36s; }

@keyframes ${slug}-chevron-fall {
  0%   { opacity: 0; transform: translateY(-8px); }
  35%  { opacity: 1; transform: translateY(0); }
  70%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .${slug} .${slug}__arrows-chevron {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

.${slug} .${slug}__eyebrow {
  font-family: var(--heading-font, "Lato", sans-serif);
  font-weight: 700;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.56px;
  text-transform: uppercase;
  color: #05356a;
  margin: 0;
}

.${slug} .${slug}__heading {
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

.${slug} .${slug}__cta-button {
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

.${slug} .${slug}__cta-button:hover,
.${slug} .${slug}__cta-button:focus-visible {
  background-color: #246d99;
  border-color: #246d99;
  transform: translateY(-1px);
}

.${slug} .${slug}__cta-button:focus-visible {
  outline: 2px solid #05356a;
  outline-offset: 3px;
}

@media (max-width: 767px) {
  .${slug} .${slug}__inner { gap: 20px; }
  .${slug} .${slug}__cta-button { width: 100%; padding: 18px 28px; }
}
`,
  },

  {
    id: 'repeatable_image_content',
    label: 'Repeatable Image + Content Section',
    description:
      'Top intro (heading + paragraph) above a repeater of image+content rows. First image position is editor-controlled (left/right); subsequent rows alternate. Lato fonts, checkmark bullet list inside the WYSIWYG.',
    preview: {
      desktop: repeatableImageContentDesktop,
      mobile: repeatableImageContentMobile,
      caption: 'Intro + alternating image / copy rows',
    },
    suggestedSlug: 'repeatable-image-content',
    suggestedHeadingTag: 'h2',
    fields: () => [
      makeField('textarea', {
        name: 'intro_title',
        label: 'Intro heading',
        rows: 2,
        placeholder: 'What is a Rhinoplasty?',
        instructions:
          'Top heading above the repeater. Renders inside the heading tag chosen in step 2 (h1 / h2).',
        width: 100,
      }),
      makeField('wysiwyg', {
        name: 'intro_text',
        label: 'Intro paragraph',
        instructions: 'Supporting paragraph below the intro heading. Optional.',
        toolbar: 'basic',
        width: 100,
      }),
      makeField('button_group', {
        name: 'first_image_position',
        label: 'First row image position',
        choices: 'left : Image left\nright : Image right',
        default_value: 'left',
        allow_null: false,
        instructions:
          'Position of the first row image. Subsequent rows alternate automatically (every other row flips sides).',
        width: 100,
      }),
      makeField('repeater', {
        name: 'items',
        label: 'Items',
        button_label: 'Add Row',
        min: 1,
        max: 0,
        instructions:
          'Add as many image+content rows as you need. Each renders alternating left/right based on the toggle above.',
        width: 100,
        _skipRender: true, // template owns the loop markup so it can apply alternating layout
        subFields: [
          {
            ...defaultFieldConfig('image'),
            name: 'image',
            label: 'Image',
            return_format: 'id',
            imageSize: 'large',
            width: 50,
          },
          {
            ...defaultFieldConfig('textarea'),
            name: 'item_heading',
            label: 'Item heading',
            rows: 2,
            placeholder: 'Who can undergo liposuction?',
            width: 50,
          },
          {
            ...defaultFieldConfig('wysiwyg'),
            name: 'body',
            label: 'Body',
            toolbar: 'basic',
            instructions:
              'Paragraph + bulleted list. Use the WYSIWYG bullet button — bullets render with a green check icon.',
            width: 100,
          },
        ],
      }),
    ],

    // Owns the items repeater markup so we can apply the alternating-row
    // modifier and a sub-field heading tag without a generator change.
    extraRender: ({ slug }) => `    <?php
    $first_image_position = get_field( 'first_image_position' ) ?: 'left';
    ?>

    <?php if ( have_rows( 'items' ) ) : ?>
      <div class="${slug}__items ${slug}__items--first-<?php echo esc_attr( $first_image_position ); ?>">
        <?php while ( have_rows( 'items' ) ) : the_row();
          $item_image   = get_sub_field( 'image' );
          $item_heading = get_sub_field( 'item_heading' );
          $item_body    = get_sub_field( 'body' );
        ?>
          <div class="${slug}__items-item">
            <?php if ( $item_image ) : ?>
              <div class="${slug}__items-image-wrap">
                <?php echo wp_get_attachment_image( $item_image, 'large', false, [
                  'class'   => '${slug}__items-image',
                  'loading' => 'lazy',
                ] ); ?>
              </div>
            <?php endif; ?>

            <div class="${slug}__items-body">
              <?php if ( $item_heading ) : ?>
                <h3 class="${slug}__items-heading"><?php echo esc_html( $item_heading ); ?></h3>
              <?php endif; ?>
              <?php if ( $item_body ) : ?>
                <div class="wysiwyg--content">
                  <?php echo wp_kses_post( $item_body ); ?>
                </div>
              <?php endif; ?>
            </div>
          </div>
        <?php endwhile; ?>
      </div>
    <?php endif; ?>`,

    // CTA-style scoped CSS — every selector wrapped under .{slug}.
    extraCss: ({ slug }) => `
/* ═══════════════════════════════════════════════════════════════════
 * Repeatable Image + Content — Lato typography, alternating rows
 *   All selectors below are scoped under .${slug}.
 * ═══════════════════════════════════════════════════════════════════ */
.${slug} {
  background-color: #ffffff;
  font-family: "Lato", system-ui, sans-serif;
  color: #58585a;
}

.${slug} .${slug}__inner {
  max-width: 1200px;
  margin: 0 auto;
  gap: 100px;
  align-items: stretch;
}

.${slug} .${slug}__heading {
  font-family: "Lato", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(30px, 4vw, 38px);
  line-height: 1.26;
  text-align: center;
  color: #000;
  text-transform: capitalize;
  max-width: 800px;
  margin: 0 auto;
}

.${slug} .${slug}__intro-text-wrap,
.${slug} > .${slug}__inner > .wysiwyg--content {
  max-width: 800px;
  margin: 24px auto 0;
  text-align: center;
  color: #333;
  font-size: 18px;
  line-height: 26px;
}

/* ─── Repeater wrapper ──────────────────────────────────────────── */
.${slug} .${slug}__items {
  display: flex;
  flex-direction: column;
  gap: 80px;
  width: 100%;
}

/* Two-column row — agency convention: always size columns in percentages
   (max-width: 50%, width: 100%) instead of grid 1fr units, so the layout
   degrades predictably across container queries / fluid contexts.
   align-items: stretch makes the image column track the content column's
   height (whichever ends up taller drives the row). */
.${slug} .${slug}__items-item {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 80px;
}

.${slug} .${slug}__items-image-wrap,
.${slug} .${slug}__items-body {
  width: 100%;
  max-width: 50%;
  flex: 0 1 calc(50% - 40px); /* 50% minus half the gap so two columns + gap fit on one row */
}

/* First row image side: left (default) ⇒ image first.
   Then every other row flips. */
.${slug} .${slug}__items--first-left  .${slug}__items-item:nth-child(odd)  .${slug}__items-image-wrap { order: 1; }
.${slug} .${slug}__items--first-left  .${slug}__items-item:nth-child(odd)  .${slug}__items-body       { order: 2; }
.${slug} .${slug}__items--first-left  .${slug}__items-item:nth-child(even) .${slug}__items-image-wrap { order: 2; }
.${slug} .${slug}__items--first-left  .${slug}__items-item:nth-child(even) .${slug}__items-body       { order: 1; }

.${slug} .${slug}__items--first-right .${slug}__items-item:nth-child(odd)  .${slug}__items-image-wrap { order: 2; }
.${slug} .${slug}__items--first-right .${slug}__items-item:nth-child(odd)  .${slug}__items-body       { order: 1; }
.${slug} .${slug}__items--first-right .${slug}__items-item:nth-child(even) .${slug}__items-image-wrap { order: 1; }
.${slug} .${slug}__items--first-right .${slug}__items-item:nth-child(even) .${slug}__items-body       { order: 2; }

.${slug} .${slug}__items-image-wrap {
  position: relative;
  width: 100%;
  /* Stretch to match the row height set by the content column.
     min-height: 100% lets it grow with the body even when the
     image's intrinsic height is shorter. */
  min-height: 100%;
  display: flex;
}

.${slug} .${slug}__items-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 24px 40px -16px rgba(0, 0, 0, 0.18);
}

.${slug} .${slug}__items-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 40px 0;
}

.${slug} .${slug}__items-heading {
  font-family: "Lato", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.26;
  color: #000;
  text-transform: capitalize;
  margin: 0;
}

/* ─── WYSIWYG body — paragraph + checkmark bullet list ────────── */
.${slug} .${slug}__items-body .wysiwyg--content {
  color: #58585a;
  font-size: 18px;
  line-height: 26px;
}

.${slug} .${slug}__items-body .wysiwyg--content p {
  margin: 0;
}

.${slug} .${slug}__items-body .wysiwyg--content p + ul {
  margin-top: 16px;
}

.${slug} .${slug}__items-body .wysiwyg--content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.${slug} .${slug}__items-body .wysiwyg--content ul li {
  position: relative;
  padding-left: 32px;
  font-weight: 500;
  color: #58585a;
  line-height: 26px;
}

.${slug} .${slug}__items-body .wysiwyg--content ul li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #2a7f6e;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.5 8.2l2.8 2.8 6.2-6.2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 12px;
}

/* ─── Mobile (≤ 767px) — stacked, image always above content ──── */
@media (max-width: 767px) {
  .${slug} .${slug}__inner {
    gap: 60px;
  }
  .${slug} .${slug}__items {
    gap: 40px;
  }
  .${slug} .${slug}__items-item {
    gap: 24px;
  }
  /* Mobile: each column expands to full row width */
  .${slug} .${slug}__items-image-wrap,
  .${slug} .${slug}__items-body {
    max-width: 100%;
    flex: 0 1 100%;
  }
  /* Reset desktop height-matching — on mobile each row has only one
     column, so the image returns to its natural aspect ratio. */
  .${slug} .${slug}__items-image-wrap {
    min-height: auto;
    display: block;
  }
  .${slug} .${slug}__items-image {
    height: auto;
  }
  /* On mobile, image is always first regardless of toggle */
  .${slug} .${slug}__items .${slug}__items-image-wrap { order: 1 !important; }
  .${slug} .${slug}__items .${slug}__items-body       { order: 2 !important; }
  .${slug} .${slug}__items-body { padding: 0; justify-content: flex-start; }
}
`,
  },
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}
