export const PAL: Record<string, string> = {
  k: '#1a1020',
  h: '#3b2417',
  s: '#f2b98f',
  S: '#cf8e68',
  y: '#ffd21f',
  g: '#169c3c',
  b: '#2449c9',
  w: '#ffffff',
  r: '#9b3b35'
};

export const TOP = [
  "....kkkkkk....",
  "...khhhhhhk...",
  "..khhhhhhhhk..",
  "..khhhhhhhhhk.",
  "..khhsssssssk.",
  "..khsssksskssk",
  "..kSsssksskssk",
  "..kSssssssssk.",
  "...kssrrrrssk.",
  "....kssssssk..",
  "...kgggggggk..",
  "..kyyyggyyyyk.",
  ".kyyyyyyyyyyyk",
  ".ksyyyyyyyyysk",
  ".kssyyyyyyyssk",
  "..kkyyyggyyykk"
];

export const LEGS = {
  stand: [
    "...kbbbbbbbk..",
    "...kbbbkbbbk..",
    "...kwwk.kwwk..",
    "..kkkkk.kkkkk."
  ],
  walk: [
    "...kbbbbbbbk..",
    "..kbbbk.kbbbk.",
    "..kwwk...kwwk.",
    ".kkkk.....kkkk"
  ],
  jump: [
    "...kbbbbbbbbk.",
    "..kbbbk..kbbbk",
    "..kwwk....kwwk",
    ".kkkk......kkk"
  ]
};

export function mkSprite(rows: string[], pal: Record<string, string>, flip: boolean): HTMLCanvasElement {
  const w = 14;
  const h = rows.length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if (!x) return c;
  rows.forEach((r, j) => {
    for (let i = 0; i < w; i++) {
      const ch = r[i];
      if (ch && pal[ch]) {
        x.fillStyle = pal[ch];
        x.fillRect(flip ? w - 1 - i : i, j, 1, 1);
      }
    }
  });
  return c;
}

export type SpriteSet = {
  stand: [HTMLCanvasElement, HTMLCanvasElement];
  walk: [HTMLCanvasElement, HTMLCanvasElement];
  jump: [HTMLCanvasElement, HTMLCanvasElement];
};

export function buildSprites(): {
  SPR: SpriteSet;
  SPRQ: SpriteSet;
  SPRM: SpriteSet;
} {
  const SPR: any = {};
  for (const f of ['stand', 'walk', 'jump'] as const) {
    SPR[f] = [mkSprite(TOP.concat(LEGS[f]), PAL, false), mkSprite(TOP.concat(LEGS[f]), PAL, true)];
  }

  const PALQ = Object.assign({}, PAL, { h: '#8f8b86', y: '#ff7a1a', g: '#c9500a', b: '#3d5f94' });
  const TOPQ = TOP.slice();
  TOPQ[8] = "...kshhhhhssk.";
  TOPQ[10] = "...kyyyyyyyk..";
  TOPQ[11] = "..kyyyyyyyyyk.";
  TOPQ[15] = "..kkyyyyyyyykk";
  const SPRQ: any = {};
  for (const f of ['stand', 'walk', 'jump'] as const) {
    SPRQ[f] = [mkSprite(TOPQ.concat(LEGS[f]), PALQ, false), mkSprite(TOPQ.concat(LEGS[f]), PALQ, true)];
  }

  const PALM = Object.assign({}, PAL, { h: '#1e1610', y: '#17171f', g: '#f4f4f4', b: '#17171f', w: '#17171f' });
  const TOPM = TOP.slice();
  TOPM[8] = "...kssssssssk.";
  TOPM[12] = ".kyyyyyyyyyyyk";
  TOPM[13] = ".kyyyyyyyyyyyk";
  TOPM[14] = ".ksyyyyyyyyysk";
  TOPM[15] = "..kkyyyyyyyykk";
  const SPRM: any = {};
  for (const f of ['stand', 'walk', 'jump'] as const) {
    SPRM[f] = [mkSprite(TOPM.concat(LEGS[f]), PALM, false), mkSprite(TOPM.concat(LEGS[f]), PALM, true)];
  }

  return { SPR, SPRQ, SPRM };
}
