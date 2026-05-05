export default function TemplatePreview({ template }) {
  if (!template || !template.preview) return null

  const { desktop, mobile, caption } = template.preview
  const fields = template.fields()

  return (
    <div className="template-preview">
      <div className="template-preview__thumbs">
        {desktop && (
          <figure className="template-preview__thumb template-preview__thumb--desktop">
            <img src={desktop} alt={`${template.label} — desktop preview`} />
            <figcaption>Desktop</figcaption>
          </figure>
        )}
        {mobile && (
          <figure className="template-preview__thumb template-preview__thumb--mobile">
            <img src={mobile} alt={`${template.label} — mobile preview`} />
            <figcaption>Mobile</figcaption>
          </figure>
        )}
      </div>

      {caption && <p className="template-preview__caption">{caption}</p>}

      {fields.length > 0 && (
        <div className="template-preview__fields">
          <span className="template-preview__fields-label">
            Pre-filled fields ({fields.length})
          </span>
          <ul>
            {fields.map((f) => (
              <li key={f._uid}>
                <code>{f.name}</code>
                <span className="template-preview__field-type">{f.type}</span>
                {f.label && <span className="template-preview__field-label">{f.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
