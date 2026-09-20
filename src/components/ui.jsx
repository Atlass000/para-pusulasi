import React from 'react'

// ---- Alt sayfa / modal ----
export function Sheet({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="scrim show" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ---- Bilgilendirme kartı ----
export function Insight({ emoji, children }) {
  return (
    <div className="insight">
      <span className="em">{emoji}</span>
      <div>{children}</div>
    </div>
  )
}

// ---- İlerleme çubuğu ----
export function Bar({ pct, state }) {
  return (
    <div className={'bar ' + (state || '')}>
      <i style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
    </div>
  )
}

// ---- Basit SVG çizgi grafiği (harici bağımlılık yok) ----
export function LineChart({ data, height = 200 }) {
  const W = 640
  const H = height
  const padX = 8
  const padY = 24
  if (!data || data.length < 2) {
    return <div className="empty" style={{ padding: '40px 0' }}>Tahmin için tekrar eden işlem ekle</div>
  }
  const vals = data.map((d) => d.value)
  let min = Math.min(...vals, 0)
  let max = Math.max(...vals, 0)
  if (min === max) { max += 1; min -= 1 }
  const range = max - min
  const x = (i) => padX + (i * (W - padX * 2)) / (data.length - 1)
  const y = (v) => padY + (H - padY * 2) * (1 - (v - min) / range)

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const areaPts = `${x(0)},${H - padY} ${linePts} ${x(data.length - 1)},${H - padY}`
  const zeroY = y(0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(216,166,87,.30)" />
          <stop offset="100%" stopColor="rgba(216,166,87,0)" />
        </linearGradient>
      </defs>
      {min < 0 && max > 0 && (
        <line x1={padX} x2={W - padX} y1={zeroY} y2={zeroY} stroke="#e06c5c" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
      )}
      <polygon points={areaPts} fill="url(#grad)" />
      <polyline points={linePts} fill="none" stroke="#d8a657" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="2.5" fill="#d8a657" />
      ))}
      {data.map((d, i) => (
        (i % 2 === 0 || i === data.length - 1) && (
          <text key={'t' + i} x={x(i)} y={H - 4} fontSize="11" fill="#a99e8f" textAnchor="middle">{d.label}</text>
        )
      ))}
    </svg>
  )
}
