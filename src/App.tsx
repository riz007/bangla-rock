import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ALBUMS, ARTISTS, ERAS, GENRES, SOURCE, type Album, type Details, type Genre } from './data/albums'
import { Cover } from './components/Cover'
import { Player } from './components/Player'
import { liveCovers } from './feed'
import { THEMES, loadList, loadMap, loadPrefs, save, savePrefs, themeFor, type Prefs } from './theme'

const CaseViewer = lazy(() => import('./components/CaseViewer'))

const byId = new Map(ALBUMS.map(a => [a.id, a]))
const yt = (a: Album) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${a.artist === 'Various Artists' ? '' : a.artist} ${a.title} full album`)}`
const spotify = (a: Album) => `https://open.spotify.com/search/${encodeURIComponent(`${a.artist === 'Various Artists' ? '' : a.artist} ${a.title}`.trim())}`
const hashId = () => location.hash.replace(/^#\/?(album\/)?/, '')

function describe(a: Album) {
  const kind = a.genre === 'mix'
    ? `A band mixed album from ${a.year} gathering ${a.with.length} acts on one disc — the format that carried the Dhaka underground from rehearsal pads to record shops.`
    : `${a.title === a.artist ? 'The self-titled release' : 'A release'} by ${a.artist}, ${a.year}. Filed under ${GENRES[a.genre].toLowerCase()}.`
  return [kind, ARTISTS[a.artist]?.note, a.label && `Released on ${a.label}.`].filter(Boolean).join(' ')
}

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [q, setQ] = useState('')
  const [era, setEra] = useState<string | null>(null)
  const [genre, setGenre] = useState<Genre | null>(null)
  const [openId, setOpenId] = useState(hashId)
  const [spinId, setSpinId] = useState<string | null>(null)
  const [tape, setTape] = useState<string[]>(() => loadList('bcc:mixtape').filter(id => byId.has(id)))
  const [panel, setPanel] = useState<'theme' | 'tape' | null>(null)
  const [details, setDetails] = useState<Record<string, Details>>({})
  const [links, setLinks] = useState(() => loadMap('bcc:yt')) // the listener's own YouTube links
  const [playToken, setPlayToken] = useState(0)
  const [live, setLive] = useState<Record<string, string>>({}) // cover URLs read from the blog's own feed

  const open = byId.get(openId) ?? null
  const spinning = (spinId && byId.get(spinId)) || null
  const theme = prefs.follow && open ? themeFor(open) : prefs.theme
  const accent = prefs.accent ?? THEMES.find(t => t.id === theme)!.accent

  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = theme
    el.dataset.grain = String(prefs.grain)
    el.dataset.motion = String(prefs.motion)
    el.style.setProperty('--accent', accent)
    savePrefs(prefs)
  }, [prefs, theme, accent])
  useEffect(() => save('bcc:mixtape', tape), [tape])
  useEffect(() => save('bcc:yt', links), [links])
  useEffect(() => { if (prefs.real) void liveCovers().then(setLive) }, [prefs.real])
  // line-ups, credits and track lists load on first use, not with the grid
  const wantDetails = !!(openId || spinId)
  useEffect(() => {
    if (wantDetails) void import('./data/details.json').then(m => setDetails(m.default as Record<string, Details>))
  }, [wantDetails])
  useEffect(() => {
    const on = () => setOpenId(hashId())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { if (open) setSpinId(open.id) }, [open])

  const go = useCallback((id: string | null) => {
    // plain #id hashes so links survive sandboxed hosts and static deploys alike
    location.hash = id ?? ''
    setOpenId(id ?? '')
  }, [])
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') panel ? setPanel(null) : go(null) }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [go, panel])

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    const e = ERAS.find(x => x.id === era)
    return ALBUMS.filter(a => {
      if (e && (a.year < e.from || a.year > e.to)) return false
      if (genre && a.genre !== genre) return false
      const hay = `${a.title} ${a.artist} ${a.year} ${a.with.join(' ')} ${a.label ?? ''} ${GENRES[a.genre]} ${ARTISTS[a.artist]?.bn ?? ''}`.toLowerCase()
      return terms.every(t => hay.includes(t))
    })
  }, [q, era, genre])

  const step = (d: number) => {
    const pool = list.length ? list : ALBUMS
    const i = pool.findIndex(a => a.id === spinning?.id)
    const next = pool[(i + d + pool.length) % pool.length]
    open ? go(next.id) : setSpinId(next.id)
  }
  const info = open ? details[open.id] : undefined
  const sourceOf = (a: Album) => [links[a.id], ...(details[a.id]?.yt ?? [])].filter((s): s is string => !!s)
  const playAlbum = (a: Album) => { setSpinId(a.id); setPlayToken(t => t + 1) }
  const toggleTape = (id: string) => setTape(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]))
  const set = (p: Partial<Prefs>) => setPrefs(v => ({ ...v, ...p }))
  const search = (term: string) => { setQ(term); setEra(null); setGenre(null); go(null); scrollTo({ top: 0 }) }

  return (
    <>
      <header className="top">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); search('') }}>
          <span className="brand-disc" aria-hidden="true" />
          <span>
            <strong>Bangla Rock Crate</strong>
            <em lang="bn">বাংলা রক ক্রেট · ১৯৯০–২০১৩</em>
          </span>
        </a>
        <label className="search">
          <span className="sr">Search albums, bands or years</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search — Warfaze, 2006, Agontuk, অর্থহীন…" />
        </label>
        <div className="actions">
          <button onClick={() => setPanel(panel === 'tape' ? null : 'tape')} aria-expanded={panel === 'tape'}>
            Mixtape <b>{tape.length}</b>
          </button>
          <button onClick={() => setPanel(panel === 'theme' ? null : 'theme')} aria-expanded={panel === 'theme'}>
            Theme · {THEMES.find(t => t.id === theme)!.era}
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="kicker">{ALBUMS.length} releases · {new Set(ALBUMS.flatMap(a => [a.artist, ...a.with])).size - 1} acts · a crate you can dig through</p>
        <h1>The sound of <span>Dhaka</span>, sleeve by sleeve.</h1>
        <p className="lede">
          From the first heavy records of 1990 to the mixed-album underground of the 2000s. Pick an era, pick a mood,
          and change the room to match. Cover scans, line-ups and credits come from{' '}
          <a href={SOURCE} target="_blank" rel="noreferrer">XTR’s Bangla CD Covers archive</a>; music plays through YouTube.
        </p>
      </section>

      <nav className="filters" aria-label="Filter the crate">
        <div className="timeline">
          <button className={!era ? 'on' : ''} onClick={() => setEra(null)}>All years<small>{ALBUMS.length}</small></button>
          {ERAS.map(e => (
            <button key={e.id} className={era === e.id ? 'on' : ''} onClick={() => setEra(era === e.id ? null : e.id)}>
              {e.name}<small>{e.tag} · {ALBUMS.filter(a => a.year >= e.from && a.year <= e.to).length}</small>
            </button>
          ))}
        </div>
        <div className="chips">
          {(Object.keys(GENRES) as Genre[]).map(g => (
            <button key={g} className={genre === g ? 'on' : ''} onClick={() => setGenre(genre === g ? null : g)}>
              {GENRES[g]} <small>{ALBUMS.filter(a => a.genre === g).length}</small>
            </button>
          ))}
        </div>
      </nav>

      <main className={`crate${prefs.dense ? ' dense' : ''}`}>
        {list.map(a => (
          <a key={a.id} className="sleeve" href={`#${a.id}`} style={{ '--tilt': `${((a.id.length * 7) % 5) - 2}deg` } as React.CSSProperties}>
            <span className="sleeve-art"><span className="sleeve-disc" aria-hidden="true" /><Cover album={a} real={prefs.real} live={live[a.id]} /></span>
            <span className="sleeve-meta">
              <strong>{a.title}</strong>
              <span>{a.artist} · {a.year}</span>
            </span>
          </a>
        ))}
        {!list.length && (
          <p className="empty">Nothing in the crate for that. <button onClick={() => search('')}>Clear filters</button></p>
        )}
      </main>

      <footer className="foot">
        Catalogue data from <a href={SOURCE} target="_blank" rel="noreferrer">banglacdcovers.blogspot.com</a>, collected and scanned by
        Shohail Ibne Mahbub (XTR) since 2012. Cover scans load directly from his blog; the patterned artwork behind them is generated.
        Music plays through YouTube’s embedded player. All music and artwork belong to the artists and labels.
      </footer>

      {open && (
        <div className="sheet-wrap" onClick={e => e.target === e.currentTarget && go(null)}>
          <article className="sheet" role="dialog" aria-modal="true" aria-label={`${open.title} by ${open.artist}`}>
            <button className="close" onClick={() => go(null)} aria-label="Close">×</button>
            <Suspense fallback={<div className="viewer"><Cover album={open} size={512} real={prefs.real} live={live[open.id]} /></div>}>
              <CaseViewer album={open} motion={prefs.motion} accent={accent} real={prefs.real} live={live[open.id]} />
            </Suspense>
            <div className="sheet-body">
              <p className="kicker">{GENRES[open.genre]} · {open.year}</p>
              <h2>{open.title}</h2>
              <p className="artist">
                {open.artist === 'Various Artists' ? open.artist : <button className="link" onClick={() => search(open.artist)}>{open.artist}</button>}
                {ARTISTS[open.artist]?.bn && <em lang="bn"> {ARTISTS[open.artist].bn}</em>}
              </p>
              <p className="desc">{describe(open)}</p>
              {open.with.length > 0 && (
                <>
                  <h3>{open.genre === 'mix' ? 'On this disc' : 'With'}</h3>
                  <div className="chips small">
                    {open.with.map(w => <button key={w} onClick={() => search(w)} title={ARTISTS[w]?.note}>{w}</button>)}
                  </div>
                </>
              )}
              <div className="cta">
                <button className="btn primary" onClick={() => playAlbum(open)}>▶ Play on the deck</button>
                <a className="btn" href={yt(open)} target="_blank" rel="noreferrer">YouTube</a>
                <a className="btn" href={spotify(open)} target="_blank" rel="noreferrer">Spotify</a>
                <button className="btn" onClick={() => toggleTape(open.id)} aria-pressed={tape.includes(open.id)}>
                  {tape.includes(open.id) ? '✓ On your mixtape' : '+ Add to mixtape'}
                </button>
              </div>
              {info && (
                <dl className="facts">
                  {(info.label ?? open.label) && <><dt>Label</dt><dd>{info.label ?? open.label}</dd></>}
                  {info.format && <><dt>Format</dt><dd>{info.format}</dd></>}
                  {info.lineup && <><dt>Line-up</dt><dd>{info.lineup.join(' · ')}</dd></>}
                  {info.credits && <><dt>Credits</dt><dd>{info.credits.join(' · ')}</dd></>}
                </dl>
              )}
              {info?.tracks && (
                <>
                  <h3>Tracks</h3>
                  <ol className="tracks">{info.tracks.map((t, i) => <li key={i}>{t}</li>)}</ol>
                </>
              )}
              <a className="source" href={open.src} target="_blank" rel="noreferrer">All scans, inlay and full notes on Bangla CD Covers ↗</a>
            </div>
          </article>
        </div>
      )}

      {panel === 'theme' && (
        <aside className="panel" aria-label="Customise theme">
          <h2>Set the room</h2>
          <div className="themes">
            {THEMES.map(t => (
              <button key={t.id} data-swatch={t.id} className={prefs.theme === t.id ? 'on' : ''} onClick={() => set({ theme: t.id, accent: null })}>
                <b>{t.era}</b> {t.name}<small>{t.blurb}</small>
              </button>
            ))}
          </div>
          <label className="row">Accent colour
            <span>
              <input type="color" value={accent} onChange={e => set({ accent: e.target.value })} />
              {prefs.accent && <button className="link" onClick={() => set({ accent: null })}>reset</button>}
            </span>
          </label>
          {([
            ['real', 'Real cover scans (off = generated art)'],
            ['follow', 'Match the theme to the album I open'],
            ['grain', 'Paper grain & print texture'],
            ['motion', 'Spinning discs & motion'],
            ['dense', 'Compact crate'],
          ] as const).map(([k, label]) => (
            <label key={k} className="row">{label}
              <input type="checkbox" checked={prefs[k]} onChange={e => set({ [k]: e.target.checked })} />
            </label>
          ))}
        </aside>
      )}

      {panel === 'tape' && (
        <aside className="panel" aria-label="Your mixtape">
          <h2>Your mixtape</h2>
          {!tape.length && <p className="muted">Empty side A. Open an album and add it — it’s saved in this browser.</p>}
          <ol className="tape">
            {tape.map(id => {
              const a = byId.get(id)!
              return (
                <li key={id}>
                  <a href={`#${id}`} onClick={() => setPanel(null)}><strong>{a.title}</strong><span>{a.artist} · {a.year}</span></a>
                  <button onClick={() => playAlbum(a)} aria-label={`Play ${a.title}`}>▶</button>
                  <button onClick={() => toggleTape(id)} aria-label={`Remove ${a.title}`}>×</button>
                </li>
              )
            })}
          </ol>
        </aside>
      )}

      {spinning && (
        <Player
          album={spinning} sources={sourceOf(spinning)} note={links[spinning.id] ? 'your own link' : details[spinning.id]?.ytNote}
          tracks={details[spinning.id]?.tracks} real={prefs.real} liveCover={live[spinning.id]} playToken={playToken} searchUrl={yt(spinning)}
          onStep={step} onClose={() => setSpinId(null)}
          onLink={id => setLinks(l => { const n = { ...l }; if (id) n[spinning.id] = id; else delete n[spinning.id]; return n })}
        />
      )}
    </>
  )
}
