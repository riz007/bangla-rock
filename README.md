# Bangla Rock Crate — বাংলা রক ক্রেট

An interactive crate of 88 Bangladeshi rock, metal and fusion albums (1990–2013): real cover scans, a 3D jewel case, line-ups, track lists and a retro player.

**Live:** [banglarock.riz1.dev](https://banglarock.riz1.dev)

![Bangla Rock Crate](public/og.png)

## Architecture

```mermaid
flowchart LR
  subgraph build["Build (Vite)"]
    D["scripts/*.txt<br/>catalogue · tracks · YouTube ids"] -->|build-data.py| J["src/data/*.json"]
    J --> S["seo-plugin.ts"]
    S --> P["88 pre-rendered<br/>/album/&lt;id&gt;/ pages"]
    S --> X["sitemap.xml · llms.txt<br/>JSON-LD · OG tags"]
  end

  subgraph app["Browser (React)"]
    G["Crate grid<br/>search · eras · themes"] --> A["Album sheet"]
    A --> C["3D jewel case<br/>three.js · lazy-loaded"]
    A --> K["Crate Deck player"]
  end

  P --> G
  B[("Blogger feed<br/>cover scans")] -->|JSONP| G
  B -->|wsrv.nl CORS proxy| C
  Y[("YouTube<br/>IFrame API")] --> K
```

| Layer | What it does |
|---|---|
| `src/data/` | Album catalogue, line-ups, credits, tracks, YouTube ids |
| `src/feed.ts` | Pulls live cover URLs from the blog's feed; `covers.json` is the fallback |
| `src/cover.ts` | Era-styled generated artwork, shown while covers load |
| `src/components/CaseViewer.tsx` | WebGL jewel case and spinning disc (React Three Fiber) |
| `src/components/Player.tsx` | Desktop-player style deck; falls through backup links if a video won't embed |
| `src/seo.ts`, `scripts/seo-plugin.ts` | Per-album pages, structured data, sitemap, `llms.txt` |

**Stack:** Vite · React 19 · TypeScript · three.js / React Three Fiber · plain CSS themes · Google Tag Manager

## Run

```bash
npm install
npm run dev     # local
npm run build   # → dist/
```

## Credits

- **Catalogue & cover scans** — [Bangla CD Covers](https://banglacdcovers.blogspot.com/) by Shohail Ibne Mahbub (XTR)
- **Music** — streamed via YouTube; all music and artwork belong to the artists and labels
- **Image proxy** — [wsrv.nl](https://wsrv.nl)
- **Fonts** — Anton, Monoton, Special Elite, Hind Siliguri (Google Fonts)

Built by [Rizwanul Islam Rudra](https://riz1.dev).
