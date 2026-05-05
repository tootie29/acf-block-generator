// Generate render.php matching every rule in the skill's render.php section.
import { getTemplate } from '../lib/templates.js'

function ind(level) {
  return '  '.repeat(level)
}

// Render a single field's PHP output, used inside the markup
function renderFieldOutput(field, slug, level = 1, opts = {}) {
  const pad = ind(level)
  const cls = `${slug}__${field.name.replace(/_/g, '-')}`
  const isHero = !!opts.isHero

  switch (field.type) {
    case 'text':
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <p class="${cls}"><?php echo esc_html( $${field.name} ); ?></p>
${pad}<?php endif; ?>`
    case 'textarea':
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <p class="${cls}"><?php echo nl2br( esc_html( $${field.name} ) ); ?></p>
${pad}<?php endif; ?>`
    case 'wysiwyg':
      // WYSIWYG output is always wrapped in .wysiwyg--content so site-wide
      // content styles (paragraph spacing, list bullets, link colors, etc.)
      // apply consistently regardless of which block it lives in.
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <div class="wysiwyg--content">
${pad}    <?php echo wp_kses_post( $${field.name} ); ?>
${pad}  </div>
${pad}<?php endif; ?>`
    case 'number':
    case 'url':
    case 'email':
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <span class="${cls}"><?php echo esc_html( $${field.name} ); ?></span>
${pad}<?php endif; ?>`
    case 'image': {
      const sz = field.imageSize || 'full'
      const mobileSz = field.mobileImageSize || 'large'
      const fmt = ['id', 'array', 'url'].includes(field.return_format)
        ? field.return_format
        : 'id'

      // Hero + featured-fallback combo: render <picture> with the featured
      // image as the mobile <source>. Hero LCP images load eagerly.
      // This path requires attachment IDs, so it forces id-format regardless.
      // The desktop <img> tries the agency [sge_srcset] shortcode first and
      // falls back to wp_get_attachment_image() when the shortcode is absent.
      if (isHero && field.useFeatured) {
        return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <div class="${cls}-wrap">
${pad}    <picture>
${pad}      <?php
${pad}      // Mobile source — only emit when featured image differs from desktop image.
${pad}      $${field.name}_mobile_url = ( ! empty( $${field.name}_mobile ) && $${field.name}_mobile !== $${field.name} )
${pad}          ? wp_get_attachment_image_url( $${field.name}_mobile, '${mobileSz}' )
${pad}          : '';
${pad}      ?>
${pad}      <?php if ( $${field.name}_mobile_url ) : ?>
${pad}        <source media="(max-width: 768px)" srcset="<?php echo esc_url( $${field.name}_mobile_url ); ?>">
${pad}      <?php endif; ?>
${pad}      <?php if ( shortcode_exists( 'sge_srcset' ) ) : ?>
${pad}        <?php echo do_shortcode( '[sge_srcset id="' . absint( $${field.name} ) . '" size="${sz}" class="${cls}" loading="eager" fetchpriority="high"]' ); ?>
${pad}      <?php else : ?>
${pad}        <?php echo wp_get_attachment_image( $${field.name}, '${sz}', false, [
${pad}          'class'         => '${cls}',
${pad}          'loading'       => 'eager',
${pad}          'fetchpriority' => 'high',
${pad}        ] ); ?>
${pad}      <?php endif; ?>
${pad}    </picture>
${pad}  </div>
${pad}<?php endif; ?>`
      }

      // return_format: 'array' — ACF returns an array of image data. When the
      // sge_srcset shortcode is present we still pass the attachment ID; we
      // only fall back to a hand-built <img> when the shortcode isn't loaded.
      if (fmt === 'array') {
        return `${pad}<?php if ( $${field.name} && ! empty( $${field.name}['url'] ) ) : ?>
${pad}  <div class="${cls}-wrap">
${pad}    <?php if ( shortcode_exists( 'sge_srcset' ) && ! empty( $${field.name}['ID'] ) ) : ?>
${pad}      <?php echo do_shortcode( '[sge_srcset id="' . absint( $${field.name}['ID'] ) . '" size="${sz}" class="${cls}"]' ); ?>
${pad}    <?php else : ?>
${pad}      <img class="${cls}"
${pad}           src="<?php echo esc_url( $${field.name}['sizes']['${sz}'] ?? $${field.name}['url'] ); ?>"
${pad}           alt="<?php echo esc_attr( $${field.name}['alt'] ); ?>"
${pad}           width="<?php echo esc_attr( $${field.name}['width'] ); ?>"
${pad}           height="<?php echo esc_attr( $${field.name}['height'] ); ?>"
${pad}           loading="lazy" />
${pad}    <?php endif; ?>
${pad}  </div>
${pad}<?php endif; ?>`
      }

      // return_format: 'url' — ACF returns a plain URL string with no
      // attachment ID, so the sge_srcset shortcode cannot be used here.
      if (fmt === 'url') {
        return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <div class="${cls}-wrap">
${pad}    <img class="${cls}" src="<?php echo esc_url( $${field.name} ); ?>" alt="" loading="lazy" />
${pad}  </div>
${pad}<?php endif; ?>`
      }

      // return_format: 'id' (default) — try the agency [sge_srcset] shortcode
      // first, fall back to wp_get_attachment_image() when it's not registered.
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <div class="${cls}-wrap">
${pad}    <?php if ( shortcode_exists( 'sge_srcset' ) ) : ?>
${pad}      <?php echo do_shortcode( '[sge_srcset id="' . absint( $${field.name} ) . '" size="${sz}" class="${cls}"]' ); ?>
${pad}    <?php else : ?>
${pad}      <?php echo wp_get_attachment_image( $${field.name}, '${sz}', false, [
${pad}        'class'   => '${cls}',
${pad}        'loading' => 'lazy',
${pad}      ] ); ?>
${pad}    <?php endif; ?>
${pad}  </div>
${pad}<?php endif; ?>`
    }
    case 'gallery':
      return `${pad}<?php if ( $${field.name} && is_array( $${field.name} ) ) : ?>
${pad}  <div class="${cls}">
${pad}    <?php foreach ( $${field.name} as $g_img ) : ?>
${pad}      <?php if ( shortcode_exists( 'sge_srcset' ) ) : ?>
${pad}        <?php echo do_shortcode( '[sge_srcset id="' . absint( $g_img['ID'] ) . '" size="large" class="${cls}__item"]' ); ?>
${pad}      <?php else : ?>
${pad}        <?php echo wp_get_attachment_image( $g_img['ID'], 'large', false, [
${pad}          'class'   => '${cls}__item',
${pad}          'loading' => 'lazy',
${pad}        ] ); ?>
${pad}      <?php endif; ?>
${pad}    <?php endforeach; ?>
${pad}  </div>
${pad}<?php endif; ?>`
    case 'file':
      return `${pad}<?php if ( $${field.name} && ! empty( $${field.name}['url'] ) ) : ?>
${pad}  <a class="${cls}" href="<?php echo esc_url( $${field.name}['url'] ); ?>" download>
${pad}    <?php echo esc_html( $${field.name}['title'] ?: 'Download' ); ?>
${pad}  </a>
${pad}<?php endif; ?>`
    case 'link':
      return `${pad}<?php if ( $${field.name} && ! empty( $${field.name}['url'] ) ) : ?>
${pad}  <a class="${cls}"
${pad}     href="<?php echo esc_url( $${field.name}['url'] ); ?>"
${pad}     <?php echo ! empty( $${field.name}['target'] ) ? 'target="' . esc_attr( $${field.name}['target'] ) . '"' : ''; ?>>
${pad}    <?php echo esc_html( $${field.name}['title'] ); ?>
${pad}  </a>
${pad}<?php endif; ?>`
    case 'select':
    case 'button_group':
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <span class="${cls} ${cls}--<?php echo esc_attr( $${field.name} ); ?>"><?php echo esc_html( $${field.name} ); ?></span>
${pad}<?php endif; ?>`
    case 'true_false':
      return `${pad}<?php if ( $${field.name} ) : ?>
${pad}  <!-- ${field.name} is enabled -->
${pad}<?php endif; ?>`
    case 'color_picker':
      // Usually consumed inline as style — render comment placeholder
      return `${pad}<?php // $${field.name} available as a color value (e.g. inline style attr) ?>`
    case 'repeater': {
      const rowsName = field.name
      const subOutput = (field.subFields || [])
        .map((sf) => {
          // sub-field rendering uses get_sub_field — adjust by replacing variable patterns.
          // Sub-fields are inside repeater rows, so the hero <picture> pattern doesn't apply.
          const subRendered = renderFieldOutput(sf, slug, level + 2, opts)
          // Replace `$sub.name` with `get_sub_field('sub.name')` references
          return subRendered.replace(
            new RegExp(`\\$${sf.name}\\b`, 'g'),
            `get_sub_field( '${sf.name}' )`,
          )
        })
        .join('\n')
      return `${pad}<?php if ( have_rows( '${rowsName}' ) ) : ?>
${pad}  <div class="${cls}">
${pad}    <?php while ( have_rows( '${rowsName}' ) ) : the_row(); ?>
${pad}      <div class="${cls}__item">
${subOutput}
${pad}      </div>
${pad}    <?php endwhile; ?>
${pad}  </div>
${pad}<?php endif; ?>`
    }
    case 'post_object':
    case 'relationship':
      return `${pad}<?php // $${field.name} — render markup based on returned post object(s) ?>`
    default:
      return `${pad}<?php // ${field.name} ?>`
  }
}

// Build the get_field() block for a field. When `globalToggle` is true, the
// fetch is wrapped in a ternary that reads from the options page when the
// `use_global_settings` toggle is on. When `isHero` is true and the field
// is an image with featured-fallback, two separate IDs are exposed
// (`$name` for desktop, `$name_mobile` for the <picture>'s mobile source).
function fieldFetchLine(field, globalToggle = false, isHero = false) {
  // Hero + featured-fallback only — inner blocks NEVER use the featured image
  // (per agency convention). Inner-block image fields fall through to a plain
  // get_field() fetch even when useFeatured is set in the schema.
  if (isHero && field.type === 'image' && field.useFeatured) {
    const fieldRead = globalToggle
      ? `$use_global_settings ? get_field( '${field.name}', 'option' ) : get_field( '${field.name}' )`
      : `get_field( '${field.name}' )`
    const featuredRead = globalToggle
      ? `$use_global_settings ? 0 : get_post_thumbnail_id()`
      : `get_post_thumbnail_id()`
    return `// Hero image — desktop uses field value (falls back to featured), mobile uses featured image
$${field.name}_field    = ${fieldRead};
$${field.name}_featured = ${featuredRead};
$${field.name}          = $${field.name}_field ? $${field.name}_field : $${field.name}_featured;
$${field.name}_mobile   = $${field.name}_featured ? $${field.name}_featured : $${field.name}_field;`
  }
  if (globalToggle) {
    return `$${field.name} = $use_global_settings ? get_field( '${field.name}', 'option' ) : get_field( '${field.name}' );`
  }
  return `$${field.name} = get_field( '${field.name}' );`
}

export function generateRenderPhp(schema) {
  const { slug, title, fields, options, headingTag, namespace, purpose } = schema
  const isHero = purpose === 'hero'

  // Build $heading_tag setup — supports the "possible hero" toggle
  const headingTagSetup = options.possibleHero
    ? `// ── Heading tag — h1 when this block acts as the page hero, else h2 ──
$use_h1       = (bool) get_field( 'use_h1_heading' );
$heading_tag  = $use_h1 ? 'h1' : 'h2';`
    : `// ── Heading tag: 'h1' for header blocks, 'h2' for section blocks ──
$heading_tag = '${headingTag}';`

  // Field fetch block (excludes section_id since it's special-cased)
  const useGlobals = !!options.hasGlobalSettings
  const fieldFetches = fields
    .map((f) => fieldFetchLine(f, useGlobals, isHero))
    .join('\n')

  const globalToggleSetup = useGlobals
    ? `// ── Global settings master toggle — when ON every field below reads from the options page ──
$use_global_settings = (bool) get_field( 'use_global_settings' );`
    : ''

  // BG color fetch
  const bgColorFetch = options.hasBgColor
    ? `$bg_color = get_field( 'bg_color' );`
    : ''

  // The FIRST field whose name contains "title" is treated as the block's
  // main title and rendered inside a heading tag. Tag is determined by
  // $heading_tag at runtime: h1 for hero blocks, h2 for inner blocks, or
  // toggleable via the "Possible Hero Section" true_false field. Limited
  // to text/textarea field types — wysiwyg / image / link don't make sense
  // wrapped in <h1>.
  const headingField = fields.find(
    (f) =>
      typeof f.name === 'string' &&
      f.name.toLowerCase().includes('title') &&
      (f.type === 'text' || f.type === 'textarea'),
  )

  // All fields render inside .{slug}__inner, in source order. Each field has
  // its own empty-check, so empty fields produce no markup. The inner wrapper
  // is always rendered (per agency layout contract: section always has __inner
  // with width 100%, flex column, gap 60px).
  // Template-level render extras (e.g. CTA chevrons) — prepended inside .__inner
  const template = getTemplate(schema.template)
  const extraRender = template?.extraRender ? template.extraRender(schema) : ''

  // Fields with `_skipRender: true` are still registered/fetched but not
  // auto-rendered — used when a template's extraRender owns the markup.
  const innerBlock = fields
    .filter((f) => !f._skipRender)
    .map((f) => {
      if (f === headingField) {
        const cls = `${slug}__heading`
        return `    <?php if ( $${f.name} ) : ?>
      <<?php echo $heading_tag; ?> class="${cls}">
        <?php echo esc_html( $${f.name} ); ?>
      </<?php echo $heading_tag; ?>>
    <?php endif; ?>`
      }
      return renderFieldOutput(f, slug, 2, { isHero })
    })
    .join('\n\n')

  const styleAttr = options.hasBgColor
    ? `<?php echo $bg_color ? 'style="background-color: ' . esc_attr( $bg_color ) . ';"' : ''; ?>`
    : ''

  const php = `<?php
/**
 * Block: ${title}
 * Slug: ${namespace}/${slug}
 *
 * @param array  $block      Block settings and attributes.
 * @param string $content    InnerBlocks HTML (when jsx support is enabled).
 * @param bool   $is_preview True when rendered inside the block editor.
 * @param int    $post_id    Post ID the block is attached to.
 */

${headingTagSetup}

// ── Section ID — use ACF value, fall back to uniqid() ──────────────────────
$section_id = get_field( 'section_id' );
$block_id   = ! empty( $section_id ) ? $section_id : uniqid( 'section-' );

// BEM root + optional extra classes
$classes = [ '${slug}' ];
if ( ! empty( $block['className'] ) ) {
    $classes[] = $block['className'];
}
if ( ! empty( $block['align'] ) ) {
    $classes[] = 'align' . $block['align'];
}

${globalToggleSetup ? globalToggleSetup + '\n\n' : ''}// ── ACF Pro fields — fetch all upfront ──────────────────────────────────────
${fieldFetches}
${bgColorFetch ? '\n' + bgColorFetch + '\n' : ''}?>

<section id="<?php echo esc_attr( $block_id ); ?>"
         class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"
         ${styleAttr}>
  <div class="${slug}__inner">
${extraRender ? '\n' + extraRender + '\n' : ''}
${innerBlock}

  </div>
</section>
`

  return php
}
