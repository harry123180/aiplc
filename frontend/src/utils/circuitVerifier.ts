/**
 * Circuit DRC (Design Rule Check) engine for AIPLC.
 *
 * Pure topology analysis of canvas components and wires.
 * No UI dependencies, no store imports (only type imports).
 */

import type {
  CanvasComponent,
  CanvasWire,
  DrcIssue,
  DrcResult,
  DrcSeverity,
} from '../store/useAppStore'

// Re-export DRC types for convenience
export type { DrcSeverity, DrcIssue, DrcResult }

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Extract DI/DO channel numbers referenced in C code. */
export function extractIOUsage(code: string): {
  diChannels: number[]
  doChannels: number[]
} {
  const diChannels: number[] = []
  const doChannels: number[] = []

  const diRe = /DI_Read\s*\(\s*(\d+)\s*\)/g
  let m: RegExpExecArray | null
  while ((m = diRe.exec(code)) !== null) {
    const ch = Number(m[1])
    if (!diChannels.includes(ch)) diChannels.push(ch)
  }

  const doRe = /DO_Write\s*\(\s*(\d+)\s*,/g
  while ((m = doRe.exec(code)) !== null) {
    const ch = Number(m[1])
    if (!doChannels.includes(ch)) doChannels.push(ch)
  }

  return { diChannels, doChannels }
}

/** Build adjacency map: componentId -> Set of connected wire IDs. */
export function buildAdjacencyMap(
  wires: CanvasWire[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()

  for (const w of wires) {
    if (!map.has(w.fromComponent)) map.set(w.fromComponent, new Set())
    map.get(w.fromComponent)!.add(w.id)

    if (!map.has(w.toComponent)) map.set(w.toComponent, new Set())
    map.get(w.toComponent)!.add(w.id)
  }

  return map
}

/** Find the PLC component (type === 'plc-cpu-f405'). */
export function findPlcComponent(
  components: CanvasComponent[],
): CanvasComponent | null {
  return components.find((c) => c.type === 'plc-cpu-f405') ?? null
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkOutputShort(
  components: CanvasComponent[],
  wires: CanvasWire[],
): DrcIssue[] {
  const issues: DrcIssue[] = []
  const plc = findPlcComponent(components)
  if (!plc) return issues

  // Map: "targetCompId:targetPin" -> list of DO source pins
  const targetMap = new Map<string, { doPin: string; wireId: string }[]>()

  for (const w of wires) {
    if (w.fromComponent === plc.id && w.fromPin.startsWith('DO')) {
      const key = `${w.toComponent}:${w.toPin}`
      if (!targetMap.has(key)) targetMap.set(key, [])
      targetMap.get(key)!.push({ doPin: w.fromPin, wireId: w.id })
    }
  }

  for (const [key, sources] of targetMap) {
    if (sources.length > 1) {
      const [targetCompId, targetPin] = key.split(':')
      const targetComp = components.find((c) => c.id === targetCompId)
      const targetLabel = targetComp ? targetComp.type : targetCompId
      const pinNames = sources.map((s) => s.doPin).join(' 和 ')
      issues.push({
        severity: 'error',
        code: 'OUTPUT_SHORT',
        message: `輸出短路：${pinNames} 同時連接到 ${targetLabel} 的 ${targetPin}`,
        componentIds: [plc.id, targetCompId],
        wireIds: sources.map((s) => s.wireId),
      })
    }
  }

  return issues
}

function checkMissingPower(components: CanvasComponent[]): DrcIssue[] {
  // Only meaningful components (exclude ground and junction)
  const meaningful = components.filter(
    (c) => c.type !== 'ground' && c.type !== 'junction',
  )
  if (meaningful.length === 0) return []

  const hasPower = components.some((c) => c.type === 'power-24v')
  if (!hasPower) {
    return [
      {
        severity: 'error',
        code: 'MISSING_POWER',
        message: '缺少電源供應器：電路中沒有 24V 電源元件',
      },
    ]
  }
  return []
}

function checkMissingGround(components: CanvasComponent[]): DrcIssue[] {
  // Only meaningful components (exclude ground and junction)
  const meaningful = components.filter(
    (c) => c.type !== 'ground' && c.type !== 'junction',
  )
  if (meaningful.length === 0) return []

  const hasGround = components.some((c) => c.type === 'ground')
  if (!hasGround) {
    return [
      {
        severity: 'error',
        code: 'MISSING_GROUND',
        message: '缺少接地：電路中沒有接地元件',
      },
    ]
  }
  return []
}

function checkSelfLoop(wires: CanvasWire[]): DrcIssue[] {
  const issues: DrcIssue[] = []
  for (const w of wires) {
    if (w.fromComponent === w.toComponent && w.fromPin === w.toPin) {
      issues.push({
        severity: 'error',
        code: 'SELF_LOOP',
        message: `自迴圈接線：${w.fromComponent} 的 ${w.fromPin} 接到自己`,
        componentIds: [w.fromComponent],
        wireIds: [w.id],
      })
    }
  }
  return issues
}

function checkInvalidWire(
  components: CanvasComponent[],
  wires: CanvasWire[],
): DrcIssue[] {
  const issues: DrcIssue[] = []
  const compIds = new Set(components.map((c) => c.id))

  for (const w of wires) {
    if (!compIds.has(w.fromComponent)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_WIRE',
        message: `無效接線：wire ${w.id} 連接到不存在的元件 ${w.fromComponent}`,
        wireIds: [w.id],
      })
    }
    if (!compIds.has(w.toComponent)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_WIRE',
        message: `無效接線：wire ${w.id} 連接到不存在的元件 ${w.toComponent}`,
        wireIds: [w.id],
      })
    }
  }
  return issues
}

function checkUnconnectedDI(
  components: CanvasComponent[],
  wires: CanvasWire[],
  code: string,
): DrcIssue[] {
  const issues: DrcIssue[] = []
  const plc = findPlcComponent(components)
  if (!plc) return issues

  const { diChannels } = extractIOUsage(code)

  for (const ch of diChannels) {
    const pinName = `DI${ch}`
    const hasWire = wires.some(
      (w) => w.toComponent === plc.id && w.toPin === pinName,
    )
    if (!hasWire) {
      issues.push({
        severity: 'warning',
        code: 'UNCONNECTED_DI',
        message: `未接線的輸入：程式碼使用 DI_Read(${ch}) 但 DI${ch} 沒有接線`,
        componentIds: [plc.id],
      })
    }
  }
  return issues
}

function checkUnconnectedDO(
  components: CanvasComponent[],
  wires: CanvasWire[],
  code: string,
): DrcIssue[] {
  const issues: DrcIssue[] = []
  const plc = findPlcComponent(components)
  if (!plc) return issues

  const { doChannels } = extractIOUsage(code)

  for (const ch of doChannels) {
    const pinName = `DO${ch}`
    const hasWire = wires.some(
      (w) => w.fromComponent === plc.id && w.fromPin === pinName,
    )
    if (!hasWire) {
      issues.push({
        severity: 'warning',
        code: 'UNCONNECTED_DO',
        message: `未接線的輸出：程式碼使用 DO_Write(${ch}) 但 DO${ch} 沒有接線`,
        componentIds: [plc.id],
      })
    }
  }
  return issues
}

function checkOrphanComponent(
  components: CanvasComponent[],
  wires: CanvasWire[],
): DrcIssue[] {
  const issues: DrcIssue[] = []
  const adjacency = buildAdjacencyMap(wires)

  for (const c of components) {
    // Skip ground and junction — they may be intentionally unconnected
    if (c.type === 'ground' || c.type === 'junction') continue

    const connectedWires = adjacency.get(c.id)
    if (!connectedWires || connectedWires.size === 0) {
      issues.push({
        severity: 'warning',
        code: 'ORPHAN_COMPONENT',
        message: `孤立元件：${c.type} (${c.id}) 沒有任何接線`,
        componentIds: [c.id],
      })
    }
  }
  return issues
}

function checkDuplicateWire(wires: CanvasWire[]): DrcIssue[] {
  const issues: DrcIssue[] = []
  const seen = new Map<string, string>() // key -> first wire ID

  for (const w of wires) {
    const key = `${w.fromComponent}:${w.fromPin}:${w.toComponent}:${w.toPin}`
    const existing = seen.get(key)
    if (existing) {
      issues.push({
        severity: 'warning',
        code: 'DUPLICATE_WIRE',
        message: `重複接線：${existing} 和 ${w.id} 連接相同的接點`,
        wireIds: [existing, w.id],
      })
    } else {
      seen.set(key, w.id)
    }
  }
  return issues
}

// ---------------------------------------------------------------------------
// Main DRC entry point
// ---------------------------------------------------------------------------

/**
 * Run all Design Rule Checks on the given circuit topology and code.
 *
 * Pure function with no side effects.
 */
export function runDrc(
  components: CanvasComponent[],
  wires: CanvasWire[],
  code: string,
): DrcResult {
  const timestamp = Date.now()

  // Empty canvas — nothing to check
  if (components.length === 0) {
    return { passed: true, issues: [], timestamp }
  }

  const issues: DrcIssue[] = [
    // Errors (block Run)
    ...checkOutputShort(components, wires),
    ...checkMissingPower(components),
    ...checkMissingGround(components),
    ...checkSelfLoop(wires),
    ...checkInvalidWire(components, wires),
    // Warnings (non-blocking)
    ...checkUnconnectedDI(components, wires, code),
    ...checkUnconnectedDO(components, wires, code),
    ...checkOrphanComponent(components, wires),
    ...checkDuplicateWire(wires),
  ]

  const passed = issues.filter((i) => i.severity === 'error').length === 0

  return { passed, issues, timestamp }
}
