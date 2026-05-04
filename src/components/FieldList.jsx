import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import FieldCard from './FieldCard.jsx'
import { FIELD_TYPES, defaultFieldConfig } from '../lib/fieldTypes.js'
import { uid } from '../lib/utils.js'
import { useState } from 'react'

export default function FieldList({ fields, onChange, purpose = 'inner' }) {
  const [pendingType, setPendingType] = useState('text')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f._uid === active.id)
    const newIndex = fields.findIndex((f) => f._uid === over.id)
    onChange(arrayMove(fields, oldIndex, newIndex))
  }

  const addField = () => {
    const fresh = {
      _uid: uid(),
      ...defaultFieldConfig(pendingType),
    }
    onChange([...fields, fresh])
  }

  const updateField = (uidVal, next) => {
    onChange(fields.map((f) => (f._uid === uidVal ? { ...next, _uid: uidVal } : f)))
  }

  const removeField = (uidVal) => {
    onChange(fields.filter((f) => f._uid !== uidVal))
  }

  return (
    <div>
      {fields.length === 0 ? (
        <div className="empty-state">
          No fields yet. Add your first field below.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f._uid)}
            strategy={verticalListSortingStrategy}
          >
            <div className="field-list">
              {fields.map((field) => (
                <FieldCard
                  key={field._uid}
                  field={field}
                  onChange={(next) => updateField(field._uid, next)}
                  onRemove={() => removeField(field._uid)}
                  purpose={purpose}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="add-field-bar">
        <select value={pendingType} onChange={(e) => setPendingType(e.target.value)}>
          {FIELD_TYPES.map((ft) => (
            <option key={ft.type} value={ft.type}>
              {ft.label}
            </option>
          ))}
        </select>
        <button className="primary" onClick={addField}>
          + Add field
        </button>
      </div>
    </div>
  )
}
