/* ──────────────────────────────────────────────────────────
   AIPLC Component Catalog — typed data for the Component Library panel.
   Ported from mock-circuit.jsx CATALOG.
   ────────────────────────────────────────────────────────── */

export interface CatalogItem {
  name: string
  pins: number
  symbol: string    // 'plc'|'btn-no'|'btn-nc'|'led'|'relay'|'contactor'|'motor'|'thermal'|'estop'|'prox'|'resistor'|'gnd'|'pwr'|'junction'|...
  color: string     // hex color
  favorite?: boolean
  type: string      // maps to CanvasComponent.type
}

export interface CatalogCategory {
  id: string
  name: string
  icon: string      // emoji or icon name
  items: CatalogItem[]
}

export const CATALOG: CatalogCategory[] = [
  {
    id: 'ctrl', name: '控制器', icon: '🔲', items: [
      { name: 'PLC CPU F405', pins: 26, symbol: 'cpu', color: '#1a4fa0', favorite: true, type: 'plc-cpu-f405' },
      { name: 'PLC CPU F407', pins: 34, symbol: 'cpu', color: '#1a4fa0', type: 'plc-cpu-f407' },
      { name: 'DI 擴充模組 x16', pins: 18, symbol: 'cpu', color: '#1a4fa0', type: 'di-expansion-16' },
      { name: 'DO 擴充模組 x16', pins: 18, symbol: 'cpu', color: '#1a4fa0', type: 'do-expansion-16' },
      { name: 'AI/AO 類比模組', pins: 12, symbol: 'cpu', color: '#1a4fa0', type: 'aiao-module' },
    ],
  },
  {
    id: 'input', name: '輸入元件', icon: '👆', items: [
      { name: '按鈕 NO（常開）', pins: 2, symbol: 'btn', color: '#64748b', favorite: true, type: 'button-no' },
      { name: '按鈕 NC（常閉）', pins: 2, symbol: 'btnc', color: '#64748b', favorite: true, type: 'button-nc' },
      { name: '自鎖切換開關', pins: 2, symbol: 'sw', color: '#64748b', type: 'toggle-switch' },
      { name: '旋鈕選擇開關', pins: 3, symbol: 'sw', color: '#64748b', type: 'rotary-switch' },
      { name: '極限開關', pins: 3, symbol: 'btn', color: '#64748b', type: 'limit-switch' },
      { name: '腳踏開關', pins: 2, symbol: 'btn', color: '#64748b', type: 'foot-switch' },
    ],
  },
  {
    id: 'output', name: '輸出元件', icon: '💡', items: [
      { name: '指示燈（紅/黃/綠）', pins: 2, symbol: 'led', color: '#22c55e', favorite: true, type: 'indicator-light' },
      { name: '蜂鳴器', pins: 2, symbol: 'buz', color: '#22c55e', type: 'buzzer' },
      { name: '繼電器 SPDT', pins: 5, symbol: 'relay', color: '#f59e0b', favorite: true, type: 'relay' },
      { name: '接觸器 3相', pins: 8, symbol: 'relay', color: '#f59e0b', favorite: true, type: 'contactor-3phase' },
      { name: '電磁閥', pins: 2, symbol: 'sol', color: '#f59e0b', type: 'solenoid-valve' },
      { name: '7 段顯示器', pins: 10, symbol: 'seg', color: '#22c55e', type: '7-segment' },
    ],
  },
  {
    id: 'safe', name: '保護 / 安全', icon: '🛡️', items: [
      { name: '急停按鈕', pins: 2, symbol: 'estop', color: '#e53e3e', favorite: true, type: 'emergency-stop' },
      { name: '熱過載繼電器', pins: 8, symbol: 'relay', color: '#e53e3e', type: 'thermal-overload' },
      { name: '無熔絲斷路器', pins: 2, symbol: 'cb', color: '#e53e3e', type: 'circuit-breaker' },
      { name: '保險絲', pins: 2, symbol: 'fuse', color: '#e53e3e', type: 'fuse' },
      { name: '安全門開關', pins: 4, symbol: 'btn', color: '#e53e3e', type: 'safety-door-switch' },
    ],
  },
  {
    id: 'sensor', name: '感測器', icon: '📡', items: [
      { name: '近接開關 PNP', pins: 3, symbol: 'sensor', color: '#0077a3', type: 'proximity-pnp' },
      { name: '近接開關 NPN', pins: 3, symbol: 'sensor', color: '#0077a3', type: 'proximity-npn' },
      { name: '光電感測器', pins: 4, symbol: 'sensor', color: '#0077a3', type: 'photoelectric-sensor' },
      { name: '溫度感測 PT100', pins: 3, symbol: 'sensor', color: '#0077a3', type: 'pt100-sensor' },
      { name: '壓力傳感器', pins: 3, symbol: 'sensor', color: '#0077a3', type: 'pressure-sensor' },
      { name: '旋轉編碼器', pins: 6, symbol: 'enc', color: '#0077a3', type: 'rotary-encoder' },
    ],
  },
  {
    id: 'load', name: '負載 / 馬達', icon: '⚡', items: [
      { name: '三相感應馬達', pins: 3, symbol: 'motor', color: '#1a4fa0', favorite: true, type: 'motor-3phase' },
      { name: '步進馬達', pins: 4, symbol: 'motor', color: '#1a4fa0', type: 'stepper-motor' },
      { name: '伺服馬達', pins: 6, symbol: 'motor', color: '#1a4fa0', type: 'servo-motor' },
      { name: '工業加熱器', pins: 2, symbol: 'heat', color: '#1a4fa0', type: 'industrial-heater' },
    ],
  },
  {
    id: 'power', name: '電源', icon: '🔋', items: [
      { name: '24V DC 電源', pins: 2, symbol: 'power', color: '#e53e3e', favorite: true, type: 'power-24v' },
      { name: '5V DC 電源', pins: 2, symbol: 'power', color: '#e53e3e', type: 'power-5v' },
      { name: '接地 GND', pins: 1, symbol: 'gnd', color: '#334155', favorite: true, type: 'ground' },
      { name: '變壓器', pins: 4, symbol: 'tx', color: '#e53e3e', type: 'transformer' },
    ],
  },
  {
    id: 'comm', name: '通訊', icon: '📶', items: [
      { name: 'Modbus RTU', pins: 3, symbol: 'comm', color: '#7c3aed', type: 'modbus-rtu' },
      { name: 'RS-485 收發器', pins: 4, symbol: 'comm', color: '#7c3aed', type: 'rs485-transceiver' },
      { name: 'CAN 匯流排', pins: 2, symbol: 'comm', color: '#7c3aed', type: 'can-bus' },
    ],
  },
  {
    id: 'passive', name: '被動元件', icon: '〰️', items: [
      { name: '電阻', pins: 2, symbol: 'res', color: '#5c6bc0', type: 'resistor' },
      { name: '電容', pins: 2, symbol: 'cap', color: '#5c6bc0', type: 'capacitor' },
      { name: '二極體', pins: 2, symbol: 'diode', color: '#5c6bc0', type: 'diode' },
      { name: '接線端子', pins: 3, symbol: 'junction', color: '#334155', type: 'junction' },
    ],
  },
]

/** Icon name mapping for each category (used by lucide-react or the collapsed rail). */
export const CAT_ICON: Record<string, string> = {
  ctrl: 'Cpu',
  input: 'MousePointerClick',
  output: 'Lightbulb',
  safe: 'Shield',
  sensor: 'Search',
  load: 'RefreshCw',
  power: 'Zap',
  comm: 'Monitor',
  passive: 'MoreHorizontal',
}
