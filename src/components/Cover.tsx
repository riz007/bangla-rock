import { memo, useEffect, useRef } from 'react'
import type { Album } from '../data/albums'
import { drawCover } from '../cover'

export const Cover = memo(function Cover({ album, size = 320 }: { album: Album; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let live = true
    const paint = () => { if (live && ref.current) drawCover(ref.current, album) }
    paint()
    document.fonts?.ready.then(paint) // repaint once display fonts arrive
    return () => { live = false }
  }, [album])
  return <canvas ref={ref} width={size} height={size} className="cover" aria-hidden="true" />
})
