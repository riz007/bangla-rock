import type { Album } from "./data/albums";

export type ThemeId = "seventies" | "cassette" | "xerox" | "y2k";

export const THEMES: {
  id: ThemeId;
  name: string;
  era: string;
  blurb: string;
  accent: string;
}[] = [
  {
    id: "seventies",
    name: "Shadhin",
    era: "'70s",
    blurb: "Sunburst posters, warm paper, Azam Khan on the radio",
    accent: "#e2711d",
  },
  {
    id: "cassette",
    name: "Cassette",
    era: "'80s",
    blurb: "Neon stage lights and TDK tapes from Elephant Road",
    accent: "#ff2e88",
  },
  {
    id: "xerox",
    name: "Photocopy",
    era: "'90s",
    blurb: "Gig flyers, typewriter liner notes, one red ink",
    accent: "#c8201c",
  },
  {
    id: "y2k",
    name: "Underground",
    era: "'00s",
    blurb: "Black tees, steel, the mixed-album underground",
    accent: "#d5202b",
  },
];

/** Which theme fits an album's vibe. */
export function themeFor(a: Album): ThemeId {
  if (a.genre === "folk") return "seventies";
  if (a.year <= 1992 || a.genre === "pop") return "cassette";
  if (a.year <= 1999) return "xerox";
  return "y2k";
}

export interface Prefs {
  theme: ThemeId;
  accent: string | null; // null → theme default
  grain: boolean;
  motion: boolean;
  follow: boolean; // switch theme to match the open album
  dense: boolean;
  real: boolean; // show the original cover scans (hotlinked from the source blog)
}

const KEY = "bcc:prefs";
export const defaultPrefs: Prefs = {
  theme: "y2k",
  accent: null,
  grain: true,
  follow: true,
  dense: false,
  real: true,
  motion:
    typeof matchMedia === "undefined" ||
    !matchMedia("(prefers-reduced-motion: reduce)").matches,
};

export const load = <T>(key: string, fallback: T): T => {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? "{}") };
  } catch {
    return fallback;
  }
};
export const loadMap = (key: string): Record<string, string> => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};
export const loadList = (key: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const save = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode */
  }
};
export const loadPrefs = () => load(KEY, defaultPrefs);
export const savePrefs = (p: Prefs) => save(KEY, p);
