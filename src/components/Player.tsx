// A retro desktop-player style deck. Audio comes from YouTube's own embedded
// player (IFrame API) — nothing is downloaded or re-hosted. The video stays
// visible while playing, as YouTube's terms require.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Album } from "../data/albums";
import { Cover } from "./Cover";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let api: Promise<any> | null = null;
function loadApi(): Promise<any> {
  return (api ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    const fail = () => {
      api = null;
      reject(new Error("YouTube player unavailable"));
    };
    s.onerror = fail;
    document.head.append(s);
    setTimeout(() => {
      if (!window.YT?.Player) fail();
    }, 8000);
  }));
}

/** Accepts a watch/share/playlist URL or a bare id. */
export function parseYouTube(input: string): string | null {
  const s = input.trim();
  const list = s.match(/[?&]list=([\w-]{12,})/)?.[1];
  const vid = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1];
  if (vid) return vid;
  if (list) return list;
  return /^[\w-]{11}$/.test(s) || /^(PL|OL|UU)[\w-]{10,}$/.test(s) ? s : null;
}
const isList = (id: string) => id.length > 11;
const clock = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

type Status = "idle" | "loading" | "playing" | "paused" | "error" | "blocked";

export function Player(props: {
  album: Album;
  sources: string[];
  note?: string;
  tracks?: string[];
  real: boolean;
  liveCover?: string;
  playToken: number;
  searchUrl: string;
  onStep: (d: number) => void;
  onClose: () => void;
  onLink: (id: string | null) => void;
}) {
  const { album, sources, tracks, playToken } = props;
  const sourcesKey = sources.join("|");
  const [pick, setPick] = useState(0); // which candidate link is on the deck
  const [retry, setRetry] = useState(0);
  const source = sources[pick];
  // YouTube reports removed / non-embeddable videos through onError: move on to the next candidate
  const advance = useRef(() => {});
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<any>(null);
  const loadedSrc = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [mini, setMini] = useState(true); // opens as a slim bar; expands on play
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(80);
  const [now, setNow] = useState("");
  const [link, setLink] = useState("");

  const play = useCallback(async () => {
    if (!source) return;
    if (yt.current && loadedSrc.current === source)
      return yt.current.playVideo();
    setStatus("loading");
    try {
      const YT = await loadApi();
      loadedSrc.current = source;
      if (yt.current) {
        isList(source)
          ? yt.current.loadPlaylist({ list: source, listType: "playlist" })
          : yt.current.loadVideoById(source);
        return;
      }
      const mount = document.createElement("div");
      host.current!.replaceChildren(mount);
      yt.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        ...(isList(source) ? {} : { videoId: source }),
        playerVars: {
          playsinline: 1,
          rel: 0,
          autoplay: 1,
          ...(isList(source) ? { listType: "playlist", list: source } : {}),
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(vol);
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) setStatus("playing");
            else if (e.data === S.PAUSED) setStatus("paused");
            else if (e.data === S.ENDED) setStatus("idle");
            else if (e.data === S.BUFFERING)
              setStatus((s) => (s === "playing" ? s : "loading"));
          },
          onError: () => advance.current(),
        },
      });
    } catch {
      setStatus("blocked");
    }
  }, [source, vol]);

  advance.current = () => {
    if (pick + 1 < sources.length) {
      setPick(pick + 1);
      setRetry((r) => r + 1);
    } else setStatus("error");
  };
  useEffect(() => {
    if (retry) void play();
  }, [retry]); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    yt.current?.stopVideo?.();
    setStatus("idle");
    setTime(0);
  }, []);

  // a new album (or a newly linked source) stops whatever was on the deck
  useEffect(() => {
    if (loadedSrc.current) {
      yt.current?.stopVideo?.();
      loadedSrc.current = undefined;
    }
    setPick(0);
    setStatus("idle");
    setTime(0);
    setDur(0);
    setNow("");
    setLink("");
  }, [album.id, sourcesKey]);
  useEffect(() => {
    if (playToken) {
      setMini(false);
      void play();
    }
  }, [playToken]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => yt.current?.destroy?.(), []);
  useEffect(() => {
    if (status !== "playing") return;
    const t = setInterval(() => {
      const p = yt.current;
      if (!p?.getCurrentTime) return;
      setTime(p.getCurrentTime() || 0);
      setDur(p.getDuration() || 0);
      setNow(p.getVideoData?.().title || "");
    }, 500);
    return () => clearInterval(t);
  }, [status]);

  const label = {
    idle: source ? "READY" : "NO TAPE",
    loading: "CUEING",
    playing: "PLAY",
    paused: "PAUSE",
    error: "ERROR",
    blocked: "OFFLINE",
  }[status];
  const marquee = `${album.artist} — ${album.title} (${album.year})${now ? `  ···  ${now}` : ""}`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseYouTube(link);
    if (id) props.onLink(id);
  };

  return (
    <section
      className={`amp${mini ? " mini" : ""}`}
      data-status={status}
      aria-label="Player"
    >
      <header className="amp-bar">
        <span>CRATE DECK</span>
        <button
          onClick={() => setMini((m) => !m)}
          aria-label={mini ? "Expand player" : "Minimise player"}
        >
          {mini ? "▴" : "▾"}
        </button>
        <button
          onClick={() => {
            stop();
            props.onClose();
          }}
          aria-label="Close player"
        >
          ×
        </button>
      </header>

      <div className="amp-lcd">
        <span className="amp-disc">
          <Cover
            album={album}
            size={96}
            real={props.real}
            live={props.liveCover}
          />
        </span>
        <div className="amp-read">
          <div className="amp-time">
            {clock(time)}
            <small>{dur ? ` / ${clock(dur)}` : ""}</small>
            <b>{label}</b>
          </div>
          <div className="amp-marquee">
            <span>{marquee}</span>
          </div>
          <div className="amp-eq" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="amp-body">
        <div
          className="amp-screen"
          ref={host}
          hidden={
            !source ||
            status === "blocked" ||
            status === "error" ||
            (status === "idle" && !yt.current)
          }
        />
        {(!source || status === "error") &&
          (status === "error" || !sources.length) && (
            <form className="amp-note" onSubmit={submit}>
              <p>
                {sources.length
                  ? "None of the linked videos can play here (removed, or embedding is off)."
                  : "No YouTube track is linked to this album yet."}{" "}
                Paste a video or playlist link — it’s saved in this browser.
              </p>
              <span>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  aria-label="YouTube link"
                />
                <button disabled={!parseYouTube(link)}>Load</button>
              </span>
              <a href={props.searchUrl} target="_blank" rel="noreferrer">
                Find it on YouTube ↗
              </a>
            </form>
          )}
        {status === "blocked" && (
          <p className="amp-note">
            The YouTube player can’t load in this window.{" "}
            <a
              href={
                source
                  ? `https://www.youtube.com/${isList(source) ? `playlist?list=${source}` : `watch?v=${source}`}`
                  : props.searchUrl
              }
              target="_blank"
              rel="noreferrer"
            >
              Open on YouTube ↗
            </a>
          </p>
        )}
        {source && (props.note || pick > 0) && (
          <p className="amp-note small">
            {pick > 0
              ? `Link ${pick} wasn’t playable, so this is backup ${pick + 1} of ${sources.length}.`
              : `Linked: ${props.note}.`}
          </p>
        )}

        <input
          className="amp-seek"
          type="range"
          min={0}
          max={dur || 1}
          step={1}
          value={Math.min(time, dur || 1)}
          disabled={!dur}
          onChange={(e) => {
            const t = +e.target.value;
            setTime(t);
            yt.current?.seekTo?.(t, true);
          }}
          aria-label="Seek"
        />
        <div className="amp-ctl">
          <button onClick={() => props.onStep(-1)} aria-label="Previous album">
            ⏮
          </button>
          <button
            className="go"
            onClick={() => void play()}
            disabled={!source}
            aria-label="Play"
          >
            ▶
          </button>
          <button
            onClick={() => yt.current?.pauseVideo?.()}
            disabled={status !== "playing"}
            aria-label="Pause"
          >
            ⏸
          </button>
          <button onClick={stop} disabled={status === "idle"} aria-label="Stop">
            ⏹
          </button>
          <button onClick={() => props.onStep(1)} aria-label="Next album">
            ⏭
          </button>
          <label>
            VOL
            <input
              type="range"
              min={0}
              max={100}
              value={vol}
              onChange={(e) => {
                setVol(+e.target.value);
                yt.current?.setVolume?.(+e.target.value);
              }}
              aria-label="Volume"
            />
          </label>
        </div>
        {tracks && tracks.length > 0 && (
          <ol className="amp-list" aria-label="Track list">
            {tracks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
