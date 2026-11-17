// Vite plugin: fills the <head> with per-page SEO tags, pre-renders one static page per
// album (crawlable HTML that the app takes over), and writes sitemap.xml, llms.txt and
// llms-full.txt. Runs in dev for the home page and at build for everything.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";
import {
  ALBUMS,
  ARTISTS,
  ERAS,
  GENRES,
  SOURCE,
  type Album,
  type Details,
} from "../src/data/albums";
import detailsJson from "../src/data/details.json";
import {
  OG_IMAGE,
  SITE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_BN,
  SITE_TITLE,
  VA,
  albumDescription,
  albumJsonLd,
  albumPath,
  albumTitle,
  albumUrl,
  describe,
  siteJsonLd,
} from "../src/seo";

const details = detailsJson as Record<string, Details>;
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const ld = (o: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const by = (a: Album) => (a.artist === VA ? "Various Artists" : a.artist);

function head(p: {
  title: string;
  description: string;
  path: string;
  type: string;
  imageAlt: string;
  jsonLd: unknown[];
  extra?: string;
}) {
  const url = SITE + p.path;
  return [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${p.type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(p.imageAlt)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:locale:alternate" content="bn_BD" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:creator" content="@rizwanulrudra" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(p.imageAlt)}" />`,
    p.extra ?? "",
    ...p.jsonLd.map(ld),
  ]
    .filter(Boolean)
    .join("\n    ");
}

const OG_ALT = `${SITE_NAME} — a crate of Bangladeshi rock albums from 1990 to 2013`;

const homeHead = () =>
  head({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
    type: "website",
    imageAlt: OG_ALT,
    jsonLd: siteJsonLd(),
  });

function homeBody() {
  const eras = ERAS.map((e) => {
    const items = ALBUMS.filter((a) => a.year >= e.from && a.year <= e.to)
      .map(
        (a) =>
          `<li><a href="${albumPath(a)}">${esc(a.title)}</a> — ${esc(by(a))} (${a.year})</li>`,
      )
      .join("");
    return `<section><h2>${esc(e.name)} · ${esc(e.tag)}</h2><ul>${items}</ul></section>`;
  }).join("");
  return `<main class="seo"><h1>${SITE_NAME} <span lang="bn">${SITE_NAME_BN}</span></h1><p>${esc(SITE_DESCRIPTION)}</p>${eras}<p>Catalogue and cover scans from <a href="${SOURCE}">Bangla CD Covers</a>, collected by Shohail Ibne Mahbub (XTR).</p></main>`;
}

function albumHead(a: Album) {
  const d = details[a.id];
  return head({
    title: albumTitle(a),
    description: albumDescription(a, d),
    path: albumPath(a),
    type: "music.album",
    imageAlt: OG_ALT,
    jsonLd: albumJsonLd(a, d, a.cover),
  });
}

function albumBody(a: Album) {
  const d = details[a.id] ?? {};
  const list = (t: string, xs?: string[]) =>
    xs?.length
      ? `<h2>${t}</h2><ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : "";
  return (
    `<main class="seo"><nav><a href="/">${SITE_NAME}</a> › ${esc(a.title)}</nav><article>` +
    `<h1>${esc(a.title)}</h1><p>${esc(by(a))}${ARTISTS[a.artist]?.bn ? ` <span lang="bn">${ARTISTS[a.artist].bn}</span>` : ""} · ${a.year} · ${esc(GENRES[a.genre])}${(d.label ?? a.label) ? ` · ${esc(d.label ?? a.label!)}` : ""}${d.format ? ` · ${esc(d.format)}` : ""}</p>` +
    `<p>${esc(describe(a))}</p>` +
    (d.tracks
      ? `<h2>Tracks</h2><ol>${d.tracks.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`
      : "") +
    list("Line-up", d.lineup) +
    list("Credits", d.credits) +
    (a.with.length
      ? `<h2>${a.artist === VA ? "On this disc" : "With"}</h2><p>${a.with.map(esc).join(", ")}</p>`
      : "") +
    `<p><a href="${a.src}">Original cover scans and notes on Bangla CD Covers</a></p></article></main>`
  );
}

function between(html: string, name: string, content: string) {
  const re = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!re.test(html))
    throw new Error(
      `seo-plugin: missing <!--${name}:start/end--> markers in index.html`,
    );
  return html.replace(
    re,
    `<!--${name}:start-->\n    ${content}\n    <!--${name}:end-->`,
  );
}

function sitemap(today: string) {
  const url = (loc: string, pri: string) =>
    `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${pri}</priority></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[url(`${SITE}/`, "1.0"), ...ALBUMS.map((a) => url(albumUrl(a), "0.8"))].join("\n")}\n</urlset>\n`;
}

function llms() {
  const eras = ERAS.map(
    (e) =>
      `## ${e.name} — ${e.tag}\n\n${ALBUMS.filter(
        (a) => a.year >= e.from && a.year <= e.to,
      )
        .map(
          (a) =>
            `- [${a.title} — ${by(a)} (${a.year})](${albumUrl(a)}): ${GENRES[a.genre]}${a.label ? `, ${a.label}` : ""}`,
        )
        .join("\n")}`,
  ).join("\n\n");
  return `# ${SITE_NAME} (${SITE_NAME_BN})

> An interactive archive of ${ALBUMS.length} Bangladeshi rock, heavy metal, folk-fusion, hip-hop and band mixed albums released between 1990 and 2013, with original cover scans, line-ups, credits, track lists and a YouTube-backed player.

The catalogue is derived from Bangla CD Covers (${SOURCE}), a blog of CD and cassette scans collected by Shohail Ibne Mahbub (XTR). Each album has its own page with structured data (schema.org MusicAlbum). Category grouping and short band notes are editorial. Music and artwork belong to the artists and labels.

- [Full catalogue as plain text](${SITE}/llms-full.txt): every album with year, label, format, line-up, credits and track list
- [Sitemap](${SITE}/sitemap.xml)
- [Source archive: Bangla CD Covers](${SOURCE})

${eras}
`;
}

function llmsFull() {
  const blocks = ALBUMS.map((a) => {
    const d = details[a.id] ?? {};
    return [
      `## ${a.title} — ${by(a)} (${a.year})`,
      "",
      `- URL: ${albumUrl(a)}`,
      `- Category: ${GENRES[a.genre]}`,
      (d.label ?? a.label) && `- Label: ${d.label ?? a.label}`,
      d.format && `- Format: ${d.format}`,
      a.with.length &&
        `- ${a.artist === VA ? "Artists on this disc" : "With"}: ${a.with.join(", ")}`,
      d.lineup && `- Line-up: ${d.lineup.join("; ")}`,
      d.credits && `- Credits: ${d.credits.join("; ")}`,
      d.tracks &&
        `- Tracks: ${d.tracks.map((t, i) => `${i + 1}. ${t}`).join(" / ")}`,
      `- About: ${describe(a)}`,
      `- Source: ${a.src}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `# ${SITE_NAME} — full catalogue\n\n> ${SITE_DESCRIPTION}\n\nSource archive: ${SOURCE}\n\n${blocks.join("\n\n")}\n`;
}

export function seoPages(): Plugin {
  let outDir = "dist";
  return {
    name: "bangla-rock-seo",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    transformIndexHtml(html) {
      if (!html.includes("<!--seo:start-->")) return html; // other pages (e.g. the OG image template)
      return between(between(html, "seo", homeHead()), "body", homeBody());
    },
    closeBundle() {
      const template = readFileSync(join(outDir, "index.html"), "utf8");
      for (const a of ALBUMS) {
        const file = join(outDir, "album", a.id, "index.html");
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(
          file,
          between(between(template, "seo", albumHead(a)), "body", albumBody(a)),
        );
      }
      writeFileSync(
        join(outDir, "sitemap.xml"),
        sitemap(new Date().toISOString().slice(0, 10)),
      );
      writeFileSync(join(outDir, "llms.txt"), llms());
      writeFileSync(join(outDir, "llms-full.txt"), llmsFull());
    },
  };
}
