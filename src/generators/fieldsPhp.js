import { fieldKey, groupKey } from '../lib/utils.js'
import { generateGlobalFieldsSnippet } from './globalFieldsPhp.js'

// Indent a multiline string by N spaces
function indent(str, n = 4) {
  const pad = ' '.repeat(n)
  return str
    .split('\n')
    .map((l) => (l.length ? pad + l : l))
    .join('\n')
}

// PHP single-quote escape
function ph(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// Render conditional_logic block tied to override toggle (for global settings)
function overrideConditionalLogic(overrideKey) {
  return `'conditional_logic' => [
    [
        [
            'field'    => '${overrideKey}',
            'operator' => '==',
            'value'    => '1',
        ],
    ],
],`
}

// Parse "value : Label" multiline into associative PHP array string
function parseChoices(raw) {
  const lines = (raw || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return "[]"

  const entries = lines.map((line) => {
    const [val, ...labelParts] = line.split(':')
    const value = (val || '').trim()
    const label = labelParts.join(':').trim() || value
    return `'${ph(value)}' => '${ph(label)}'`
  })
  return `[\n    ${entries.join(',\n    ')},\n]`
}

// Render a single field's PHP array (recursive for repeater sub_fields)
function renderField(field, opts = {}) {
  const { conditional, depth = 0 } = opts
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

  // Type-specific keys
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
      lines.push(`    'return_format' => 'id',`) // ALWAYS id per skill
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
      // sub_fields
      if (field.subFields && field.subFields.length) {
        const subs = field.subFields
          .map((sf) => indent(renderField(sf, { depth: depth + 1 }), 8))
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

  if (conditional) {
    lines.push(indent(conditional, 4))
  }

  lines.push(`]`)
  return lines.join('\n')
}

// Assign hex keys to all fields recursively (mutates)
function assignKeys(fields) {
  fields.forEach((f) => {
    f._key = fieldKey()
    if (f.type === 'repeater' && f.subFields) {
      assignKeys(f.subFields)
    }
  })
}

export function generateFieldsPhp(schema) {
  const { namespace, slug, title, fields, options, headingTag } = schema

  // Clone fields so we can attach _key without mutating React state
  const localFields = JSON.parse(JSON.stringify(fields))
  assignKeys(localFields)

  const groupKeyVal = groupKey()
  const sectionIdKey = fieldKey()
  const overrideKey = fieldKey()
  const bgColorKey = fieldKey()

  // Determine which standard fields to prepend
  const standardFields = []

  // section_id is ALWAYS first
  standardFields.push({
    _key: sectionIdKey,
    label: 'Section ID',
    name: 'section_id',
    type: 'text',
    instructions: 'Optional. Used as the HTML id attribute of this section (e.g. "about-us"). If left empty, a unique ID is generated automatically.',
    required: false,
    placeholder: 'e.g. about-us',
    width: 50,
  })

  // Optional: BG color
  if (options.hasBgColor) {
    standardFields.push({
      _key: bgColorKey,
      label: 'Background Color',
      name: 'bg_color',
      type: 'color_picker',
      instructions: 'Optional background color for this section.',
      required: false,
      width: 50,
    })
  }

  // Optional: heading-as-h1 toggle (Possible Hero Section feature)
  let headingTagFieldKey = null
  if (options.possibleHero) {
    headingTagFieldKey = fieldKey()
    standardFields.push({
      _key: headingTagFieldKey,
      label: 'Use H1 for heading',
      name: 'use_h1_heading',
      type: 'true_false',
      instructions: 'Enable when this block is the page hero — the main heading will render as H1 instead of H2. Only one H1 should exist per page.',
      required: false,
      ui: 1,
      default_value: 0,
      width: 50,
    })
  }

  // Optional: master "use global settings" override toggle
  let useGlobalFieldKey = null
  if (options.hasGlobalSettings) {
    useGlobalFieldKey = fieldKey()
    standardFields.push({
      _key: useGlobalFieldKey,
      label: 'Use global settings',
      name: 'use_global_settings',
      type: 'true_false',
      instructions: 'When ON, every field below is read from the site-wide global options page instead of this block. Turn OFF to override values just for this page.',
      required: false,
      ui: 1,
      default_value: 1,
      width: 100,
    })
  }

  // Build the rendered fields list (standards first, then user fields)
  const allFields = [...standardFields, ...localFields]
  const renderedFields = allFields
    .map((f) => indent(renderField(f), 8))
    .join(',\n')

  const headerComment = `/**
 * ACF Pro field group for: ${title}
 * Block: ${namespace}/${slug}
 *
 * Generated by acf-block-generator. All keys are unique 16-char hex strings.
 */`

  const php = `<?php
${headerComment}

if ( ! function_exists( 'acf_add_local_field_group' ) ) {
    return;
}

acf_add_local_field_group( [
    'key'   => '${groupKeyVal}',
    'title' => '${ph(title)} Fields',

    'fields' => [
${renderedFields},
    ],

    'location' => [
        [
            [
                'param'    => 'block',
                'operator' => '==',
                'value'    => '${namespace}/${slug}',
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
${options.hasGlobalSettings ? generateGlobalFieldsSnippet(schema) : ''}`

  return {
    code: php,
    keys: { groupKeyVal, sectionIdKey, headingTagFieldKey },
    fieldsWithKeys: allFields,
  }
}
