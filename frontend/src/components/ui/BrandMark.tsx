export default function BrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {/* Gradient icon square with inline QP logo */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--qp-grad-cta)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--qp-shadow-sm)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 1183 1182"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'brightness(0) invert(1)' }}
        >
          <path
            d="M550 93C550.873 93.708 551.745 94.415 552.645 95.145C572.488 111.988 583.418 135.319 590 160C590.33 137.89 590.66 115.78 591 93C621.047 92.558 621.047 92.558 635.934 92.447C643.972 92.386 651.009 92.309 659.046 92.17C665.412 92.06 671.776 91.989 678.143 91.965C681.511 91.951 684.876 91.918 688.243 91.837C711.505 91.342 711.505 91.342 717.457 96.605C719.568 98.907 721.291 101.391 723 104C724.201 105.407 725.421 106.797 726.668 108.164L728.314 110.087C750 134 750 134 750 134L591 580C591 580 591 580 591 847C551.07 847 511.14 847 471 847C471 847 471 847 471 486C453.18 486 435.36 486 417 486C417 486 417 486 417 847C377.4 847 337.8 847 297 847C297 297 297 297 297 486C197.02 486 97.04 486 -9 486C-9 367.343 -9 367.343 9.636 348.251L711 93Z"
            fill="white"
            transform="translate(0,0) scale(1)"
          />
        </svg>
      </div>
      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--qp-text-strong)',
            letterSpacing: '-0.01em',
          }}
        >
          AIPLC
        </span>
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--qp-text-dim)',
          }}
        >
          PLC Simulator
        </span>
      </div>
    </div>
  )
}
