// Everything search engines, link previews and LLMs see. Pure functions, no DOM:
// used by the app at runtime and by the build plugin that pre-renders each page.
import { ALBUMS, ARTISTS, ERAS, GENRES, SOURCE, type Album, type Details } from './data/albums'

export const SITE = 'https://banglarock.riz1.dev'
export const SITE_NAME = 'Bangla Rock Crate'
export const SITE_NAME_BN = 'বাংলা রক ক্রেট'
export const SITE_TITLE = `${SITE_NAME} — Bangladeshi rock & metal albums, 1990–2013`
export const SITE_DESCRIPTION =
  `Dig through ${ALBUMS.length} Bangladeshi rock, metal, folk-fusion and band mixed albums from 1990 to 2013 — Warfaze, Artcell, Aurthohin, Black, Cryptic Fate, Shironamhin, Arnob and more. Real cover scans, line-ups, track lists, and a player.`
export const OG_IMAGE = `${SITE}/og.png`
export const VA = 'Various Artists'

export const albumPath = (a: Album) => `/album/${a.id}/`
export const albumUrl = (a: Album) => `${SITE}${albumPath(a)}`
const by = (a: Album) => (a.artist === VA ? 'band mixed album' : a.artist)

export function describe(a: Album) {
  const kind = a.genre === 'mix'
    ? `A band mixed album from ${a.year} gathering ${a.with.length} acts on one disc — the format that carried the Dhaka underground from rehearsal pads to record shops.`
    : `${a.title === a.artist ? 'The self-titled release' : 'A release'} by ${a.artist}, ${a.year}. Filed under ${GENRES[a.genre].toLowerCase()}.`
  return [kind, ARTISTS[a.artist]?.note, a.label && `Released on ${a.label}.`].filter(Boolean).join(' ')
}

export const albumTitle = (a: Album) => `${a.title} — ${by(a)} (${a.year}) | ${SITE_NAME}`

export function albumDescription(a: Album, d?: Details) {
  const label = d?.label ?? a.label
  const who = a.artist === VA ? `Bangladeshi band mixed album (${a.year}) featuring ${a.with.slice(0, 4).join(', ')}${a.with.length > 4 ? ' and more' : ''}` : `${a.artist}’s ${a.year} album`
  const parts = [`${a.title}: ${who}${label ? ` on ${label}` : ''}.`, 'Cover art', d?.lineup ? 'line-up' : '', d?.tracks ? `${d.tracks.length} tracks` : '']
  const s = `${parts[0]} ${parts.slice(1).filter(Boolean).join(', ')} — and play it on the deck.`
  return s.length > 160 ? `${s.slice(0, 157).replace(/\s+\S*$/, '')}…` : s
}

const productionType = (a: Album) =>
  /live/i.test(a.title) ? 'https://schema.org/LiveAlbum' : a.artist === VA ? 'https://schema.org/CompilationAlbum' : 'https://schema.org/StudioAlbum'

export function albumJsonLd(a: Album, d: Details | undefined, cover?: string) {
  const label = d?.label ?? a.label
  return [{
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': `${albumUrl(a)}#album`,
    name: a.title,
    url: albumUrl(a),
    datePublished: String(a.year),
    genre: GENRES[a.genre],
    inLanguage: 'bn',
    description: describe(a),
    albumProductionType: productionType(a),
    albumReleaseType: 'https://schema.org/AlbumRelease',
    byArtist: a.artist === VA
      ? a.with.map(name => ({ '@type': 'MusicGroup', name }))
      : { '@type': 'MusicGroup', name: a.artist, ...(ARTISTS[a.artist]?.bn ? { alternateName: ARTISTS[a.artist].bn } : {}) },
    ...(label ? { recordLabel: { '@type': 'Organization', name: label } } : {}),
    ...(cover ? { image: cover } : {}),
    ...(d?.tracks ? {
      numTracks: d.tracks.length,
      track: { '@type': 'ItemList', numberOfItems: d.tracks.length, itemListElement: d.tracks.map((t, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'MusicRecording', name: t } })) },
    } : {}),
    sameAs: a.src,
    isPartOf: { '@id': `${SITE}/#website` },
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: `${a.title} (${a.year})`, item: albumUrl(a) },
    ],
  }]
}

export function siteJsonLd() {
  return [{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: SITE_NAME,
    alternateName: SITE_NAME_BN,
    url: `${SITE}/`,
    description: SITE_DESCRIPTION,
    inLanguage: ['en', 'bn'],
    creator: { '@type': 'Person', name: 'Rizwanul Islam Rudra', url: 'https://riz1.dev' },
  }, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE}/#crate`,
    name: SITE_TITLE,
    url: `${SITE}/`,
    isPartOf: { '@id': `${SITE}/#website` },
    citation: SOURCE,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: ALBUMS.length,
      itemListElement: ALBUMS.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: albumUrl(a), name: `${a.title} — ${by(a)} (${a.year})` })),
    },
  }]
}

export { ERAS }
