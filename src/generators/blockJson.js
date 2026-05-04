// Generate block.json content matching the SGE convention
export function generateBlockJson(schema) {
  const {
    namespace,
    slug,
    title,
    description,
    icon,
    keywords,
    libraries,
    options,
  } = schema

  const json = {
    name: `${namespace}/${slug}`,
    title,
    description: description || `${title} Block`,
    icon: icon || 'admin-comments',
    keywords: keywords && keywords.length ? keywords : [slug],
    category: 'sge_blocks',
    acf: {
      mode: 'edit',
      renderTemplate: 'template.php',
    },
    style: ['file:./stylesheet.css'],
    supports: {
      anchor: false,
      align: false,
    },
  }

  // Add viewScript if any library is enabled or custom JS toggled on
  const needsJs =
    options.hasCustomJs ||
    libraries.tabs ||
    libraries.slider ||
    libraries.accordion

  if (needsJs) {
    json.viewScript = 'file:./block.js'
  }

  return JSON.stringify(json, null, 2) + '\n'
}
