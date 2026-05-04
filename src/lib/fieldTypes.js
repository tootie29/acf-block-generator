// Catalog of ACF Pro field types this generator supports.
// Mirrors the "ACF Pro Field Type Quick Reference" table in the skill.

export const FIELD_TYPES = [
  { type: 'text', label: 'Text (single line)', group: 'Basic' },
  { type: 'textarea', label: 'Textarea', group: 'Basic' },
  { type: 'wysiwyg', label: 'WYSIWYG (rich text)', group: 'Basic' },
  { type: 'number', label: 'Number', group: 'Basic' },
  { type: 'url', label: 'URL', group: 'Basic' },
  { type: 'email', label: 'Email', group: 'Basic' },

  { type: 'image', label: 'Image', group: 'Media' },
  { type: 'gallery', label: 'Gallery (Pro)', group: 'Media' },
  { type: 'file', label: 'File', group: 'Media' },

  { type: 'link', label: 'Link', group: 'Choice' },
  { type: 'select', label: 'Select dropdown', group: 'Choice' },
  { type: 'button_group', label: 'Button group (Pro)', group: 'Choice' },
  { type: 'true_false', label: 'True / False toggle', group: 'Choice' },
  { type: 'color_picker', label: 'Color picker', group: 'Choice' },

  { type: 'repeater', label: 'Repeater (Pro)', group: 'Layout' },

  { type: 'post_object', label: 'Post object', group: 'Relational' },
  { type: 'relationship', label: 'Relationship (Pro)', group: 'Relational' },
]

// Default config when a new field of a given type is added to the schema
export function defaultFieldConfig(type) {
  const base = {
    type,
    label: '',
    name: '',
    required: false,
    width: 100, // wrapper width %
    instructions: '',
  }

  switch (type) {
    case 'text':
      return { ...base, placeholder: '' }
    case 'textarea':
      return { ...base, rows: 3, placeholder: '' }
    case 'wysiwyg':
      return { ...base, tabs: 'visual', toolbar: 'full' }
    case 'number':
      return { ...base, min: '', max: '', step: '' }
    case 'image':
      return {
        ...base,
        return_format: 'id', // ALWAYS id per skill
        preview_size: 'medium',
        library: 'all',
        useFeatured: false, // agency standard: auto-fallback to featured image
        imageSize: 'full', // size used in wp_get_attachment_image()
      }
    case 'gallery':
      return { ...base, return_format: 'array', preview_size: 'medium' }
    case 'file':
      return { ...base, return_format: 'array' }
    case 'link':
      return { ...base, return_format: 'array' }
    case 'select':
      return { ...base, choices: 'option_one : Option One\noption_two : Option Two', allow_null: true, multiple: false }
    case 'button_group':
      return { ...base, choices: 'option_one : Option One\noption_two : Option Two', allow_null: true }
    case 'true_false':
      return {
        ...base,
        ui: 1,
        default_value: 0,
        message: '',
        ui_on_text: '',
        ui_off_text: '',
      }
    case 'color_picker':
      return { ...base, default_value: '' }
    case 'repeater':
      return { ...base, button_label: 'Add Row', subFields: [], collapsed: '', min: 0, max: 0 }
    case 'post_object':
      return { ...base, return_format: 'object', post_type: 'post', multiple: false }
    case 'relationship':
      return { ...base, return_format: 'object', post_type: 'post' }
    case 'url':
    case 'email':
      return { ...base, placeholder: '' }
    default:
      return base
  }
}
