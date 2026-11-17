import { memo, useEffect, useRef, useState } from 'react'
import { coverUrl, type Album } from '../data/albums'
import { drawCover } from '../cover'

/** Generative artwork on a canvas; the real scan fades in on top when enabled and reachable. */
export const Cover = memo(function Cover({ album, size = 320, real = false }: { album: Album; size?: number; real?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = real && !failed ? coverUrl(album, size > 400 ? 900 : 400) : undefined

  useEffect(() => { setFailed(false); setLoaded(false) }, [album, real])
  useEffect(() => {
    let live = true
    const paint = () => { if (live && ref.current) drawCover(ref.current, album) }
    paint()
    document.fonts?.ready.then(paint) // repaint once display fonts arrive
    return () => { live = false }
  }, [album])

  return (
    <span className="cover">
      <canvas ref={ref} width={size} height={size} aria-hidden="true" />
      {src && (
        <img
          src={src} alt={`Cover of ${album.title} by ${album.artist}`} loading="lazy" decoding="async" referrerPolicy="no-referrer"
          className={loaded ? 'in' : ''} onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
        />
      )}
    </span>
  )
})
