// Original, procedural cover art. Every album gets a deterministic artwork
// seeded from its id, in a visual language that matches its era and genre.
// These are NOT the real covers — the originals live on the source blog.
import type { Album } from './data/albums'

export type CoverStyle = 'sun' | 'neon' | 'xerox' | 'metal' | 'folk' | 'mix'

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function styleFor(a: Album): CoverStyle {
  if (a.genre === 'mix') return 'mix'
  if (a.genre === 'folk') return 'folk'
  if (a.year <= 1992) return 'neon'
  if (a.year <= 1999) return 'xerox'
  if (a.genre === 'heavy') return 'metal'
  if (a.genre === 'pop') return 'neon'
  return hash(a.id) % 3 === 0 ? 'xerox' : 'sun'
}

const PAL: Record<CoverStyle, string[]> = {
  sun: ['#f2e3c0', '#e2711d', '#c1440e', '#6b8f3a', '#3b2314', '#f4b942'],
  neon: ['#14052b', '#ff2e88', '#00e5ff', '#ffd319', '#7a2cff'],
  xerox: ['#eae4d6', '#111111', '#c8201c', '#8a8576'],
  metal: ['#0b0b0d', '#8d99a6', '#b3121b', '#d9dde2', '#3a3f47'],
  folk: ['#f6ead2', '#b3261e', '#1f6f5c', '#e0a526', '#2b1a12'],
  mix: ['#101014', '#e2711d', '#ff2e88', '#00e5ff', '#e0a526', '#b3121b', '#eae4d6'],
}

type Ctx = CanvasRenderingContext2D
type R = () => number

const painters: Record<CoverStyle, (c: Ctx, S: number, r: R, p: string[]) => void> = {
  // 70s: sunburst rays and stacked discs
  sun(c, S, r, p) {
    c.fillStyle = p[0]; c.fillRect(0, 0, S, S)
    const cx = S * (0.3 + r() * 0.4), cy = S * (0.35 + r() * 0.2), n = 14 + ((r() * 10) | 0) * 2
    for (let i = 0; i < n; i++) {
      c.fillStyle = p[1 + (i % 2 ? 0 : 4)]
      c.beginPath(); c.moveTo(cx, cy)
      c.arc(cx, cy, S * 1.5, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2); c.fill()
    }
    const rings = [p[4], p[2], p[5], p[3], p[0]]
    rings.forEach((col, i) => {
      c.fillStyle = col; c.beginPath()
      c.arc(cx, cy, S * (0.3 - i * 0.055), 0, Math.PI * 2); c.fill()
    })
  },
  // 80s: neon horizon grid, a striped sun, sometimes a skyline of peaks
  neon(c, S, r, base) {
    const p = [base, ['#03122b', '#ff7a18', '#35f0c0', '#fff06a', '#1b4dff'], ['#1a0420', '#ff3b3b', '#ffb000', '#ffe9c9', '#a3127a']][(r() * 3) | 0]
    const hz = S * (0.52 + r() * 0.14), sx = S * (0.2 + r() * 0.6), sr = S * (0.16 + r() * 0.16)
    const g = c.createLinearGradient(0, 0, 0, hz)
    g.addColorStop(0, p[0]); g.addColorStop(1, p[4])
    c.fillStyle = g; c.fillRect(0, 0, S, hz)
    c.fillStyle = '#fff'
    for (let i = 0; i < 40; i++) c.fillRect(r() * S, r() * hz * 0.7, S / 260, S / 260)
    const sg = c.createLinearGradient(0, hz - sr * 1.6, 0, hz)
    sg.addColorStop(0, p[3]); sg.addColorStop(1, p[1])
    c.fillStyle = sg; c.beginPath(); c.arc(sx, hz, sr, Math.PI, 0); c.fill()
    c.fillStyle = p[4]
    for (let i = 0; i < 5; i++) c.fillRect(sx - sr, hz - sr * (0.1 + i * 0.16), sr * 2, sr * 0.022 * (5 - i))
    if (r() > 0.45) {
      c.fillStyle = p[0]; c.beginPath(); c.moveTo(0, hz)
      for (let x = 0; x <= 1.01; x += 0.125) c.lineTo(x * S, hz - S * (0.03 + r() * 0.17) * (Math.abs(x * S - sx) < sr ? 0.3 : 1))
      c.lineTo(S, hz); c.fill()
    }
    c.fillStyle = p[0]; c.fillRect(0, hz, S, S - hz)
    c.strokeStyle = p[2]; c.lineWidth = S / 300
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(S / 2 + i * S * 0.03, hz); c.lineTo(S / 2 + i * S * 0.3, S); c.stroke() }
    for (let i = 0; i < 9; i++) { const y = hz + Math.pow(i / 9, 2) * (S - hz); c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke() }
  },
  // 90s: photocopied halftone, tape strips, one spot colour
  xerox(c, S, r, p) {
    c.fillStyle = p[0]; c.fillRect(0, 0, S, S)
    const cx = S * r(), cy = S * r() * 0.7, step = S / 34
    c.fillStyle = p[1]
    for (let y = 0; y < S; y += step) for (let x = 0; x < S; x += step) {
      const d = Math.hypot(x - cx, y - cy) / S
      const rad = step * 0.62 * Math.max(0, 1 - d * (1.1 + r() * 0.2))
      if (rad > 0.4) { c.beginPath(); c.arc(x + step / 2, y + step / 2, rad, 0, Math.PI * 2); c.fill() }
    }
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(S * r(), S * r()); c.rotate((r() - 0.5) * 0.5)
      c.fillStyle = i ? p[1] : p[2]; c.fillRect(-S * 0.3, 0, S * (0.3 + r() * 0.5), S * (0.03 + r() * 0.07)); c.restore()
    }
  },
  // 2000s: mirrored steel shards on black
  metal(c, S, r, p) {
    c.fillStyle = p[0]; c.fillRect(0, 0, S, S)
    const g = c.createRadialGradient(S / 2, S * 0.42, 0, S / 2, S * 0.42, S * 0.6)
    g.addColorStop(0, p[2] + 'aa'); g.addColorStop(1, 'transparent')
    c.fillStyle = g; c.fillRect(0, 0, S, S)
    const shards = Array.from({ length: 9 }, () => [r() * 0.5, r() * 0.85, r() * 0.5, r() * 0.85, r() * 0.16, r() * 0.85])
    for (const side of [1, -1]) shards.forEach((s, i) => {
      c.fillStyle = [p[1], p[4], p[3]][i % 3]
      c.beginPath()
      for (let k = 0; k < 6; k += 2) c.lineTo(S / 2 + side * s[k] * S, s[k + 1] * S)
      c.closePath(); c.fill()
    })
    c.strokeStyle = p[0]; c.lineWidth = S / 120
    c.beginPath(); c.moveTo(S / 2, 0); c.lineTo(S / 2, S); c.stroke()
  },
  // folk & fusion: alpana-like petal mandala
  folk(c, S, r, p) {
    c.fillStyle = p[(r() * 2) | 0 ? 0 : 4]; c.fillRect(0, 0, S, S)
    const cx = S / 2, cy = S * 0.42
    for (let ring = 5; ring >= 1; ring--) {
      const n = 6 + ring * 2 + ((r() * 3) | 0) * 2, rad = S * 0.085 * ring
      c.fillStyle = p[1 + ((ring + ((r() * 3) | 0)) % 3)]
      for (let i = 0; i < n; i++) {
        c.save(); c.translate(cx, cy); c.rotate((i / n) * Math.PI * 2 + ring)
        c.beginPath(); c.ellipse(0, -rad, rad * 0.22, rad * 0.5, 0, 0, Math.PI * 2); c.fill(); c.restore()
      }
    }
    c.fillStyle = p[3]; c.beginPath(); c.arc(cx, cy, S * 0.035, 0, Math.PI * 2); c.fill()
  },
  // mixed albums: a wall of gig-poster tiles
  mix(c, S, r, p) {
    c.fillStyle = p[0]; c.fillRect(0, 0, S, S)
    const n = 5, t = S / n
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      c.save(); c.translate(x * t + t / 2, y * t + t / 2); c.rotate((r() - 0.5) * 0.18)
      c.fillStyle = p[1 + ((r() * 6) | 0)]; c.fillRect(-t * 0.46, -t * 0.46, t * 0.92, t * 0.92)
      c.fillStyle = p[0]
      const k = (r() * 3) | 0
      c.beginPath()
      if (k === 0) c.arc(0, 0, t * 0.26, 0, Math.PI * 2)
      else if (k === 1) c.rect(-t * 0.3, -t * 0.08, t * 0.6, t * 0.16)
      else { c.moveTo(0, -t * 0.3); c.lineTo(t * 0.3, t * 0.28); c.lineTo(-t * 0.3, t * 0.28) }
      c.fill(); c.restore()
    }
  },
}

function wrap(c: Ctx, text: string, max: number) {
  const out: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (line && c.measureText(t).width > max) { out.push(line); line = w } else line = t
  }
  out.push(line)
  return out
}

export function drawCover(canvas: HTMLCanvasElement, a: Album) {
  const c = canvas.getContext('2d')
  if (!c) return
  const S = canvas.width, style = styleFor(a), p = PAL[style], r = rng(hash(a.id))
  c.save()
  painters[style](c, S, r, p)
  c.restore()

  // typography block
  const dark = style === 'neon' || style === 'metal' || style === 'mix'
  const ink = dark ? '#ffffff' : '#111111', plate = dark ? 'rgba(0,0,0,.72)' : 'rgba(255,255,255,.82)'
  const font = { sun: 'Monoton', neon: 'Monoton', xerox: '"Special Elite"', metal: 'Anton', folk: '"Special Elite"', mix: 'Anton' }[style]
  let size = S * (font === 'Monoton' ? 0.085 : 0.115)
  const title = a.title.replace(/\s*\(.*\)$/, '').toUpperCase()
  let lines: string[]
  for (;;) {
    c.font = `${size}px ${font}, Impact, sans-serif`
    lines = wrap(c, title, S * 0.86)
    const fits = lines.length <= 3 && lines.every(l => c.measureText(l).width <= S * 0.88)
    if (fits || size < S * 0.045) break
    size *= 0.9
  }
  const lh = size * 1.22, h = lines.length * lh + S * 0.1, top = S - h - S * 0.05
  c.fillStyle = plate; c.fillRect(0, top, S, h)
  c.fillStyle = ink; c.textBaseline = 'top'
  lines.forEach((l, i) => c.fillText(l, S * 0.06, top + S * 0.025 + i * lh))
  c.font = `600 ${S * 0.042}px "Hind Siliguri", system-ui, sans-serif`
  c.fillStyle = dark ? p[3] ?? ink : p[2] ?? ink
  c.fillText(`${a.artist.toUpperCase()}  ·  ${a.year}`, S * 0.06, top + S * 0.03 + lines.length * lh)
}
