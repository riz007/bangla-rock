import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@ui-sdk/react/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@ui-sdk/react/dialog";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle";
import { Cover } from "./components/Cover";
import {
  ALBUMS,
  ARTISTS,
  ERAS,
  GENRES,
  SOURCE,
  type Album,
  type Details,
  type Genre,
} from "./data/albums";
import { liveCovers } from "./feed";
import { SITE, SITE_TITLE, albumPath, albumTitle, describe } from "./seo";
import {
  THEMES,
  loadList,
  loadMap,
  loadPrefs,
  save,
  savePrefs,
  skinFor,
  themeFor,
  type Prefs,
  type ThemeId,
} from "./theme";

const CaseViewer = lazy(() => import("./components/CaseViewer"));
type Skin = import("./components/Player").Skin;
const Player = lazy(() =>
  import("./components/Player").then((m) => ({ default: m.Player })),
);

const byId = new Map(ALBUMS.map((a) => [a.id, a]));
const yt = (a: Album) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${a.artist === "Various Artists" ? "" : a.artist} ${a.title} full album`)}`;
const spotify = (a: Album) =>
  `https://open.spotify.com/search/${encodeURIComponent(`${a.artist === "Various Artists" ? "" : a.artist} ${a.title}`.trim())}`;
/** Album pages live at /album/<id>/ (pre-rendered for search engines); old #<id> links still open. */
const routeId = () =>
  location.pathname.match(/\/album\/([a-z0-9-]+)\/?$/)?.[1] ??
  location.hash.replace(/^#\/?(album\/)?/, "");

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}
const track = (path: string, title: string) => {
  (window.dataLayer ??= []).push({
    event: "page_view",
    page_path: path,
    page_location: location.href,
    page_title: title,
  });
};
/** Follow a same-site link inside the app unless the visitor asked for a new tab or window. */
const spa = (e: React.MouseEvent, fn: () => void) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  e.preventDefault();
  fn();
};

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [q, setQ] = useState("");
  const [era, setEra] = useState<string | null>(null);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [openId, setOpenId] = useState(routeId);
  const [spinId, setSpinId] = useState<string | null>(null);
  const [tape, setTape] = useState<string[]>(() =>
    loadList("bcc:mixtape").filter((id) => byId.has(id)),
  );
  const [panel, setPanel] = useState<"theme" | "tape" | null>(null);
  const [details, setDetails] = useState<Record<string, Details>>({});
  const [links, setLinks] = useState(() => loadMap("bcc:yt")); // the listener's own YouTube links
  const [playToken, setPlayToken] = useState(0);
  const [skinPick, setSkinPick] = useState<{ id: string; skin: Skin } | null>(
    null,
  );
  const [live, setLive] = useState<Record<string, string>>({}); // cover URLs read from the blog's own feed

  const open = byId.get(openId) ?? null;
  const spinning = (spinId && byId.get(spinId)) || null;
  const theme = prefs.follow && open ? themeFor(open) : prefs.theme;
  // a skin picked by hand holds for that album, even while following
  const skin =
    spinning && skinPick?.id === spinning.id
      ? skinPick.skin
      : prefs.follow && spinning
        ? skinFor(spinning)
        : prefs.skin;
  const accent = prefs.accent ?? THEMES.find((t) => t.id === theme)!.accent;

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = theme;
    el.dataset.grain = String(prefs.grain);
    el.dataset.motion = String(prefs.motion);
    el.style.setProperty("--accent", accent);
    savePrefs(prefs);
  }, [prefs, theme, accent]);
  useEffect(() => save("bcc:mixtape", tape), [tape]);
  useEffect(() => save("bcc:yt", links), [links]);
  useEffect(() => {
    if (prefs.real) void liveCovers().then(setLive);
  }, [prefs.real]);
  // line-ups, credits and track lists load on first use, not with the grid
  const wantDetails = !!(openId || spinId);
  useEffect(() => {
    if (wantDetails)
      void import("./data/details.json").then((m) =>
        setDetails(m.default as Record<string, Details>),
      );
  }, [wantDetails]);
  useEffect(() => {
    // upgrade a legacy #id link to its real page URL
    if (location.hash && byId.has(routeId()))
      history.replaceState(null, "", `/album/${routeId()}/`);
    const on = () => setOpenId(routeId());
    addEventListener("popstate", on);
    addEventListener("hashchange", on);
    return () => {
      removeEventListener("popstate", on);
      removeEventListener("hashchange", on);
    };
  }, []);
  // keep title + canonical in step with the open album, and tell Tag Manager about the virtual page view
  useEffect(() => {
    const title = open ? albumTitle(open) : SITE_TITLE;
    const path = open ? albumPath(open) : "/";
    document.title = title;
    document
      .querySelector("link[rel=canonical]")
      ?.setAttribute("href", SITE + path);
    track(path, title);
  }, [open]);
  useEffect(() => {
    if (open) setSpinId(open.id);
  }, [open]);

  const go = useCallback((id: string | null) => {
    const path = id ? `/album/${id}/` : "/";
    if (location.pathname + location.hash !== path)
      history.pushState(null, "", path + location.search);
    setOpenId(id ?? "");
  }, []);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panel && !open) setPanel(null);
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [panel, open]);

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const e = ERAS.find((x) => x.id === era);
    return ALBUMS.filter((a) => {
      if (e && (a.year < e.from || a.year > e.to)) return false;
      if (genre && a.genre !== genre) return false;
      const hay =
        `${a.title} ${a.artist} ${a.year} ${a.with.join(" ")} ${a.label ?? ""} ${GENRES[a.genre]} ${ARTISTS[a.artist]?.bn ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [q, era, genre]);

  const step = (d: number) => {
    const pool = list.length ? list : ALBUMS;
    const i = pool.findIndex((a) => a.id === spinning?.id);
    const next = pool[(i + d + pool.length) % pool.length];
    open ? go(next.id) : setSpinId(next.id);
  };
  const info = open ? details[open.id] : undefined;
  const sourceOf = (a: Album) =>
    [links[a.id], ...(details[a.id]?.yt ?? [])].filter((s): s is string => !!s);
  const playAlbum = (a: Album) => {
    setSpinId(a.id);
    setPlayToken((t) => t + 1);
  };
  const toggleTape = (id: string) =>
    setTape((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const set = (p: Partial<Prefs>) => setPrefs((v) => ({ ...v, ...p }));
  const search = (term: string) => {
    setQ(term);
    setEra(null);
    setGenre(null);
    go(null);
    scrollTo({ top: 0 });
  };

  return (
    <>
      <header className="top">
        <a className="brand" href="/" onClick={(e) => spa(e, () => search(""))}>
          <span className="brand-disc" aria-hidden="true" />
          <span>
            <strong>Bangla Rock Crate</strong>
            <em lang="bn">বাংলা রক ক্রেট · ১৯৯০–২০১৩</em>
          </span>
        </a>
        <Field className="search">
          <FieldLabel className="sr">Search albums, bands or years</FieldLabel>
          <Input
            type="search"
            value={q}
            onValueChange={setQ}
            placeholder="Search — Warfaze, 2006, Agontuk, অর্থহীন…"
          />
        </Field>
        <div className="actions">
          <Toggle
            pressed={panel === "tape"}
            onPressedChange={(on) => setPanel(on ? "tape" : null)}
          >
            Mixtape <b>{tape.length}</b>
          </Toggle>
          <Toggle
            pressed={panel === "theme"}
            onPressedChange={(on) => setPanel(on ? "theme" : null)}
          >
            Theme · {THEMES.find((t) => t.id === theme)!.era}
          </Toggle>
        </div>
      </header>

      <section className="hero">
        <p className="kicker">
          {ALBUMS.length} releases ·{" "}
          {new Set(ALBUMS.flatMap((a) => [a.artist, ...a.with])).size - 1} acts
          · a crate you can dig through
        </p>
        <h1>
          The sound of <span>Dhaka</span>, sleeve by sleeve.
        </h1>
        <p className="lede">
          From the first heavy records of 1990 to the mixed-album underground of
          the 2000s. Pick an era, pick a mood, and change the room to match.
          Cover scans, line-ups and credits come from{" "}
          <a href={SOURCE} target="_blank" rel="noreferrer">
            XTR’s Bangla CD Covers archive
          </a>
          ; music plays through YouTube.
        </p>
      </section>

      <nav className="filters" aria-label="Filter the crate">
        <SegmentedControl
          className="timeline"
          aria-label="Era"
          value={era ?? "all"}
          onValueChange={(v) => setEra(!v || v === "all" ? null : v)}
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem value="all">
            All years <small>{ALBUMS.length}</small>
          </SegmentedControlItem>
          {ERAS.map((e) => (
            <SegmentedControlItem key={e.id} value={e.id}>
              {e.name}{" "}
              <small>
                {e.tag} ·{" "}
                {
                  ALBUMS.filter((a) => a.year >= e.from && a.year <= e.to)
                    .length
                }
              </small>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <ToggleGroup
          className="chips"
          aria-label="Genre"
          value={genre ? [genre] : []}
          onValueChange={(v) => setGenre((v[0] as Genre) ?? null)}
        >
          {(Object.keys(GENRES) as Genre[]).map((g) => (
            <Toggle key={g} value={g}>
              {GENRES[g]}{" "}
              <small>{ALBUMS.filter((a) => a.genre === g).length}</small>
            </Toggle>
          ))}
        </ToggleGroup>
      </nav>

      <main className={`crate${prefs.dense ? " dense" : ""}`}>
        {list.map((a) => (
          <a
            key={a.id}
            className="sleeve"
            href={albumPath(a)}
            onClick={(e) => spa(e, () => go(a.id))}
            style={
              {
                "--tilt": `${((a.id.length * 7) % 5) - 2}deg`,
              } as React.CSSProperties
            }
          >
            <span className="sleeve-art">
              <span className="sleeve-disc" aria-hidden="true" />
              <Cover album={a} real={prefs.real} live={live[a.id]} />
            </span>
            <span className="sleeve-meta">
              <strong>{a.title}</strong>
              <span>
                {a.artist} · {a.year}
              </span>
            </span>
          </a>
        ))}
        {!list.length && (
          <p className="empty">
            Nothing in the crate for that.{" "}
            <Button onClick={() => search("")}>Clear filters</Button>
          </p>
        )}
      </main>

      <footer className="foot">
        Catalogue data from{" "}
        <a href={SOURCE} target="_blank" rel="noreferrer">
          banglacdcovers.blogspot.com
        </a>
        , collected and scanned by Shohail Ibne Mahbub (XTR) since 2012. Cover
        scans load directly from his blog; the patterned artwork behind them is
        generated. Music plays through YouTube’s embedded player. All music and
        artwork belong to the artists and labels.
      </footer>

      <Dialog
        open={!!open}
        onOpenChange={(o) => !o && go(null)}
        persistentElements={[".amp-host"]}
        onOpenChangeComplete={(o) =>
          dispatchEvent(new Event(o ? "amp:raise" : "amp:lower"))
        }
      >
        <DialogBackdrop className="sheet-wrap" />
        {open && (
          <DialogContent className="sheet">
            <DialogClose className="close" aria-label="Close album">
              <span aria-hidden="true">×</span>
            </DialogClose>
            <Suspense
              fallback={
                <div className="viewer">
                  <Cover
                    album={open}
                    size={512}
                    real={prefs.real}
                    live={live[open.id]}
                  />
                </div>
              }
            >
              <CaseViewer
                album={open}
                motion={prefs.motion}
                accent={accent}
                real={prefs.real}
                live={live[open.id]}
              />
            </Suspense>
            <div className="sheet-body">
              <p className="kicker">
                {GENRES[open.genre]} · {open.year}
              </p>
              <DialogTitle>{open.title}</DialogTitle>
              <p className="artist">
                {open.artist === "Various Artists" ? (
                  open.artist
                ) : (
                  <Button className="link" onClick={() => search(open.artist)}>
                    {open.artist}
                  </Button>
                )}
                {ARTISTS[open.artist]?.bn && (
                  <em lang="bn"> {ARTISTS[open.artist].bn}</em>
                )}
              </p>
              <p className="desc">{describe(open)}</p>
              {open.with.length > 0 && (
                <>
                  <h3>{open.genre === "mix" ? "On this disc" : "With"}</h3>
                  <div className="chips small">
                    {open.with.map((w) => (
                      <Button
                        key={w}
                        onClick={() => search(w)}
                        title={ARTISTS[w]?.note}
                      >
                        {w}
                      </Button>
                    ))}
                  </div>
                </>
              )}
              <div className="cta">
                <Button className="btn primary" onClick={() => playAlbum(open)}>
                  <span aria-hidden="true">▶ </span>Put it on the deck
                </Button>
                <a
                  className="btn"
                  href={yt(open)}
                  target="_blank"
                  rel="noreferrer"
                >
                  YouTube
                </a>
                <a
                  className="btn"
                  href={spotify(open)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Spotify
                </a>
                <Toggle
                  className="btn"
                  pressed={tape.includes(open.id)}
                  onPressedChange={() => toggleTape(open.id)}
                >
                  <span aria-hidden="true">
                    {tape.includes(open.id) ? "✓ " : "+ "}
                  </span>
                  On my mixtape
                </Toggle>
              </div>
              {info && (
                <dl className="facts">
                  {(info.label ?? open.label) && (
                    <>
                      <dt>Label</dt>
                      <dd>{info.label ?? open.label}</dd>
                    </>
                  )}
                  {info.format && (
                    <>
                      <dt>Format</dt>
                      <dd>{info.format}</dd>
                    </>
                  )}
                  {info.lineup && (
                    <>
                      <dt>Line-up</dt>
                      <dd>{info.lineup.join(" · ")}</dd>
                    </>
                  )}
                  {info.credits && (
                    <>
                      <dt>Credits</dt>
                      <dd>{info.credits.join(" · ")}</dd>
                    </>
                  )}
                </dl>
              )}
              {info?.tracks && (
                <>
                  <h3>Tracks</h3>
                  <ol className="tracks">
                    {info.tracks.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ol>
                </>
              )}
              <a
                className="source"
                href={open.src}
                target="_blank"
                rel="noreferrer"
              >
                All scans, inlay and full notes on Bangla CD Covers ↗
              </a>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {panel === "theme" && (
        <aside className="panel" aria-label="Customise theme">
          <h2>Set the room</h2>
          <SegmentedControl
            className="themes"
            aria-label="Room"
            orientation="vertical"
            value={prefs.theme}
            onValueChange={(v) =>
              v && set({ theme: v as ThemeId, accent: null })
            }
          >
            <SegmentedControlIndicator />
            {THEMES.map((t) => (
              <SegmentedControlItem key={t.id} value={t.id} data-swatch={t.id}>
                <b>{t.era}</b> {t.name}
                <small>{t.blurb}</small>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <label className="row">
            Accent colour
            <span>
              <input
                type="color"
                value={accent}
                onChange={(e) => set({ accent: e.target.value })}
              />
              {prefs.accent && (
                <Button className="link" onClick={() => set({ accent: null })}>
                  Reset accent
                </Button>
              )}
            </span>
          </label>
          {(
            [
              ["real", "Real cover scans (off = generated art)"],
              ["follow", "Match the theme and player to the album I open"],
              ["grain", "Paper grain & print texture"],
              ["motion", "Spinning discs & motion"],
              ["dense", "Compact crate"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} className="row">
              <FieldLabel>{label}</FieldLabel>
              <Switch
                checked={prefs[k]}
                onCheckedChange={(on) => set({ [k]: on })}
              >
                <SwitchThumb />
              </Switch>
            </Field>
          ))}
        </aside>
      )}

      {panel === "tape" && (
        <aside className="panel" aria-label="Your mixtape">
          <h2>Your mixtape</h2>
          {!tape.length && (
            <p className="muted">
              Empty side A. Open an album and add it — it’s saved in this
              browser.
            </p>
          )}
          <ol className="tape">
            {tape.map((id) => {
              const a = byId.get(id)!;
              return (
                <li key={id}>
                  <a
                    href={albumPath(a)}
                    onClick={(e) =>
                      spa(e, () => {
                        setPanel(null);
                        go(id);
                      })
                    }
                  >
                    <strong>{a.title}</strong>
                    <span>
                      {a.artist} · {a.year}
                    </span>
                  </a>
                  <Button
                    onClick={() => playAlbum(a)}
                    aria-label={`Cue ${a.title}`}
                  >
                    <span aria-hidden="true">▶</span>
                  </Button>
                  <Button
                    onClick={() => toggleTape(id)}
                    aria-label={`Remove ${a.title}`}
                  >
                    <span aria-hidden="true">×</span>
                  </Button>
                </li>
              );
            })}
          </ol>
        </aside>
      )}

      <div className="amp-host">
        {spinning && (
          <Suspense fallback={null}>
            <Player
              album={spinning}
              sources={sourceOf(spinning)}
              note={
                links[spinning.id]
                  ? "your own link"
                  : details[spinning.id]?.ytNote
              }
              tracks={details[spinning.id]?.tracks}
              real={prefs.real}
              liveCover={live[spinning.id]}
              playToken={playToken}
              searchUrl={yt(spinning)}
              skin={skin}
              onSkin={(skin) => {
                set({ skin });
                setSkinPick({ id: spinning.id, skin });
              }}
              onStep={step}
              onClose={() => setSpinId(null)}
              onLink={(id) =>
                setLinks((l) => {
                  const n = { ...l };
                  if (id) n[spinning.id] = id;
                  else delete n[spinning.id];
                  return n;
                })
              }
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
