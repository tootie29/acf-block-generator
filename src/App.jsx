import { useMemo, useState, useEffect } from 'react'
import FieldList from './components/FieldList.jsx'
import CodePreview from './components/CodePreview.jsx'
import TemplatePreview from './components/TemplatePreview.jsx'
import Sidebar from './components/Sidebar.jsx'
import TemplatesGallery from './components/TemplatesGallery.jsx'
import { toSlug, detectLibraries } from './lib/utils.js'
import { TEMPLATES, getTemplate } from './lib/templates.js'
import { buildZip, triggerDownload } from './generators/index.js'

const DEFAULT_SCHEMA = {
  namespace: 'sge',
  blockName: 'Hero Banner',
  description: '',
  icon: 'layout',
  keywords: '',
  purpose: 'hero', // 'hero' | 'inner'
  template: 'blank',
  headingTag: 'h2', // 'h1' | 'h2'
  options: {
    hasBgColor: true,    // always true (locked) — bg_color field is on every section
    hasSectionId: true,  // always true (locked) — section_id field is on every section
    hasCustomJs: false,
    possibleHero: false,
    hasGlobalSettings: false,
  },
  fields: [],
}

export default function App() {
  const [view, setView] = useState('generator') // 'generator' | 'templates'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // default small
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)

  // Derived: slug + library detection
  const slug = toSlug(schema.blockName)
  const libraries = detectLibraries(schema.blockName)

  // Default heading tag based on purpose: hero -> h1
  useEffect(() => {
    setSchema((s) => ({
      ...s,
      headingTag: s.purpose === 'hero' ? 'h1' : 'h2',
    }))
  }, [schema.purpose])

  const fullSchema = useMemo(
    () => ({
      ...schema,
      slug,
      title: schema.blockName,
      keywords: schema.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      libraries,
    }),
    [schema, slug, libraries],
  )

  const updateOption = (key, val) => {
    setSchema({ ...schema, options: { ...schema.options, [key]: val } })
  }

  const selectedTemplate = getTemplate(schema.template)

  const handleTemplateChange = (nextId) => {
    if (nextId === schema.template) return
    const template = getTemplate(nextId)
    const presetFields = template.fields()

    // Templates can lock specific options ON (e.g. doctor_profile forces
    // hasGlobalSettings). Merge those into the existing options so the
    // matching toggle becomes both checked and disabled in step 4.
    const mergedOptions = { ...schema.options, ...(template.forceOptions || {}) }

    if (presetFields.length === 0) {
      setSchema({ ...schema, template: nextId, options: mergedOptions })
      return
    }

    if (
      schema.fields.length > 0 &&
      !confirm(
        `Switching to "${template.label}" will replace your current ${schema.fields.length} field(s) with the template's pre-filled fields. Continue?`,
      )
    ) {
      return
    }

    setSchema({
      ...schema,
      template: nextId,
      fields: presetFields,
      options: mergedOptions,
    })
  }

  const handleDownload = async () => {
    if (!slug) {
      alert('Block name is required.')
      return
    }
    const blob = await buildZip(fullSchema)
    triggerDownload(blob, `${slug}.zip`)
  }

  const handleReset = () => {
    if (confirm('Reset the entire form? This will clear all fields.')) {
      setSchema(DEFAULT_SCHEMA)
    }
  }

  const detectedLibs = Object.entries(libraries)
    .filter(([, on]) => on)
    .map(([name]) => name)

  const handleUseTemplateFromGallery = (templateId) => {
    handleTemplateChange(templateId)
    setView('generator')
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        view={view}
        onChange={setView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {view === 'templates' ? (
        <main className="app-main app-main--gallery">
          <TemplatesGallery onUseTemplate={handleUseTemplateFromGallery} />
        </main>
      ) : (
        <main className="app-main app-main--generator">
          <div className="app">
            {/* ───────── LEFT: Configuration panel ───────── */}
            <div className="panel">
        <h1>
          ACF Block Generator <span className="badge">RichardMedina</span>
        </h1>
        <p className="subtitle">
          Configure → Export → Reset. Generates a Gutenberg+ACF Pro block ZIP that drops into{' '}
          <code>{`{theme}/gutenberg-blocks/`}</code>
        </p>

        {/* ── Step 1: Block name ── */}
        <div className="section">
          <h3 className="section-title">1 · Block name & namespace</h3>
          <div className="field-row">
            <div>
              <label>Block name</label>
              <input
                type="text"
                value={schema.blockName}
                onChange={(e) => setSchema({ ...schema, blockName: e.target.value })}
                placeholder="e.g. Hero Banner"
              />
              <p className="hint">
                Slug: <code>{slug || '—'}</code>
                {detectedLibs.length > 0 && (
                  <>
                    {' · Auto-detected: '}
                    {detectedLibs.map((l) => (
                      <span key={l} className="lib-tag">
                        {l}
                      </span>
                    ))}
                  </>
                )}
              </p>
            </div>
            <div>
              <label>Namespace</label>
              <input
                type="text"
                value={schema.namespace}
                onChange={(e) => setSchema({ ...schema, namespace: e.target.value })}
              />
              <p className="hint">
                Becomes <code>{schema.namespace}/{slug || 'slug'}</code>
              </p>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label>Description (optional)</label>
              <input
                type="text"
                value={schema.description}
                onChange={(e) => setSchema({ ...schema, description: e.target.value })}
                placeholder="Short description shown in inserter"
              />
            </div>
            <div>
              <label>Keywords (comma-separated)</label>
              <input
                type="text"
                value={schema.keywords}
                onChange={(e) => setSchema({ ...schema, keywords: e.target.value })}
                placeholder="hero, banner"
              />
            </div>
          </div>
        </div>

        {/* ── Step 2: Purpose ── */}
        <div className="section">
          <h3 className="section-title">2 · Purpose</h3>
          <div>
            <label>Block role</label>
            <select
              value={schema.purpose}
              onChange={(e) => setSchema({ ...schema, purpose: e.target.value })}
            >
              <option value="hero">Hero section (page header — H1)</option>
              <option value="inner">Inner section (regular content — H2)</option>
            </select>
            <p className="hint">
              Heading tag is auto-set from this role (Hero → H1, Inner → H2).
            </p>
          </div>
        </div>

        {/* ── Step 3: Template ── */}
        <div className="section">
          <h3 className="section-title">3 · Template</h3>
          <div>
            <label>Block template</label>
            <select
              value={schema.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {selectedTemplate?.description && (
              <p className="hint">{selectedTemplate.description}</p>
            )}
          </div>
          <TemplatePreview template={selectedTemplate} />
        </div>

        {/* ── Step 4: Standards toggles ── */}
        <div className="section">
          <h3 className="section-title">4 · Agency standards</h3>
          <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
            Always-on: <code>section_id</code> field, <code>bg_color</code> field
            (color picker rendered as inline <code>style</code> on the section), BEM root
            <code> .{slug || 'slug'}</code>, global CSS vars
            (<code>--primary-color</code>, <code>--heading-font</code>, etc),
            globally-unique ACF keys, every field wrapped in empty-check.
          </p>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={schema.options.possibleHero}
              onChange={(e) => updateOption('possibleHero', e.target.checked)}
            />
            <div className="label-text">
              "Possible hero section" — toggle H1/H2
              <span className="desc">
                Adds a true_false field; when ON, heading renders as H1, otherwise H2.
              </span>
            </div>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={schema.options.hasCustomJs}
              onChange={(e) => updateOption('hasCustomJs', e.target.checked)}
            />
            <div className="label-text">
              Has custom JS
              <span className="desc">
                Generates a <code>block.js</code> stub and adds <code>viewScript</code> to
                block.json.
              </span>
            </div>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={schema.options.hasGlobalSettings}
              onChange={(e) => updateOption('hasGlobalSettings', e.target.checked)}
              disabled={!!selectedTemplate?.forceOptions?.hasGlobalSettings}
            />
            <div className="label-text">
              Add Global Settings (options page)
              {selectedTemplate?.forceOptions?.hasGlobalSettings && (
                <span className="lib-tag" style={{ marginLeft: 8 }}>
                  required by {selectedTemplate.label}
                </span>
              )}
              <span className="desc">
                Generates <code>global-fields.php</code> mirroring all custom fields on an ACF options page.
                Adds a <code>use_global_settings</code> toggle to the block — when ON, every field reads from the options page instead of the block.
                Excludes per-page fields (<code>section_id</code>, <code>bg_color</code>, hero toggle).
              </span>
            </div>
          </label>
        </div>

        {/* ── Step 5: Fields ── */}
        <div className="section">
          <h3 className="section-title">5 · Custom fields</h3>
          <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
            Drag <span className="kbd">⠿</span> to reorder. Sub-fields for repeaters can be added
            after picking the type. Image fields support featured-image fallback.
          </p>
          <FieldList
            fields={schema.fields}
            onChange={(fields) => setSchema({ ...schema, fields })}
            purpose={schema.purpose}
          />
        </div>

        {/* ── Step 6: Download ── */}
        <div className="section">
          <h3 className="section-title">6 · Download</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary" onClick={handleDownload}>
              ↓ Download {slug || 'block'}.zip
            </button>
            <button className="secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
          <p className="hint">
            ZIP contains <code>gutenberg-blocks/{slug || 'slug'}/</code> with all files. Drop into
            your theme.
          </p>
        </div>
      </div>

      {/* ───────── RIGHT: Live preview ───────── */}
            <div className="panel">
              <h1>Live Preview</h1>
              <p className="subtitle">Generated files update as you edit. Click a tab to inspect.</p>
              <CodePreview schema={fullSchema} />
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
