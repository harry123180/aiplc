import { useRef, useCallback, useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import type { CanvasComponent, CanvasWire } from '../store/useAppStore'
import { Plus, Trash2, RotateCw, ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react'
import ComponentPropertyDialog from './ComponentPropertyDialog'

// ---- Pin layout definitions ----

interface PinDef {
  name: string
  side: 'left' | 'right' | 'top' | 'bottom'
  offset: number
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
        width: 50, height: 40,
        pins: [
          { name: 'COM', side: 'left', offset: 20 },
          { name: 'NO', side: 'right', offset: 20 },
        ],
      }
    case 'button-nc':
      return {
        width: 50, height: 40,
        pins: [
          { name: 'COM', side: 'left', offset: 20 },
          { name: 'NC', side: 'right', offset: 20 },
        ],
      }
    case 'indicator-light':
      return {
        width: 30, height: 30,
        pins: [
          { name: 'A', side: 'top', offset: 15 },
          { name: 'K', side: 'bottom', offset: 15 },
        ],
      }
    case 'relay':
      return {
        width: 60, height: 50,
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
        width: 60, height: 60,
        pins: [
          { name: 'U', side: 'top', offset: 12 },
          { name: 'V', side: 'top', offset: 30 },
          { name: 'W', side: 'top', offset: 48 },
        ],
      }
    case 'emergency-stop':
      return {
        width: 40, height: 40,
        pins: [
          { name: 'NC1', side: 'left', offset: 20 },
          { name: 'NC2', side: 'right', offset: 20 },
        ],
      }
    case 'resistor':
      return {
        width: 16, height: 40,
        pins: [
          { name: '1', side: 'top', offset: 8 },
          { name: '2', side: 'bottom', offset: 8 },
        ],
      }
    case 'ground':
      return {
        width: 20, height: 25,
        pins: [{ name: 'GND', side: 'top', offset: 10 }],
      }
    case 'power-24v':
      return {
        width: 50, height: 30,
        pins: [
          { name: 'V+', side: 'top', offset: 15 },
          { name: 'V-', side: 'bottom', offset: 15 },
        ],
      }
    case 'junction':
      return {
        width: 8, height: 8,
        pins: [
          { name: '1', side: 'left', offset: 4 },
          { name: '2', side: 'right', offset: 4 },
          { name: '3', side: 'bottom', offset: 4 },
        ],
      }
    default:
      return { width: 50, height: 50, pins: [] }
  }
}

function getPinLocalPos(pin: PinDef, def: ComponentDef): { x: number; y: number } {
  switch (pin.side) {
    case 'left': return { x: 0, y: pin.offset }
    case 'right': return { x: def.width, y: pin.offset }
    case 'top': return { x: pin.offset, y: 0 }
    case 'bottom': return { x: pin.offset, y: def.height }
  }
}

function rotatePoint(px: number, py: number, cx: number, cy: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  const ddx = px - cx
  const ddy = py - cy
  return {
    x: cx + ddx * Math.cos(rad) - ddy * Math.sin(rad),
    y: cy + ddx * Math.sin(rad) + ddy * Math.cos(rad),
  }
}

function getPinWorldPos(comp: CanvasComponent, pinName: string): { x: number; y: number } | null {
  const def = getComponentDef(comp.type)
  const pin = def.pins.find((p) => p.name === pinName)
  if (!pin) return null
  const local = getPinLocalPos(pin, def)
  const rotation = ((comp.properties?.rotation as number) || 0)
  let ox = 0, oy = 0
  switch (pin.side) {
    case 'left': ox = -6; break
    case 'right': ox = 6; break
    case 'top': oy = -6; break
    case 'bottom': oy = 6; break
  }
  if (rotation === 0) {
    return { x: comp.x + local.x + ox, y: comp.y + local.y + oy }
  }
  const ccx = def.width / 2
  const ccy = def.height / 2
  const rotated = rotatePoint(local.x + ox, local.y + oy, ccx, ccy, rotation)
  return { x: comp.x + rotated.x, y: comp.y + rotated.y }
}

type TextAnchor = 'start' | 'middle' | 'end'

function getPinLabelOffset(side: PinDef['side']): { dx: number; dy: number; anchor: TextAnchor } {
  switch (side) {
    case 'left': return { dx: -14, dy: 3, anchor: 'end' }
    case 'right': return { dx: 14, dy: 3, anchor: 'start' }
    case 'top': return { dx: 0, dy: -12, anchor: 'middle' }
    case 'bottom': return { dx: 0, dy: 16, anchor: 'middle' }
  }
}

// ---- SVG component renderers ----

function PlcCpuF405({ comp }: { comp: CanvasComponent }) {
  void comp
  const def = getComponentDef('plc-cpu-f405')
  return (
    <>
      <rect width={def.width} height={def.height} rx={6} fill="#1A237E" stroke="#3949AB" strokeWidth={1.5} />
      <text x={60} y={18} textAnchor="middle" fill="white" fontSize={11} fontWeight={700} fontFamily="Inter, sans-serif">PLC CPU</text>
      <text x={60} y={28} textAnchor="middle" fill="#9FA8DA" fontSize={7} fontFamily="Inter, sans-serif">STM32F405</text>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`di${i}`}>
          <circle cx={0} cy={30 + i * 20} r={3} fill="#4CAF50" />
          <text x={8} y={33 + i * 20} fill="#C5CAE9" fontSize={7} fontFamily="Inter, sans-serif">DI{i}</text>
        </g>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`do${i}`}>
          <circle cx={120} cy={30 + i * 20} r={3} fill="#F44336" />
          <text x={112} y={33 + i * 20} fill="#C5CAE9" fontSize={7} fontFamily="Inter, sans-serif" textAnchor="end">DO{i}</text>
        </g>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={`ai${i}`}>
          <circle cx={15 + i * 22} cy={200} r={3} fill="#FF9800" />
          <text x={15 + i * 22} y={196} fill="#C5CAE9" fontSize={6} fontFamily="Inter, sans-serif" textAnchor="middle">AI{i}</text>
        </g>
      ))}
      {Array.from({ length: 2 }, (_, i) => (
        <g key={`ao${i}`}>
          <circle cx={15 + 4 * 22 + i * 22} cy={200} r={3} fill="#2196F3" />
          <text x={15 + 4 * 22 + i * 22} y={196} fill="#C5CAE9" fontSize={6} fontFamily="Inter, sans-serif" textAnchor="middle">AO{i}</text>
        </g>
      ))}
    </>
  )
}

function ButtonNO({ comp }: { comp: CanvasComponent }) { void comp; return (<><rect width={50} height={40} rx={4} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={1} /><text x={25} y={12} textAnchor="middle" fill="#424242" fontSize={7} fontWeight={600} fontFamily="Inter, sans-serif">NO</text><line x1={12} y1={26} x2={20} y2={20} stroke="#424242" strokeWidth={1.5} /><line x1={30} y1={26} x2={38} y2={26} stroke="#424242" strokeWidth={1.5} /><circle cx={22} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} /><circle cx={28} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} /><circle cx={0} cy={20} r={3} fill="#4CAF50" /><circle cx={50} cy={20} r={3} fill="#4CAF50" /></>) }

function ButtonNC({ comp }: { comp: CanvasComponent }) { void comp; return (<><rect width={50} height={40} rx={4} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={1} /><text x={25} y={12} textAnchor="middle" fill="#424242" fontSize={7} fontWeight={600} fontFamily="Inter, sans-serif">NC</text><line x1={12} y1={26} x2={38} y2={26} stroke="#424242" strokeWidth={1.5} /><line x1={22} y1={20} x2={28} y2={32} stroke="#F44336" strokeWidth={1.5} /><circle cx={22} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} /><circle cx={28} cy={26} r={2} fill="none" stroke="#424242" strokeWidth={1} /><circle cx={0} cy={20} r={3} fill="#4CAF50" /><circle cx={50} cy={20} r={3} fill="#4CAF50" /></>) }

function IndicatorLight({ comp }: { comp: CanvasComponent }) {
  const color = (comp.properties?.color as string) || '#4CAF50'
  const active = (comp.properties?.active as boolean) || false
  return (<>{active && <circle cx={15} cy={15} r={18} fill={color} opacity={0.2} />}<circle cx={15} cy={15} r={14} fill={active ? color : '#E0E0E0'} stroke={color} strokeWidth={2} /><text x={15} y={18} textAnchor="middle" fill={active ? 'white' : '#757575'} fontSize={7} fontWeight={600} fontFamily="Inter, sans-serif">LED</text><circle cx={15} cy={0} r={3} fill="#F44336" /><circle cx={15} cy={30} r={3} fill="#2196F3" /></>)
}

function RelayComp({ comp }: { comp: CanvasComponent }) { void comp; return (<><rect width={60} height={50} rx={4} fill="#FFF3E0" stroke="#FF9800" strokeWidth={1.5} /><text x={30} y={12} textAnchor="middle" fill="#E65100" fontSize={8} fontWeight={600} fontFamily="Inter, sans-serif">RELAY</text><path d="M 15,22 C 18,18 22,18 25,22 C 28,26 32,26 35,22 C 38,18 42,18 45,22" fill="none" stroke="#E65100" strokeWidth={1.5} /><line x1={38} y1={30} x2={50} y2={30} stroke="#424242" strokeWidth={1} /><circle cx={0} cy={15} r={3} fill="#F44336" /><circle cx={0} cy={35} r={3} fill="#2196F3" /><circle cx={60} cy={12} r={3} fill="#4CAF50" /><circle cx={60} cy={25} r={3} fill="#4CAF50" /><circle cx={60} cy={38} r={3} fill="#4CAF50" /><text x={62} y={14} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">COM</text><text x={62} y={27} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">NO</text><text x={62} y={40} fill="#757575" fontSize={6} fontFamily="Inter, sans-serif">NC</text></>) }

function Motor3Phase({ comp }: { comp: CanvasComponent }) { void comp; return (<><circle cx={30} cy={30} r={28} fill="white" stroke="#1565C0" strokeWidth={2} /><text x={30} y={28} textAnchor="middle" fill="#1565C0" fontSize={16} fontWeight={700} fontFamily="Inter, sans-serif">M</text><text x={30} y={42} textAnchor="middle" fill="#1565C0" fontSize={9} fontFamily="Inter, sans-serif">3~</text><circle cx={12} cy={0} r={3} fill="#F44336" /><circle cx={30} cy={0} r={3} fill="#4CAF50" /><circle cx={48} cy={0} r={3} fill="#2196F3" /><text x={12} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">U</text><text x={30} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">V</text><text x={48} y={-6} textAnchor="middle" fill="#757575" fontSize={7} fontFamily="Inter, sans-serif">W</text></>) }

function EmergencyStop({ comp }: { comp: CanvasComponent }) { void comp; return (<><circle cx={20} cy={20} r={18} fill="#D32F2F" stroke="#B71C1C" strokeWidth={2} /><line x1={10} y1={10} x2={30} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" /><line x1={30} y1={10} x2={10} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" /><text x={20} y={-4} textAnchor="middle" fill="#D32F2F" fontSize={6} fontWeight={600} fontFamily="Inter, sans-serif">E-STOP</text><circle cx={0} cy={20} r={3} fill="#F44336" /><circle cx={40} cy={20} r={3} fill="#F44336" /></>) }

function Resistor({ comp }: { comp: CanvasComponent }) { void ((comp.properties?.value as string) || '1k'); return (<><rect width={16} height={40} rx={2} fill="white" stroke="#5C6BC0" strokeWidth={1.5} /><line x1={0} y1={10} x2={16} y2={10} stroke="#AB47BC" strokeWidth={2} /><line x1={0} y1={16} x2={16} y2={16} stroke="#F44336" strokeWidth={2} /><line x1={0} y1={22} x2={16} y2={22} stroke="#FF9800" strokeWidth={2} /><line x1={0} y1={28} x2={16} y2={28} stroke="#FFD600" strokeWidth={1.5} /><circle cx={8} cy={0} r={3} fill="#5C6BC0" /><circle cx={8} cy={40} r={3} fill="#5C6BC0" /></>) }

function GroundSymbol({ comp }: { comp: CanvasComponent }) { void comp; return (<><line x1={10} y1={0} x2={10} y2={8} stroke="#424242" strokeWidth={1.5} /><line x1={2} y1={8} x2={18} y2={8} stroke="#424242" strokeWidth={2} /><line x1={5} y1={13} x2={15} y2={13} stroke="#424242" strokeWidth={2} /><line x1={7} y1={18} x2={13} y2={18} stroke="#424242" strokeWidth={2} /><circle cx={10} cy={0} r={3} fill="#424242" /></>) }

function Power24V({ comp }: { comp: CanvasComponent }) { void comp; return (<><rect width={50} height={30} rx={4} fill="white" stroke="#D32F2F" strokeWidth={1.5} /><text x={25} y={14} textAnchor="middle" fill="#D32F2F" fontSize={10} fontWeight={700} fontFamily="Inter, sans-serif">24V</text><text x={10} y={26} textAnchor="middle" fill="#D32F2F" fontSize={8} fontWeight={600} fontFamily="Inter, sans-serif">+</text><text x={40} y={26} textAnchor="middle" fill="#1565C0" fontSize={10} fontWeight={600} fontFamily="Inter, sans-serif">{'−'}</text><circle cx={15} cy={0} r={3} fill="#D32F2F" /><circle cx={15} cy={30} r={3} fill="#1565C0" /></>) }

function Junction({ comp }: { comp: CanvasComponent }) { void comp; return (<><circle cx={4} cy={4} r={4} fill="#424242" /><circle cx={0} cy={4} r={2} fill="#424242" /><circle cx={8} cy={4} r={2} fill="#424242" /><circle cx={4} cy={8} r={2} fill="#424242" /></>) }

function renderComponent(comp: CanvasComponent) {
  switch (comp.type) {
    case 'plc-cpu-f405': return <PlcCpuF405 comp={comp} />
    case 'button-no': return <ButtonNO comp={comp} />
    case 'button-nc': return <ButtonNC comp={comp} />
    case 'indicator-light': return <IndicatorLight comp={comp} />
    case 'relay': return <RelayComp comp={comp} />
    case 'motor-3phase': return <Motor3Phase comp={comp} />
    case 'emergency-stop': return <EmergencyStop comp={comp} />
    case 'resistor': return <Resistor comp={comp} />
    case 'ground': return <GroundSymbol comp={comp} />
    case 'power-24v': return <Power24V comp={comp} />
    case 'junction': return <Junction comp={comp} />
    default: return <rect width={50} height={50} rx={4} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth={1} />
  }
}

// ---- Wire path generation with waypoints ----

function generateWirePath(start: { x: number; y: number }, end: { x: number; y: number }, waypoints?: Array<{ x: number; y: number }>): string {
  const points = [start, ...(waypoints || []), end]
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (prev.x !== curr.x && prev.y !== curr.y) {
      d += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`
    } else {
      d += ` L ${curr.x} ${curr.y}`
    }
  }
  return d
}

function pointToSegmentDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const segDx = bx - ax
  const segDy = by - ay
  const lenSq = segDx * segDx + segDy * segDy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * segDx + (py - ay) * segDy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * segDx), py - (ay + t * segDy))
}

function findWaypointInsertIndex(worldX: number, worldY: number, start: { x: number; y: number }, end: { x: number; y: number }, waypoints?: Array<{ x: number; y: number }>): number {
  const logicalPoints = [start, ...(waypoints || []), end]
  let bestDist = Infinity
  let bestIdx = 0
  for (let i = 0; i < logicalPoints.length - 1; i++) {
    const a = logicalPoints[i]
    const b = logicalPoints[i + 1]
    const subPts: Array<{ x: number; y: number }> = [a]
    if (a.x !== b.x && a.y !== b.y) { subPts.push({ x: b.x, y: a.y }) }
    subPts.push(b)
    for (let j = 0; j < subPts.length - 1; j++) {
      const dist = pointToSegmentDist(worldX, worldY, subPts[j].x, subPts[j].y, subPts[j + 1].x, subPts[j + 1].y)
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    }
  }
  return bestIdx
}

// ---- Wire renderer ----

function WirePath({ wire, components, isHighlighted, isSelected, onSelect, onDoubleClick, onWaypointDragStart, onWaypointContextMenu }: {
  wire: CanvasWire; components: CanvasComponent[]; isHighlighted: boolean; isSelected: boolean
  onSelect: (wireId: string) => void; onDoubleClick: (wireId: string, worldX: number, worldY: number) => void
  onWaypointDragStart: (wireId: string, waypointIndex: number, e: React.MouseEvent) => void
  onWaypointContextMenu: (wireId: string, waypointIndex: number, e: React.MouseEvent) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredWpIndex, setHoveredWpIndex] = useState<number | null>(null)
  const fromComp = components.find((c) => c.id === wire.fromComponent)
  const toComp = components.find((c) => c.id === wire.toComponent)
  if (!fromComp || !toComp) return null
  const fromPos = getPinWorldPos(fromComp, wire.fromPin)
  const toPos = getPinWorldPos(toComp, wire.toPin)
  if (!fromPos || !toPos) return null
  const wireColor = wire.color || '#1565C0'
  const d = generateWirePath(fromPos, toPos, wire.waypoints)
  const strokeColor = isSelected ? 'var(--color-blue, #4285F4)' : isHighlighted ? 'var(--color-red)' : isHovered ? '#1976D2' : wireColor
  const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : isHighlighted ? 2.5 : 1.5
  return (
    <g>
      <path d={d} stroke="transparent" strokeWidth={12} fill="none" style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onSelect(wire.id) }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          const svg = (e.target as SVGElement).ownerSVGElement
          if (!svg) return
          const rect = svg.getBoundingClientRect()
          const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
          onDoubleClick(wire.id, e.clientX - rect.left, e.clientY - rect.top)
        }}
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      />
      <path d={d} fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
        strokeDasharray={isSelected ? '8 4' : 'none'} strokeLinecap="round" strokeLinejoin="round"
        style={isHighlighted ? { animation: 'drc-pulse 1.5s ease-in-out infinite' } : undefined} pointerEvents="none"
      />
      {isSelected && wire.waypoints && wire.waypoints.map((wp, idx) => {
        const isWpHovered = hoveredWpIndex === idx
        return (
          <circle key={`wp-${idx}`} cx={wp.x} cy={wp.y} r={isWpHovered ? 4 : 3}
            fill="white" stroke="#4285F4" strokeWidth={1.5}
            style={{ cursor: 'move', transition: 'r 0.1s' }}
            onMouseDown={(e) => { e.stopPropagation(); onWaypointDragStart(wire.id, idx, e) }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onWaypointContextMenu(wire.id, idx, e) }}
            onMouseEnter={() => setHoveredWpIndex(idx)} onMouseLeave={() => setHoveredWpIndex(null)}
          />
        )
      })}
    </g>
  )
}

// ---- Wire preview ----

function WirePreview({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const absDx = Math.abs(to.x - from.x)
  const absDy = Math.abs(to.y - from.y)
  const d = absDx >= absDy
    ? `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`
  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke="#00BCD4" strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={from.x} cy={from.y} r={5} fill="#00BCD4" stroke="white" strokeWidth={2} />
      <circle cx={to.x} cy={to.y} r={4} fill="none" stroke="#00BCD4" strokeWidth={1.5} strokeDasharray="3 2" />
    </g>
  )
}

// ---- Palette ----

const PALETTE_ITEMS = [
  { type: 'plc-cpu-f405', label: 'PLC CPU', color: '#1A237E' },
  { type: 'button-no', label: 'Button NO', color: '#9E9E9E' },
  { type: 'button-nc', label: 'Button NC', color: '#9E9E9E' },
  { type: 'indicator-light', label: 'LED', color: '#4CAF50' },
  { type: 'relay', label: 'Relay', color: '#FF9800' },
  { type: 'motor-3phase', label: 'Motor 3~', color: '#1565C0' },
  { type: 'emergency-stop', label: 'E-Stop', color: '#D32F2F' },
  { type: 'resistor', label: 'Resistor', color: '#5C6BC0' },
  { type: 'ground', label: 'GND', color: '#424242' },
  { type: 'power-24v', label: '24V', color: '#D32F2F' },
  { type: 'junction', label: 'Junction', color: '#424242' },
] as const

let nextCompId = 0

// ---- Zoom / Pan constants ----
const ZOOM_MIN = 0.2
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1
const ZOOM_WHEEL_FACTOR = 0.001

function screenToWorld(clientX: number, clientY: number, svgEl: SVGSVGElement, zoom: number, panX: number, panY: number): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect()
  return { x: (clientX - rect.left) / zoom - panX, y: (clientY - rect.top) / zoom - panY }
}

// ---- Main CanvasPanel ----

export default function CanvasPanel() {
  const components = useAppStore((s) => s.components)
  const wires = useAppStore((s) => s.wires)
  const recordAddComponent = useAppStore((s) => s.recordAddComponent)
  const recordAddWire = useAppStore((s) => s.recordAddWire)
  const recordRemoveComponent = useAppStore((s) => s.recordRemoveComponent)
  const recordMoveComponent = useAppStore((s) => s.recordMoveComponent)
  const recordRotateComponent = useAppStore((s) => s.recordRotateComponent)
  const removeCanvasWire = useAppStore((s) => s.removeCanvasWire)
  const updateComponentPosition = useAppStore((s) => s.updateComponentPosition)
  const highlightedComponentIds = useAppStore((s) => s.highlightedComponentIds)
  const highlightedWireIds = useAppStore((s) => s.highlightedWireIds)
  const updateComponentProperties = useAppStore((s) => s.updateComponentProperties)
  const addWireWaypoint = useAppStore((s) => s.addWireWaypoint)
  const updateWireWaypoint = useAppStore((s) => s.updateWireWaypoint)
  const removeWireWaypoint = useAppStore((s) => s.removeWireWaypoint)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const dragStartPos = useRef<{ id: string; x: number; y: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null)

  // --- Zoom & Pan state ---
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  useEffect(() => { panRef.current = { x: panX, y: panY } }, [panX, panY])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })
  const isPanningRef = useRef(false)
  const spaceHeldRef = useRef(false)
  const transformGroupRef = useRef<SVGGElement>(null)

  const [svgSize, setSvgSize] = useState({ w: 1600, h: 900 })
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ wireId: string; waypointIndex: number } | null>(null)
  const [editingComponent, setEditingComponent] = useState<{id: string, screenX: number, screenY: number} | null>(null)

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

  const [wiringFrom, setWiringFrom] = useState<{ componentId: string; pin: string; x: number; y: number } | null>(null)
  const [wiringMouse, setWiringMouse] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pin: string } | null>(null)

  const applyTransform = useCallback((z: number, px: number, py: number) => {
    const g = transformGroupRef.current
    if (g) g.setAttribute('transform', `scale(${z}) translate(${px}, ${py})`)
  }, [])

  const toWorldCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    return screenToWorld(e.clientX, e.clientY, svg, zoomRef.current, panRef.current.x, panRef.current.y)
  }, [])

  const clampZoom = useCallback((z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)), [])

  const zoomTo = useCallback((newZoom: number, cx?: number, cy?: number) => {
    const svg = svgRef.current; if (!svg) return
    const clamped = clampZoom(newZoom)
    const oldZ = zoomRef.current
    if (cx !== undefined && cy !== undefined) {
      const rect = svg.getBoundingClientRect()
      const sx = cx - rect.left, sy = cy - rect.top
      const wx = sx / oldZ - panRef.current.x, wy = sy / oldZ - panRef.current.y
      const npx = sx / clamped - wx, npy = sy / clamped - wy
      panRef.current = { x: npx, y: npy }; setPanX(npx); setPanY(npy)
    }
    zoomRef.current = clamped; setZoom(clamped)
    applyTransform(clamped, panRef.current.x, panRef.current.y)
  }, [clampZoom, applyTransform])

  const handleZoomIn = useCallback(() => {
    const svg = svgRef.current; if (!svg) return
    const r = svg.getBoundingClientRect()
    zoomTo(zoomRef.current + ZOOM_STEP, r.left + r.width / 2, r.top + r.height / 2)
  }, [zoomTo])

  const handleZoomOut = useCallback(() => {
    const svg = svgRef.current; if (!svg) return
    const r = svg.getBoundingClientRect()
    zoomTo(zoomRef.current - ZOOM_STEP, r.left + r.width / 2, r.top + r.height / 2)
  }, [zoomTo])

  const handleZoomReset = useCallback(() => {
    zoomRef.current = 1; panRef.current = { x: 0, y: 0 }
    setZoom(1); setPanX(0); setPanY(0); applyTransform(1, 0, 0)
  }, [applyTransform])

  const handleZoomFit = useCallback(() => {
    if (components.length === 0) { handleZoomReset(); return }
    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity
    for (const comp of components) { const d = getComponentDef(comp.type); mnX = Math.min(mnX, comp.x); mnY = Math.min(mnY, comp.y); mxX = Math.max(mxX, comp.x + d.width); mxY = Math.max(mxY, comp.y + d.height) }
    const pad = 40, cW = mxX - mnX + pad * 2, cH = mxY - mnY + pad * 2
    const fZ = clampZoom(Math.min(svgSize.w / cW, svgSize.h / cH))
    const fPX = -mnX + pad + (svgSize.w / fZ - cW) / 2, fPY = -mnY + pad + (svgSize.h / fZ - cH) / 2
    zoomRef.current = fZ; panRef.current = { x: fPX, y: fPY }
    setZoom(fZ); setPanX(fPX); setPanY(fPY); applyTransform(fZ, fPX, fPY)
  }, [components, svgSize, clampZoom, applyTransform, handleZoomReset])

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomTo(clampZoom(zoomRef.current + -e.deltaY * ZOOM_WHEEL_FACTOR * zoomRef.current), e.clientX, e.clientY) }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [clampZoom, zoomTo])

  const startPan = useCallback((cx: number, cy: number) => { isPanningRef.current = true; setIsPanning(true); panStartRef.current = { clientX: cx, clientY: cy, panX: panRef.current.x, panY: panRef.current.y } }, [])
  const movePan = useCallback((cx: number, cy: number) => { if (!isPanningRef.current) return; const z = zoomRef.current; panRef.current = { x: panStartRef.current.panX + (cx - panStartRef.current.clientX) / z, y: panStartRef.current.panY + (cy - panStartRef.current.clientY) / z }; applyTransform(z, panRef.current.x, panRef.current.y) }, [applyTransform])
  const endPan = useCallback(() => { if (!isPanningRef.current) return; isPanningRef.current = false; setIsPanning(false); setPanX(panRef.current.x); setPanY(panRef.current.y) }, [])

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return
    const onMD = (e: MouseEvent) => { if (e.button === 1) { e.preventDefault(); startPan(e.clientX, e.clientY) } else if (e.button === 0 && spaceHeldRef.current) { e.preventDefault(); e.stopPropagation(); startPan(e.clientX, e.clientY) } }
    const onMM = (e: MouseEvent) => { if (isPanningRef.current) movePan(e.clientX, e.clientY) }
    const onMU = (e: MouseEvent) => { if (isPanningRef.current && (e.button === 1 || e.button === 0)) endPan() }
    svg.addEventListener('mousedown', onMD); window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU)
    return () => { svg.removeEventListener('mousedown', onMD); window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU) }
  }, [startPan, movePan, endPan])

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { const t = (e.target as HTMLElement)?.tagName; if (t === 'INPUT' || t === 'TEXTAREA') return; e.preventDefault(); spaceHeldRef.current = true } }
    const onKU = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeldRef.current = false; if (isPanningRef.current) endPan() } }
    window.addEventListener('keydown', onKD); window.addEventListener('keyup', onKU)
    return () => { window.removeEventListener('keydown', onKD); window.removeEventListener('keyup', onKU) }
  }, [endPan])

  const handleAddComponent = useCallback((type: string) => {
    const id = `comp-${++nextCompId}-${Date.now()}`
    const svg = svgRef.current
    let x = 150 + (nextCompId % 5) * 80, y = 80 + Math.floor(nextCompId / 5) * 100
    if (svg) { const r = svg.getBoundingClientRect(); const ctr = screenToWorld(r.left + r.width / 2, r.top + r.height / 2, svg, zoomRef.current, panRef.current.x, panRef.current.y); const d = getComponentDef(type); x = Math.round((ctr.x - d.width / 2) / 5) * 5; y = Math.round((ctr.y - d.height / 2) / 5) * 5 }
    recordAddComponent({ id, type, x, y })
  }, [recordAddComponent])

  const handleMouseDown = useCallback((e: React.MouseEvent, compId: string) => {
    if (isPanningRef.current || spaceHeldRef.current) return
    const target = e.target as SVGElement
    if (target.dataset?.pin === 'true') return
    e.stopPropagation()
    const comp = components.find((c) => c.id === compId)
    if (!comp) return
    const world = toWorldCoords(e)
    dragStartPos.current = { id: compId, x: comp.x, y: comp.y }
    setDragging({ id: compId, offsetX: world.x - comp.x, offsetY: world.y - comp.y })
    setSelectedId(compId)
    setSelectedWireId(null)
  }, [components, toWorldCoords])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) return
    if (draggingWaypoint) {
      const world = toWorldCoords(e)
      updateWireWaypoint(draggingWaypoint.wireId, draggingWaypoint.waypointIndex, { x: Math.round(world.x / 5) * 5, y: Math.round(world.y / 5) * 5 })
      return
    }
    if (dragging) {
      const world = toWorldCoords(e)
      updateComponentPosition(dragging.id, Math.round((world.x - dragging.offsetX) / 5) * 5, Math.round((world.y - dragging.offsetY) / 5) * 5)
    }
    if (wiringFrom) { setWiringMouse(toWorldCoords(e)) }
  }, [dragging, draggingWaypoint, wiringFrom, toWorldCoords, updateComponentPosition, updateWireWaypoint])

  const handleMouseUp = useCallback(() => {
    if (draggingWaypoint) { setDraggingWaypoint(null); return }
    if (dragging && dragStartPos.current && dragStartPos.current.id === dragging.id) {
      const comp = components.find((c) => c.id === dragging.id)
      if (comp) {
        const { x: fromX, y: fromY } = dragStartPos.current
        if (fromX !== comp.x || fromY !== comp.y) { recordMoveComponent(dragging.id, fromX, fromY, comp.x, comp.y) }
      }
      dragStartPos.current = null
    }
    setDragging(null)
  }, [dragging, draggingWaypoint, components, recordMoveComponent])

  const handleSvgClick = useCallback(() => {
    if (isPanningRef.current) return
    if (!dragging) { setSelectedId(null); setSelectedWireId(null); setEditingComponent(null) }
  }, [dragging])

  const handleDeleteSelected = useCallback(() => {
    if (selectedWireId) { removeCanvasWire(selectedWireId); setSelectedWireId(null) }
    else if (selectedId) { recordRemoveComponent(selectedId); setSelectedId(null) }
  }, [selectedId, selectedWireId, recordRemoveComponent, removeCanvasWire])

  const handleWireSelect = useCallback((wireId: string) => { if (isPanningRef.current) return; setSelectedWireId(wireId); setSelectedId(null) }, [])

  const handleWireDoubleClick = useCallback((wireId: string, worldX: number, worldY: number) => {
    const wire = wires.find((w) => w.id === wireId)
    if (!wire) return
    const fromComp = components.find((c) => c.id === wire.fromComponent)
    const toComp = components.find((c) => c.id === wire.toComponent)
    if (!fromComp || !toComp) return
    const fromPos = getPinWorldPos(fromComp, wire.fromPin)
    const toPos = getPinWorldPos(toComp, wire.toPin)
    if (!fromPos || !toPos) return
    const insertIdx = findWaypointInsertIndex(worldX, worldY, fromPos, toPos, wire.waypoints)
    addWireWaypoint(wireId, insertIdx, { x: Math.round(worldX / 5) * 5, y: Math.round(worldY / 5) * 5 })
    setSelectedWireId(wireId)
    setSelectedId(null)
  }, [wires, components, addWireWaypoint])

  const handleWaypointDragStart = useCallback((wireId: string, waypointIndex: number, _e: React.MouseEvent) => {
    setDraggingWaypoint({ wireId, waypointIndex })
  }, [])

  const handleWaypointContextMenu = useCallback((wireId: string, waypointIndex: number, _e: React.MouseEvent) => {
    removeWireWaypoint(wireId, waypointIndex)
  }, [removeWireWaypoint])

  const handlePinClick = useCallback((componentId: string, pinName: string) => {
    if (isPanningRef.current) return
    const comp = components.find((c) => c.id === componentId)
    if (!comp) return
    const pinPos = getPinWorldPos(comp, pinName)
    if (!pinPos) return
    if (!wiringFrom) {
      setWiringFrom({ componentId, pin: pinName, x: pinPos.x, y: pinPos.y })
      setWiringMouse(pinPos)
    } else {
      if (wiringFrom.componentId !== componentId) {
        recordAddWire({ id: `wire-${Date.now()}`, fromComponent: wiringFrom.componentId, fromPin: wiringFrom.pin, toComponent: componentId, toPin: pinName })
      }
      setWiringFrom(null)
      setWiringMouse(null)
    }
  }, [components, wiringFrom, recordAddWire])

  const handleSvgContextMenu = useCallback((e: React.MouseEvent) => {
    if (wiringFrom) { e.preventDefault(); setWiringFrom(null); setWiringMouse(null) }
    else if (selectedWireId) { e.preventDefault(); removeCanvasWire(selectedWireId); setSelectedWireId(null) }
  }, [wiringFrom, selectedWireId, removeCanvasWire])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedId || selectedWireId)) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        handleDeleteSelected()
      }
      if (e.key === 'Escape') {
        if (editingComponent) {
          setEditingComponent(null)
          return
        }
        if (wiringFrom) { setWiringFrom(null); setWiringMouse(null) }
        else { setSelectedId(null); setSelectedWireId(null) }
      }
      if ((e.key === 'r' || e.key === 'R') && selectedId) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        recordRotateComponent(selectedId)
      }
      if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleZoomIn() }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleZoomOut() }
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleZoomReset() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedWireId, wiringFrom, editingComponent, handleDeleteSelected, recordRotateComponent, handleZoomIn, handleZoomOut, handleZoomReset])

  const getCursor = () => {
    if (isPanning) return 'grabbing'
    if (spaceHeldRef.current) return 'grab'
    if (draggingWaypoint) return 'move'
    if (wiringFrom) return 'crosshair'
    if (dragging) return 'grabbing'
    return 'default'
  }

  const isEmpty = components.length === 0

  return (
    <div className="w-full h-full relative flex flex-col" style={{ background: '#FAFAFA' }}>
      <div className="flex items-center gap-1 px-2 py-1 border-b shrink-0" style={{ background: 'white', borderColor: '#E0E0E0' }}>
        <span style={{ fontSize: 11, color: '#5F6368', fontWeight: 600, marginRight: 8, fontFamily: 'Inter, sans-serif' }}>Components</span>
        {PALETTE_ITEMS.map((item) => (
          <button key={item.type} onClick={() => handleAddComponent(item.type)}
            className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer"
            style={{ fontSize: 10, color: '#424242', background: '#F5F5F5', border: '1px solid #E0E0E0', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEEEE')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')}
            title={`Add ${item.label}`}
          >
            <Plus size={10} color={item.color} />{item.label}
          </button>
        ))}
        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 ml-auto" style={{ borderLeft: '1px solid #E0E0E0', paddingLeft: 6 }}>
          <button onClick={handleZoomOut} className="flex items-center justify-center rounded cursor-pointer" style={{ width: 22, height: 22, background: '#F5F5F5', border: '1px solid #E0E0E0', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEEEE')} onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')} title="Zoom out (Ctrl+-)"><ZoomOut size={12} color="#5F6368" /></button>
          <span style={{ fontSize: 10, color: '#5F6368', fontFamily: 'Inter, sans-serif', fontWeight: 600, minWidth: 38, textAlign: 'center', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="flex items-center justify-center rounded cursor-pointer" style={{ width: 22, height: 22, background: '#F5F5F5', border: '1px solid #E0E0E0', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEEEE')} onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')} title="Zoom in (Ctrl+=)"><ZoomIn size={12} color="#5F6368" /></button>
          <button onClick={handleZoomReset} className="flex items-center justify-center rounded cursor-pointer" style={{ width: 22, height: 22, background: '#F5F5F5', border: '1px solid #E0E0E0', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEEEE')} onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')} title="Reset zoom (Ctrl+0)"><RotateCcw size={11} color="#5F6368" /></button>
          <button onClick={handleZoomFit} className="flex items-center justify-center rounded cursor-pointer" style={{ width: 22, height: 22, background: '#F5F5F5', border: '1px solid #E0E0E0', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEEEE')} onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')} title="Fit to content"><Maximize size={11} color="#5F6368" /></button>
        </div>
        {selectedId && !wiringFrom && (
          <button onClick={() => recordRotateComponent(selectedId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer"
            style={{ fontSize: 10, color: '#1565C0', background: '#E3F2FD', border: '1px solid #BBDEFB', fontFamily: 'Inter, sans-serif' }}
            title="Rotate 90deg (R)">
            <RotateCw size={10} />Rotate
          </button>
        )}
        {(selectedId || selectedWireId) && !wiringFrom && (
          <button onClick={handleDeleteSelected}
            className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer${!selectedId ? ' ml-auto' : ''}`}
            style={{ fontSize: 10, color: '#D32F2F', background: '#FFEBEE', border: '1px solid #FFCDD2', fontFamily: 'Inter, sans-serif' }}
            title={selectedWireId ? 'Delete selected wire' : 'Delete selected component'}>
            <Trash2 size={10} />Delete
          </button>
        )}
        {wiringFrom && (
          <span style={{ fontSize: 10, color: '#00838F', marginLeft: 'auto', fontFamily: 'Inter, sans-serif', fontWeight: 500, background: '#E0F7FA', padding: '2px 8px', borderRadius: 4, border: '1px solid #B2EBF2' }}>
            {'•'} {'點擊目標接點完成接線'} | ESC {'取消'}
          </span>
        )}
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          onClick={handleSvgClick} onContextMenu={handleSvgContextMenu}
          style={{ cursor: getCursor() }}
        >
          <defs>
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="#D0D0D0" />
            </pattern>
          </defs>
          <rect width={svgSize.w} height={svgSize.h} fill="white" />
          {isEmpty && (
            <text x={svgSize.w / 2} y={svgSize.h / 2} textAnchor="middle" dominantBaseline="middle" fill="#BDBDBD" fontSize={14} fontFamily="Inter, sans-serif" fontWeight={400}>
              {'拖拉元件到畫布上，或讓 AI 幫你配置線路圖'}
            </text>
          )}

          <g ref={transformGroupRef} transform={`scale(${zoom}) translate(${panX}, ${panY})`}>
            <rect width={10000} height={10000} x={-5000} y={-5000} fill="url(#dot-grid)" />

          {wires.map((w) => (
            <WirePath key={w.id} wire={w} components={components}
              isHighlighted={highlightedWireIds.includes(w.id)} isSelected={selectedWireId === w.id}
              onSelect={handleWireSelect} onDoubleClick={handleWireDoubleClick}
              onWaypointDragStart={handleWaypointDragStart} onWaypointContextMenu={handleWaypointContextMenu}
            />
          ))}

          {wiringFrom && wiringMouse && <WirePreview from={wiringFrom} to={wiringMouse} />}

          {components.map((comp) => {
            const isSelected = selectedId === comp.id
            const isHovered = hoveredComponentId === comp.id
            const def = getComponentDef(comp.type)
            const showPins = isHovered || isSelected || !!wiringFrom
            return (
              <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}
                onMouseDown={(e) => handleMouseDown(e, comp.id)}
                onMouseEnter={() => setHoveredComponentId(comp.id)}
                onMouseLeave={() => setHoveredComponentId(null)}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingComponent({ id: comp.id, screenX: e.clientX, screenY: e.clientY })
                }}
                onContextMenu={(e) => {
                  if (wiringFrom) return
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingComponent({ id: comp.id, screenX: e.clientX, screenY: e.clientY })
                }}
                style={{ cursor: dragging?.id === comp.id ? 'grabbing' : 'grab' }}
              >
                {isSelected && <rect x={-4} y={-4} width={def.width + 8} height={def.height + 8} rx={6} fill="none" stroke="#4285F4" strokeWidth={2} strokeDasharray="4 2" />}
                {highlightedComponentIds.includes(comp.id) && <rect x={-4} y={-4} width={def.width + 8} height={def.height + 8} fill="none" stroke="var(--color-red)" strokeWidth={2} strokeDasharray="6 3" rx={4} style={{ animation: 'drc-pulse 1.5s ease-in-out infinite' }} />}
                {renderComponent(comp)}
                {typeof comp.properties?.label === 'string' && comp.properties.label !== '' && (
                  <text
                    x={def.width / 2}
                    y={def.height + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--color-text-secondary)"
                  >
                    {comp.properties.label}
                  </text>
                )}
                {showPins && def.pins.map((pin) => {
                  const local = getPinLocalPos(pin, def)
                  const isSource = wiringFrom?.componentId === comp.id && wiringFrom?.pin === pin.name
                  const isPinHovered = hoveredPin?.componentId === comp.id && hoveredPin?.pin === pin.name
                  const isWiringTarget = !!wiringFrom && wiringFrom.componentId !== comp.id && isPinHovered
                  const radius = isSource || isPinHovered ? 10 : 8
                  const fillColor = isSource ? '#0097A7' : isWiringTarget ? '#66BB6A' : isPinHovered ? '#26C6DA' : '#00BCD4'
                  const labelInfo = getPinLabelOffset(pin.side)
                  return (
                    <g key={`pin-overlay-${pin.name}`}>
                      <circle data-pin="true" cx={local.x} cy={local.y} r={radius} fill={fillColor} fillOpacity={0.85} stroke="white" strokeWidth={2}
                        style={{ cursor: 'crosshair', transition: 'r 0.1s, fill 0.1s' }}
                        onClick={(e) => { e.stopPropagation(); handlePinClick(comp.id, pin.name) }}
                        onMouseEnter={() => setHoveredPin({ componentId: comp.id, pin: pin.name })}
                        onMouseLeave={() => setHoveredPin(null)}
                      />
                      {isPinHovered && (
                        <g pointerEvents="none">
                          <rect x={local.x + labelInfo.dx - (labelInfo.anchor === 'middle' ? 16 : labelInfo.anchor === 'end' ? 32 : 0)} y={local.y + labelInfo.dy - 10} width={32} height={14} rx={3} fill="rgba(0,0,0,0.75)" />
                          <text x={local.x + labelInfo.dx} y={local.y + labelInfo.dy} textAnchor={labelInfo.anchor} fill="white" fontSize={8} fontWeight={600} fontFamily="Inter, sans-serif">{pin.name}</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
          </g>
        </svg>
        {editingComponent && (() => {
          const comp = components.find(c => c.id === editingComponent.id)
          if (!comp) return null
          return (
            <ComponentPropertyDialog
              componentId={comp.id}
              componentType={comp.type}
              properties={comp.properties || {}}
              position={{ x: editingComponent.screenX, y: editingComponent.screenY }}
              onClose={() => setEditingComponent(null)}
              onUpdate={(key, value) => {
                updateComponentProperties(comp.id, { [key]: value })
              }}
              onDelete={() => {
                recordRemoveComponent(comp.id)
                setEditingComponent(null)
              }}
            />
          )
        })()}
      </div>
    </div>
  )
}
