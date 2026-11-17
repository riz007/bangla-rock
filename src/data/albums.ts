// Catalogue derived from the post index of https://banglacdcovers.blogspot.com
// (collected and scanned by Shohail Ibne Mahbub, "XTR"). Titles, years and
// featured-artist tags follow the blog's own labels. Genre grouping is editorial.

import covers from "./covers.json";

export type Genre = "heavy" | "rock" | "folk" | "pop" | "mix";

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: Genre;
  /** other artists / bands tagged on the release */
  with: string[];
  label?: string;
  /** original cover scan, hosted by the source blog (hotlinked, never copied into this repo) */
  cover?: string;
  /** path of the original post on the source blog */
  src: string;
}

export const GENRES: Record<Genre, string> = {
  heavy: "Heavy & Metal",
  rock: "Rock & Alternative",
  folk: "Folk, Fusion & Indie",
  pop: "Pop & Hip-Hop",
  mix: "Mixed Albums",
};

const ARTIST_GENRE: Record<string, Genre> = {
  Warfaze: "heavy",
  Rockstrata: "heavy",
  "In Dhaka": "heavy",
  "Cryptic Fate": "heavy",
  Artcell: "heavy",
  Aurthohin: "heavy",
  Stentorian: "heavy",
  Powersurge: "heavy",
  Mechanix: "heavy",
  Minerva: "heavy",
  Scarecrow: "heavy",
  "Poizon Green": "heavy",
  Kronic: "heavy",
  "Elephant Road": "heavy",
  Black: "rock",
  Nemesis: "rock",
  Arbovirus: "rock",
  ViBE: "rock",
  Breach: "rock",
  Triloy: "rock",
  Icons: "rock",
  Sumon: "rock",
  "The Watson Brothers": "rock",
  RaaGa: "rock",
  GrooveTrap: "rock",
  "Paper Rhyme": "rock",
  Shironamhin: "folk",
  Meghdol: "folk",
  Bangla: "folk",
  Arnob: "folk",
  "Prayer Hall": "folk",
  Yaatri: "pop",
  "Stoic Bliss": "pop",
  Kranti: "pop",
  "Upol Islam": "pop",
};

const VA = "Various Artists";
type Row = [
  title: string,
  artist: string,
  year: number,
  src: string,
  withArtists?: string,
  label?: string,
];

const rows: Row[] = [
  // ── 1990s ─────────────────────────────────────────────
  [
    "Hooray!",
    VA,
    1990,
    "2014/01/hooray-band-mixed-album",
    "Ark, Azam Khan, Faith, In Dhaka, Lesson 1, Prometheus, Reshad, Rockstrata, Symphony, Warfaze, Winds, Winning",
  ],
  ["Rockstrata", "Rockstrata", 1990, "2013/06/rockstrata-by-rockstrata"],
  ["Warfaze", "Warfaze", 1991, "2018/08/warfaze-by-warfaze"],
  [
    "Nishshobdo Kolahol",
    "In Dhaka",
    1992,
    "2018/09/nishshobdo-kolahol-by-in-dhaka",
  ],
  ["Obak Bhalobasha", "Warfaze", 1994, "2018/08/obak-bhalobasha-by-warfaze"],
  [
    "Ends are Forever",
    "Cryptic Fate",
    1995,
    "2018/09/ends-are-forever-by-cryptic-fate",
    "",
    "Soundtek",
  ],
  ["Paper Rhyme", "Paper Rhyme", 1996, "2018/09/paper-rhyme-by-paper-rhyme"],
  ["Jibon Dhara", "Warfaze", 1997, "2018/08/jibon-dhara-by-warfaze"],
  ["Sumon O Aurthohin", "Sumon", 1997, "2012/02/sumon-o-aurthohin-by-sumon"],
  ["Oshamajik", "Warfaze", 1998, "2018/08/oshamajik-by-warfaze"],
  // ── 2000–2004 ─────────────────────────────────────────
  ["Trimatrik", "Aurthohin", 2000, "2012/06/trimatrik-by-aurthohin"],
  ["Aalo", "Warfaze", 2001, "2018/08/aalo-by-warfaze"],
  ["Biborton", "Aurthohin", 2001, "2012/10/biborton-by-aurthohin"],
  [
    "Shopnogulo Tomar Moto",
    "Sumon",
    2001,
    "2012/02/shopnogulo-tomar-moto-by-sumon",
  ],
  [
    "Charpotro",
    VA,
    2001,
    "2012/10/charpotro-band-mixed-album",
    "Agontuk, Anything but Six, Artcell, Aurthohin, Black, Canopy, Cryptic Fate, Faith, Isha Khan Duray, Koprophillia, Metal Maze, Srishti",
  ],
  ["Onnoshomoy", "Artcell", 2002, "2012/06/onno-shomoy-by-artcell"],
  ["Amar Prithibi", "Black", 2002, "2012/06/amar-prithibi-by-black"],
  [
    "Notun Diner Michile",
    "Aurthohin",
    2002,
    "2012/01/notun-diner-michile-by-aurthohin",
  ],
  ["Sreshtho", "Cryptic Fate", 2002, "2018/07/sreshtho-by-cryptic-fate"],
  [
    "Kingkortobbobimurh",
    "Bangla",
    2002,
    "2018/09/kingkortobbobimurh-by-bangla",
    "Arnob",
    "Ektaar",
  ],
  [
    "Onushilon",
    VA,
    2002,
    "2012/10/onushilon-band-mixed-album",
    "Artcell, Aurthohin, Black, Cryptic Fate, Faith, Isha Khan Duray, Metal Maze",
  ],
  ["Utshober Por", "Black", 2003, "2012/06/utshober-por-by-black"],
  ["Dhrubok", "Aurthohin", 2003, "2012/06/dhrubok-by-aurthohin"],
  ["Moharaaj", "Warfaze", 2003, "2018/09/moharaaj-by-warfaze", "", "Ektaar"],
  ["Ohom", "The Watson Brothers", 2003, "2012/02/ohom-by-watson-brothers"],
  ["Kranti", "Kranti", 2003, "2012/01/kranti-by-kranti", "Fuad-Al-Muqtadir"],
  [
    "Agontuk",
    VA,
    2003,
    "2014/01/agontuk-band-mixed-album",
    "Artcell, Aurthohin, Black, Cryptic Fate, Dew Drops, Isha Khan Duray, Jewel, Koprophillia, Kronic, Poizon Green, Triloy, ViBE",
  ],
  [
    "Projonmo",
    VA,
    2003,
    "2012/10/projonmo-band-mixed-album",
    "Anything but Six, Artcell, Aurthohin, Azam Khan, Black, Cryptic Fate, Isha Khan Duray, Metal Maze, Raja, Shomoy, Srishti, Subconscious",
  ],
  ["Jahaji", "Shironamhin", 2004, "2018/08/jahaji-by-shironamhin"],
  [
    "Elephant Road",
    "Elephant Road",
    2004,
    "2018/08/elephant-road-by-elephant-road",
    "Aces, In Dhaka, Rockstrata, Warfaze",
  ],
  [
    "Agontuk 2",
    VA,
    2004,
    "2014/01/agontuk-2-band-mixed-album",
    "Arbovirus, Artcell, Aurthohin, Black, Breach, Cryptic Fate, Dethrow, dNA, Kamal, Kral, Nemesis, ReBORN, Stentorian, Warfaze",
  ],
  [
    "Lokayot",
    VA,
    2004,
    "2012/10/lokayot-band-mixed-album",
    "Aashor, Arbovirus, Artcell, Aurthohin, Bivishika, Black, Cryptic Fate, dNA, Fulbanu's Revenge, Icons, Isha Khan Duray, Kral, ReBORN, Scarecrow, Stentorian, Striking, X-Uranium",
  ],
  [
    "Din Bodol",
    VA,
    2004,
    "2013/06/din-bodol-band-mixed-album",
    "Aashor, ABC, Arbovirus, Artcell, Bivishika, Black, Breach, Cryptic Fate, Fulbanu's Revenge, Icons, Isha Khan Duray, Metal Maze, Nemesis, Poizon Green, ReBORN, Scarecrow, Stentorian, Striking",
  ],
  [
    "Shopnochura",
    VA,
    2004,
    "2012/06/shopnochura-band-mixed-album",
    "Acoustica, Aurthohin, Black, Fake Plastic Superheroes, Highway, Ionic, Mohakaal, Parthib, Purbo-Poshchim, Rulz, Striking, Yaatri",
  ],
  // ── 2005–2009 ─────────────────────────────────────────
  [
    "Chaina Bhabish",
    "Arnob",
    2005,
    "2018/08/chaina-bhabish-by-arnob",
    "Sahana",
    "Ektaar",
  ],
  [
    "Droher Montre Bhalobasha",
    "Meghdol",
    2005,
    "2018/08/droher-montre-bhalobasha-by-meghdol",
  ],
  ["RaaGa", "RaaGa", 2005, "2018/10/raaga-by-raaga"],
  ["Shunno", "Triloy", 2005, "2018/08/shunno-by-triloy"],
  [
    "Megher Deshe (A Tribute to John Denver)",
    "Sumon",
    2005,
    "2012/02/megher-deshe-tribute-to-john-denver-by",
  ],
  ["Protimuhurtey", "Stentorian", 2005, "2012/02/protimuhurtey-by-stentorian"],
  ["Asroy", "Kronic", 2005, "2012/02/asroy-by-kronic"],
  ["Ishshoronio", "Icons", 2005, "2012/01/ishshoronio-by-icons"],
  [
    "Agontuk 3",
    VA,
    2005,
    "2012/01/agontuk-3-band-mixed-album",
    "666, Aashor, Artcell, Aurthohin, Bivishika, Black, Cryptic Fate, Dripping Gore, Echoes, Fulbanu's Revenge, Icons, Nagorik, Shade, Stentorian, Zefyr",
  ],
  [
    "Shopnochura 2",
    VA,
    2005,
    "2012/06/shopnochura-2-band-mixed-album",
    "Acoustica, Black, Dark, Fake Plastic Superheroes, Kalponik, Psychovina, Purbo-Poshchim, Raaga, Rulz, Shironamhin, X-Factor, Yaatri",
  ],
  [
    "Oniket Prantor",
    "Artcell",
    2006,
    "2012/06/released-in-2006-oniker-prantor-is-2nd",
  ],
  ["Danob", "Cryptic Fate", 2006, "2018/07/danob-by-cryptic-fate"],
  ["Onneshon", "Nemesis", 2006, "2012/06/onneshon-by-nemesis"],
  [
    "Ichchhe Ghuri",
    "Shironamhin",
    2006,
    "2018/08/ichchhe-ghuri-by-shironamhin",
  ],
  [
    "Hok Kolorob",
    "Arnob",
    2006,
    "2018/08/hok-kolorob-by-arnob",
    "Sahana",
    "BMC",
  ],
  [
    "Prottutponnomotitto",
    "Bangla",
    2006,
    "2018/09/prottutponnomotitto-by-bangla",
    "Arnob",
    "Ektaar",
  ],
  [
    "Bujhcho?!",
    "Prayer Hall",
    2006,
    "2018/09/bujhcho-by-prayer-hall",
    "Arnob, Sahana",
    "BMC",
  ],
  ["Daak", "Yaatri", 2006, "2018/09/daak-by-yaatri", "Topu"],
  [
    "Light Years Ahead",
    "Stoic Bliss",
    2006,
    "2018/11/light-years-ahead-by-stoic-bliss",
    "",
    "G-Series",
  ],
  ["Oparthib", "Scarecrow", 2006, "2018/08/oparthib-by-scarecrow"],
  [
    "Poizon Green",
    "Poizon Green",
    2006,
    "2018/08/poizon-green-by-poizon-green",
  ],
  ["Breach", "Breach", 2006, "2018/08/breach-by-breach"],
  [
    "Underground",
    VA,
    2006,
    "2012/01/underground-band-mixed-album",
    "Artcell, Aurthohin, Black, Carsinoma, Hell Divers, Kalponik, Kamal, Kolpolok, Koprophillia, Kral, Moshpit, Powersurge, ReBORN, Rulz, Sentinals, The Watson Brothers, Yaatri, Zeal",
  ],
  ["64m 53s", "Arbovirus", 2007, "2012/06/64m-53s-by-arbovirus"],
  [
    "Kolponar Baire",
    "Stoic Bliss",
    2007,
    "2018/11/kolponar-baire-by-stoic-bliss",
    "",
    "G-Series",
  ],
  [
    "Ekhon Ami",
    "Sumon",
    2007,
    "2018/09/ekhon-ami-by-sumon",
    "Anila, Fuad-Al-Muqtadir",
  ],
  [
    "Boka Manushta (Sumon O Aurthohin 2)",
    "Sumon",
    2007,
    "2012/02/boka-manushta-sumon-o-aurthohin-2-by",
  ],
  ["Chena Jogot", "ViBE", 2007, "2012/02/chena-jogot-by-vibe"],
  [
    "Neon Aloy Shagotom",
    VA,
    2007,
    "2018/12/neon-aloy-shagotom-band-mixed-album",
    "Ajob, B'Borton, D Minor, Dhrubo, Kanak O Kartik, Karnishey Magpie, Meghdol, Road House, Shironamhin, Shohor, Shohortoli, Shorboda, Striking",
    "G-Series",
  ],
  [
    "Jhalmuri 1 & 2",
    VA,
    2007,
    "2018/09/jhalmuri-1-2-mixed-albums",
    "Abida, Armeen Musa, Arnob, Bappa Mazumder, Gourob, Habib Wahid, Laura, Nabila, Nancy, Prayer Hall, Punam, Rupom, Sahana, Shawjeeb, Shuvo, Sovvota, Srabonti, Syed Wakil Ahmed",
    "BMC",
  ],
  [
    "Underground 2",
    VA,
    2007,
    "2012/01/underground-2-band-mixed-album",
    "Aloukik, Aurthohin, Bishourgo, Eclipse, Kamal, Koprophillia, Kral, Mechanix, Metal Maze, Nemesis, Re-Dhun, Satanic, Stentorian, Tomosh, ViBE, Yaatri",
  ],
  [
    "Live Now",
    VA,
    2007,
    "2012/01/live-now-band-mixed-album",
    "'71, Arbovirus, Artcell, Aurthohin, Birodh, Black, Cryptic Fate, dNA, Kolpolok, Koprophillia, Nemesis, ReBORN, Shabab Murshid Foundation, The Watson Brothers, X-Factor",
  ],
  [
    "Shopnochura 3",
    VA,
    2007,
    "2012/06/shopnochura-3-band-mixed-album",
    "Aronnya, Black, Breed, Dark, Ionic, Kalponik, Mohakaal, Montro, Phoenix, Psychovina, Purbo-Poshchim, Shironamhin, Yaatri",
  ],
  [
    "Aushomapto 1",
    "Aurthohin",
    2008,
    "2012/06/aushomapto-1-is-aurthohin-s-5th-studio",
  ],
  ["Abar", "Black", 2008, "2012/06/abar-by-black"],
  [
    "Doob",
    "Arnob",
    2008,
    "2018/08/doob-by-arnob",
    "Nemesis, Sahana, Zohad",
    "BMC",
  ],
  [
    "Oprostut Juddho",
    "Powersurge",
    2008,
    "2018/10/oprostut-juddho-by-powersurge",
  ],
  [
    "GrooveTrap",
    "GrooveTrap",
    2008,
    "2018/11/groovetrap-by-groovetrap",
    "",
    "Rage Records",
  ],
  ["Pothchola", "Warfaze", 2009, "2018/09/pothchola-by-warfaze"],
  [
    "Bondho Janala",
    "Shironamhin",
    2009,
    "2018/08/bondho-janala-by-shironamhin",
  ],
  ["Shohorbondi", "Meghdol", 2009, "2018/08/shohorbondi-by-meghdol"],
  [
    "Arnob & Friends Live",
    "Arnob",
    2009,
    "2018/08/arnob-friends-live-by-arnob",
    "Andrew, Dristipat, Jibon, Nazia, Resalat",
    "BMC",
  ],
  // ── 2010s ─────────────────────────────────────────────
  ["Rabindranath", "Shironamhin", 2010, "2018/08/rabindranath-by-shironamhin"],
  [
    "Rodh Boleche Hobe",
    "Arnob",
    2010,
    "2018/09/rodh-boleche-hobe-by-arnob",
    "Sahana",
    "Adhkhana Music",
  ],
  [
    "The Miracle - 1",
    "Upol Islam",
    2010,
    "2018/09/the-miracle-1-by-upol-islam",
    "",
    "BMC",
  ],
  [
    "Aushomapto 2",
    "Aurthohin",
    2011,
    "2012/06/aushomapto-2-is-aurthohin-s-6th-studio",
  ],
  ["Black", "Black", 2011, "2012/06/black-by-black"],
  ["Tritiyo Jatra", "Nemesis", 2011, "2012/06/tritiyo-jatra-by-nemesis"],
  ["Oporajeyo", "Mechanix", 2011, "2018/10/oporajeyo-by-mechanix"],
  ["Shotto", "Warfaze", 2012, "2018/09/shotto-by-warfaze"],
  [
    "Adheko Ghume",
    "Arnob",
    2012,
    "2018/08/adheko-ghume-by-arnob",
    "Elvind Lodemel",
    "Adhkhana Music",
  ],
  [
    "Shironamhin",
    "Shironamhin",
    2013,
    "2018/08/shironamhin-by-shironamhin",
    "",
    "Incursion Music",
  ],
  [
    "Biday Shongbidhan",
    "Minerva",
    2013,
    "2018/10/biday-shongbidhan-by-minerva",
    "",
    "Incursion Music",
  ],
  [
    "Scarecrow (EP)",
    "Scarecrow",
    2013,
    "2018/10/scarecrow-by-scarecrow",
    "",
    "G-Series",
  ],
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const SOURCE = "https://banglacdcovers.blogspot.com/";

export interface Details {
  format?: string;
  label?: string;
  lineup?: string[];
  credits?: string[];
  tracks?: string[];
  /** YouTube video or playlist ids, best first; the player falls back down the list */
  yt?: string[];
  ytNote?: string;
}

/** Blogger image URLs carry their size in the path (/s1600/, /s72-c/, /w400-h400/): ask for the size we need. */
export const sized = (url: string, size: number) =>
  url
    .replace(/\/(?:s\d+|w\d+(?:-h\d+)?|h\d+)(?:-[a-z0-9]+)*\//, `/s${size}/`)
    .replace(/=s\d+(-c)?$/, `=s${size}`);

/** Cover candidates, best first: the live feed's image, then the one recorded in covers.json. */
export const coverUrls = (a: Album, size: number, live?: string) => [
  ...new Set(
    [live, a.cover].filter((u): u is string => !!u).map((u) => sized(u, size)),
  ),
];

/** WebGL may only read images served with CORS headers, which Blogger's image host does not send. */
export const corsSafe = (url: string) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=88`;

const id = (artist: string, title: string, year: number) =>
  slug(`${artist === VA ? "va" : artist}-${title}-${year}`);

export const ALBUMS: Album[] = rows.map(
  ([title, artist, year, src, w, label]) => ({
    id: id(artist, title, year),
    cover: (covers as Record<string, string>)[id(artist, title, year)],
    title,
    artist,
    year,
    genre: artist === VA ? "mix" : (ARTIST_GENRE[artist] ?? "rock"),
    with: w ? w.split(", ") : [],
    label,
    src: `${SOURCE}${src}.html`,
  }),
);

export const ERAS = [
  { id: "90s", name: "'90–'99", tag: "The first wave", from: 1990, to: 1999 },
  {
    id: "00a",
    name: "'00–'04",
    tag: "Mixed-album years",
    from: 2000,
    to: 2004,
  },
  { id: "00b", name: "'05–'09", tag: "Underground peak", from: 2005, to: 2009 },
  {
    id: "10s",
    name: "'10–'13",
    tag: "Last of the jewel cases",
    from: 2010,
    to: 2013,
  },
] as const;

/** Short, deliberately conservative notes on the acts with the most releases here. */
export const ARTISTS: Record<string, { bn?: string; note: string }> = {
  Warfaze: {
    bn: "ওয়ারফেজ",
    note: "Dhaka hard rock and heavy metal veterans, among the bands that defined the sound of Bangladeshi heavy music.",
  },
  Rockstrata: {
    bn: "রকস্ট্রাটা",
    note: "One of the earliest heavy metal bands in Bangladesh; the self-titled record is a cornerstone of the scene.",
  },
  "In Dhaka": {
    note: "An early-90s Dhaka hard rock outfit from the first wave of the scene.",
  },
  "Cryptic Fate": {
    bn: "ক্রিপটিক ফেইট",
    note: "Heavy and progressive metal from Dhaka, starting with an English-language debut and moving into Bangla.",
  },
  Artcell: {
    bn: "আর্টসেল",
    note: "Progressive metal with long-form songwriting and poetic Bangla lyrics; a defining band of the 2000s underground.",
  },
  Aurthohin: {
    bn: "অর্থহীন",
    note: "Hard rock and metal band led by bassist Sumon, growing out of his solo records.",
  },
  Sumon: {
    bn: "সুমন",
    note: "Bassist and songwriter, known as “Bassbaba”; the solo work sits alongside his band Aurthohin.",
  },
  Black: {
    bn: "ব্ল্যাক",
    note: "Alternative rock from Dhaka that brought a rawer, guitar-driven sound to the early 2000s.",
  },
  Nemesis: {
    bn: "নেমেসিস",
    note: "Alternative rock band from the mid-2000s Dhaka scene.",
  },
  Arbovirus: {
    bn: "আর্বোভাইরাস",
    note: "Alternative and nu-metal leaning rock from the 2000s underground.",
  },
  Stentorian: {
    note: "Hard rock and metal act that appears across the era’s mixed albums.",
  },
  Shironamhin: {
    bn: "শিরোনামহীন",
    note: "Psychedelic and folk-tinged rock with city-life storytelling and classical instruments in the mix.",
  },
  Meghdol: {
    bn: "মেঘদল",
    note: "Dhaka band blending folk, rock and urban poetry.",
  },
  Arnob: {
    bn: "অর্ণব",
    note: "Singer-songwriter and composer whose records blend Bengali folk, fusion and contemporary arrangements.",
  },
  Bangla: {
    bn: "বাংলা",
    note: "Folk-fusion band that reworked Baul and Lalon songs for a new generation.",
  },
  "Stoic Bliss": {
    note: "Bangla hip-hop group formed by Bangladeshi-Americans.",
  },
  "Azam Khan": {
    bn: "আজম খান",
    note: "Freedom fighter and the “Pop Guru” of the 1970s — the root of Bangladeshi band music. He appears here on mixed albums.",
  },
};
