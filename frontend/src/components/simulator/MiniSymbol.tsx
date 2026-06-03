/* ──────────────────────────────────────────────────────────
   MiniSymbol — 28x28 SVG thumbnail for the component library.
   Each `symbol` key draws a tiny schematic icon in the given color.
   Ported from mock-circuit.jsx MiniSymbol switch.
   ────────────────────────────────────────────────────────── */

interface MiniSymbolProps {
  symbol: string
  color: string
  size?: number
}

export default function MiniSymbol({ symbol, color, size = 28 }: MiniSymbolProps) {
  const common = {
    strokeWidth: 1.6,
    stroke: color,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  let body: React.ReactNode
  switch (symbol) {
    case 'cpu':
      body = (
        <g>
          <rect x="7" y="7" width="14" height="14" rx="2" fill={color} opacity="0.9" />
          <path d="M11 7V4M17 7V4M11 24v-3M17 24v-3M7 11H4M7 17H4M24 11h-3M24 17h-3" {...common} fill="none" />
        </g>
      )
      break
    case 'btn':
      body = (
        <g>
          <path d="M5 16h6M17 16h6" {...common} />
          <path d="M11 16l5-3" {...common} />
          <circle cx="11" cy="16" r="1.6" {...common} />
          <circle cx="17" cy="16" r="1.6" {...common} />
        </g>
      )
      break
    case 'btnc':
      body = (
        <g>
          <path d="M5 16h18" {...common} />
          <path d="M12 12l4 8" stroke="#e53e3e" strokeWidth="1.6" />
          <circle cx="11" cy="16" r="1.6" {...common} />
          <circle cx="17" cy="16" r="1.6" {...common} />
        </g>
      )
      break
    case 'sw':
      body = (
        <g>
          <path d="M5 16h6M17 16h6" {...common} />
          <path d="M11 16l6-4" {...common} />
          <circle cx="11" cy="16" r="1.6" {...common} />
        </g>
      )
      break
    case 'led':
      body = (
        <g>
          <circle cx="14" cy="14" r="8" {...common} />
          <path d="M9 14h10M14 9v10" {...common} />
        </g>
      )
      break
    case 'buz':
      body = (
        <g>
          <path d="M7 11h5l5-4v14l-5-4H7z" {...common} />
          <path d="M20 10c2 2 2 6 0 8" {...common} />
        </g>
      )
      break
    case 'relay':
      body = (
        <g>
          <rect x="6" y="8" width="16" height="12" rx="2" {...common} />
          <path d="M9 14h3m4 0h3" {...common} />
        </g>
      )
      break
    case 'sol':
      body = (
        <g>
          <rect x="8" y="8" width="12" height="12" rx="2" {...common} />
          <path d="M11 8v12M14 8v12M17 8v12" {...common} />
        </g>
      )
      break
    case 'seg':
      body = (
        <g>
          <rect x="8" y="6" width="12" height="16" rx="2" {...common} />
          <path d="M11 10h6M11 14h6M11 18h6" {...common} />
        </g>
      )
      break
    case 'estop':
      body = (
        <g>
          <circle cx="14" cy="14" r="8" fill={color} />
          <path d="M11 11l6 6M17 11l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )
      break
    case 'cb':
      body = (
        <g>
          <path d="M8 20L18 8" {...common} />
          <circle cx="8" cy="20" r="1.8" {...common} />
          <circle cx="18" cy="8" r="1.8" {...common} />
        </g>
      )
      break
    case 'fuse':
      body = (
        <g>
          <rect x="6" y="11" width="16" height="6" rx="3" {...common} />
          <path d="M9 14h10" {...common} />
        </g>
      )
      break
    case 'sensor':
      body = (
        <g>
          <path d="M14 6l8 8-8 8-8-8z" {...common} />
          <circle cx="14" cy="14" r="2.4" fill={color} stroke="none" />
        </g>
      )
      break
    case 'enc':
      body = (
        <g>
          <circle cx="14" cy="14" r="8" {...common} />
          <path d="M14 6v4M14 18v4M6 14h4M18 14h4" {...common} />
        </g>
      )
      break
    case 'motor':
      body = (
        <g>
          <circle cx="14" cy="14" r="8" {...common} />
          <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill={color} fontFamily="Inter">M</text>
        </g>
      )
      break
    case 'heat':
      body = (
        <g>
          <rect x="6" y="9" width="16" height="10" rx="2" {...common} />
          <path d="M10 12c1 1 1 3 0 4M14 12c1 1 1 3 0 4M18 12c1 1 1 3 0 4" {...common} />
        </g>
      )
      break
    case 'power':
    case 'pwr':
      body = (
        <g>
          <rect x="6" y="9" width="16" height="10" rx="2" {...common} />
          <path d="M10 14h3M11.5 12.5v3M16 14h2" {...common} />
        </g>
      )
      break
    case 'gnd':
      body = (
        <g>
          <path d="M14 6v8M9 14h10M11 18h6M13 21h2" {...common} />
        </g>
      )
      break
    case 'tx':
      body = (
        <g>
          <circle cx="11" cy="14" r="5" {...common} />
          <circle cx="17" cy="14" r="5" {...common} />
        </g>
      )
      break
    case 'comm':
      body = (
        <g>
          <path d="M5 17c3-6 5-6 8 0s5 6 8 0" {...common} />
        </g>
      )
      break
    case 'res':
    case 'resistor':
      body = (
        <g>
          <path d="M5 14h3l2-4 3 8 3-8 2 4h3" {...common} />
        </g>
      )
      break
    case 'cap':
      body = (
        <g>
          <path d="M5 14h7M16 14h7M12 8v12M16 8v12" {...common} />
        </g>
      )
      break
    case 'diode':
      body = (
        <g>
          <path d="M5 14h6M11 9l8 5-8 5zM19 9v10M19 14h4" {...common} />
        </g>
      )
      break
    case 'junction':
      body = (
        <g>
          <circle cx="14" cy="14" r="3" fill={color} stroke="none" />
          <path d="M14 6v5M14 17v5M6 14h5M17 14h5" {...common} />
        </g>
      )
      break
    default:
      body = <rect x="7" y="7" width="14" height="14" rx="2" {...common} />
  }

  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      {body}
    </svg>
  )
}
