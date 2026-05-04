import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toFieldName, uid } from '../lib/utils.js'
import { FIELD_TYPES, defaultFieldConfig } from '../lib/fieldTypes.js'

// Sub-field types — repeaters cannot nest repeaters in this generator (kept
// flat to match what we render in fields.php / render.php today).
const SUB_FIELD_TYPES = FIELD_TYPES.filter((ft) => ft.type !== 'repeater')

function SubFieldList({ subFields, onChange }) {
  const [pendingType, setPendingType] = useState('text')

  const list = subFields || []

  const addSub = () => {
    const fresh = { _uid: uid(), ...defaultFieldConfig(pendingType) }
    onChange([...list, fresh])
  }

  const updateSub = (uidVal, next) => {
    onChange(list.map((f) => (f._uid === uidVal ? { ...next, _uid: uidVal } : f)))
  }

  const removeSub = (uidVal) => {
    onChange(list.filter((f) => f._uid !== uidVal))
  }

  const moveSub = (uidVal, dir) => {
    const idx = list.findIndex((f) => f._uid === uidVal)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= list.length) return
    const next = list.slice()
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  return (
    <div className="sub-field-list">
      {list.length === 0 ? (
        <div className="empty-state" style={{ padding: 8, fontSize: 12 }}>
          No sub-fields yet. Add the first row column below.
        </div>
      ) : (
        list.map((sf, i) => (
          <div key={sf._uid} className="sub-field-wrap">
            <div className="sub-field-controls">
              <button
                type="button"
                className="secondary"
                disabled={i === 0}
                onClick={() => moveSub(sf._uid, -1)}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="secondary"
                disabled={i === list.length - 1}
                onClick={() => moveSub(sf._uid, 1)}
                title="Move down"
              >
                ↓
              </button>
            </div>
            <FieldCard
              field={sf}
              onChange={(next) => updateSub(sf._uid, next)}
              onRemove={() => removeSub(sf._uid)}
              isSubField={true}
            />
          </div>
        ))
      )}

      <div className="add-field-bar" style={{ marginTop: 8 }}>
        <select value={pendingType} onChange={(e) => setPendingType(e.target.value)}>
          {SUB_FIELD_TYPES.map((ft) => (
            <option key={ft.type} value={ft.type}>
              {ft.label}
            </option>
          ))}
        </select>
        <button type="button" className="primary" onClick={addSub}>
          + Add sub-field
        </button>
      </div>
    </div>
  )
}

export default function FieldCard({ field, onChange, onRemove, isSubField = false, purpose = 'inner' }) {
  const isHero = purpose === 'hero'
  // Sub-fields don't participate in DnD — sortable is only used at the top
  // level. Calling useSortable here is safe because dnd-kit returns null-ish
  // values when no SortableContext is found in the tree, but we just skip
  // the drag handle UI when isSubField is true.
  const sortable = useSortable({ id: field._uid })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  const style = isSubField
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      }

  const update = (patch) => onChange({ ...field, ...patch })

  const handleLabelChange = (e) => {
    const label = e.target.value
    // Auto-generate name from label only if name field hasn't been customized
    const auto = toFieldName(field.label || '')
    const isAuto = !field.name || field.name === auto
    update({
      label,
      name: isAuto ? toFieldName(label) : field.name,
    })
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    const fresh = defaultFieldConfig(newType)
    // Preserve label/name across type change
    update({ ...fresh, label: field.label, name: field.name })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="field-card-header">
        {!isSubField && (
          <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
            ⠿
          </span>
        )}
        <input
          className="label-input"
          type="text"
          value={field.label}
          onChange={handleLabelChange}
          placeholder={isSubField ? 'Sub-field label' : 'Field label'}
        />
        <span className="type-pill">{field.type.replace('_', ' ')}</span>
        <button className="danger" onClick={onRemove} title="Remove field">
          Remove
        </button>
      </div>

      <div className="field-card-body">
        <div>
          <label>Field name (key)</label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => update({ name: toFieldName(e.target.value) })}
            placeholder="auto-generated"
          />
        </div>
        <div>
          <label>Type</label>
          <select value={field.type} onChange={handleTypeChange}>
            {FIELD_TYPES.map((ft) => (
              <option key={ft.type} value={ft.type}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Width %</label>
          <select
            value={field.width || 100}
            onChange={(e) => update({ width: parseInt(e.target.value, 10) })}
          >
            <option value={25}>25%</option>
            <option value={33}>33%</option>
            <option value={50}>50%</option>
            <option value={66}>66%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
          </select>
        </div>
        <div>
          <label>Required</label>
          <label className="checkbox-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
            <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
              Required field
            </span>
          </label>
        </div>

        <div className="full">
          <label>Instructions (optional)</label>
          <input
            type="text"
            value={field.instructions || ''}
            onChange={(e) => update({ instructions: e.target.value })}
            placeholder="Helper text shown to editors"
          />
        </div>

        {/* Type-specific options */}
        {(field.type === 'text' || field.type === 'url' || field.type === 'email') && (
          <div className="full">
            <label>Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </div>
        )}

        {field.type === 'textarea' && (
          <>
            <div>
              <label>Rows</label>
              <input
                type="number"
                value={field.rows || 3}
                onChange={(e) => update({ rows: parseInt(e.target.value, 10) || 3 })}
              />
            </div>
            <div>
              <label>Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => update({ placeholder: e.target.value })}
              />
            </div>
          </>
        )}

        {field.type === 'image' && (
          <>
            <div>
              <label>Image size</label>
              <select
                value={field.imageSize || 'full'}
                onChange={(e) => update({ imageSize: e.target.value })}
              >
                <option value="thumbnail">thumbnail</option>
                <option value="medium">medium</option>
                <option value="medium_large">medium_large</option>
                <option value="large">large</option>
                <option value="full">full</option>
              </select>
              <p className="hint">Used by wp_get_attachment_image()</p>
            </div>
            {isHero && !isSubField && (
              <>
                <div>
                  <label>Featured-image fallback</label>
                  <label className="checkbox-row" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={!!field.useFeatured}
                      onChange={(e) => update({ useFeatured: e.target.checked })}
                    />
                    <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                      Use featured image on mobile
                    </span>
                  </label>
                  <p className="hint">
                    Hero only — emits a <code>&lt;picture&gt;</code> with the post's featured image as the
                    mobile <code>&lt;source&gt;</code> when not empty. Desktop uses this field's image.
                  </p>
                </div>
                {field.useFeatured && (
                  <div>
                    <label>Mobile image size</label>
                    <select
                      value={field.mobileImageSize || 'large'}
                      onChange={(e) => update({ mobileImageSize: e.target.value })}
                    >
                      <option value="thumbnail">thumbnail</option>
                      <option value="medium">medium</option>
                      <option value="medium_large">medium_large</option>
                      <option value="large">large</option>
                      <option value="full">full</option>
                    </select>
                    <p className="hint">Used for the mobile {`<source>`}.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {(field.type === 'select' || field.type === 'button_group') && (
          <>
            <div className="full">
              <label>Choices (one per line — value : Label)</label>
              <textarea
                value={field.choices || ''}
                onChange={(e) => update({ choices: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label>Allow null</label>
              <label className="checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!field.allow_null}
                  onChange={(e) => update({ allow_null: e.target.checked })}
                />
                <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                  Allow empty / "— Select —" option
                </span>
              </label>
            </div>
            {field.type === 'select' && (
              <div>
                <label>Multiple</label>
                <label className="checkbox-row" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={!!field.multiple}
                    onChange={(e) => update({ multiple: e.target.checked })}
                  />
                  <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                    Allow multiple selections
                  </span>
                </label>
              </div>
            )}
          </>
        )}

        {field.type === 'number' && (
          <>
            <div>
              <label>Min</label>
              <input
                type="number"
                value={field.min || ''}
                onChange={(e) => update({ min: e.target.value })}
              />
            </div>
            <div>
              <label>Max</label>
              <input
                type="number"
                value={field.max || ''}
                onChange={(e) => update({ max: e.target.value })}
              />
            </div>
          </>
        )}

        {field.type === 'true_false' && (
          <>
            <div>
              <label>Default value</label>
              <label className="checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!field.default_value}
                  onChange={(e) => update({ default_value: e.target.checked ? 1 : 0 })}
                />
                <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                  Default to ON
                </span>
              </label>
            </div>
            <div>
              <label>Stylised UI</label>
              <label className="checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={field.ui !== 0}
                  onChange={(e) => update({ ui: e.target.checked ? 1 : 0 })}
                />
                <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                  Render as pill toggle (vs plain checkbox)
                </span>
              </label>
            </div>
            <div className="full">
              <label>Message (optional)</label>
              <input
                type="text"
                value={field.message || ''}
                onChange={(e) => update({ message: e.target.value })}
                placeholder='e.g. "Yes, enable the dark theme"'
              />
              <p className="hint">Text shown next to the toggle in the editor.</p>
            </div>
            {field.ui !== 0 && (
              <>
                <div>
                  <label>On text</label>
                  <input
                    type="text"
                    value={field.ui_on_text || ''}
                    onChange={(e) => update({ ui_on_text: e.target.value })}
                    placeholder="Yes"
                  />
                </div>
                <div>
                  <label>Off text</label>
                  <input
                    type="text"
                    value={field.ui_off_text || ''}
                    onChange={(e) => update({ ui_off_text: e.target.value })}
                    placeholder="No"
                  />
                </div>
              </>
            )}
          </>
        )}

        {field.type === 'color_picker' && (
          <div className="full">
            <label>Default color</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={field.default_value || '#000000'}
                onChange={(e) => update({ default_value: e.target.value })}
                title="Pick default color"
              />
              <input
                type="text"
                value={field.default_value || ''}
                onChange={(e) => update({ default_value: e.target.value })}
                placeholder="#1a6ff4"
              />
              {field.default_value && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => update({ default_value: '' })}
                  title="Clear default"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="hint">
              Saved into <code>fields.php</code> as <code>'default_value' =&gt; '...'</code>. Leave empty for no default.
            </p>
          </div>
        )}

        {field.type === 'repeater' && (
          <>
            <div>
              <label>Button label</label>
              <input
                type="text"
                value={field.button_label || 'Add Row'}
                onChange={(e) => update({ button_label: e.target.value })}
                placeholder="Add Row"
              />
            </div>
            <div>
              <label>Layout</label>
              <select
                value={field.collapsed || ''}
                onChange={(e) => update({ collapsed: e.target.value })}
              >
                <option value="">Block (rows expanded)</option>
                <option value="row">Collapsed (click to expand)</option>
              </select>
              <p className="hint">"row" collapses each row in the editor.</p>
            </div>
            <div>
              <label>Min rows</label>
              <input
                type="number"
                value={field.min ?? 0}
                onChange={(e) => update({ min: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <label>Max rows</label>
              <input
                type="number"
                value={field.max ?? 0}
                onChange={(e) => update({ max: parseInt(e.target.value, 10) || 0 })}
              />
              <p className="hint">0 = unlimited.</p>
            </div>

            <div className="full">
              <label style={{ marginTop: 8 }}>Sub-fields</label>
              <p className="hint" style={{ marginTop: 0, marginBottom: 8 }}>
                Each sub-field becomes a column on each repeater row. Use ↑↓ to reorder.
                Repeaters cannot be nested inside repeaters in this generator.
              </p>
              <SubFieldList
                subFields={field.subFields || []}
                onChange={(subFields) => update({ subFields })}
              />
            </div>
          </>
        )}

        {field.type === 'post_object' && (
          <>
            <div>
              <label>Post type</label>
              <input
                type="text"
                value={field.post_type || 'post'}
                onChange={(e) => update({ post_type: e.target.value })}
                placeholder="post, page, custom_type"
              />
            </div>
            <div>
              <label>Multiple</label>
              <label className="checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!field.multiple}
                  onChange={(e) => update({ multiple: e.target.checked })}
                />
                <span className="label-text" style={{ fontSize: 12, fontWeight: 400 }}>
                  Allow multiple
                </span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
