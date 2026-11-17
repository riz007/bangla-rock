# Bangla Rock Crate — বাংলা রক ক্রেট

An interactive crate of 88 Bangladeshi rock, metal, fusion and mixed-album releases (1990–2013),
reimagined from the catalogue at [banglacdcovers.blogspot.com](https://banglacdcovers.blogspot.com/),
collected and scanned by Shohail Ibne Mahbub (XTR).

## What it does

- **Dig the crate** — search by album, band, year, label or Bangla name; filter by era and by category.
- **Real cover scans** — each album shows its original cover, loaded straight from the source blog, with generated
  era-styled artwork underneath as the loading state and fallback (toggle in the theme panel).
- **Album sheets** — label, format, line-up, credits and track list for all 88 releases, plus a draggable WebGL jewel case.
- **Crate Deck player** — a retro desktop-player that plays albums through YouTube's embedded player. 81 of 88 albums have a
  video or playlist linked, most with backups the deck falls back to if one is removed or blocks embedding. For the
  rest, paste any YouTube link into the deck and it is remembered in that browser.
- **Four era themes** — '70s Shadhin, '80s Cassette, '90s Photocopy, '00s Underground, with accent colour, grain,
  motion and density controls. The theme can follow the album you open.
- **Mixtape** — save albums in the browser and play them from the list.
- **Deep links** — every album has a URL (`#artcell-oniket-prantor-2006`).

## Where the content comes from

- **Catalogue, covers, line-ups, credits, tracks:** [banglacdcovers.blogspot.com](https://banglacdcovers.blogspot.com/).
  Cover images are read at runtime from the blog's public feed (`src/feed.ts`) and hotlinked from its own hosting,
  never copied into this repo; `covers.json` is the fallback. The 3D case loads the same scan through the
  [wsrv.nl](https://wsrv.nl) image proxy, because WebGL can't use images from hosts that don't send CORS headers. The scans are XTR's work and the
  artwork belongs to the bands and labels — ask him before launching publicly, and expect covers to disappear if the blog does.
- **Music:** YouTube's IFrame player. Nothing is downloaded or re-hosted. Linked videos can be removed or have embedding
  disabled at any time; the deck then asks for another link.
- **Category grouping and band notes** are editorial.

## Editing the data

- `src/data/albums.ts` — one row per release, artist → category map, era ranges, band notes.
- `scripts/covers.txt`, `scripts/details.txt` — cover references and per-album details (`Y:` is the YouTube video or
  playlist id). Run `python3 scripts/build-data.py` to regenerate `src/data/covers.json` and `details.json`; it fails
  if an album is missing or a title does not match.

## SEO, analytics and crawlers

- **Google Tag Manager** (`GTM-54KR7LRC`) in `index.html`, plus a `page_view` event pushed to `dataLayer` on every in-app
  navigation (`page_path`, `page_title`). Set up a GA4 tag in GTM triggered on that custom event to count album views.
- **One real page per album** at `/album/<id>/`, pre-rendered at build by `scripts/seo-plugin.ts` with its own title,
  description, canonical, Open Graph / Twitter tags, `MusicAlbum` + `BreadcrumbList` JSON-LD and crawlable HTML (tracks,
  line-up, credits) that the app replaces when it boots. Old `#<id>` links still work.
- **Home page**: `WebSite` + `CollectionPage` JSON-LD listing every album, and a crawlable list of all album links.
- **Generated at build**: `sitemap.xml`, `llms.txt`, `llms-full.txt` (whole catalogue as text for LLMs).
- **Static**: `robots.txt`, `og.png` (1200×630 share image), favicons, `site.webmanifest`.
- Regenerate the share image with `npm i --no-save @fontsource/anton @fontsource/hind-siliguri @fontsource/monoton
  @fontsource/special-elite`, `npx vite`, then screenshot `/scripts/og/index.html` at 1200×630.

## Run

```bash
npm install
npm run dev      # local dev
npm run build    # type-check + production build to dist/
```

Static output; deploys as-is to Vercel, Netlify or GitHub Pages (`base: './'`).
First load is about 100 kB gzipped; album details (13 kB) and three.js (about 245 kB) load when an album is opened,
and the YouTube player loads only when you press play.

Stack: Vite, React 19, TypeScript, three.js + @react-three/fiber, plain CSS custom properties for theming.
