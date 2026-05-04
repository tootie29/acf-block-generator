import { fieldKey, groupKey } from '../lib/utils.js'

function indent(str, n = 4) {
  const pad = ' '.repeat(n)
  return str
    .split('\n')
    .map((l) => (l.length ? pad + l : l))
    .join('\n')
}

function ph(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function parseChoices(raw) {
  const lines = (raw || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return '[]'
  const entries = lines.map((line) => {
    const [val, ...labelParts] = line.split(':')
    const value = (val || '').trim()
    const label = labelParts.join(':').trim() || value
    return `'${ph(value)}' => '${ph(label)}'`
  })
  return `[\n    ${entries.join(',\n    ')},\n]`
}

function renderField(field, depth = 0) {
  const lines = []
  lines.push(`[`)
  lines.push(`    'key'         => '${field._key}',`)
  lines.push(`    'label'       => '${ph(field.label)}',`)
  lines.push(`    'name'        => '${ph(field.name)}',`)
  lines.push(`    'type'        => '${field.type}',`)

  if (field.instructions) {
    lines.push(`    'instructions'=> '${ph(field.instructions)}',`)
  }
  lines.push(`    'required'    => ${field.required ? 1 : 0},`)

  switch (field.type) {
    case 'text':
    case 'url':
    case 'email':
      if (field.placeholder) lines.push(`    'placeholder' => '${ph(field.placeholder)}',`)
      break
    case 'textarea':
      lines.push(`    'rows'        => ${parseInt(field.rows, 10) || 3},`)
      if (field.placeholder) lines.push(`    'placeholder' => '${ph(field.placeholder)}',`)
      break
    case 'wysiwyg':
      lines.push(`    'tabs'        => '${field.tabs || 'visual'}',`)
      lines.push(`    'toolbar'     => '${field.toolbar || 'full'}',`)
      lines.push(`    'media_upload'=> 0,`)
      break
    case 'number':
      if (field.min !== '' && field.min !== undefined) lines.push(`    'min'         => ${field.min},`)
      if (field.max !== '' && field.max !== undefined) lines.push(`    'max'         => ${field.max},`)
      if (field.step !== '' && field.step !== undefined) lines.push(`    'step'        => ${field.step},`)
      break
    case 'image':
      lines.push(`    'return_format' => 'id',`)
      lines.push(`    'preview_size'  => '${field.preview_size || 'medium'}',`)
      lines.push(`    'library'       => '${field.library || 'all'}',`)
      break
    case 'gallery':
      lines.push(`    'return_format' => 'array',`)
      lines.push(`    'preview_size'  => '${field.preview_size || 'medium'}',`)
      break
    case 'file':
      lines.push(`    'return_format' => 'array',`)
      break
    case 'link':
      lines.push(`    'return_format' => 'array',`)
      break
    case 'select':
      lines.push(`    'choices'     => ${parseChoices(field.choices)},`)
      lines.push(`    'allow_null'  => ${field.allow_null ? 1 : 0},`)
      lines.push(`    'multiple'    => ${field.multiple ? 1 : 0},`)
      lines.push(`    'ui'          => 1,`)
      break
    case 'button_group':
      lines.push(`    'choices'     => ${parseChoices(field.choices)},`)
      lines.push(`    'allow_null'  => ${field.allow_null ? 1 : 0},`)
      lines.push(`    'layout'      => 'horizontal',`)
      break
    case 'true_false':
      lines.push(`    'ui'          => ${field.ui === 0 ? 0 : 1},`)
      lines.push(`    'default_value' => ${field.default_value ? 1 : 0},`)
      if (field.message) lines.push(`    'message'     => '${ph(field.message)}',`)
      if (field.ui_on_text) lines.push(`    'ui_on_text'  => '${ph(field.ui_on_text)}',`)
      if (field.ui_off_text) lines.push(`    'ui_off_text' => '${ph(field.ui_off_text)}',`)
      break
    case 'color_picker':
      if (field.default_value) lines.push(`    'default_value' => '${ph(field.default_value)}',`)
      break
    case 'post_object':
      lines.push(`    'post_type'    => ['${ph(field.post_type || 'post')}'],`)
      lines.push(`    'return_format'=> '${field.return_format || 'object'}',`)
      lines.push(`    'multiple'     => ${field.multiple ? 1 : 0},`)
      lines.push(`    'ui'           => 1,`)
      break
    case 'relationship':
      lines.push(`    'post_type'    => ['${ph(field.post_type || 'post')}'],`)
      lines.push(`    'return_format'=> '${field.return_format || 'object'}',`)
      break
    case 'repeater':
      lines.push(`    'button_label' => '${ph(field.button_label || 'Add Row')}',`)
      if (field.collapsed) lines.push(`    'collapsed'    => '${ph(field.collapsed)}',`)
      lines.push(`    'min'          => ${parseInt(field.min, 10) || 0},`)
      lines.push(`    'max'          => ${parseInt(field.max, 10) || 0},`)
      lines.push(`    'layout'       => 'block',`)
      if (field.subFields && field.subFields.length) {
        const subs = field.subFields
          .map((sf) => indent(renderField(sf, depth + 1), 8))
          .join(',\n')
        lines.push(`    'sub_fields' => [`)
        lines.push(subs)
        lines.push(`    ],`)
      } else {
        lines.push(`    'sub_fields' => [],`)
      }
      break
  }

  lines.push(`    'wrapper'     => [ 'width' => '${field.width || 100}' ],`)
  lines.push(`]`)
  return lines.join('\n')
}

// Recursively assign fresh hex keys to a cloned field tree (so global keys
// don't collide with the block's per-page keys).
function assignKeys(fields) {
  fields.forEach((f) => {
    f._key = fieldKey()
    if (f.type === 'repeater' && f.subFields) {
      assignKeys(f.subFields)
    }
  })
}

// Returns a PHP snippet (no <?php opener) intended to be appended to the
// block's fields.php. This avoids creating a second file — the existing theme
// loader already requires fields.php, so global registration ships in the
// same file and "just works" without any functions.php edits.
export function generateGlobalFieldsSnippet(schema) {
  const { namespace, slug, title, fields } = schema

  const globalFields = JSON.parse(JSON.stringify(fields))
  assignKeys(globalFields)

  const groupKeyVal = groupKey()
  const parentSlug = 'section-global-settings'
  const subPageSlug = `${slug}-globals`

  const renderedFields = globalFields
    .map((f) => indent(renderField(f), 8))
    .join(',\n')

  // Parent "Section Globals" page is registered exactly once across all
  // blocks. The function_exists() guard means whichever block's fields.php
  // loads first defines it; later blocks skip the redefinition.
  return `
/**
 * ─────────────────────────────────────────────────────────────────────────
 * Global Settings for: ${title}
 * Block: ${namespace}/${slug}
 *
 * Adds a sub-page under the shared "Section Globals" parent options page,
 * plus a field group mirroring this block's custom fields. The block opts
 * in via its "use_global_settings" toggle — when ON, render.php reads each
 * value from this options sub-page instead of the per-page field.
 *
 * The parent page is auto-registered the first time ANY block's fields.php
 * runs, so no functions.php edits are required.
 *
 * Generated by acf-block-generator. All keys are unique 16-char hex strings,
 * separate from the block's own field keys.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Parent "Section Globals" page — registered once across all blocks.
if ( ! function_exists( 'sge_register_section_globals_parent' ) ) {
    function sge_register_section_globals_parent() {
        if ( function_exists( 'acf_add_options_page' ) ) {
            acf_add_options_page( [
                'page_title' => 'Section Globals',
                'menu_title' => 'Section Globals',
                'menu_slug'  => 'section-global-settings',
                'capability' => 'edit_posts',
                'redirect'   => true,
            ] );
        }
    }
    sge_register_section_globals_parent();
}

// Sub-page for this block under "Section Globals".
if ( function_exists( 'acf_add_options_sub_page' ) ) {
    acf_add_options_sub_page( [
        'page_title'  => '${ph(title)}',
        'menu_title'  => '${ph(title)}',
        'menu_slug'   => '${subPageSlug}',
        'parent_slug' => '${parentSlug}',
        'capability'  => 'edit_posts',
    ] );
}

// Field group bound to this block's sub-page.
acf_add_local_field_group( [
    'key'   => '${groupKeyVal}',
    'title' => '${ph(title)} Global Settings',

    'fields' => [
${renderedFields}
    ],

    'location' => [
        [
            [
                'param'    => 'options_page',
                'operator' => '==',
                'value'    => '${subPageSlug}',
            ],
        ],
    ],

    'menu_order'            => 0,
    'position'              => 'normal',
    'style'                 => 'default',
    'label_placement'       => 'top',
    'instruction_placement' => 'label',
    'active'                => true,
] );
`
}
