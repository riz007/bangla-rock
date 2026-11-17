// Audio comes from YouTube's own embedded player (IFrame API): nothing is
// downloaded or re-hosted, and the video stays visible while it plays, as
// YouTube's terms require. Two faces share one engine: a cassette deck and a
// late-90s desktop player.
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/react/slider";
import { Toggle } from "@ui-sdk/react/toggle";
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

export type Skin = "tape" | "desktop";
export const SKINS: { id: Skin; name: string }[] = [
  { id: "tape", name: "Tape deck" },
  { id: "desktop", name: "Desktop ’98" },
];

type Status = "idle" | "loading" | "playing" | "paused" | "error" | "blocked";
type Wind = "rew" | "ff" | null;

interface Deck {
  status: Status;
  label: string;
  time: number;
  dur: number;
  vol: number;
  source?: string;
  wind: Wind;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (t: number) => void;
  volume: (v: number) => void;
  step: (d: number) => void;
  eject: () => void;
}

const readVol = () => {
  const v = Number(globalThis.localStorage?.getItem("bcc:vol"));
  return Number.isFinite(v) && v > 0 && v <= 100 ? v : 80;
};

export function Player(props: {
  album: Album;
  sources: string[];
  note?: string;
  tracks?: string[];
  real: boolean;
  liveCover?: string;
  playToken: number;
  searchUrl: string;
  skin: Skin;
  onSkin: (s: Skin) => void;
  onStep: (d: number) => void;
  onClose: () => void;
  onLink: (id: string | null) => void;
}) {
  const { album, sources, tracks, playToken, skin } = props;
  const sourcesKey = sources.join("|");
  const [pick, setPick] = useState(0);
  const [retry, setRetry] = useState(0);
  const source = sources[pick];
  // YouTube reports removed or non-embeddable videos through onError: try the next candidate
  const advance = useRef(() => {});
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<any>(null);
  const loadedSrc = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [mini, setMini] = useState(true);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(readVol);
  const volRef = useRef(vol);
  const [now, setNow] = useState("");
  const [link, setLink] = useState("");
  const [swap, setSwap] = useState(false);
  const [wind, setWind] = useState<Wind>(null);
  const [list, setList] = useState(true);
  const shell = useRef<HTMLElement>(null);

  // The album sheet is a top-layer dialog: while it's open the player joins
  // the top layer above it, and drops back to a plain fixed panel after.
  useEffect(() => {
    const el = shell.current;
    if (!el?.showPopover) return;
    const raise = () => {
      if (el.matches(":popover-open")) el.hidePopover();
      el.popover = "manual";
      el.showPopover();
    };
    const lower = () => {
      if (!el.popover) return;
      el.hidePopover();
      el.removeAttribute("popover");
    };
    if (document.querySelector(".sheet[data-open]")) raise();
    addEventListener("amp:raise", raise);
    addEventListener("amp:lower", lower);
    return () => {
      removeEventListener("amp:raise", raise);
      removeEventListener("amp:lower", lower);
    };
  }, []);

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
            e.target.setVolume(volRef.current);
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
  }, [source]);

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

  // a new album, or a newly linked source, stops whatever was on the deck
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
    setSwap(false);
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
  useEffect(() => {
    if (!wind) return;
    const t = setTimeout(() => setWind(null), 700);
    return () => clearTimeout(t);
  }, [wind]);

  const deck: Deck = {
    status,
    label: {
      idle: source ? "READY" : "NO TAPE",
      loading: "CUEING",
      playing: "PLAY",
      paused: "PAUSE",
      error: "ERROR",
      blocked: "OFFLINE",
    }[status],
    time,
    dur,
    vol,
    source,
    wind,
    play: () => {
      setMini(false);
      void play();
    },
    pause: () => yt.current?.pauseVideo?.(),
    stop,
    seek: (t) => {
      setTime(t);
      yt.current?.seekTo?.(t, true);
    },
    volume: (v) => {
      setVol(v);
      volRef.current = v;
      yt.current?.setVolume?.(v);
      try {
        localStorage.setItem("bcc:vol", String(v));
      } catch {
        /* private mode */
      }
    },
    step: (d) => {
      setWind(d < 0 ? "rew" : "ff");
      props.onStep(d);
    },
    eject: () => {
      stop();
      setMini(false);
      setSwap(true);
    },
  };

  const marquee = `${album.artist} — ${album.title} (${album.year})${now ? `  ···  ${now}` : ""}`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseYouTube(link);
    if (id) {
      setSwap(false);
      props.onLink(id);
    }
  };
  const askLink =
    swap || (status === "error" && sources.length > 0) || !sources.length;
  const art = (size: number) => (
    <Cover album={album} size={size} real={props.real} live={props.liveCover} />
  );

  return (
    <section
      ref={shell}
      className={`amp${mini ? " mini" : ""}`}
      data-skin={skin}
      data-status={status}
      aria-label="Player"
    >
      <header className="amp-bar">
        <span className="amp-title">
          {skin === "tape" ? "BRC-90 STEREO" : "CRATE AMP"}
        </span>
        <SegmentedControl
          className="amp-skins"
          aria-label="Player skin"
          value={skin}
          onValueChange={(v) => v && props.onSkin(v as Skin)}
        >
          <SegmentedControlIndicator />
          {SKINS.map((s) => (
            <SegmentedControlItem key={s.id} value={s.id}>
              {s.name}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <Button
          className="amp-win"
          onClick={() => setMini((m) => !m)}
          aria-label={mini ? "Expand player" : "Minimise player"}
        >
          <span aria-hidden="true">{mini ? "▴" : "▾"}</span>
        </Button>
        <Button
          className="amp-win"
          onClick={() => {
            stop();
            props.onClose();
          }}
          aria-label="Close player"
        >
          <span aria-hidden="true">×</span>
        </Button>
      </header>

      {skin === "tape" ? (
        <TapeFace d={deck} album={album} art={art(64)} />
      ) : (
        <DesktopFace
          d={deck}
          album={album}
          marquee={marquee}
          tracks={tracks}
          list={list}
          onList={setList}
        />
      )}

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
        {askLink && (
          <form className="amp-note" onSubmit={submit}>
            <p>
              {swap
                ? "Swap the tape: paste any YouTube video or playlist for this album."
                : sources.length
                  ? "None of the linked videos can play here (removed, or embedding is off)."
                  : "No YouTube track is linked to this album yet."}{" "}
              It’s saved in this browser.
            </p>
            <Field className="amp-link">
              <FieldLabel className="sr">YouTube link</FieldLabel>
              <Input
                value={link}
                onValueChange={setLink}
                placeholder="https://youtube.com/watch?v=…"
              />
              <Button type="submit" disabled={!parseYouTube(link)}>
                Load link
              </Button>
            </Field>
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
        {source && !swap && (props.note || pick > 0) && (
          <p className="amp-note small">
            {pick > 0
              ? `Link ${pick} wasn’t playable, so this is backup ${pick + 1} of ${sources.length}.`
              : `Linked: ${props.note}.`}
          </p>
        )}
        {skin === "tape" && tracks && tracks.length > 0 && (
          <ol className="jcard" aria-label="Track list">
            {tracks.map((t, i) => (
              <li key={`${i}-${t}`}>{t}</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Seek({ d, className }: { d: Deck; className?: string }) {
  const [scrub, setScrub] = useState<number | null>(null);
  const max = Math.max(1, Math.floor(d.dur));
  return (
    <Slider
      className={className}
      min={0}
      max={max}
      step={1}
      largeStep={15}
      value={Math.min(scrub ?? Math.floor(d.time), max)}
      disabled={!d.dur}
      format={(v) => clock(v as number)}
      onValueChange={(v, details) => {
        const t = v as number;
        if (details.source === "agent") d.seek(t);
        else setScrub(t);
      }}
      onValueCommit={(v) => {
        d.seek(v as number);
        setScrub(null);
      }}
    >
      <SliderControl>
        <SliderTrack>
          <SliderIndicator />
          <SliderThumb aria-label="Seek" />
        </SliderTrack>
      </SliderControl>
    </Slider>
  );
}

function Volume({ d, className }: { d: Deck; className?: string }) {
  return (
    <Slider
      className={className}
      min={0}
      max={100}
      value={d.vol}
      format={(v) => `${v}%`}
      onValueChange={(v) => d.volume(v as number)}
    >
      <SliderControl>
        <SliderTrack>
          <SliderIndicator />
          <SliderThumb aria-label="Volume" />
        </SliderTrack>
      </SliderControl>
    </Slider>
  );
}

const Glyph = ({ g }: { g: string }) => <span aria-hidden="true">{g}</span>;

function TapeFace({
  d,
  album,
  art,
}: {
  d: Deck;
  album: Album;
  art: React.ReactNode;
}) {
  const p = d.dur ? Math.min(1, d.time / d.dur) : 0;
  const count = String(Math.floor(d.time) % 1000).padStart(3, "0");
  const keys: [string, string, string, () => void, boolean, boolean?][] = [
    ["◀◀", "REW", "Previous album", () => d.step(-1), false],
    ["▶", "PLAY", "Play", d.play, !d.source, d.status === "playing"],
    ["▶▶", "FF", "Next album", () => d.step(1), false],
    ["■", "STOP", "Stop", d.stop, d.status === "idle"],
    [
      "❚❚",
      "PAUSE",
      "Pause",
      d.pause,
      d.status !== "playing",
      d.status === "paused",
    ],
    ["⏏", "EJECT", "Eject", d.eject, false],
  ];
  return (
    <div
      className="cdeck"
      data-wind={d.wind ?? undefined}
      style={{ "--p": p } as React.CSSProperties}
    >
      <div className="tape-top">
        <span
          className="tape-led"
          data-on={d.status === "playing" || undefined}
        >
          {d.label}
        </span>
        <span
          className="tape-counter"
          aria-label={`Counter ${count}`}
          role="img"
        >
          {count.split("").map((c, i) => (
            <i key={i}>{c}</i>
          ))}
        </span>
      </div>

      <div className="tape-well">
        <div className="cassette">
          <div className="cassette-label">
            <span className="cassette-art">{art}</span>
            <span className="cassette-text">
              <b aria-hidden="true">A</b>
              <strong>{album.title}</strong>
              <em>
                {album.artist} · {album.year}
              </em>
            </span>
          </div>
          <div className="cassette-window" aria-hidden="true">
            <span className="reel l">
              <i />
            </span>
            <span className="reel r">
              <i />
            </span>
          </div>
          <span className="cassette-foot" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>

      <div className="tape-meters" aria-hidden="true">
        <span className="vu">
          <i />
          <small>L</small>
        </span>
        <span className="vu">
          <i />
          <small>R</small>
        </span>
      </div>

      <div className="tape-keys">
        {keys.map(([g, cap, name, fn, off, down]) => (
          <Button
            key={cap}
            className="key"
            aria-label={name}
            disabled={off}
            data-down={down || undefined}
            onClick={fn}
          >
            <Glyph g={g} />
            <small aria-hidden="true">{cap}</small>
          </Button>
        ))}
      </div>

      <div className="tape-row">
        <span className="tape-cap">
          {clock(d.time)}
          {d.dur ? ` / ${clock(d.dur)}` : ""}
        </span>
        <Seek d={d} className="tape-seek" />
        <span className="tape-cap">VOL</span>
        <Volume d={d} className="tape-vol" />
      </div>
    </div>
  );
}

function DesktopFace({
  d,
  album,
  marquee,
  tracks,
  list,
  onList,
}: {
  d: Deck;
  album: Album;
  marquee: string;
  tracks?: string[];
  list: boolean;
  onList: (v: boolean) => void;
}) {
  const playing = d.status === "playing";
  return (
    <div className="d98">
      <div className="d98-main">
        <div className="d98-lcd">
          <span
            className="d98-state"
            data-status={d.status}
            aria-hidden="true"
          />
          <span className="d98-time">{clock(d.time)}</span>
          <div className="d98-spec" aria-hidden="true">
            {Array.from({ length: 19 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${(i * 173) % 1000}ms` }} />
            ))}
          </div>
        </div>
        <div className="d98-info">
          <div className="d98-marquee">
            <span>{marquee}</span>
          </div>
          <div className="d98-specs">
            <span>
              <b>{playing ? 128 : "--"}</b> kbps
            </span>
            <span>
              <b>{playing ? 44 : "--"}</b> kHz
            </span>
            <span data-on={!playing || undefined}>mono</span>
            <span data-on={playing || undefined}>stereo</span>
          </div>
          <Volume d={d} className="d98-vol" />
        </div>
      </div>
      <Seek d={d} className="d98-seek" />
      <div className="d98-ctl">
        <Button aria-label="Previous album" onClick={() => d.step(-1)}>
          <Glyph g="⏮" />
        </Button>
        <Button aria-label="Play" disabled={!d.source} onClick={d.play}>
          <Glyph g="▶" />
        </Button>
        <Button aria-label="Pause" disabled={!playing} onClick={d.pause}>
          <Glyph g="❚❚" />
        </Button>
        <Button
          aria-label="Stop"
          disabled={d.status === "idle"}
          onClick={d.stop}
        >
          <Glyph g="■" />
        </Button>
        <Button aria-label="Next album" onClick={() => d.step(1)}>
          <Glyph g="⏭" />
        </Button>
        <Button aria-label="Eject" onClick={d.eject}>
          <Glyph g="⏏" />
        </Button>
        <span className="d98-led">{d.label}</span>
        <Toggle
          className="d98-pl"
          aria-label="Track list"
          pressed={list}
          onPressedChange={onList}
        >
          <Glyph g="PL" />
        </Toggle>
      </div>
      {list && (
        <div className="d98-list">
          <p>
            {album.artist} — {album.title}
          </p>
          {tracks?.length ? (
            <ol>
              {tracks.map((t, i) => (
                <li key={`${i}-${t}`}>{t}</li>
              ))}
            </ol>
          ) : (
            <p className="d98-empty">No track list on file for this album.</p>
          )}
        </div>
      )}
    </div>
  );
}
