/* Música de fundo
   Sintetizador 8-bit próprio (Web Audio), sem arquivos de áudio. Cada faixa tem acordes por compasso,
   baixo, acompanhamento, bateria e melodia; tudo toca bem abaixo dos efeitos sonoros.
   Faixas: title (abertura: título, seleção e mapa), uma por fase (pelo id da fase) e ending (urna e créditos). */

type Ev = { at: number; sym: string; dur: number };
type Pat = { ev: Ev[]; len: number };
type Chord = { r: number; third: number; sev: number };
type Track = {
  bpm: number; spb: number; chords: string[];
  lead: { wave: OscillatorType; v: number; pat: string; vib?: boolean; env?: 'pluck'; trem?: boolean };
  bass: string; arp: string; arpOct?: number; drums: Record<string, string>;
  L?: Pat; B?: Pat; A?: Pat; CH?: Chord[]; len?: number; g?: number;
};

export const MUSIC_VOL = 0.3;
const NN: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midiOf(n: string): number | null {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) return null;
  return 12 * (+m[3] + 1) + NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function chordOf(c: string): Chord {
  const m = /^([A-G])(#|b)?(m|7|m7)?$/.exec(c)!;
  const r = NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), q = m[3] || '';
  return { r, third: q.startsWith('m') ? 3 : 4, sev: q === '7' || q === 'm7' ? 10 : 11 };
}
function degree(ch: Chord, d: string, oct: number) {
  const base = 12 * (oct + 1) + ch.r;
  return base + ({ R: 0, '3': ch.third, '5': 7, '7': ch.sev, '8': 12, '9': 14 } as Record<string, number>)[d];
}
function parsePat(s: string): Pat {
  const ev: Ev[] = [];
  let p = 0;
  for (const tok of s.trim().split(/\s+/)) {
    const [a, b] = tok.split(':');
    const d = b ? +b : 1;
    if (a !== '.') ev.push({ at: p, sym: a, dur: d });
    p += d;
  }
  return { ev, len: p };
}

const MUSIC: Record<string, Track> = {
  // abertura: marchinha alegre de fliperama, em dó maior
  title:{bpm:138,spb:16,chords:['C','C','F','G','C','Am','F','G'],
    lead:{wave:'square',v:1,pat:'E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 F5:2 E5:2 D5:2 C5:2 D5:4 G4:4 A4:2 C5:2 F5:4 E5:2 F5:2 A5:4 G5:4 F5:2 E5:2 D5:4 .:4 E5:2 G5:2 C6:4 D6:2 C6:2 G5:4 A5:2 G5:2 E5:2 C5:2 E5:4 A4:4 F5:2 A5:2 C6:2 A5:2 G5:2 F5:2 E5:2 D5:2 D5:4 G5:4 C5:6 .:2'},
    bass:'R:2 .:2 5:2 .:2 8:2 .:2 5:2 .:2',arp:'.:2 3+5:2 .:2 3+5:2 .:2 3+5:2 .:2 3+5:2',
    drums:{k:'x...x...x...x...',s:'....x.......x...',h:'..x...x...x...x.'}},
  // fase 1, fantasma na Câmara: valsinha de assombração em ré menor, com o tique-taque do relógio de ponto
  fantasma:{bpm:104,spb:12,chords:['Dm','Dm','Gm','A','Dm','Bb','Gm','A'],
    lead:{wave:'sine',v:1.5,vib:true,pat:'D5:6 F5:3 A5:3 G#5:3 A5:3 F5:6 G5:6 Bb5:3 D6:3 C#6:3 D6:3 A5:6 D6:6 C6:3 A5:3 Bb5:6 A5:3 F5:3 G5:3 F5:3 E5:3 D5:3 C#5:6 .:6'},
    bass:'R:4 .:8',arp:'.:4 3+5:2 .:2 3+5:2 .:2',
    drums:{c:'x...x...x...'}},
  // fase 2, Queiroz na Alerj: samba-funk de malandro do dinheiro, em sol maior
  rachadinha:{bpm:112,spb:16,chords:['G','Em','Am','D7','G','Em','Am','D7'],
    lead:{wave:'square',v:.9,pat:'D5:2 .:1 B4:1 D5:2 E5:2 .:1 D5:3 B4:2 G4:2 .:2 E5:1 E5:1 G5:2 E5:2 .:2 B4:2 D5:4 C5:2 .:1 A4:1 C5:2 E5:2 .:1 D5:3 C5:2 A4:2 .:2 F#5:1 F#5:1 A5:2 F#5:2 E5:2 D5:2 C5:4 B5:2 .:1 A5:1 G5:2 D5:2 .:1 E5:3 D5:2 B4:2 G5:3 E5:3 B4:2 E5:2 G5:2 B5:4 A5:2 G5:2 E5:2 C5:2 A4:2 C5:2 E5:4 D5:3 F#5:3 A5:2 C6:2 .:2 D6:2 .:2'},
    bass:'R:3 R:1 .:2 5:2 R:3 R:1 .:2 5:2',arp:'.:1 3+5:1 .:1 3+5:1 .:2 3+5:1 .:1 .:1 3+5:1 .:1 3+5:1 .:2 3+5:2',
    drums:{k:'x..x..x.x..x..x.',s:'....x.......x...',h:'xxx.xxx.xxx.xxx.'}},
  // fase 3, laços com a milícia: tango noir de madrugada, em lá menor
  lacos:{bpm:84,spb:16,chords:['Am','Am','Dm','E7','Am','F','Dm','E7'],
    lead:{wave:'triangle',v:1.6,vib:true,pat:'E5:6 F5:2 E5:4 C5:4 B4:4 C5:4 A4:8 D5:6 E5:2 F5:4 A5:4 G#5:6 F5:2 E5:8 A5:6 G5:2 E5:4 C5:4 F5:6 E5:2 C5:4 A4:4 D5:4 F5:4 A5:4 G#5:4 B4:8 E5:4 .:4'},
    bass:'R:3 R:1 5:2 3:2 R:3 R:1 5:2 3:2',arp:'.:4 3+5:2 .:6 3+5:2 .:2',
    drums:{k:'x.......x.......',h:'..x...x...x...x.'}},
  // fase 4, fábrica de chocolate: caixinha de música saltitante, em fá maior
  chocolate:{bpm:126,spb:16,chords:['F','Dm','Bb','C','F','Gm','C','F'],
    lead:{wave:'square',v:.8,env:'pluck',pat:'C6:1 .:1 A5:1 .:1 F5:1 .:1 A5:1 .:1 C6:2 .:2 F6:2 .:2 D6:1 .:1 A5:1 .:1 F5:1 .:1 A5:1 .:1 D6:2 C6:2 A5:4 Bb5:1 .:1 F5:1 .:1 D5:1 .:1 F5:1 .:1 Bb5:2 .:2 D6:2 .:2 C6:2 Bb5:2 A5:2 G5:2 E5:2 G5:2 C6:4 A5:2 C6:2 F6:4 E6:2 D6:2 C6:4 Bb5:2 D6:2 G6:4 F6:2 D6:2 Bb5:4 E6:2 D6:2 C6:2 Bb5:2 G5:2 E5:2 G5:4 F5:4 A5:2 C6:2 F6:4 .:4'},
    bass:'R:2 .:2 5:2 .:2 R:2 .:2 5:2 .:2',arp:'.:2 3+5:1 .:1 .:2 3+5:1 .:1 .:2 3+5:1 .:1 .:2 3+5:1 .:1',
    drums:{k:'x.......x.......',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'}},
  // fase 5, ventania no STF: perseguição tensa com arpejos em redemoinho, em mi menor
  vento:{bpm:150,spb:16,chords:['Em','C','D','B7','Em','C','Am','B7'],
    lead:{wave:'square',v:.8,pat:'B5:8 G5:4 E5:4 C6:8 G5:4 E5:4 D6:8 A5:4 F#5:4 D#6:8 B5:4 A5:4 E6:6 D6:2 B5:4 G5:4 C6:6 B5:2 G5:4 E5:4 A5:4 C6:4 E6:4 C6:4 B5:12 .:4'},
    bass:'R:2 8:2 R:2 8:2 R:2 8:2 R:2 8:2',arp:'R 3 5 8 5 3 R 3 5 8 5 3 R 3 5 8',arpOct:4,
    drums:{k:'x...x...x...x...',s:'....x.......x.xx',h:'x.x.x.x.x.x.x.x.'}},
  // fase 6, o Peixe na praia: surf rock com guitarra em trêmulo, em ré maior
  peixe:{bpm:132,spb:16,chords:['D','D','G','A','D','Bm','G','A'],
    lead:{wave:'square',v:.75,trem:true,pat:'F#5:4 A5:4 D6:6 .:2 E6:2 D6:2 A5:4 F#5:6 .:2 G5:4 B5:4 D6:6 .:2 C#6:2 E6:2 C#6:2 A5:2 E5:6 .:2 D6:4 F#6:4 A6:6 .:2 F#6:2 D6:2 B5:4 F#5:6 .:2 G5:2 B5:2 D6:2 G6:2 F#6:2 E6:2 D6:2 B5:2 A5:4 C#6:4 D6:6 .:2'},
    bass:'R:1 R:1 .:1 R:1 5:2 R:2 8:1 8:1 .:1 8:1 5:2 R:2',arp:'.:16',
    drums:{k:'x.....x...x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'}},
  // fase 7, Dark Horse: galope de faroeste de cinema, em lá menor
  darkhorse:{bpm:150,spb:16,chords:['Am','Am','G','G','F','F','E','E'],
    lead:{wave:'square',v:.9,pat:'E5:4 A5:4 C6:4 B5:2 A5:2 E6:8 C6:4 A5:4 D6:4 B5:4 G5:4 A5:2 B5:2 D6:12 .:4 C6:4 A5:4 F5:4 G5:2 A5:2 C6:8 F6:4 E6:4 B5:4 G#5:4 E5:4 F5:2 G#5:2 B5:8 E6:4 .:4'},
    bass:'R:2 R:1 R:1 R:2 R:1 R:1 5:2 5:1 5:1 5:2 5:1 5:1',arp:'.:16',
    drums:{k:'x...x...x...x...',s:'....x.......x...',h:'x.xxx.xxx.xxx.xx'}},
  // encerramento: hino lento e reflexivo, em sol maior
  ending:{bpm:88,spb:16,chords:['G','D','Em','C','G','D','C','D'],
    lead:{wave:'triangle',v:1.6,vib:true,pat:'B4:4 D5:4 G5:6 F#5:2 E5:4 D5:4 A4:8 B4:4 E5:4 G5:6 A5:2 G5:4 E5:4 C5:8 D5:4 G5:4 B5:6 A5:2 A5:4 F#5:4 D5:8 E5:4 G5:4 C6:4 B5:2 A5:2 A5:8 F#5:4 D5:4'},
    bass:'R:8 5:4 8:4',arp:'R:2 3:2 5:2 8:2 5:2 3:2 5:2 3:2',arpOct:4,
    drums:{k:'x.......x.......',s:'........x.......'}}
};


// ganho por faixa, medido para todas ficarem no mesmo volume baixo
const MUSIC_GAIN: Record<string, number> = {title:0.98,fantasma:1.04,rachadinha:0.90,lacos:0.80,chocolate:1.27,vento:0.85,peixe:1.04,darkhorse:0.89,ending:0.80};
for (const k in MUSIC) {
  const t = MUSIC[k];
  t.g = MUSIC_GAIN[k] || 1;
  t.L = parsePat(t.lead.pat); t.B = parsePat(t.bass); t.A = parsePat(t.arp);
  t.CH = t.chords.map(chordOf); t.len = t.spb * t.chords.length;
}

let NOISE: AudioBuffer | null = null;
function noiseBuf(ac: BaseAudioContext) {
  if (NOISE && NOISE.sampleRate === ac.sampleRate) return NOISE;
  const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (NOISE = b);
}

// todo nó de ganho começa em zero, para não escapar um estalo antes do envelope
function mNote(ac: BaseAudioContext, out: AudioNode, f: number, t: number, dur: number, wave: OscillatorType, v: number, o: { vib?: boolean; pluck?: boolean } = {}) {
  const os = ac.createOscillator(), g = ac.createGain();
  g.gain.value = 0;
  os.type = wave; os.frequency.setValueAtTime(f, t);
  if (o.vib) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = 5.2; lg.gain.value = f * 0.006;
    l.connect(lg).connect(os.frequency); l.start(t); l.stop(t + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.008);
  if (o.pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.18, dur));
  else {
    g.gain.linearRampToValueAtTime(v * 0.7, t + Math.min(0.12, dur * 0.5));
    g.gain.setValueAtTime(v * 0.7, t + Math.max(0.01, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  os.connect(g).connect(out); os.start(t); os.stop(t + dur + 0.25);
}

function mDrum(ac: BaseAudioContext, out: AudioNode, kind: string, t: number) {
  if (kind === 'k') {
    const o = ac.createOscillator(), g = ac.createGain();
    g.gain.value = 0; o.type = 'sine';
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.2);
    return;
  }
  if (kind === 'c') { // tique-taque do relógio de ponto
    const o = ac.createOscillator(), g = ac.createGain();
    g.gain.value = 0; o.type = 'square'; o.frequency.value = (Math.floor(t * 10) % 2) ? 1500 : 1900;
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.05);
    return;
  }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  g.gain.value = 0; s.buffer = noiseBuf(ac);
  f.type = 'highpass'; f.frequency.value = kind === 's' ? 1400 : 7000;
  const d = kind === 's' ? 0.12 : 0.035;
  g.gain.setValueAtTime(kind === 's' ? 0.09 : 0.035, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
}

// toca tudo o que começa no passo `step` da faixa, no instante t.
// `loop` alterna o arranjo: 0 melodia cheia, 1 melodia suave uma oitava abaixo, 2 só o acompanhamento
function mStep(ac: BaseAudioContext, out: AudioNode, tr: Track, step: number, t: number, loop = 0) {
  const sd = 60 / tr.bpm / 4, ch = tr.CH![Math.floor(step / tr.spb) % tr.CH!.length], vr = loop % 3;
  const li = step % tr.L!.len;
  if (vr !== 2) for (const e of tr.L!.ev) if (e.at === li) {
    let m = midiOf(e.sym);
    if (m == null) continue;
    if (vr === 1) { m -= 12; mNote(ac, out, hz(m), t, e.dur * sd * 0.95, 'triangle', 0.06 * tr.lead.v, { vib: true }); continue; }
    if (tr.lead.trem) for (let i = 0; i < e.dur; i++) mNote(ac, out, hz(m), t + i * sd, sd * 0.9, tr.lead.wave, 0.045 * tr.lead.v, { pluck: true });
    else mNote(ac, out, hz(m), t, e.dur * sd * 0.95, tr.lead.wave, 0.045 * tr.lead.v, { vib: tr.lead.vib, pluck: tr.lead.env === 'pluck' });
  }
  const bi = step % tr.B!.len;
  for (const e of tr.B!.ev) if (e.at === bi) mNote(ac, out, hz(degree(ch, e.sym, 2)), t, e.dur * sd * 0.9, 'triangle', 0.07);
  const ai = step % tr.A!.len;
  for (const e of tr.A!.ev) if (e.at === ai) for (const d of e.sym.split('+')) mNote(ac, out, hz(degree(ch, d, tr.arpOct || 3) + (tr.arpOct ? 0 : 12)), t, e.dur * sd * 0.8, 'square', 0.012, { pluck: true });
  for (const k in tr.drums) { const p = tr.drums[k]; if (p[step % p.length] === 'x') mDrum(ac, out, k, t); }
}

// Toca a faixa pedida a cada quadro, trocando com um fade curto; abaixa na pausa e respeita o mudo
export function createMusic() {
  let name: string | null = null, bus: GainNode | null = null, trGain: GainNode | null = null, master: GainNode | null = null;
  let step = 0, loop = 0, next = 0;
  function set(ac: AudioContext, want: string | null) {
    if (name === want) return;
    if (!master) { master = ac.createGain(); master.gain.value = MUSIC_VOL; master.connect(ac.destination); }
    const t = ac.currentTime;
    if (bus) {
      const old = bus;
      old.gain.cancelScheduledValues(t); old.gain.setValueAtTime(old.gain.value, t); old.gain.linearRampToValueAtTime(0, t + 0.35);
      setTimeout(() => { try { old.disconnect(); } catch (_) {} }, 800);
    }
    name = want; bus = null; trGain = null;
    if (!want || !MUSIC[want]) { name = null; return; }
    bus = ac.createGain(); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(1, t + 0.4); bus.connect(master);
    trGain = ac.createGain(); trGain.gain.value = MUSIC[want].g || 1; trGain.connect(bus);
    step = 0; loop = 0; next = t + 0.12;
  }
  return {
    tick(ac: AudioContext | null, want: string | null, muted: boolean, paused: boolean) {
      if (!ac) return;
      set(ac, want);
      if (master) {
        const target = muted ? 0 : MUSIC_VOL * (paused ? 0.35 : 1);
        if (Math.abs(master.gain.value - target) > 0.001) master.gain.setTargetAtTime(target, ac.currentTime, 0.08);
      }
      if (!name || !trGain) return;
      const tr = MUSIC[name], sd = 60 / tr.bpm / 4;
      if (next < ac.currentTime - 0.25) next = ac.currentTime + 0.05; // voltou de um travamento: não despeja notas atrasadas
      while (next < ac.currentTime + 0.18) {
        mStep(ac, trGain, tr, step, next, loop);
        step++;
        if (step >= tr.len!) { step = 0; loop++; }
        next += sd;
      }
    },
    stop(ac: AudioContext | null) { if (ac) set(ac, null); }
  };
}
