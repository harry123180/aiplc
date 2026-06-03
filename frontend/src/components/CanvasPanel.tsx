import { useRef, useCallback, useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import type { CanvasComponent, CanvasWire } from '../store/useAppStore'
import { Plus, Trash2 } from 'lucide-react'

// ---- Pin layout definitions ----

interface PinDef {
  name: string
  side: 'left' | 'right' | 'top' | 'bottom'
  offset: number // px from component origin along that edge
}

interface ComponentDef {
  width: number
  height: number
  pins: PinDef[]
}

function getComponentDef(type: string): ComponentDef {
  switch (type) {
    case 'plc-cpu-f405':
      return {
        width: 120,
        height: 200,
        pins: [
          ...Array.from({ length: 8 }, (_, i) => ({
            name: `DI${i}`,
            side: 'left' as const,
            offset: 30 + i * 20,
          })),
          ...Array.from({ length: 8 }, (_, i) => ({
            name: `DO${i}`,
            side: 'right' as const,
            offset: 30 + i * 20,
          })),
          ...Array.from({ length: 4 }, (_, i) => ({
            name: `AI${i}`,
            side: 'bottom' as const,
            offset: 15 + i * 22,
          })),
          ...Array.from({ length: 2 }, (_, i) => ({
            name: `AO${i}`,
            side: 'bottom' as const,
            offset: 15 + 4 * 22 + i * 22,
          })),
        ],
      }
    case 'button-no':
      return {
        width: 50,
        height: 40,
        pins: [
          { name: 'COM', side: 'left', offset: 20 },
          { name: 'NO', side: 'right', offset: 20 },
        ],
      }
    case 'button-nc':
      return {
        width: 50,
        height: 40,
        pins: [
          { name: 'COM', side: 'left', offset: 20 },
          { name: 'NC', side: 'right', offset: 20 },
        ],
      }
    case 'indicator-light':
      return {
        width: 30,
        height: 30,
        pins: [
          { name: 'A', side: 'top', offset: 15 },
          { name: 'K', side: 'bottom', offset: 15 },
        ],
      }
    case 'relay':
      return {
        width: 60,
        height: 50,
        pins: [
          { name: 'COIL+', side: 'left', offset: 15 },
          { name: 'COIL-', side: 'left', offset: 35 },
          { name: 'COM', side: 'right', offset: 12 },
          { name: 'NO', side: 'right', offset: 25 },
          { name: 'NC', side: 'right', offset: 38 },
        ],
      }
    case 'motor-3phase':
      return {
        width: 60,
        height: 60,
        pins: [
          { name: 'U', side: 'top', offset: 12 },
          { name: 'V', side: 'top', offset: 30 },
          { name: 'W', side: 'top', offset: 48 },
        ],
      }
    case 'emergency-stop':
      return {
        width: 40,
        height: 40,
        pins: [
          { name: 'NC1', side: 'left', offset: 20 },
          { name: 'NC2', side: 'right', offset: 20 },
        ],
      }
    default:
      return { width: 50, height: 50, pins: [] }
  }
}

/** Get pin position in local component coordinates (relative to component origin) */
function getPinLocalPos(
  pin: PinDef,
  def: ComponentDef
): { x: number; y: number } {
  switch (pin.side) {
    case 'left':   return { x: 0, y: pin.offset }
    case 'right':  return { x: def.width, y: pin.offset }
    case 'top':    return { x: pin.offset, y: 0 }
    case 'bottom': return { x: pin.offset, y: def.height }
  }
}

function getPinWorldPos(
  comp: CanvasComponent,
  pinName: string
): { x: number; y: number } | null {
  const def = getComponentDef(comp.type)
  const pin = def.pins.find((p) => p.name === pinName)
  if (!pin) return null
  const local = getPinLocalPos(pin, def)
  // Offset pins slightly outside the component boundary for wire attachment
  let ox = 0, oy = 0
  switch (pin.side) {
    case 'left':   ox = -6; break
    case 'right':  ox = 6;  break
    case 'top':    oy = -6; break
    case 'bottom': oy = 6;  break
  }
  return { x: comp.x + local.x + ox, y: comp.y + local.y + oy }
}

/** Compute label offset so tooltip appears outside the component */
type TextAnchor = 'start' | 'middle' | 'end'

function getPinLabelOffset(side: PinDef['side']): { dx: number; dy: number; anchor: TextAnchor } {
  switch (side) {
    case 'left':   return { dx: -14, dy: 3, anchor: 'end' }
    case 'right':  return { dx: 14, dy: 3, anchor: 'start' }
    case 'top':    return { dx: 0, dy: -12, anchor: 'middle' }
    case 'bottom': return { dx: 0, dy: 16, anchor: 'middle' }
  }
}

// ---- Individual SVG component renderers ----

function PlcCpuF405({ comp }: { comp: CanvasComponent }) {
  void comp
  const def = getComponentDef('plc-cpu-f405')
  return (
    <>
      <rect
        width={def.width}
        height={def.height}
        rx={6}
        fill="#1A237E"
        stroke="#3949AB"
        strokeWidth={1.5}
      />
      <text
        x={60}
        y={18}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        PLC CPU
      </text>
      <text
        x={60}
        y={28}
        textAnchor="middle"
        fill="#9FA8DA"
        fontSize={7}
        fontFamily="Inter, sans-serif"
      >
        STM32F405
      </text>
      {/* DI pins left */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`di${i}`}>
          <circle cx={0} cy={30 + i * 20} r={3} fill="#4CAF50" />
          <text
            x={8}
            y={33 + i * 20}
            fill="#C5CAE9"
            fontSize={7}
            fontFamily="Inter, sans-serif"
          >
            DI{i}
          </text>
        </g>
      ))}
      {/* DO pins right */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`do${i}`}>
          <circle cx={120} cy={30 + i * 20} r={3} fill="#F44336" />
          <text
            x={112}
            y={33 + i * 20}
            fill="#C5CAE9"
            fontSize={7}
            fontFamily="Inter, sans-serif"
            textAnchor="end"
          >
            DO{i}
          </text>
        </g>
      ))}
      {/* AI pins bottom */}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={`ai${i}`}>
          <circle cx={15 + i * 22} cy={200} r={3} fill="#FF9800" />
          <text
            x={15 + i * 22}
            y={196}
            fill="#C5CAE9"
            fontSize={6}
            fontFamily="Inter, sans-serif"
            textAnchor="middle"
          >
            AI{i}
          </text>
        </g>
      ))}
      {/* AO pins bottom */}
      {Array.from({ length: 2 }, (_, i) => (
        <g key={`ao${i}`}>
          <circle cx={15 + 4 * 22 + i * 22} cy={200} r={3} fill="#2196F3" />
          <text
            x={15 + 4 * 22 + i * 22}
            y={196}
            fill="#C5CAE9"
            fontSize={6}
            fontFamily="Inter, sans-serif"
            textAnchor="middle"
          >
            AO{i}
          </text>
        </g>
      ))}
    </>
  )
}

function ButtonNO({ comp }: { comp: CanvasComponent }) {
  void comp
  return (
    <>
      <rect width={50} height={40} rx={4} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={1} />
      <text
        x={25}
        y={12}
        textAnchor="middle"
        fill="#424242"
        fontSize={7}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        NO
      </text>
      {/* NO contact symbol */}
      <line x1={12} y1={26} x2={20} y2={20} stroke="#424242" strokeWidth={1.5} />
      <line x1={30} y1={26} x2={38} y2={26} stroke="#424242" strokeWidth={1.5} />
      <circle cx={22} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} />
      <circle cx={28} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} />
      {/* Pins */}
      <circle cx={0} cy={20} r={3} fill="#4CAF50" />
      <circle cx={50} cy={20} r={3} fill="#4CAF50" />
    </>
  )
}

function ButtonNC({ comp }: { comp: CanvasComponent }) {
  void comp
  return (
    <>
      <rect width={50} height={40} rx={4} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={1} />
      <text
        x={25}
        y={12}
        textAnchor="middle"
        fill="#424242"
        fontSize={7}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        NC
      </text>
      {/* NC contact symbol - closed with slash */}
      <line x1={12} y1={26} x2={38} y2={26} stroke="#424242" strokeWidth={1.5} />
      <line x1={22} y1={20} x2={28} y2={32} stroke="#F44336" strokeWidth={1.5} />
      <circle cx={22} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} />
      <circle cx={28} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} />
      {/* Pins */}
      <circle cx={0} cy={20} r={3} fill="#4CAF50" />
      <circle cx={50} cy={20} r={3} fill="#4CAF50" />
    </>
  )
}

function IndicatorLight({ comp }: { comp: CanvasComponent }) {
  const color = (comp.properties?.color as string) || '#4CAF50'
  const active = (comp.properties?.active as boolean) || false
  return (
    <>
      {active && (
        <circle cx={15} cy={15} r={18} fill={color} opacity={0.2} />
      )}
      <circle
        cx={15}
        cy={15}
        r={14}
        fill={active ? color : '#E0E0E0'}
        stroke={color}
        strokeWidth={2}
      />
      <text
        x={15}
        y={18}
        textAnchor="middle"
        fill={active ? 'white' : '#757575'}
        fontSize={7}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        LED
      </text>
      {/* Pins */}
      <circle cx={15} cy={0} r={3} fill="#F44336" />
      <circle cx={15} cy={30} r={3} fill="#2196F3" />
    </>
  )
}

function RelayComp({ comp }: { comp: CanvasComponent }) {
  void comp
  return (
    <>
      <rect width={60} height={50} rx={4} fill="#FFF3E0" stroke="#FF9800" strokeWidth={1.5} />
      <text
        x={30}
        y={12}
        textAnchor="middle"
        fill="#E65100"
        fontSize={8}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        RELAY
      </text>
      {/* Coil symbol */}
      <path
        d="M 15,22 C 18,18 22,18 25,22 C 28,26 32,26 35,22 C 38,18 42,18 45,22"
        fill="none"
        stroke="#E65100"
        strokeWidth={1.5}
      />
      {/* Contact line */}
      <line x1={38} y1={30} x2={50} y2={30} stroke="#424242" strokeWidth={1} />
      {/* Pins */}
      <circle cx={0} cy={15} r={3} fill="#F44336" />
      <circle cx={0} cy={35} r={3} fill="#2196F3" />
      <circle cx={60} cy={12} r={3} fill="#4CAF50" />
      <circle cx={60} cy={25} r={3} fill="#4CAF50" />
      <circle cx={60} cy={38} r={3} fill="#4CAF50" />
      <text x={62} y={14} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">COM</text>
      <text x={62} y={27} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">NO</text>
      <text x={62} y={40} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">NC</text>
    </>
  )
}

function Motor3Phase({ comp }: { comp: CanvasComponent }) {
  void comp
  return (
    <>
      <circle cx={30} cy={30} r={28} fill="white" stroke="#1565C0" strokeWidth={2} />
      <text
        x={30}
        y={28}
        textAnchor="middle"
        fill="#1565C0"
        fontSize={16}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        M
      </text>
      <text
        x={30}
        y={42}
        textAnchor="middle"
        fill="#1565C0"
        fontSize={9}
        fontFamily="Inter, sans-serif"
      >
        3~
      </text>
      {/* Pins */}
      <circle cx={12} cy={0} r={3} fill="#F44336" />
      <circle cx={30} cy={0} r={3} fill="#4CAF50" />
      <circle cx={48} cy={0} r={3} fill="#2196F3" />
      <text x={12} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">U</text>
      <text x={30} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">V</text>
      <text x={48} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">W</text>
    </>
  )
}

function EmergencyStop({ comp }: { comp: CanvasComponent }) {
  void comp
  return (
    <>
      <circle cx={20} cy={20} r={18} fill="#D32F2F" stroke="#B71C1C" strokeWidth={2} />
      <line x1={10} y1={10} x2={30} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" />
      <line x1={30} y1={10} x2={10} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" />
      <text
        x={20}
        y={-4}
        textAnchor="middle"
        fill="#D32F2F"
        fontSize={6}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        E-STOP
      </text>
      {/* Pins */}
      <circle cx={0} cy={20} r={3} fill="#F44336" />
      <circle cx={40} cy={20} r={3} fill="#F44336" />
    </>
  )
}

function renderComponent(comp: CanvasComponent) {
  switch (comp.type) {
    case 'plc-cpu-f405':
      return <PlcCpuF405 comp={comp} />
    case 'button-no':
      return <ButtonNO comp={comp} />
    case 'button-nc':
      return <ButtonNC comp={comp} />
    case 'indicator-light':
      return <IndicatorLight comp={comp} />
    case 'relay':
      return <RelayComp comp={comp} />
    case 'motor-3phase':
      return <Motor3Phase comp={comp} />
    case 'emergency-stop':
      return <EmergencyStop comp={comp} />
    default:
      return (
        <rect
          width={50}
          height={50}
          rx={4}
          fill="#E0E0E0"
          stroke="#9E9E9E"
          strokeWidth={1}
        />
      )
  }
}

// ---- Wire renderer (orthogonal L-shaped path) ----

function WirePath({
  wire,
  components,
}: {
  wire: CanvasWire
  components: CanvasComponent[]
}) {
  const fromComp = components.find((c) => c.id === wire.fromComponent)
  const toComp = components.find((c) => c.id === wire.toComponent)
  if (!fromComp || !toComp) return null

  const fromPos = getPinWorldPos(fromComp, wire.fromPin)
  const toPos = getPinWorldPos(toComp, wire.toPin)
  if (!fromPos || !toPos) return null

  const midX = (fromPos.x + toPos.x) / 2
  const d = `M ${fromPos.x} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${toPos.x} ${toPos.y}`

  return (
    <path
      d={d}
      fill="none"
      stroke="#1565C0"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

// ---- Preview wire (dashed orthogonal path with markers) ----

function WirePreview({
  from,
  to,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
}) {
  const midX = (from.x + to.x) / 2
  const d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`

  return (
    <g pointerEvents="none">
      {/* Dashed preview path */}
      <path
        d={d}
        fill="none"
        stroke="#00BCD4"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Start pin marker */}
      <circle
        cx={from.x}
        cy={from.y}
        r={5}
        fill="#00BCD4"
        stroke="white"
        strokeWidth={2}
      />
      {/* Cursor marker */}
      <circle
        cx={to.x}
        cy={to.y}
        r={4}
        fill="none"
        stroke="#00BCD4"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
    </g>
  )
}

// ---- Palette definitions ----

const PALETTE_ITEMS = [
  { type: 'plc-cpu-f405', label: 'PLC CPU', color: '#1A237E' },
  { type: 'button-no', label: 'Button NO', color: '#9E9E9E' },
  { type: 'button-nc', label: 'Button NC', color: '#9E9E9E' },
  { type: 'indicator-light', label: 'LED', color: '#4CAF50' },
  { type: 'relay', label: 'Relay', color: '#FF9800' },
  { type: 'motor-3phase', label: 'Motor 3~', color: '#1565C0' },
  { type: 'emergency-stop', label: 'E-Stop', color: '#D32F2F' },
] as const

let nextCompId = 0

// ---- Main CanvasPanel ----

export default function CanvasPanel() {
  const components = useAppStore((s) => s.components)
  const wires = useAppStore((s) => s.wires)
  const addCanvasComponent = useAppStore((s) => s.addCanvasComponent)
  const addCanvasWire = useAppStore((s) => s.addCanvasWire)
  const removeCanvasComponent = useAppStore((s) => s.removeCanvasComponent)
  const updateComponentPosition = useAppStore((s) => s.updateComponentPosition)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [dragging, setDragging] = useState<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // --- Track which component the mouse is hovering over ---
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null)

  // --- Bug C3: Track actual SVG container size for viewBox ---
  const [svgSize, setSvgSize] = useState({ w: 1600, h: 900 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSvgSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // --- Wire creation state ---
  const [wiringFrom, setWiringFrom] = useState<{
    componentId: string
    pin: string
    x: number
    y: number
  } | null>(null)
  const [wiringMouse, setWiringMouse] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPin, setHoveredPin] = useState<{
    componentId: string
    pin: string
  } | null>(null)

  // Convert mouse event to SVG coordinates
  const toSvgCoords = useCallback(
    (e: React.MouseEvent) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    []
  )

  const handleAddComponent = useCallback(
    (type: string) => {
      const id = `comp-${++nextCompId}-${Date.now()}`
      // Place at a semi-random position within visible area
      const x = 150 + (nextCompId % 5) * 80
      const y = 80 + Math.floor(nextCompId / 5) * 100
      addCanvasComponent({ id, type, x, y })
    },
    [addCanvasComponent]
  )

  // --- Component drag: skip if target is a pin circle (data-pin="true") ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, compId: string) => {
      const target = e.target as SVGElement
      if (target.dataset?.pin === 'true') return // let pin onClick handle it
      e.stopPropagation()
      const comp = components.find((c) => c.id === compId)
      if (!comp) return
      const svgCoord = toSvgCoords(e)
      setDragging({
        id: compId,
        offsetX: svgCoord.x - comp.x,
        offsetY: svgCoord.y - comp.y,
      })
      setSelectedId(compId)
    },
    [components, toSvgCoords]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        const svgCoord = toSvgCoords(e)
        const nx = Math.round((svgCoord.x - dragging.offsetX) / 5) * 5
        const ny = Math.round((svgCoord.y - dragging.offsetY) / 5) * 5
        updateComponentPosition(dragging.id, nx, ny)
      }
      // Track mouse for wiring preview line
      if (wiringFrom) {
        const svgCoord = toSvgCoords(e)
        setWiringMouse(svgCoord)
      }
    },
    [dragging, wiringFrom, toSvgCoords, updateComponentPosition]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleSvgClick = useCallback(() => {
    if (!dragging) {
      setSelectedId(null)
    }
  }, [dragging])

  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      removeCanvasComponent(selectedId)
      setSelectedId(null)
    }
  }, [selectedId, removeCanvasComponent])

  // --- Pin click handler for wire creation (uses onClick, not onMouseDown) ---
  const handlePinClick = useCallback(
    (componentId: string, pinName: string) => {
      const comp = components.find((c) => c.id === componentId)
      if (!comp) return

      const pinPos = getPinWorldPos(comp, pinName)
      if (!pinPos) return

      if (!wiringFrom) {
        // Start wiring from this pin
        setWiringFrom({ componentId, pin: pinName, x: pinPos.x, y: pinPos.y })
        setWiringMouse(pinPos)
      } else {
        // Complete wiring to this pin (must be different component)
        if (wiringFrom.componentId !== componentId) {
          const wireId = `wire-${Date.now()}`
          addCanvasWire({
            id: wireId,
            fromComponent: wiringFrom.componentId,
            fromPin: wiringFrom.pin,
            toComponent: componentId,
            toPin: pinName,
          })
        }
        setWiringFrom(null)
        setWiringMouse(null)
      }
    },
    [components, wiringFrom, addCanvasWire]
  )

  // Cancel wiring on right-click
  const handleSvgContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (wiringFrom) {
        e.preventDefault()
        setWiringFrom(null)
        setWiringMouse(null)
      }
    },
    [wiringFrom]
  )

  // --- Keyboard handler for Delete and Escape ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Don't delete if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        handleDeleteSelected()
      }
      if (e.key === 'Escape') {
        if (wiringFrom) {
          // Cancel wiring first
          setWiringFrom(null)
          setWiringMouse(null)
        } else {
          setSelectedId(null)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, wiringFrom, handleDeleteSelected])

  const isEmpty = components.length === 0

  return (
    <div className="w-full h-full relative flex flex-col" style={{ background: '#FAFAFA' }}>
      {/* Toolbar / Palette */}
      <div
        className="flex items-center gap-1 px-2 py-1 border-b shrink-0"
        style={{
          background: 'white',
          borderColor: '#E0E0E0',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: '#5F6368',
            fontWeight: 600,
            marginRight: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Components
        </span>
        {PALETTE_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => handleAddComponent(item.type)}
            className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer"
            style={{
              fontSize: 10,
              color: '#424242',
              background: '#F5F5F5',
              border: '1px solid #E0E0E0',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#EEEEEE')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = '#F5F5F5')
            }
            title={`Add ${item.label}`}
          >
            <Plus size={10} color={item.color} />
            {item.label}
          </button>
        ))}
        {selectedId && !wiringFrom && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ml-auto"
            style={{
              fontSize: 10,
              color: '#D32F2F',
              background: '#FFEBEE',
              border: '1px solid #FFCDD2',
              fontFamily: 'Inter, sans-serif',
            }}
            title="Delete selected component"
          >
            <Trash2 size={10} />
            Delete
          </button>
        )}
        {wiringFrom && (
          <span
            style={{
              fontSize: 10,
              color: '#00838F',
              marginLeft: 'auto',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              background: '#E0F7FA',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #B2EBF2',
            }}
          >
            {'•'} {'點擊目標接點完成接線'} | ESC {'取消'}
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgClick}
          onContextMenu={handleSvgContextMenu}
          style={{ cursor: wiringFrom ? 'crosshair' : dragging ? 'grabbing' : 'default' }}
        >
          <defs>
            {/* Dot grid pattern */}
            <pattern
              id="dot-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="0.8" fill="#D0D0D0" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={svgSize.w} height={svgSize.h} fill="white" />
          <rect width={svgSize.w} height={svgSize.h} fill="url(#dot-grid)" />

          {/* Empty state message */}
          {isEmpty && (
            <text
              x={svgSize.w / 2}
              y={svgSize.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#BDBDBD"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              fontWeight={400}
            >
              {'拖拉元件到畫布上，或讓 AI 幫你配置線路圖'}
            </text>
          )}

          {/* Wires (render behind components) */}
          {wires.map((w) => (
            <WirePath key={w.id} wire={w} components={components} />
          ))}

          {/* Wiring preview with orthogonal path + markers */}
          {wiringFrom && wiringMouse && (
            <WirePreview from={wiringFrom} to={wiringMouse} />
          )}

          {/* Components */}
          {components.map((comp) => {
            const isSelected = selectedId === comp.id
            const isHovered = hoveredComponentId === comp.id
            const def = getComponentDef(comp.type)

            // Show pins when: component is hovered, selected, or wiring is in progress
            const showPins = isHovered || isSelected || !!wiringFrom

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y})`}
                onMouseDown={(e) => handleMouseDown(e, comp.id)}
                onMouseEnter={() => setHoveredComponentId(comp.id)}
                onMouseLeave={() => setHoveredComponentId(null)}
                style={{ cursor: dragging?.id === comp.id ? 'grabbing' : 'grab' }}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <rect
                    x={-4}
                    y={-4}
                    width={def.width + 8}
                    height={def.height + 8}
                    rx={6}
                    fill="none"
                    stroke="#4285F4"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
                {renderComponent(comp)}

                {/* Interactive pin circles -- only shown on hover/select/wiring */}
                {showPins && def.pins.map((pin) => {
                  const local = getPinLocalPos(pin, def)
                  const isSource =
                    wiringFrom?.componentId === comp.id &&
                    wiringFrom?.pin === pin.name
                  const isPinHovered =
                    hoveredPin?.componentId === comp.id &&
                    hoveredPin?.pin === pin.name
                  // During wiring, target pins on OTHER components get green highlight
                  const isWiringTarget =
                    !!wiringFrom &&
                    wiringFrom.componentId !== comp.id &&
                    isPinHovered

                  const radius = isSource || isPinHovered ? 10 : 8
                  const fillColor = isSource
                    ? '#0097A7'
                    : isWiringTarget
                    ? '#66BB6A'
                    : isPinHovered
                    ? '#26C6DA'
                    : '#00BCD4'

                  const labelInfo = getPinLabelOffset(pin.side)

                  return (
                    <g key={`pin-overlay-${pin.name}`}>
                      {/* Visible, clickable pin circle */}
                      <circle
                        data-pin="true"
                        cx={local.x}
                        cy={local.y}
                        r={radius}
                        fill={fillColor}
                        fillOpacity={0.85}
                        stroke="white"
                        strokeWidth={2}
                        style={{ cursor: 'crosshair', transition: 'r 0.1s, fill 0.1s' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePinClick(comp.id, pin.name)
                        }}
                        onMouseEnter={() =>
                          setHoveredPin({ componentId: comp.id, pin: pin.name })
                        }
                        onMouseLeave={() => setHoveredPin(null)}
                      />
                      {/* Pin label tooltip on hover */}
                      {isPinHovered && (
                        <g pointerEvents="none">
                          <rect
                            x={local.x + labelInfo.dx - (labelInfo.anchor === 'middle' ? 16 : labelInfo.anchor === 'end' ? 32 : 0)}
                            y={local.y + labelInfo.dy - 10}
                            width={32}
                            height={14}
                            rx={3}
                            fill="rgba(0,0,0,0.75)"
                          />
                          <text
                            x={local.x + labelInfo.dx}
                            y={local.y + labelInfo.dy}
                            textAnchor={labelInfo.anchor}
                            fill="white"
                            fontSize={8}
                            fontWeight={600}
                            fontFamily="Inter, sans-serif"
                          >
                            {pin.name}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
