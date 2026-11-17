import { memo, useEffect, useRef, useState } from 'react'
import { coverUrls, type Album } from '../data/albums'
import { drawCover } from '../cover'

/** Generated artwork on a canvas; the real scan fades in on top and the next candidate URL is tried if one fails. */
export const Cover = memo(function Cover({ album, size = 320, real = false, live }: { album: Album; size?: number; real?: boolean; live?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const urls = real ? coverUrls(album, size > 400 ? 900 : 400, live) : []
  const key = urls.join('|')
  // failures and the loaded flag are tied to the exact URLs, never reset by an effect: a cached image can fire
  // onLoad before effects run, and resetting afterwards would leave it loaded but hidden
  const [fail, setFail] = useState({ key: '', n: 0 })
  const [loadedSrc, setLoadedSrc] = useState('')
  const src = urls[fail.key === key ? fail.n : 0]
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
          className={loadedSrc === src ? 'in' : ''} onLoad={() => setLoadedSrc(src)}
          onError={() => setFail(f => ({ key, n: (f.key === key ? f.n : 0) + 1 }))}
        />
      )}
    </span>
  )
})
