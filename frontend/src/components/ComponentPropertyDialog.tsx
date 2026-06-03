import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'

// ---- Property definition types ----

interface PropertyDefBase {
  key: string
  label: string
}

interface TextPropertyDef extends PropertyDefBase {
  type: 'text'
  default: string
}

interface NumberPropertyDef extends PropertyDefBase {
  type: 'number'
  default: number
}

interface SelectPropertyDef extends PropertyDefBase {
  type: 'select'
  options: string[]
  default: string
}

type PropertyDef = TextPropertyDef | NumberPropertyDef | SelectPropertyDef

// ---- Per-component-type property definitions ----

const COMPONENT_PROPERTIES: Record<string, PropertyDef[]> = {
  'plc-cpu-f405': [],
  'button-no': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
  ],
  'button-nc': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
  ],
  'indicator-light': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
    { key: 'color', label: '顏色', type: 'select', options: ['red', 'yellow', 'green', 'blue'], default: 'green' },
  ],
  'relay': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
  ],
  'contactor-3phase': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
  ],
  'motor-3phase': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
    { key: 'power', label: '功率 (HP)', type: 'number', default: 5 },
  ],
  'thermal-overload': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
    { key: 'current', label: '額定電流 (A)', type: 'number', default: 10 },
  ],
  'emergency-stop': [
    { key: 'label', label: '標籤', type: 'text', default: '' },
  ],
  'resistor': [
    { key: 'value', label: '阻值', type: 'text', default: '1kΩ' },
  ],
  'power-24v': [
    { key: 'voltage', label: '電壓 (V)', type: 'number', default: 24 },
  ],
}

// ---- Friendly display names for component types ----

const COMPONENT_TYPE_LABELS: Record<string, string> = {
  'plc-cpu-f405': 'PLC CPU (STM32F405)',
  'button-no': 'Button NO',
  'button-nc': 'Button NC',
  'indicator-light': 'Indicator Light',
  'relay': 'Relay',
  'contactor-3phase': 'Contactor 3相',
  'motor-3phase': 'Motor 3相',
  'thermal-overload': 'Thermal Overload',
  'emergency-stop': 'Emergency Stop',
  'resistor': 'Resistor',
  'power-24v': '24V Power',
  'ground': 'Ground',
  'junction': 'Junction',
}

// ---- Dialog props ----

interface ComponentPropertyDialogProps {
  componentId: string
  componentType: string
  properties: Record<string, unknown>
  position: { x: number; y: number }
  onClose: () => void
  onUpdate: (key: string, value: unknown) => void
  onDelete: () => void
}

// ---- Dialog component ----

export default function ComponentPropertyDialog({
  componentType,
  properties,
  position,
  onClose,
  onUpdate,
  onDelete,
}: ComponentPropertyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const propertyDefs = COMPONENT_PROPERTIES[componentType] || []
  const typeLabel = COMPONENT_TYPE_LABELS[componentType] || componentType

  // Clamp position to viewport
  const clampedPos = useClampedPosition(position, dialogRef)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close on click outside (delayed to avoid closing on trigger click)
  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      if (!mounted) return
      const handleClickOutside = (e: MouseEvent) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      // Store cleanup fn
      cleanupRef.current = () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, 100)

    const cleanupRef = { current: () => {} }

    return () => {
      mounted = false
      clearTimeout(timer)
      cleanupRef.current()
    }
  }, [onClose])

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete()
  }, [confirmDelete, onDelete])

  // If no editable properties and it's a plc-cpu, still show delete
  const hasProperties = propertyDefs.length > 0

  return (
    <div
      ref={dialogRef}
      style={{
        position: 'fixed',
        left: clampedPos.x,
        top: clampedPos.y,
        zIndex: 1000,
        minWidth: 220,
        maxWidth: 300,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #E0E0E0',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        overflow: 'hidden',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #F0F0F0',
          background: '#FAFAFA',
        }}
      >
        <span style={{ fontWeight: 600, color: '#333', fontSize: 12 }}>
          {typeLabel}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            color: '#999',
            borderRadius: 4,
          }}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Properties */}
      {hasProperties && (
        <div style={{ padding: '8px 12px' }}>
          {propertyDefs.map((def) => (
            <PropertyField
              key={def.key}
              def={def}
              value={properties[def.key]}
              onChange={(val) => onUpdate(def.key, val)}
            />
          ))}
        </div>
      )}

      {!hasProperties && (
        <div style={{ padding: '12px', color: '#999', textAlign: 'center', fontSize: 11 }}>
          No editable properties
        </div>
      )}

      {/* Delete button */}
      <div
        style={{
          padding: '6px 12px 8px',
          borderTop: '1px solid #F0F0F0',
        }}
      >
        <button
          onClick={handleDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: '100%',
            padding: '5px 8px',
            border: '1px solid',
            borderColor: confirmDelete ? '#EF5350' : '#FFCDD2',
            borderRadius: 4,
            background: confirmDelete ? '#EF5350' : '#FFF5F5',
            color: confirmDelete ? 'white' : '#D32F2F',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Trash2 size={12} />
          {confirmDelete ? '確定刪除?' : '刪除元件'}
        </button>
      </div>
    </div>
  )
}

// ---- Individual property field renderer ----

function PropertyField({
  def,
  value,
  onChange,
}: {
  def: PropertyDef
  value: unknown
  onChange: (val: unknown) => void
}) {
  const currentValue = value !== undefined ? value : def.default

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #E0E0E0',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    background: 'white',
    color: '#333',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 3,
          color: '#666',
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {def.label}
      </label>

      {def.type === 'text' && (
        <input
          type="text"
          value={String(currentValue)}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4285F4' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
          style={inputStyle}
          placeholder={def.default || undefined}
        />
      )}

      {def.type === 'number' && (
        <input
          type="number"
          value={Number(currentValue)}
          onChange={(e) => onChange(e.target.value === '' ? def.default : Number(e.target.value))}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4285F4' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
          style={inputStyle}
        />
      )}

      {def.type === 'select' && (
        <select
          value={String(currentValue)}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4285F4' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

// ---- Hook to clamp dialog position to viewport ----

function useClampedPosition(
  position: { x: number; y: number },
  ref: React.RefObject<HTMLDivElement | null>,
): { x: number; y: number } {
  const [clamped, setClamped] = useState(position)

  useEffect(() => {
    // Initially position, then adjust after render
    const el = ref.current
    if (!el) {
      setClamped(position)
      return
    }

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 8

      let x = position.x
      let y = position.y

      // Clamp right edge
      if (x + rect.width > vw - margin) {
        x = vw - rect.width - margin
      }
      // Clamp bottom edge
      if (y + rect.height > vh - margin) {
        y = vh - rect.height - margin
      }
      // Clamp left/top
      if (x < margin) x = margin
      if (y < margin) y = margin

      setClamped({ x, y })
    })
  }, [position, ref])

  return clamped
}
