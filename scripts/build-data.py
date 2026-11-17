"""Turn scripts/covers.txt and scripts/details.txt into src/data/*.json, keyed by album id."""
import json, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
rows = re.findall(r"^  \[(?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\"), (VA|'[^']*'), (\d{4}),", (root / 'src/data/albums.ts').read_text(), re.M)
slug = lambda s: re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))
ids = {}
for a, b, artist, year in rows:
    title = (a or b).replace("\\'", "'")
    ids[title] = slug(f"{'va' if artist == 'VA' else artist.strip(chr(39))}-{title}-{year}")
BASE = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/'
covers, details, bad = {}, {}, []
for line in (root / 'scripts/covers.txt').read_text().splitlines():
    title, token, file = line.split('|')
    if title not in ids: bad.append(('cover', title)); continue
    covers[ids[title]] = token if token.startswith('http') else f'{BASE}{token}/s1600/{file}'
cur = None
KEYS = {'F': 'format', 'L': 'label', 'P': 'lineup', 'C': 'credits', 'T': 'tracks', 'Y': 'yt', 'YN': 'ytNote'}
for line in (root / 'scripts/details.txt').read_text().splitlines():
    if line.startswith('== '):
        title = line[3:]
        if title not in ids: bad.append(('details', title)); cur = None
        else: cur = details.setdefault(ids[title], {})
    elif cur is not None and ': ' in line:
        k, v = line.split(': ', 1)
        cur[KEYS[k]] = [t.strip() for t in v.split(' / ')] if k == 'T' else [t.strip() for t in v.split('; ')] if k in 'PC' else v
missing = [t for t, i in ids.items() if i not in covers or i not in details]
print(len(ids), 'albums,', len(covers), 'covers,', len(details), 'details; unmatched:', bad, 'missing:', missing)
(root / 'src/data/covers.json').write_text(json.dumps(covers, indent=0, ensure_ascii=False))
(root / 'src/data/details.json').write_text(json.dumps(details, indent=0, ensure_ascii=False))
sys.exit(1 if bad or missing else 0)
