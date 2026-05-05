import { useState } from 'react'
import { TEMPLATES } from '../lib/templates.js'
import { buildZip, triggerDownload } from '../generators/index.js'

const NAMESPACE_DEFAULT = 'sge'

function templateToSchema(template) {
  const slug = template.suggestedSlug || template.id.replace(/_/g, '-')
  return {
    namespace: NAMESPACE_DEFAULT,
    blockName: template.label.replace(/—.*/, '').trim() || template.label,
    title: template.label,
    slug,
    description: template.description || '',
    icon: 'layout',
    keywords: [],
    purpose: 'inner',
    template: template.id,
    headingTag: template.suggestedHeadingTag || 'h2',
    options: {
      hasBgColor: true,
      hasSectionId: true,
      hasCustomJs: false,
      possibleHero: false,
      hasGlobalSettings: false,
    },
    libraries: { tabs: false, slider: false, accordion: false },
    fields: template.fields(),
  }
}

export default function TemplatesGallery({ onUseTemplate }) {
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownload = async (template) => {
    try {
      setDownloadingId(template.id)
      const schema = templateToSchema(template)
      const blob = await buildZip(schema)
      triggerDownload(blob, `${schema.slug}.zip`)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="gallery">
      <header className="gallery__header">
        <h1>Templates</h1>
        <p className="subtitle">
          Pick a ready-made block, download the ZIP, and drop it into your theme. Or open it in
          the Generator to tweak the field set first.
        </p>
      </header>

      <div className="gallery__grid">
        {TEMPLATES.map((template) => {
          const fieldCount = template.fields().length
          const slug = template.suggestedSlug || template.id.replace(/_/g, '-')
          const isDownloading = downloadingId === template.id
          const hasPreview = !!template.preview

          return (
            <article key={template.id} className="gallery-card">
              <div className="gallery-card__previews">
                {hasPreview ? (
                  <>
                    {template.preview.desktop && (
                      <figure className="gallery-card__preview gallery-card__preview--desktop">
                        <img
                          src={template.preview.desktop}
                          alt={`${template.label} — desktop preview`}
                          loading="lazy"
                        />
                        <figcaption>Desktop</figcaption>
                      </figure>
                    )}
                    {template.preview.mobile && (
                      <figure className="gallery-card__preview gallery-card__preview--mobile">
                        <img
                          src={template.preview.mobile}
                          alt={`${template.label} — mobile preview`}
                          loading="lazy"
                        />
                        <figcaption>Mobile</figcaption>
                      </figure>
                    )}
                  </>
                ) : (
                  <div className="gallery-card__no-preview">No preview</div>
                )}
              </div>

              <div className="gallery-card__body">
                <h3 className="gallery-card__title">{template.label}</h3>
                {template.description && (
                  <p className="gallery-card__description">{template.description}</p>
                )}

                <dl className="gallery-card__meta">
                  <div>
                    <dt>Slug</dt>
                    <dd><code>{slug}</code></dd>
                  </div>
                  <div>
                    <dt>Fields</dt>
                    <dd>{fieldCount}</dd>
                  </div>
                  <div>
                    <dt>Default heading</dt>
                    <dd>{template.suggestedHeadingTag || 'h2'}</dd>
                  </div>
                </dl>

                <div className="gallery-card__actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => handleDownload(template)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Building…' : `↓ Download ${slug}.zip`}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onUseTemplate?.(template.id)}
                  >
                    Open in Generator
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
