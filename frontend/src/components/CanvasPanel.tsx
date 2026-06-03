export default function CanvasPanel() {
  return (
    <div className="w-full h-full relative" style={{ background: '#FAFAFA' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#E8E8E8"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="grid-large"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <rect width="100" height="100" fill="url(#grid)" />
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="#D8D8D8"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid-large)" />

        {/* Center label */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#BDBDBD"
          fontSize="18"
          fontFamily="Inter, sans-serif"
          fontWeight="500"
        >
          Canvas -- Circuit Diagram
        </text>

        {/* Sample PLC block placeholder */}
        <g transform="translate(80, 40)">
          <rect
            width="120"
            height="60"
            rx="8"
            fill="white"
            stroke="#4285F4"
            strokeWidth="1.5"
          />
          <text
            x="60"
            y="25"
            textAnchor="middle"
            fill="#4285F4"
            fontSize="11"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            AIPLC
          </text>
          <text
            x="60"
            y="42"
            textAnchor="middle"
            fill="#5F6368"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            Main Controller
          </text>
        </g>
      </svg>
    </div>
  )
}
