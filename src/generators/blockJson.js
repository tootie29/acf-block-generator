// Generate block.json content matching the skill convention
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

  const supports = {
    anchor: true,
    align: ['wide', 'full'],
    html: false,
  }

  const json = {
    $schema: 'https://schemas.wp.org/trunk/block.json',
    apiVersion: 3,
    name: `${namespace}/${slug}`,
    title,
    description: description || `${title} block`,
    category: 'theme',
    icon: icon || 'layout',
    keywords: keywords && keywords.length ? keywords : [slug],
    acf: {
      mode: 'edit',
      renderTemplate: `gutenberg-blocks/${slug}/render.php`,
    },
    supports,
    style: 'file:./block.css',
    editorStyle: 'file:./block.css',
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
