/**
 * Circuit DRC (Design Rule Check) engine for AIPLC.
 *
 * Topology analysis + optional electrical simulation via ngspice WASM.
 * No UI dependencies, no store imports (only type imports).
 */

import type {
  CanvasComponent,
  CanvasWire,
  DrcIssue,
  DrcResult,
  DrcSeverity,
} from '../store/useAppStore'
import { spiceEngine } from '../spice/spiceEngine'
import { buildPlcNetlist } from '../spice/plcNetlistBuilder'

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
 * Run all Design Rule Checks on the given circuit topology, code, and
 * optionally an ngspice electrical simulation.
 *
 * The function is async because the ngspice WASM engine runs in a Web
 * Worker. Topology checks run synchronously; the electrical checks are
 * appended only when the circuit has both power and ground and at least
 * three components.
 */
export async function runDrc(
  components: CanvasComponent[],
  wires: CanvasWire[],
  code: string,
): Promise<DrcResult> {
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

  // ── Electrical checks via ngspice ──────────────────────────────────
  const hasPower = components.some((c) => c.type === 'power-24v')
  const hasGround = components.some((c) => c.type === 'ground')

  if (hasPower && hasGround && components.length >= 3) {
    try {
      const netlist = buildPlcNetlist(components, wires)
      console.log('[DRC] ngspice netlist:', netlist)
      await spiceEngine.init()
      const result = await spiceEngine.solve(netlist)
      console.log('[DRC] ngspice result:', {
        success: result.success,
        error: result.error,
        variableNames: result.variableNames,
        variables: Object.fromEntries(result.variables),
      })

      if (result.success) {
        // Check power source current (short circuit detection)
        // ngspice reports branch current as the power source name + #branch
        // In our netlist the power source is named V_<sanitized_id>
        // ngspice lowercases all vector names, so we must lowercase the key
        const powerComp = components.find((c) => c.type === 'power-24v')
        if (powerComp) {
          const sid = powerComp.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
          const currentKey = `v_${sid}#branch`
          const powerCurrent = Math.abs(result.variables.get(currentKey) ?? 0)

          if (powerCurrent > 0.5) {
            issues.push({
              severity: 'error',
              code: 'SPICE_SHORT_CIRCUIT',
              message: `短路偵測：電源電流 ${(powerCurrent * 1000).toFixed(0)}mA 超過 500mA 閾值`,
              componentIds: [powerComp.id],
            })
          }
        }

        // Check LED currents via sense sources
        for (const comp of components) {
          if (comp.type === 'indicator-light') {
            // ngspice lowercases all vector names, so we must lowercase the key
            const sid = comp.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
            const senseKey = `v_${sid}_sense#branch`
            const current = Math.abs(result.variables.get(senseKey) ?? 0)

            if (current > 0.02) {
              issues.push({
                severity: 'error',
                code: 'LED_OVERCURRENT',
                message: `LED ${(comp.properties?.label as string) || comp.id} 電流 ${(current * 1000).toFixed(1)}mA 超過 20mA 上限，請加限流電阻`,
                componentIds: [comp.id],
              })
            }
          }
        }

        // Check resistor power dissipation
        for (const comp of components) {
          if (comp.type === 'resistor') {
            const sid = comp.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
            // Get node voltages from the two resistor terminals
            const net1Key = findNetVoltage(result.variables, sid, '1')
            const net2Key = findNetVoltage(result.variables, sid, '2')
            if (net1Key !== undefined && net2Key !== undefined) {
              const resistance = parseResistanceValue(comp.properties?.value)
              const voltageDrop = Math.abs(net1Key - net2Key)
              const power = (voltageDrop * voltageDrop) / resistance

              if (power > 0.25) {
                issues.push({
                  severity: 'warning',
                  code: 'RESISTOR_POWER',
                  message: `電阻 ${(comp.properties?.label as string) || comp.id} 功耗 ${(power * 1000).toFixed(0)}mW 超過 250mW (1/4W) 額定`,
                  componentIds: [comp.id],
                })
              }
            }
          }
        }
      }
    } catch (err) {
      // ngspice solve failed — don't block user, just warn
      issues.push({
        severity: 'warning',
        code: 'SPICE_SOLVE_FAILED',
        message: `電路模擬引擎無法求解：${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  const passed = issues.filter((i) => i.severity === 'error').length === 0

  return { passed, issues, timestamp }
}

// ---------------------------------------------------------------------------
// Helpers for electrical checks
// ---------------------------------------------------------------------------

/** Try to find a node voltage in the SPICE results. */
function findNetVoltage(
  _variables: Map<string, number>,
  _componentSid: string,
  _pin: string,
): number | undefined {
  // For .op analysis, ngspice stores node voltages as the net name.
  // We can't easily reverse-map from component+pin to net name here,
  // so we return undefined and skip the power check for now.
  // A future enhancement can pass the net map from the builder.
  return undefined
}

/** Parse resistance value for power calculation. */
function parseResistanceValue(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 1000

  const cleaned = String(value).replace(/[Ωohm\s]/gi, '').trim()
  const match = cleaned.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z]*)?$/i)
  if (!match) return 1000

  const num = parseFloat(match[1])
  const suffix = (match[2] || '').toLowerCase()
  const multipliers: Record<string, number> = {
    t: 1e12, g: 1e9, meg: 1e6, m: 1e6, k: 1e3, '': 1,
  }
  return num * (multipliers[suffix] ?? 1)
}
