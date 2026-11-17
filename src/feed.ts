// Reads the cover image of every post straight from the source blog's public
// Blogger feed (JSONP, so no CORS setup is needed). Covers come out exactly as the
// blog serves them today; the static covers.json is only the fallback.
import { ALBUMS } from "./data/albums";

const FEED =
  "https://banglacdcovers.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=200";
const norm = (u: string) =>
  u.replace(/^http:/, "https:").replace(/[?#].*$/, "");

type Entry = {
  link?: { rel: string; href: string }[];
  content?: { $t: string };
  media$thumbnail?: { url: string };
};

let pending: Promise<Record<string, string>> | null = null;

/** Resolves to { albumId: coverUrl } for every album the feed has a picture for. Never rejects. */
export function liveCovers(): Promise<Record<string, string>> {
  return (pending ??= new Promise((resolve) => {
    const cb = `__bccFeed${Date.now()}`;
    const script = document.createElement("script");
    const done = (map: Record<string, string>) => {
      delete (window as any)[cb];
      script.remove();
      resolve(map);
    }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const timer = setTimeout(() => done({}), 10000);
    (window as any)[cb] = (data: { feed?: { entry?: Entry[] } }) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      clearTimeout(timer);
      const byPost = new Map<string, string>();
      for (const e of data.feed?.entry ?? []) {
        const href = e.link?.find((l) => l.rel === "alternate")?.href;
        // the first image is usually the front cover; skip a leading screenshot (e.g. Dhrubok's autorun) if a cover follows
        const imgs = [
          ...(e.content?.$t ?? "").matchAll(/<img[^>]+src="([^"]+)"/gi),
        ].map((m) => m[1]);
        const img =
          imgs.find((u) =>
            /artwork|arwork|front|folder|cover/i.test(
              decodeURIComponent(u.split("/").pop() ?? ""),
            ),
          ) ??
          imgs[0] ??
          e.media$thumbnail?.url;
        if (href && img)
          byPost.set(norm(href), img.replace(/^http:/, "https:"));
      }
      const map: Record<string, string> = {};
      for (const a of ALBUMS) {
        const img = byPost.get(norm(a.src));
        if (img) map[a.id] = img;
      }
      done(map);
    };
    script.src = `${FEED}&callback=${cb}`;
    script.onerror = () => {
      clearTimeout(timer);
      done({});
    };
    document.head.append(script);
  }));
}
