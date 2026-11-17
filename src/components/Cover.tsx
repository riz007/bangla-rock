import { memo, useEffect, useRef, useState } from 'react'
import { coverUrls, type Album } from '../data/albums'
import { drawCover } from '../cover'

/** Generated artwork on a canvas; the real scan fades in on top and the next candidate URL is tried if one fails. */
export const Cover = memo(function Cover({ album, size = 320, real = false, live }: { album: Album; size?: number; real?: boolean; live?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const urls = real ? coverUrls(album, size > 400 ? 900 : 400, live) : []
  const key = urls.join('|')
  const [i, setI] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const src = urls[i]

  useEffect(() => { setI(0); setLoaded(false) }, [key])
  useEffect(() => {
    let alive = true
    const paint = () => { if (alive && ref.current) drawCover(ref.current, album) }
    paint()
    document.fonts?.ready.then(paint) // repaint once display fonts arrive
    return () => { alive = false }
  }, [album])

  return (
    <span className="cover">
      <canvas ref={ref} width={size} height={size} aria-hidden="true" />
      {src && (
        <img
          key={src} src={src} alt={`Cover of ${album.title} by ${album.artist}`} loading="lazy" decoding="async" referrerPolicy="no-referrer"
          className={loaded ? 'in' : ''} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setI(n => n + 1) }}
        />
      )}
    </span>
  )
})
