// Smooth SVG line chart (no chart library) styled like the design's Overview.
import { useState } from 'react'

const W = 640
const H = 170
const PAD_X = 24
const PAD_Y = 26

function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export default function AttendanceChart({ data, unit = 'events attended' }) {
  const [active, setActive] = useState(data.length - 1)
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = (W - PAD_X * 2) / (data.length - 1)
  const points = data.map((d, i) => ({
    x: PAD_X + i * step,
    y: H - PAD_Y - (d.value / max) * (H - PAD_Y * 2),
  }))
  const line = smoothPath(points)
  const area = `${line} L ${points.at(-1).x} ${H} L ${points[0].x} ${H} Z`
  const idx = Math.min(active, data.length - 1)
  const p = points[idx]

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart__svg" role="img" aria-label="Attendance over time">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={p.x - 22} y="0" width="44" height={H} rx="18" fill="#fff" fillOpacity="0.12" />
        <path d={area} fill="url(#chart-fill)" />
        <path d={line} fill="none" stroke="#f178b6" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="chart__dot" style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }} />
      <span className={`chart__tooltip${idx > data.length / 2 ? ' is-left' : ''}`} style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}>
        <strong>{data[idx].value}</strong> {unit}
      </span>
      <div className="chart__labels">
        {data.map((d, i) => (
          <button key={d.label} type="button" className={i === idx ? 'is-active' : ''} onClick={() => setActive(i)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}
