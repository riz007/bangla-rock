# Bangla CD Covers — বাংলা রক আর্কাইভ

An interactive crate of 88 Bangladeshi rock, metal, fusion and mixed-album releases (1990–2013),
reimagined from the catalogue at [banglacdcovers.blogspot.com](https://banglacdcovers.blogspot.com/),
collected and scanned by Shohail Ibne Mahbub (XTR).

## What it does

- **Dig the crate** — search by album, band, year, label or Bangla name; filter by era and by category.
- **Four era themes** — '70s Shadhin, '80s Cassette, '90s Photocopy, '00s Underground. Pick one, change the
  accent colour, toggle grain, motion and density. The theme can also follow the album you open.
- **3D jewel case** — opening an album loads a small WebGL scene (React Three Fiber): drag the case, the disc spins.
- **Mixtape + now-spinning deck** — save albums in the browser, step through the crate, jump out to YouTube or Spotify.
- **Deep links** — every album has a URL (`#/album/artcell-oniket-prantor-2006`).

## About the artwork

Cover images here are **original generative art** (`src/cover.ts`), seeded per album and styled by era and genre.
They are not the real album covers. Each album links to its original scan, line-up and credits on the source blog.
No audio is hosted; "Listen" opens a search on YouTube or Spotify.

## Editing the catalogue

`src/data/albums.ts` holds everything: one row per release, the artist → category map, era ranges and short band notes.
Titles, years and featured-artist tags follow the blog's labels. Category grouping and band notes are editorial — correct them freely.

## Run

```bash
npm install
npm run dev      # local dev
npm run build    # type-check + production build to dist/
```

Static output; deploys as-is to Vercel, Netlify or GitHub Pages (`base: './'`).
First load is about 85 kB gzipped; three.js (about 245 kB gzipped) only loads when an album is opened.

Stack: Vite, React 19, TypeScript, three.js + @react-three/fiber, plain CSS custom properties for theming.
