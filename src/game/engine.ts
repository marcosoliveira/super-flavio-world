import { SRC, VW, VH, TS, ROWS, hr, fmtBR } from './sources.ts';
import { buildSprites } from './sprites.ts';
import { LEVELS, THEMES, MAPNODES, build, LevelData } from './levels.ts';

export function initGame() {
  const cv = document.getElementById('game') as HTMLCanvasElement;
  if (!cv) return () => {};
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const $ = (id: string) => document.getElementById(id)!;
  const { SPR, SPRQ, SPRM } = buildSprites();

  const selCanvas = $('selSprite') as HTMLCanvasElement;
  if (selCanvas) selCanvas.getContext('2d')?.drawImage(SPR.stand[0], 0, 0);

  // Audio synthesizer
  let AC: AudioContext | null = null;
  let muted = false;
  function unlockAudio() {
    if (AC) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) AC = new AudioCtx();
    } catch (_) {}
  }
  function tone(f: number, d: number, type: OscillatorType = 'square', v = 0.045, slide = 0, delay = 0) {
    if (muted || !AC) return;
    try {
      const t = AC.currentTime + delay;
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(AC.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    } catch (_) {}
  }
  const sfx = {
    jump: () => tone(330, 0.16, 'square', 0.035, 660),
    coin: () => { tone(988, 0.07); tone(1319, 0.22, 'square', 0.04, 0, 0.07); },
    stomp: () => tone(260, 0.12, 'square', 0.05, 90),
    bump: () => tone(140, 0.08, 'triangle', 0.08),
    die: () => { [494, 466, 440, 392, 349, 330].forEach((f, i) => tone(f, 0.14, 'square', 0.05, 0, i * 0.13)); },
    clear: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.045, 0, i * 0.11)); },
    pick: () => { tone(660, 0.08); tone(880, 0.08, 'square', 0.04, 0, 0.08); tone(1175, 0.16, 'square', 0.04, 0, 0.16); },
    throw: () => tone(880, 0.08, 'square', 0.03, 440),
    ghost: () => tone(520, 0.18, 'sine', 0.05, 260),
    hurt: () => tone(200, 0.25, 'sawtooth', 0.04, 80),
    atm: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.08, 'square', 0.035, 0, i * 0.05)); },
    sel: () => tone(600, 0.06, 'square', 0.03)
  };

  // State
  let S = 'title';
  let T = 0;
  let lives = 22;
  let progress = 0;
  let mapIdx = 0;
  let lv: LevelData | null = null;
  let st: any = null;
  let P: any = null;
  let camX = 0;
  let parts: any[] = [];
  let dieT = 0;
  let pitFall = false;
  let clearT = 0;
  let dq: any = null;
  let under = 'map';
  let titleCam = 0;
  let toastT = 0;
  let hudCache = '';
  let cardMode = '';
  let killedBy = '';

  try {
    progress = Math.min(7, parseInt(localStorage.getItem('sfw-progress') || '0', 10) || 0);
  } catch (_) {}
  mapIdx = Math.min(progress, 6);
  const saveProgress = () => {
    try { localStorage.setItem('sfw-progress', String(progress)); } catch (_) {}
  };

  // Controls
  const K: Record<string, boolean> = {};
  const pressed: Record<string, boolean> = {};
  const KEYMAP: Record<string, string> = {
    ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D',
    KeyZ: 'J', KeyX: 'B', Enter: 'S', NumpadEnter: 'S', Escape: 'P', KeyM: 'M'
  };

  const isTouch = () => document.documentElement.classList.contains('touch-on');
  const keyB = () => isTouch() ? 'B' : 'X';
  const keyJ = () => isTouch() ? 'A' : 'Z';
  const keyBack = () => isTouch() ? 'II' : 'Esc';
  const confirmHit = () => pressed.J || pressed.S;

  function setBtn(b: string, on: boolean, el?: Element | null) {
    if (on && !K[b]) pressed[b] = true;
    K[b] = on;
    if (el) el.classList.toggle('on', on);
  }

  const dpad = $('dpad');
  const dirEl: Record<string, HTMLElement | null> = {
    U: dpad?.querySelector('.u') as HTMLElement,
    D: dpad?.querySelector('.d') as HTMLElement,
    L: dpad?.querySelector('.l') as HTMLElement,
    R: dpad?.querySelector('.r') as HTMLElement
  };
  let dpadId: number | null = null;

  function dpadAt(e: PointerEvent) {
    if (!dpad) return;
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dz = r.width * 0.1;
    const v = Math.abs(dy) > Math.abs(dx) * 0.9;
    const s: Record<string, boolean> = {
      L: dx < -dz && !(v && Math.abs(dx) < dz * 2),
      R: dx > dz && !(v && Math.abs(dx) < dz * 2),
      U: dy < -dz && v,
      D: dy > dz && v
    };
    for (const b in s) setBtn(b, s[b], dirEl[b]);
  }

  function enableTouch() {
    if (isTouch()) return;
    document.documentElement.classList.add('touch-on');
    const p1 = $('pressTxt'), p2 = $('pickTxt'), p3 = $('pauseTxt'), ctl = $('ctl');
    if (p1) p1.textContent = 'Toque para começar';
    if (p2) p2.textContent = 'Toque para escolher';
    if (p3) p3.textContent = 'A continua · B volta ao mapa';
    if (ctl) ctl.innerHTML = '<div><b>◀ ▶</b> andar<br><b>A</b> pular</div><div><b>B</b> correr / ação<br><b>II</b> pausa</div>';
    checkRotate();
  }

  function checkRotate() {
    const need = window.innerHeight > window.innerWidth && (isTouch() || window.innerWidth <= 900);
    const rot = $('rotate');
    if (rot) rot.hidden = !need;
    if (need && S === 'play') setS('pause');
  }

  function toast(t: string) {
    const el = $('toast');
    if (!el) return;
    el.textContent = t;
    el.hidden = false;
    toastT = 110;
  }

  function esc(t: any) {
    return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
  }

  const heroSpr = () => (lv && lv.D?.hero === 'queiroz' ? SPRQ : SPR);
  const heroName = () => (lv && lv.D?.hero === 'queiroz' ? 'Queiroz' : 'Flavinho');

  function mapBar() {
    const D = LEVELS[mapIdx];
    const t1 = $('mT1'), t2 = $('mT2'), t3 = $('mT3');
    if (t1) t1.textContent = `Fase ${mapIdx + 1} · ${D.year}` + (mapIdx < progress ? ' · concluída' : '');
    if (t2) t2.textContent = D.name;
    if (t3) t3.innerHTML = `Aperte ${keyJ()} para entrar na fase<br>◀ ▶ para andar · Vidas ${lives}`;
  }

  function ui() {
    $('title').hidden = S !== 'title';
    $('select').hidden = S !== 'select';
    $('mapbar').hidden = !(S === 'map' || (S === 'dialog' && under === 'map'));
    $('hud').hidden = !(lv && ['play', 'dialog', 'dying', 'clear', 'pause', 'card'].includes(S) && under === 'play');
    $('dlg').hidden = S !== 'dialog';
    $('card').hidden = S !== 'card';
    $('pause').hidden = S !== 'pause';
    document.documentElement.classList.toggle('txt-open', S === 'dialog' || S === 'card');
    if (S === 'map') mapBar();
  }

  function setS(s: string) {
    S = s;
    ui();
  }

  function renderDlg(fresh = false) {
    if (!dq) return;
    const p = dq.pages[dq.i];
    const full = p.body || '';
    const shown = full.slice(0, Math.floor(dq.n));
    const doneTyping = dq.n >= full.length;
    const tagCls = p.tag === 'O que aconteceu' ? 'tag fact' : (/^Final/.test(p.tag || '') || p.tag === 'Surpresa!') ? 'tag end' : 'tag';
    let h = p.tag ? `<div class="${tagCls}">${esc(p.tag)}</div>` : '';
    if (p.title) h += `<h2>${esc(p.title)}</h2>`;
    h += `<p>${esc(shown)}${doneTyping ? '' : '<span style="opacity:.4">▌</span>'}</p>`;
    if (doneTyping) {
      if (p.stats) h += `<dl class="stats">${p.stats.map(([k, v]: [string, string]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
      if (p.note) h += `<p class="note">${esc(p.note)}</p>`;
      if (p.src && p.src.length) {
        h += `<div class="src">Fontes: ${p.src.map((k: string) => `<a href="${SRC[k][1]}" target="_blank" rel="noopener noreferrer">${esc(SRC[k][0])} ↗</a>`).join(' · ')}</div>`;
      }
      h += `<div class="next" id="dlgNext"></div>`;
    }
    const dlgEl = $('dlg');
    if (dlgEl) {
      dlgEl.innerHTML = h;
      if (fresh) dlgEl.scrollTop = 0;
      else if (!doneTyping) dlgEl.scrollTop = dlgEl.scrollHeight;
      updNext();
    }
  }

  // Quanto texto ainda está escondido abaixo da área visível da caixa
  function dlgHidden() {
    const el = $('dlg');
    return el ? el.scrollHeight - el.clientHeight - el.scrollTop : 0;
  }

  function updNext() {
    const n = document.getElementById('dlgNext');
    if (!n || !dq) return;
    const more = dlgHidden() > 2;
    n.classList.toggle('more', more);
    n.textContent = more
      ? `Aperte ${keyJ()} para rolar ▼`
      : `Aperte ${keyJ()} para continuar ▶`;
  }

  function dialog(pages: any[], done: () => void, u?: string) {
    under = u || under;
    dq = { pages, i: 0, done, n: 0 };
    renderDlg(true);
    setS('dialog');
  }

  function updDialog() {
    if (!dq) return;
    const p = dq.pages[dq.i];
    const len = (p.body || '').length;
    if (dq.n < len) {
      dq.n = Math.min(len, dq.n + 1.6);
      if (confirmHit()) dq.n = len;
      renderDlg();
      if (dq.n < len && T % 3 === 0) tone(1400, 0.02, 'square', 0.012);
      return;
    }
    if (confirmHit()) {
      sfx.sel();
      const el = $('dlg');
      if (el && dlgHidden() > 2) {
        el.scrollBy({ top: el.clientHeight * 0.75, behavior: 'smooth' });
        return;
      }
      if (dq.i < dq.pages.length - 1) {
        dq.i++;
        dq.n = 0;
        renderDlg(true);
      } else {
        const d = dq.done;
        dq = null;
        if (d) d();
      }
    }
  }

  function showCard(final: boolean) {
    if (!lv || !lv.D) return;
    const D = lv.D;
    const msg = (pitFall && D.pitDeath) ? D.pitDeath : (D.deathBy && D.deathBy[killedBy]) || D.death;
    cardMode = final ? 'moro' : 'retry';
    const roll = $('roll');
    if (roll) {
      roll.innerHTML = final
        ? `<div class="go-kick">${heroName()} × 0</div><div class="go-big" style="text-decoration:line-through;text-decoration-thickness:.6cqw">Game over</div><div class="go-head">Aliado inesperado!</div><canvas id="moroSpr" width="14" height="20" style="width:7cqw;height:10cqw;image-rendering:pixelated" aria-hidden="true"></canvas><div class="go-sub">O Flavinho nunca foi condenado, e não ia ser agora. Sergio Moro, o ex-juiz que condenou Lula, entrou no PL e subiu no palanque de Flávio. Ele chega a tempo de salvar o dia: +22 vidas.</div><div class="go-lives">${heroName()} × 22</div><div class="go-hint">Aperte ${keyJ()} para continuar a fase</div>`
        : `<div class="go-kick">Fase ${lv.i! + 1} · ${esc(D.name)}</div><div class="go-big">Game over</div><div class="go-head">${esc(msg.head)}</div><div class="go-sub">${esc(msg.sub)}</div><div class="go-lives">${heroName()} × ${lives}</div><div class="go-hint">${keyJ()} tenta de novo · ${keyBack()} volta ao mapa</div>`;
      if (final) {
        const mc = document.getElementById('moroSpr') as HTMLCanvasElement;
        if (mc) mc.getContext('2d')?.drawImage(SPRM.stand[0], 0, 0);
        sfx.clear();
      }
      roll.style.animation = 'none';
      void roll.offsetWidth;
      roll.style.animation = '';
    }
    setS('card');
  }

  // Level & Physics
  const SOLID = new Set(['#', 'B', '?', 'U', 'X', '>', '<', 'C', 'T']);
  function tileAt(tx: number, ty: number) {
    if (!lv) return '#';
    if (tx < 0 || tx >= lv.w) return '#';
    if (ty < 0 || ty >= ROWS) return ' ';
    return lv.g[ty][tx];
  }
  function solidFor(c: string, body: any, down: boolean, prevBottom?: number, ty?: number) {
    if (c === '-') return down && (prevBottom ?? 0) <= (ty ?? 0) * TS + 0.01;
    if (c === 'T') return !(body === P && (P.ghost || P.inT));
    return SOLID.has(c);
  }
  function moveBody(b: any, dx: number, dy: number) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    if (n === 1) return moveStep(b, dx, dy);
    const r: any = {};
    let sx = dx / n, sy = dy / n;
    for (let i = 0; i < n; i++) {
      const q = moveStep(b, sx, sy);
      if (q.wall) { r.wall = q.wall; sx = 0; }
      if (q.land) { r.land = true; sy = 0; }
      if (q.head) { r.head = q.head; sy = 0; }
      if (!sx && !sy) break;
    }
    return r;
  }
  function moveStep(b: any, dx: number, dy: number) {
    const r: any = {};
    if (dx) {
      b.x += dx;
      const y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
      if (dx > 0) {
        const tx = Math.floor((b.x + b.w - 0.01) / TS);
        for (let ty = y0; ty <= y1; ty++) {
          if (solidFor(tileAt(tx, ty), b, false)) { b.x = tx * TS - b.w; r.wall = 1; break; }
        }
      } else {
        const tx = Math.floor(b.x / TS);
        for (let ty = y0; ty <= y1; ty++) {
          if (solidFor(tileAt(tx, ty), b, false)) { b.x = (tx + 1) * TS; r.wall = -1; break; }
        }
      }
    }
    const prevBottom = b.y + b.h;
    b.y += dy;
    const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS);
    if (dy > 0) {
      const ty = Math.floor((b.y + b.h - 0.01) / TS);
      for (let tx = x0; tx <= x1; tx++) {
        if (solidFor(tileAt(tx, ty), b, true, prevBottom, ty)) { b.y = ty * TS - b.h; r.land = true; break; }
      }
    } else if (dy < 0) {
      const ty = Math.floor(b.y / TS), cx = Math.floor((b.x + b.w / 2) / TS);
      for (const tx of [cx, x0, x1]) {
        const c = tileAt(tx, ty);
        if (c !== '-' && solidFor(c, b, false)) { b.y = (ty + 1) * TS; r.head = { tx, ty, c }; break; }
      }
    }
    return r;
  }
  const over = (a: any, b: any) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function overlapsTile(b: any, ch: string) {
    const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS);
    const y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === ch) return true;
    return false;
  }

  function loadLevel(i: number) {
    const D = LEVELS[i];
    lv = build(D);
    lv.i = i;
    lv.id = D.id;
    lv.D = D;
    lv.cr = {};
    lv.th = THEMES[D.theme];
    st = { coins: 0, queiroz: 0, crachas: 0, deposits: 0, carry: 0, dollars: 0, gust: 0, pontos: 0, provas: 0, spawn: 60 };
    if (lv.id === 'rachadinha') {
      let n = lv.ents.filter(e => e.k === 'coin').length;
      lv.g.forEach(r => r.forEach(c => { if (c === '?') n++; }));
      lv.coinVal = 7e6 / (n || 1);
    }
    P = { x: lv.start.x, y: lv.start.y, w: 10, h: 20, vx: 0, vy: 0, on: false, face: 1, ghost: false, meter: 150, inv: 0, horse: false, jbuf: 0, coyote: 0, anim: 0, ext: 0, inT: false };
    camX = 0;
    parts = [];
    hudCache = '';
  }

  function killPlayer(pit: boolean, by?: string) {
    if (S !== 'play' || !P) return;
    killedBy = by || '';
    pitFall = !!pit;
    P.vy = pit ? 0 : -5;
    P.vx = 0;
    dieT = pit ? 50 : 100;
    P.ghost = false;
    sfx.die();
    setS('dying');
  }

  function loseHorse() {
    P.horse = false; P.h = 20; P.y += 10; P.inv = 100; sfx.hurt();
    parts.push({ k: 'horseRun', x: P.x - 4, y: P.y + 2, vx: -P.face * 2.2, t: 120, face: -P.face });
  }

  function getCoin(x: number, y: number) {
    st.coins++;
    sfx.coin();
    if (lv?.id === 'fantasma') P.meter = Math.min(150, P.meter + 35);
    if (lv?.id === 'rachadinha') {
      st.queiroz += lv.coinVal || 0;
      parts.push({ k: 'half', sx: x - camX, sy: y, t: 0 });
    }
  }

  function headHit(h: { tx: number; ty: number; c: string }) {
    if (!lv) return;
    if (h.c === '?') {
      lv.g[h.ty][h.tx] = 'U';
      getCoin(h.tx * TS + 3, h.ty * TS - 12);
      parts.push({ k: 'popcoin', x: h.tx * TS + 3, y: h.ty * TS - 14, vy: -3, t: 24 });
    } else if (h.c === 'B' || h.c === 'U' || h.c === 'X') {
      sfx.bump();
    }
    if (h.c === 'B') parts.push({ k: 'bump', tx: h.tx, ty: h.ty, t: 8 });
  }

  function updPlayer() {
    if (!lv || !P) return;
    const run = K.B && lv.id !== 'fantasma';
    let max = run ? 2.3 : 1.4;
    if (P.horse) max += 0.5;
    const acc = P.on ? 0.12 : 0.085;
    if (K.L && !K.R) { P.face = -1; if (P.vx > -max) P.vx = Math.max(-max, P.vx - acc); }
    else if (K.R && !K.L) { P.face = 1; if (P.vx < max) P.vx = Math.min(max, P.vx + acc); }
    else { P.vx *= P.on ? 0.8 : 0.97; if (Math.abs(P.vx) < 0.05) P.vx = 0; }
    if (Math.abs(P.vx) > max) P.vx = Math.sign(P.vx) * Math.max(max, Math.abs(P.vx) - 0.08);

    P.inT = overlapsTile(P, 'T');
    if (lv.id === 'fantasma') {
      const was = P.ghost;
      if (K.B && P.meter > 0) { P.ghost = true; P.meter -= 1; }
      else { P.ghost = false; P.meter = Math.min(150, P.meter + 0.3); }
      if (P.ghost && !was) sfx.ghost();
      if (!P.ghost && P.inT) { P.vx = -1.6; if (T % 10 === 0) tone(180, 0.06, 'sawtooth', 0.03); }
    }

    if (lv.id === 'lacos' && pressed.B && lv.ents.filter(e => e.k === 'medal').length < 2) {
      lv.ents.push({ k: 'medal', x: P.x + (P.face > 0 ? P.w : -8), y: P.y + 6, w: 8, h: 8, vx: 3.2 * P.face, vy: 1, life: 140 });
      sfx.throw();
    }

    P.ext = 0;
    if (lv.id === 'vento') {
      st.gust = Math.max(0, Math.sin(T * 0.018)) ** 2;
      if (!P.on || K.L || K.R) P.ext -= 0.1 + 0.16 * st.gust;
    }
    if (P.on) {
      const ty = Math.floor((P.y + P.h + 1) / TS);
      const x0 = Math.floor(P.x / TS);
      const x1 = Math.floor((P.x + P.w - 0.01) / TS);
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (c === '>') { P.ext += 0.7; break; }
        if (c === '<') { P.ext -= 0.7; break; }
        if (c === 'C') {
          const key = tx + ',' + ty;
          if (!lv.cr![key]) lv.cr![key] = { s: 'shake', t: 60 };
        }
      }
    }

    if (pressed.J) P.jbuf = 7;
    if (P.jbuf > 0) P.jbuf--;
    if (P.on) P.coyote = 6;
    else if (P.coyote > 0) P.coyote--;

    if (P.jbuf > 0 && P.coyote > 0) {
      let jv = 4.3 + Math.abs(P.vx) * 0.25;
      if (P.horse) jv += 0.6;
      if (lv.id === 'chocolate') jv *= Math.max(0.78, 1 - 0.022 * st.carry);
      P.vy = -jv;
      P.on = false;
      P.coyote = 0;
      P.jbuf = 0;
      sfx.jump();
    }
    const g = (K.J && P.vy < 0) ? 0.14 : 0.34;
    P.vy = Math.min(P.vy + g, 5.5);
    const r = moveBody(P, P.vx + P.ext, P.vy);
    if (r.wall) P.vx = 0;
    P.on = !!r.land;
    if (r.land) P.vy = 0;
    if (r.head) { P.vy = Math.max(P.vy, 0.5); headHit(r.head); }
    P.anim += Math.abs(P.vx);
    if (P.inv > 0) P.inv--;
    if (P.x < 0) P.x = 0;
  }

  const hurtable = (e: any) => ['walk', 'hop', 'fly', 'fish', 'report'].includes(e.k) && !e.dead && !e.squash;
  function killEnemy(e: any, how: string) {
    if (how === 'stomp' && (e.k === 'walk' || e.k === 'hop')) e.squash = 24;
    else { e.dead = true; e.vy = -3; e.vx = (e.vx || 0) * 0.5; }
  }

  function updEnts() {
    if (!lv || !P) return;
    for (const e of lv.ents) {
      if (e.gone) continue;
      if (!e.act) {
        if (e.x < camX + VW + 24 && e.x > camX - 80) e.act = true;
        else continue;
      }
      if (e.dead) {
        e.vy += 0.3; e.y += e.vy; e.x += e.vx || 0;
        if (e.y > VH + 40) e.gone = true;
        continue;
      }
      if (e.squash) {
        if (--e.squash <= 0) e.gone = true;
        continue;
      }
      switch (e.k) {
        case 'walk': {
          e.vy = Math.min(e.vy + 0.3, 5);
          const r = moveBody(e, e.vx, e.vy);
          if (r.wall) e.vx *= -1;
          if (r.land) {
            const ax = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
            const c = tileAt(Math.floor(ax / TS), Math.floor((e.y + e.h + 2) / TS));
            if (!SOLID.has(c) && c !== '-') e.vx *= -1;
          }
          if (e.y > VH + 40) e.gone = true;
          break;
        }
        case 'hop': {
          e.vy = Math.min(e.vy + 0.25, 5);
          e.vx = Math.sign(P.x - e.x || 1) * 0.45;
          const ax = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
          const c = tileAt(Math.floor(ax / TS), Math.floor((e.y + e.h + 2) / TS));
          const r = moveBody(e, e.onG && !SOLID.has(c) && c !== '-' ? 0 : e.vx, e.vy);
          e.onG = !!r.land;
          if (r.land) { e.vy = 0; if ((T + e.ph) % 64 === 0) e.vy = -3.8; }
          if (e.y > VH + 40) e.gone = true;
          break;
        }
        case 'report': {
          e.x += e.vx - st.gust * 1.2;
          e.y += Math.sin(T * 0.09 + e.ph) * 0.7;
          if (e.x < camX - 30) { e.gone = true; st.provas++; }
          break;
        }
        case 'fly': {
          if (e.x0 === undefined) { e.x0 = e.x; e.y0 = e.y; e.t = hr(e.x) * 6; }
          e.t += 0.035; e.y = e.y0 + Math.sin(e.t) * 20; e.x = e.x0 + Math.sin(e.t * 0.5) * 28; e.vx = Math.cos(e.t * 0.5);
          break;
        }
        case 'fish': {
          if (e.air === undefined) { e.air = false; e.wait = 20 + Math.floor(hr(e.x) * 90); e.x0 = e.x; }
          if (!e.air) {
            if (--e.wait <= 0) { e.air = true; e.y = VH + 8; e.vy = -(5.5 + hr(e.x + T) * 0.9); e.x = e.x0; }
          } else {
            e.vy += 0.17; e.y += e.vy; e.x += Math.sin(T * 0.05 + e.x0) * 0.3;
            if (e.vy > 0 && e.y > VH + 10) { e.air = false; e.wait = 60 + Math.floor(hr(T + e.x0) * 90); }
          }
          break;
        }
        case 'cloud': {
          const tx = Math.min(Math.max(P.x + 36, 40), lv.goal * TS - 60);
          e.x += (tx - e.x) * 0.025; e.y = 14 + Math.sin(T * 0.04) * 4;
          e.tm = (e.tm || 90) - 1;
          if (e.tm <= 0) {
            e.tm = 78;
            const air = lv.ents.filter(b => b.k === 'bag' && !b.gone).length;
            if (st.dollars + air < 24 && P.x < lv.goal * TS - 40) {
              lv.ents.push({ k: 'bag', x: e.x + 10, y: e.y + 32, w: 12, h: 12, vy: 0, life: 460, act: true });
              tone(1200, 0.05, 'triangle', 0.03);
            }
          }
          break;
        }
        case 'bag': {
          if (e.vy !== undefined) {
            e.vy = Math.min((e.vy || 0) + 0.22, 4);
            const r = moveBody(e, 0, e.vy);
            if (r.land) e.vy = 0;
          }
          if (--e.life <= 0 || e.y > VH + 30) e.gone = true;
          break;
        }
        case 'medal': {
          e.vy = Math.min(e.vy + 0.35, 5);
          const r = moveBody(e, e.vx, e.vy);
          if (r.land) e.vy = -3;
          if (r.wall || --e.life <= 0 || e.y > VH) e.gone = true;
          for (const o of lv.ents) {
            if (!o.gone && o.act && hurtable(o) && over(e, o)) {
              killEnemy(o, 'medal');
              e.gone = true;
              sfx.stomp();
              parts.push({ k: 'txt', s: 'HOMENAGEADO', x: o.x - 14, y: o.y - 6, t: 50 });
              break;
            }
          }
          break;
        }
      }

      if (S !== 'play' || e.gone || !over(P, e)) continue;

      if (hurtable(e)) {
        if (lv.id === 'fantasma' && P.ghost) continue;
        if (P.vy > 0.4 && P.y + P.h - e.y < 10) {
          killEnemy(e, 'stomp');
          P.vy = K.J ? -5 : -3.2;
          sfx.stomp();
          continue;
        }
        if (P.inv > 0) continue;
        if (P.horse) { loseHorse(); continue; }
        killPlayer(false, e.skin || e.k);
        return;
      }

      switch (e.k) {
        case 'coin': e.gone = true; getCoin(e.x, e.y); break;
        case 'bill': e.gone = true; st.carry++; sfx.coin(); parts.push({ k: 'txt', s: '+1 NOTA', x: e.x - 6, y: e.y - 6, t: 36 }); break;
        case 'bag': e.gone = true; st.dollars++; sfx.coin(); parts.push({ k: 'txt', s: '+US$ 1 MI', x: e.x - 12, y: e.y - 6, t: 40 }); break;
        case 'ponto':
          if (!e.done) {
            if (P.ghost) {
              e.done = true; st.pontos++; sfx.pick(); parts.push({ k: 'txt', s: 'PONTO: ' + e.day.toUpperCase(), x: e.x - 14, y: e.y - 6, t: 60 });
            } else if (toastT <= 0) {
              toast(`Fique invisível (${keyB()}) para bater o ponto`);
            }
          }
          break;
        case 'cracha':
          e.gone = true; st.crachas++; sfx.pick();
          toast(`Crachá ${st.crachas}/2: ${st.crachas === 1 ? 'a mãe está contratada' : 'a mulher está contratada'}`);
          break;
        case 'horse':
          if (!P.horse) {
            e.gone = true; P.horse = true; P.y -= 10; P.h = 30; sfx.pick();
            toast('Você montou no Dark Horse');
          }
          break;
        case 'atm':
          if (st.carry > 0) {
            const n = st.carry * 36;
            st.deposits += n; st.carry = 0; sfx.atm();
            parts.push({ k: 'txt', s: `+${n} DEPÓSITOS`, x: e.x - 16, y: e.y - 10, t: 60 });
          }
          break;
      }
    }
    if (T % 120 === 0) lv.ents = lv.ents.filter(e => !e.gone);
  }

  function updCrumble() {
    if (!lv || !lv.cr) return;
    for (const key in lv.cr) {
      const c = lv.cr[key];
      const [tx, ty] = key.split(',').map(Number);
      if (c.s === 'shake') {
        if (--c.t <= 0) {
          lv.g[ty][tx] = ' '; c.s = 'gone'; c.t = 150;
          parts.push({ k: 'stamp', x: tx * TS, y: ty * TS, vy: 0, t: 400 });
        }
      } else if (--c.t <= 0) {
        const box = { x: tx * TS, y: ty * TS, w: TS, h: TS };
        if (!over(P, box)) { lv.g[ty][tx] = 'C'; delete lv.cr[key]; }
        else c.t = 20;
      }
    }
  }

  function updParts() {
    for (const p of parts) {
      p.t--;
      if (p.k === 'popcoin') { p.y += p.vy; p.vy += 0.25; }
      else if (p.k === 'txt') { p.y -= 0.5; }
      else if (p.k === 'half') { p.t += 2; }
      else if (p.k === 'paper') { p.vy += 0.2; p.y += p.vy; p.x -= 1; }
      else if (p.k === 'stamp') {
        p.vy = Math.min(p.vy + 0.3, 6); p.y += p.vy;
        const ty = Math.floor((p.y + 16) / TS);
        const below = tileAt(Math.floor((p.x + 8) / TS), ty);
        const hitGround = SOLID.has(below) && ty < ROWS;
        const hitBottom = p.y + 16 >= VH;
        if (hitGround || hitBottom) {
          const gy = hitGround ? ty * TS : VH;
          p.t = 0; tone(120, 0.12, 'square', 0.05, 60);
          if (!parts.some(q => q.k === 'anulado' && Math.abs(q.x - p.x) < 36 && q.t > 40)) {
            parts.push({ k: 'anulado', x: p.x + 8, y: gy - 9, t: 80 });
          }
        }
      } else if (p.k === 'horseRun') { p.x += p.vx; }
      else if (p.k === 'wind') { p.x += p.vx; p.y += Math.sin((p.x + p.t) * 0.05) * 0.6; }
    }
    parts = parts.filter(p => (p.k === 'half' ? p.t < 60 : p.t > 0));
    if (lv && lv.id === 'vento' && T % (st.gust > 0.5 ? 3 : 8) === 0) {
      parts.push({ k: 'wind', x: VW + 10, y: hr(T) * VH * 0.8, vx: -(3 + st.gust * 4 + hr(T + 1) * 2), t: 200, paper: hr(T + 2) < 0.35 });
    }
  }

  function goalLock() {
    if (!lv) return '';
    if (lv.id === 'lacos' && st.crachas < 2) return `A saída só abre com os 2 crachás (${st.crachas}/2)`;
    if (lv.id === 'fantasma' && st.pontos < 5) return `Faltam pontos da semana (${st.pontos}/5)`;
    return '';
  }

  function camera() {
    if (!lv || !P) return;
    const tx = Math.max(0, Math.min(lv.w * TS - VW, P.x - VW * 0.4));
    camX += (tx - camX) * 0.18;
    if (Math.abs(tx - camX) < 0.3) camX = tx;
  }

  function emendaStr() {
    return st.coins >= 20 ? '199.999,79' : fmtBR(st.coins * 9999.99, 2);
  }

  function resultLine() {
    if (!lv) return '';
    switch (lv.id) {
      case 'rachadinha': return `No jogo, você movimentou R$ ${fmtBR(st.queiroz / 1e6, 1)} mi e repassou R$ ${fmtBR(st.queiroz / 2e6, 1)} mi ao chefe.`;
      case 'chocolate': return `Você fez ${fmtBR(st.deposits)} de 1.512 depósitos.`;
      case 'peixe': return `Sua emenda: R$ ${emendaStr()}.`;
      case 'darkhorse': return `Você juntou US$ ${st.dollars} milhões.`;
    }
    return '';
  }

  function showEnding(done: () => void) {
    dialog([
      {
        tag: 'Final · Placar de 26 anos',
        title: 'Você zerou Super Flávio World',
        body: 'O resumo da campanha, com os números das reportagens:',
        stats: [
          ['Depósitos em espécie na loja', '1.512'],
          ['Movimentado por Queiroz', 'R$ 7 mi'],
          ['Emenda do caso Peixe', 'R$ 199.999,79'],
          ['Negociado com Vorcaro', 'US$ 24 mi'],
          ['Julgamentos de mérito', '0'],
          ['Condenações', '0']
        ],
        src: ['bbc22', 'stf', 'g1kop', 'g1em', 'bbcdh']
      },
      {
        title: 'O fim desse jogo é você quem escolhe',
        body: 'Flávio é candidato a presidente, e o mandato dele de senador termina em 31 de janeiro de 2027. Se perder a eleição, fica sem cargo a partir de 2027 e perde o foro privilegiado nos casos que não têm a ver com o mandato, que passam a correr na Justiça comum, como os de qualquer cidadão. Se for eleito, a Constituição impede que um presidente seja responsabilizado, durante o mandato, por atos alheios ao cargo. Aí o jogo provavelmente continua, impune, no Super Flávio World.',
        src: ['cnnpl', 'ndmais', 'cf86']
      }
    ], done, under);
  }

  function finishLevel() {
    if (!lv || !lv.D) return;
    const i = lv.i!;
    const D = lv.D;
    const extra = resultLine();
    dialog([{
      tag: 'O que aconteceu',
      title: D.name + ' · ' + D.year,
      body: D.outro.body,
      note: (extra ? extra + ' ' : '') + D.outro.note,
      src: D.outro.src
    }], () => {
      progress = Math.max(progress, i + 1);
      saveProgress();
      mapIdx = Math.min(i + 1, 6);
      if (i === 6) showEnding(() => { mapIdx = 6; under = 'map'; setS('map'); });
      else { under = 'map'; setS('map'); }
    }, 'play');
  }

  // Graphics rendering helpers
  function R(x: number, y: number, w: number, h: number, c: string) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function circ(x: number, y: number, r: number, c: string) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function sky(th: any) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
  }
  function rep(cam: number, f: number, span: number, fn: (x: number, k: number) => void) {
    const off = -((cam * f) % span + span) % span;
    for (let x = off - span; x < VW + span; x += span) {
      fn(x, Math.floor((cam * f - off + x) / span));
    }
  }

  const BG: Record<string, (cam: number) => void> = {
    brasilia(cam) {
      circ(250, 60, 22, '#fff1b8');
      rep(cam, 0.2, 300, (x) => {
        const c = '#e98c6a';
        R(x + 120, 58, 7, 94, c); R(x + 130, 58, 7, 94, c); R(x + 60, 146, 160, 10, c);
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x + 85, 146, 18, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 158, 146); ctx.lineTo(x + 200, 146); ctx.lineTo(x + 190, 132); ctx.lineTo(x + 168, 132); ctx.fill();
      });
      rep(cam, 0.45, 220, (x) => { circ(x + 60, 190, 60, '#d9a04a'); circ(x + 170, 196, 48, '#cf8f3e'); });
    },
    rio(cam) {
      rep(cam, 0.08, 200, (x) => { circ(x + 40, 40, 10, '#fff'); circ(x + 52, 36, 13, '#fff'); circ(x + 66, 42, 9, '#fff'); });
      rep(cam, 0.25, 340, (x) => {
        ctx.fillStyle = '#3a8a6a';
        ctx.beginPath(); ctx.ellipse(x + 80, 170, 34, 76, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 150, 176, 26, 46, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 80, 95); ctx.lineTo(x + 150, 131); ctx.stroke();
        const k = 0.5 - 0.5 * Math.cos(T * 0.01), cx = x + 80 + 70 * k, cy = 95 + 36 * k;
        R(cx, cy, 1, 3, '#1a1020'); R(cx - 3, cy + 3, 7, 5, '#e8412c'); R(cx - 2, cy + 4, 5, 2, '#cfeeff');
      });
      rep(cam, 0.5, 160, (x) => { circ(x + 30, 196, 40, '#2fae4a'); circ(x + 100, 200, 34, '#28a043'); });
    },
    night(cam) {
      for (let i = 0; i < 40; i++) {
        const x = (hr(i) * VW * 2 - cam * 0.03) % VW;
        R((x + VW) % VW, hr(i + 50) * 110, 1, 1, (T + i * 7) % 90 < 6 ? '#666' : '#fff');
      }
      circ(270, 40, 14, '#fff6d0'); circ(276, 36, 12, '#2a2a5e');
      rep(cam, 0.3, 240, (x, k) => {
        for (let j = 0; j < 5; j++) {
          const bw = 26 + (Math.floor(hr(k * 9 + j) * 14)), bh = 40 + (Math.floor(hr(k * 5 + j) * 70)), bx = x + j * 48;
          R(bx, VH - bh, bw, bh, '#191a3c');
          for (let wy = VH - bh + 6; wy < VH - 8; wy += 9) {
            for (let wx = bx + 4; wx < bx + bw - 4; wx += 7) {
              if (hr(wx * 3 + wy + k) > 0.62) R(wx, wy, 3, 4, '#f7d56b');
            }
          }
        }
      });
    },
    choco(cam) {
      rep(cam, 0.25, 260, (x) => {
        R(x + 40, 70, 26, 122, '#8a4a2a'); R(x + 44, 56, 18, 16, '#6b3a1e');
        R(x + 120, 90, 20, 102, '#8a4a2a'); R(x + 110, 120, 120, 72, '#a0582e');
        for (let i = 0; i < 4; i++) circ(x + 53 + Math.sin(T * 0.02 + i) * 6, 48 - i * 12 - (T * 0.3 % 12), 6 + i * 2, 'rgba(255,240,245,.55)');
        for (let i = 0; i < 6; i++) R(x + 112 + i * 20, 126, 10, 8, '#ffd9e6');
      });
      rep(cam, 0.5, 180, (x) => { circ(x + 50, 206, 56, '#c97a4a'); R(x + 30, 160, 8, 14, '#c97a4a'); R(x + 80, 158, 6, 20, '#c97a4a'); });
    },
    vento(cam) {
      rep(cam, 0.22, 380, (x) => {
        const c = '#9aa6b8';
        R(x + 60, 110, 200, 8, c); R(x + 50, 104, 220, 6, c);
        for (let i = 0; i < 9; i++) R(x + 70 + i * 22, 118, 7, 50, c);
        R(x + 50, 168, 220, 10, c);
      });
      rep(cam, 0.45, 200, (x) => { circ(x + 60, 210, 60, '#8993a3'); });
    },
    praia(cam) {
      circ(80, 70, 20, '#fff2b0');
      R(0, 118, VW, 74, '#2d8ce0');
      for (let i = 0; i < 8; i++) R(((i * 61 - cam * 0.1) % VW + VW) % VW, 124 + i * 8, 30, 1, '#8fd0ff');
      rep(cam, 0.15, 300, (x) => {
        ctx.fillStyle = '#3a7a6a';
        ctx.beginPath(); ctx.ellipse(x + 200, 118, 40, 16, 0, Math.PI, 0); ctx.fill();
      });
      rep(cam, 0.55, 190, (x) => {
        R(x + 40, 110, 4, 60, '#8a5a30');
        for (let a = 0; a < 5; a++) {
          ctx.fillStyle = '#2f9a4a';
          ctx.beginPath(); ctx.ellipse(x + 42 + Math.cos(a * 1.3) * 10, 110 + Math.sin(a * 1.3) * 3, 12, 3, a * 1.3, 0, Math.PI * 2); ctx.fill();
        }
      });
    },
    estudio(cam) {
      for (let i = 0; i < 30; i++) R((hr(i) * VW * 1.5 - cam * 0.02 + VW) % VW, hr(i + 9) * 90, 1, 1, '#bba');
      for (let i = 0; i < 3; i++) {
        const cx = 60 + i * 110, a = Math.sin(T * 0.012 + i * 2) * 0.5;
        ctx.fillStyle = 'rgba(255,236,160,.10)';
        ctx.beginPath(); ctx.moveTo(cx, VH); ctx.lineTo(cx + Math.sin(a) * 260 - 40, 0); ctx.lineTo(cx + Math.sin(a) * 260 + 40, 0); ctx.fill();
      }
      rep(cam, 0.2, 420, (x) => {
        R(x + 100, 30, 170, 34, '#2a1030'); R(x + 104, 34, 162, 26, '#120818');
        ctx.fillStyle = '#ffd21f'; ctx.font = '12px "Press Start 2P", monospace'; ctx.fillText('DARK HORSE', x + 124, 53);
        for (let i = 0; i < 17; i++) R(x + 102 + i * 10, 31, 3, 3, (T >> 3) % 2 === i % 2 ? '#fff5c0' : '#7a5a20');
      });
    }
  };

  function drawStamp(x: number, y: number) {
    R(x + 4, y, 8, 4, '#7a4a20'); R(x + 5, y, 6, 1, '#a06a3a'); R(x + 7, y + 4, 2, 4, '#5a3416');
    R(x + 1, y + 8, 14, 5, '#8a1f1a'); R(x + 1, y + 8, 14, 1, '#b23a2a'); R(x + 1, y + 13, 14, 3, '#e8412c');
  }

  function drawTile(c: string, x: number, y: number, tx: number, ty: number, th: any) {
    switch (c) {
      case '#': {
        const topEdge = !['#', '>', '<'].includes(tileAt(tx, ty - 1));
        R(x, y, 16, 16, th.fill);
        if ((tx + ty) % 2 === 0) R(x + 4, y + 8, 2, 2, th.dot); else R(x + 10, y + 11, 2, 2, th.dot);
        if (topEdge) { R(x, y, 16, 5, th.top); R(x, y + 5, 16, 1, 'rgba(0,0,0,.25)'); }
        break;
      }
      case 'B':
        R(x, y, 16, 16, th.brick);
        R(x, y + 7, 16, 1, 'rgba(0,0,0,.35)'); R(x, y + 15, 16, 1, 'rgba(0,0,0,.35)');
        R(x + 7, y, 1, 7, 'rgba(0,0,0,.35)'); R(x + 3, y + 8, 1, 7, 'rgba(0,0,0,.35)'); R(x + 12, y + 8, 1, 7, 'rgba(0,0,0,.35)');
        R(x, y, 16, 1, 'rgba(255,255,255,.25)');
        break;
      case '?': {
        const b = (T >> 4) % 4;
        R(x, y, 16, 16, '#1a1020'); R(x + 1, y + 1, 14, 14, b === 3 ? '#ffe680' : '#ffc21f'); R(x + 1, y + 1, 14, 1, '#fff2a8');
        const Q = ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'];
        Q.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') R(x + 3 + i * 2, y + 2 + j * 2, 2, 2, '#8a4a10'); });
        break;
      }
      case 'U':
        R(x, y, 16, 16, '#1a1020'); R(x + 1, y + 1, 14, 14, '#9a6a40');
        R(x + 3, y + 3, 2, 2, '#6a4020'); R(x + 11, y + 3, 2, 2, '#6a4020');
        R(x + 3, y + 11, 2, 2, '#6a4020'); R(x + 11, y + 11, 2, 2, '#6a4020');
        break;
      case 'X':
        R(x, y, 16, 16, th.block); R(x, y, 16, 2, 'rgba(255,255,255,.22)'); R(x, y + 14, 16, 2, 'rgba(0,0,0,.3)'); R(x + 14, y, 2, 16, 'rgba(0,0,0,.2)');
        break;
      case '-':
        R(x, y, 16, 6, th.plat); R(x, y, 16, 1, 'rgba(255,255,255,.5)'); R(x, y + 5, 16, 1, 'rgba(0,0,0,.35)');
        if (tx % 3 === 0) R(x + 7, y + 6, 2, 10, 'rgba(0,0,0,.25)');
        break;
      case 'C': {
        const cr = lv?.cr?.[tx + ',' + ty];
        const sh = cr && cr.s === 'shake' ? ((T >> 1) % 2 ? 1 : -1) : 0;
        drawStamp(x + sh, y);
        break;
      }
      case 'T': {
        const a = P && P.ghost ? 0.35 : 1;
        ctx.globalAlpha = a;
        const top = tileAt(tx, ty - 1) !== 'T', bot = tileAt(tx, ty + 1) !== 'T';
        R(x + 2, y, 3, 16, '#b8c0d0'); R(x + 11, y, 3, 16, '#b8c0d0'); R(x + 6, y + (ty % 2 ? 4 : 10), 4, 2, '#e8412c');
        if (top) R(x, y, 16, 3, '#6a7280');
        if (bot) R(x, y + 13, 16, 3, '#6a7280');
        ctx.globalAlpha = 1;
        break;
      }
      case '>': case '<': {
        R(x, y, 16, 16, th.fill); R(x, y, 16, 6, '#333');
        const o = ((c === '>' ? T : -T) >> 1) % 8;
        for (let i = -8; i < 16; i += 8) {
          const px = x + ((i + o + 16) % 16);
          R(px, y + 1, 2, 4, '#ffd21f');
        }
        R(x, y + 6, 16, 1, 'rgba(0,0,0,.4)');
        break;
      }
    }
  }

  function drawHorse(x: number, y: number, face: number, run: boolean) {
    ctx.save();
    if (face < 0) { ctx.translate(x * 2 + 22, 0); ctx.scale(-1, 1); }
    const c = '#17171f', m = '#6a6a80';
    R(x + 3, y + 4, 14, 7, c); R(x + 15, y, 4, 7, c); R(x + 17, y - 2, 5, 4, c); R(x + 21, y, 1, 2, c);
    R(x + 15, y - 1, 2, 5, m); R(x + 19, y - 1, 1, 1, '#fff'); R(x + 1, y + 4, 2, 7, m);
    const o = run ? ((T >> 3) % 2 ? 2 : -2) : 0;
    R(x + 4 + o, y + 11, 2, 7, c); R(x + 8 - o, y + 11, 2, 7, c); R(x + 12 + o, y + 11, 2, 7, c); R(x + 15 - o, y + 11, 2, 7, c);
    ctx.restore();
  }

  function drawSkin(e: any, x: number, y: number, o: number) {
    switch (e.skin || e.k) {
      case 'servidor':
        R(x + 4, y, 6, 2, '#4a3a2a'); R(x + 4, y + 2, 6, 4, '#e6a77e'); R(x + 5, y + 3, 1, 1, '#1a1020'); R(x + 8, y + 3, 1, 1, '#1a1020');
        R(x + 2, y + 6, 10, 6, '#6a7082'); R(x + 4, y + 7, 2, 3, '#f4f4f4');
        R(e.vx > 0 ? x + 11 : x, y + 7, 3, 4, '#f4f4f4'); R(e.vx > 0 ? x + 11 : x, y + 7, 3, 1, '#7a4a20');
        R(x + 3 + o, y + 12, 3, 2, '#1a1020'); R(x + 8 - o, y + 12, 3, 2, '#1a1020');
        break;
      case 'fiscal':
        R(x + 4, y, 6, 2, '#2a1a10'); R(x + 4, y + 2, 6, 4, '#e6a77e'); R(x + 4, y + 3, 6, 1, '#1a1020');
        R(x + 2, y + 6, 10, 6, '#27305a'); R(x + 6, y + 6, 2, 4, '#e8412c');
        R(e.vx > 0 ? x + 10 : x, y + 7, 4, 5, '#f0c030');
        R(x + 3 + o, y + 12, 3, 2, '#1a1020'); R(x + 8 - o, y + 12, 3, 2, '#1a1020');
        break;
      case 'lupa':
        ctx.strokeStyle = '#eef1f8'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(150,200,255,.4)';
        ctx.beginPath(); ctx.arc(x + 6, y + 6, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        R(x + 10, y + 10, 2, 2, '#7a4a20'); R(x + 12, y + 12, 2, 2, '#7a4a20');
        R(x + 5 + Math.sign(P.x - e.x), y + 5, 2, 2, '#1a1020');
        break;
      case 'manchete':
        R(x + 1, y, 12, 12, '#1a1020'); R(x + 2, y + 1, 10, 10, '#f1ede2'); R(x + 3, y + 2, 8, 2, '#1a1020');
        R(x + 3, y + 5, 3, 1, '#8a8a8a'); R(x + 3, y + 7, 3, 1, '#8a8a8a'); R(x + 3, y + 9, 3, 1, '#8a8a8a');
        R(x + 7, y + 5, 4, 5, '#9a9a9a');
        R(x + 3 + o, y + 12, 3, 2, '#1a1020'); R(x + 8 - o, y + 12, 3, 2, '#1a1020');
        break;
      case 'camera':
        R(x, y + 3, 14, 9, '#23232b'); R(x + 2, y + 1, 4, 2, '#23232b'); R(x + 4, y + 5, 6, 5, '#6a7a8a'); R(x + 6, y + 6, 2, 2, '#cfeeff');
        if ((T + e.ph) % 80 < 6) { R(x + 9, y - 1, 5, 4, '#fffbd0'); circ(x + 11, y + 1, 8, 'rgba(255,250,200,.35)'); }
        else R(x + 9, y, 4, 3, '#9a9a9a');
        break;
      case 'bombom': {
        circ(x + 7, y + 7, 6, '#5a2c14');
        const s = (T >> 2) % 4;
        R(x + 3 + s, y + 3, 2, 8, '#7a4424'); R(x + 4, y + 3, 2, 2, '#a0603a');
        R(x - 2, y + 5, 3, 4, '#e8b830'); R(x + 13, y + 5, 3, 4, '#e8b830');
        break;
      }
      case 'pf':
        R(x + 3, y, 8, 2, '#111'); R(x + 4, y + 2, 6, 4, '#d99a6e'); R(x + 4, y + 3, 6, 1, '#111');
        R(x + 2, y + 6, 10, 6, '#15151a'); R(x + 4, y + 7, 2, 3, '#ffd21f'); R(x + 8, y + 7, 2, 3, '#ffd21f');
        R(x + 3 + o, y + 12, 3, 2, '#111'); R(x + 8 - o, y + 12, 3, 2, '#111');
        break;
      case 'celular': {
        R(x + 2, y, 10, 14, '#1a1020'); R(x + 3, y + 1, 8, 10, '#3a4a6a'); R(x + 6, y + 12, 2, 1, '#6a6a7a');
        const m = (T + e.ph) % 60 < 40;
        R(x + 4, y + 2, 5, 2, m ? '#2ecc55' : '#8a9ab0'); R(x + 5, y + 5, 5, 2, '#e6ecf4');
        if (m) R(x + 4, y + 8, 4, 2, '#2ecc55');
        R(x + 1, y + 5, 1, 4, '#1a1020'); R(x + 12, y + 5, 1, 4, '#1a1020');
        R(x + 3 + o, y + 14, 2, 1, '#1a1020'); R(x + 9 - o, y + 14, 2, 1, '#1a1020');
        break;
      }
      case 'tcu':
        R(x + 4, y, 6, 2, '#6a6a6a'); R(x + 4, y + 2, 6, 4, '#e6a77e'); R(x + 4, y + 3, 2, 1, '#1a1020'); R(x + 7, y + 3, 3, 1, '#1a1020'); R(x + 6, y + 3, 1, 1, '#1a1020');
        R(x + 2, y + 6, 10, 6, '#1f3a6a'); R(x + 6, y + 6, 2, 3, '#f4f4f4');
        R(e.vx > 0 ? x + 10 : x - 1, y + 6, 5, 6, '#d8d0b8'); R(e.vx > 0 ? x + 11 : x, y + 7, 3, 1, '#2a6a3a');
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) R((e.vx > 0 ? x + 11 : x) + i * 2, y + 9 + j * 1, 1, 1, '#555');
        R(x + 3 + o, y + 12, 3, 2, '#1a1020'); R(x + 8 - o, y + 12, 3, 2, '#1a1020');
        break;
      case 'fish': {
        const up = e.vy < 0;
        ctx.save(); ctx.translate(x + 7, y + 7); ctx.rotate(up ? -Math.PI / 2 : Math.PI / 2);
        R(-6, -4, 11, 8, '#ff8a1f'); R(5, -3, 3, 6, '#ff8a1f'); R(-9, -4, 3, 8, '#e8412c');
        R(2, -2, 2, 2, '#fff'); R(3, -2, 1, 1, '#1a1020'); R(-3, -6, 4, 2, '#e8412c');
        ctx.restore();
        break;
      }
      default: R(x, y, 14, 14, '#f0f');
    }
  }

  function drawEnt(e: any) {
    const x = Math.round(e.x - camX), y = Math.round(e.y);
    if (x < -40 || x > VW + 40) return;
    const f = (T >> 3) % 2, o = f ? 1 : 0;
    if (e.squash) { ctx.save(); ctx.translate(x, y + 10); ctx.scale(1, 0.3); drawSkin(e, 0, 0, 0); ctx.restore(); return; }
    if (e.dead) { ctx.save(); ctx.translate(x, y + 14); ctx.scale(1, -1); drawSkin(e, 0, 0, 0); ctx.restore(); return; }
    switch (e.k) {
      case 'walk': case 'hop': case 'fly': case 'fish': drawSkin(e, x, y, o); break;
      case 'report': {
        const fl = (T >> 3) % 2;
        R(x, y + fl, 14, 10, '#f7f5ee'); R(x, y + 9 + fl, 14, 1, '#cfc9b8');
        R(x + 2, y + 2 + fl, 6, 1, '#1a1020'); R(x + 2, y + 4 + fl, 10, 1, '#9a9a9a'); R(x + 2, y + 6 + fl, 8, 1, '#9a9a9a');
        R(x + 10, y + 1 + fl, 3, 3, '#e8412c');
        break;
      }
      case 'ponto': {
        R(x + 6, y + 10, 2, 26, '#5a6272'); R(x + 2, y + 34, 10, 2, '#5a6272');
        R(x, y, 14, 11, '#1a1020'); R(x + 1, y + 1, 12, 9, '#a9b3c9'); R(x + 3, y + 2, 8, 4, e.done ? '#2ecc55' : '#12402a');
        if (e.done) {
          R(x + 5, y + 4, 1, 1, '#fff'); R(x + 6, y + 5, 1, 1, '#fff'); R(x + 7, y + 4, 1, 1, '#fff'); R(x + 8, y + 3, 1, 1, '#fff');
        } else {
          R(x + 4, y + 3, (T >> 4) % 2 ? 5 : 2, 1, '#7cf0a0');
        }
        R(x + 4, y + 7, 6, 1, '#39405a');
        break;
      }
      case 'coin': {
        const w = Math.max(2, Math.round(10 * Math.abs(Math.cos(T * 0.08 + e.x * 0.1))));
        R(x + 5 - w / 2, y, w, 12, '#c89400');
        if (w > 3) R(x + 5 - w / 2 + 1, y + 1, w - 2, 10, '#ffd21f');
        if (w > 5) R(x + 4, y + 3, 2, 6, '#fff3a0');
        break;
      }
      case 'bill': {
        const b = Math.sin(T * 0.1 + e.x) * 1.5;
        R(x, y + b, 12, 8, '#2e8a50'); R(x + 1, y + 1 + b, 10, 6, '#8fe0a8'); R(x + 5, y + 2 + b, 2, 4, '#1f6b3a');
        break;
      }
      case 'bag':
        R(x + 2, y + 4, 8, 8, '#9a6a34'); R(x + 1, y + 6, 10, 5, '#9a6a34'); R(x + 4, y + 1, 4, 3, '#7a4a20');
        R(x + 5, y + 5, 2, 5, '#2ecc55'); R(x + 4, y + 6, 4, 1, '#2ecc55'); R(x + 4, y + 8, 4, 1, '#2ecc55');
        break;
      case 'cracha': {
        const b = Math.round(Math.sin(T * 0.08) * 2);
        R(x + 5, y + b, 2, 4, '#e8412c'); R(x, y + 4 + b, 12, 10, '#1a1020'); R(x + 1, y + 5 + b, 10, 8, '#f4f4f4');
        R(x + 1, y + 5 + b, 10, 3, '#2449c9'); R(x + 2, y + 9 + b, 3, 3, '#c9a080'); R(x + 6, y + 9 + b, 4, 1, '#888'); R(x + 6, y + 11 + b, 3, 1, '#888');
        break;
      }
      case 'horse': drawHorse(x - 3, y - 4, 1, false); break;
      case 'atm':
        R(x, y, 16, 32, '#1a1020'); R(x + 1, y + 1, 14, 30, '#6a7282'); R(x + 3, y + 4, 10, 8, '#12402a');
        R(x + 4, y + 6, 6, 1, '#7cf0a0'); R(x + 4, y + 8, 4, 1, '#7cf0a0'); R(x + 3, y + 15, 10, 2, '#222');
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(x + 4 + i * 3, y + 20 + j * 3, 2, 2, '#cfd4de');
        R(x + 5, y - 4, 6, 4, '#ffd21f'); R(x + 7, y - 3, 2, 2, '#1a1020');
        break;
      case 'medal':
        R(x + 1, y, 2, 3, '#169c3c'); R(x + 5, y, 2, 3, '#169c3c'); R(x + 3, y, 2, 3, '#ffd21f');
        R(x, y + 3, 8, 5, '#c89400'); R(x + 1, y + 3, 6, 4, '#ffd21f'); R(x + 3, y + 4, 2, 2, '#fff3a0');
        break;
      case 'cloud': {
        const c = '#f8f8ff';
        R(x + 5, y + 16, 22, 14, '#0a1a4a'); R(x + 6, y + 17, 20, 12, '#132a6e'); R(x + 6, y + 17, 20, 1, '#2a4a9a');
        const MP = ['#...#', '##.##', '#.#.#', '#...#', '#...#'];
        MP.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '#') R(x + 11 + i * 2, y + 18 + j * 2, 2, 2, '#e8b830'); });
        ctx.fillStyle = '#e8b830'; ctx.font = '4px "Press Start 2P", monospace'; ctx.fillText('MASTER', x + 5, y + 33);
        circ(x + 8, y + 10, 7, c); circ(x + 16, y + 6, 9, c); circ(x + 24, y + 10, 7, c); R(x + 4, y + 10, 24, 7, c);
        R(x + 10, y + 6, 5, 2, '#1a1020'); R(x + 17, y + 6, 5, 2, '#1a1020'); R(x + 14, y + 6, 4, 1, '#1a1020');
        R(x + 13, y + 11, 6, 1, '#1a1020'); R(x + 12, y + 13, 8, 2, '#ffd21f'); R(x + 15, y + 13, 2, 2, '#1a1020');
        break;
      }
    }
  }

  function drawPlayer() {
    if (!P) return;
    if (S === 'dying' && pitFall && P.y > VH) return;
    if (P.inv > 0 && (T >> 2) % 2) return;
    const sx = Math.round(P.x - camX - 2), sy = Math.round(P.y);
    let f: 'stand' | 'walk' | 'jump' = 'stand';
    if (S === 'dying') f = 'jump';
    else if (!P.on) f = 'jump';
    else if (Math.abs(P.vx) > 0.2) f = (P.anim >> 3) % 2 ? 'walk' : 'stand';
    ctx.globalAlpha = P.ghost ? 0.4 : 1;
    ctx.drawImage(heroSpr()[f][P.face > 0 ? 0 : 1], sx, sy);
    if (P.ghost) {
      ctx.globalAlpha = 0.35;
      R(sx + 1, sy + 18, 12, 2, '#9fd8ff');
    }
    ctx.globalAlpha = 1;
    if (P.horse) drawHorse(sx - 4, sy + 12, P.face, Math.abs(P.vx) > 0.2);
  }

  function drawGoal() {
    if (!lv) return;
    const gx = lv.goal * TS - camX;
    if (gx < -60 || gx > VW + 20) return;
    const post = '#e8d0a0', dk = '#6a4a2a';
    R(gx, 40, 4, 120, dk); R(gx + 1, 40, 2, 120, post); R(gx + 40, 40, 4, 120, dk); R(gx + 41, 40, 2, 120, post);
    const ty = 58 + (Math.sin(T * 0.04) * 0.5 + 0.5) * 90;
    R(gx + 4, ty, 36, 4, '#ffd21f'); R(gx + 4, ty + 1, 36, 2, '#fff2a0');
    const locked = !!goalLock();
    if (locked) {
      for (let y = 60; y < 160; y += 12) R(gx + 4, y, 36, 2, '#8a8a9a');
      R(gx + 16, 96, 12, 10, '#e8412c'); R(gx + 18, 90, 8, 6, '#e8412c'); R(gx + 20, 92, 4, 4, '#1a1020');
    }
    if (lv.id === 'vento') {
      ctx.fillStyle = '#f4f4f4'; ctx.font = '6px "Press Start 2P", monospace'; ctx.fillText('STF', gx + 13, 36);
    }
    if (lv.id === 'darkhorse') {
      R(gx + 8, 20, 28, 14, '#1a1020');
      for (let i = 0; i < 4; i++) R(gx + 8 + i * 8, 20, 4, 4, '#f4f4f4');
    }
  }

  function renderLevel() {
    if (!lv) return;
    const th = lv.th;
    sky(th);
    BG[lv.D!.theme](camX);
    if (th.liquid) {
      R(0, 170, VW, 22, th.liquid);
      for (let i = 0; i < VW; i += 12) R(i + ((T >> 2) % 12), 170, 6, 2, th.liq2);
    }
    const x0 = Math.floor(camX / TS), x1 = x0 + Math.ceil(VW / TS) + 1;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (c === ' ' || tx < 0 || tx >= lv.w) continue;
        let yo = 0;
        for (const p of parts) if (p.k === 'bump' && p.tx === tx && p.ty === ty) yo = -Math.sin(p.t / 8 * Math.PI) * 4;
        drawTile(c, Math.round(tx * TS - camX), ty * TS + yo, tx, ty, th);
      }
    }
    drawGoal();
    for (const e of lv.ents) if (!e.gone && (e.act || e.k !== 'fly')) drawEnt(e);
    drawPlayer();
    for (const p of parts) {
      const px = Math.round(p.x - camX);
      if (p.k === 'popcoin') { R(px + 2, p.y, 6, 12, '#ffd21f'); R(px + 3, p.y + 2, 2, 6, '#fff3a0'); }
      else if (p.k === 'txt') { ctx.fillStyle = '#fff'; ctx.font = '6px "Press Start 2P", monospace'; ctx.fillText(p.s, px, p.y); }
      else if (p.k === 'paper') { R(px, p.y, 16, 10, '#f7f5ee'); }
      else if (p.k === 'stamp') { drawStamp(px, p.y); }
      else if (p.k === 'anulado') {
        ctx.save(); ctx.globalAlpha = Math.min(1, p.t / 30); ctx.translate(px, p.y); ctx.rotate(-0.12);
        ctx.strokeStyle = '#e8412c'; ctx.lineWidth = 1.5; ctx.strokeRect(-25, -6, 50, 12);
        ctx.fillStyle = '#e8412c'; ctx.font = '6px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillText('ANULADO', 0, 3);
        ctx.textAlign = 'left'; ctx.restore();
      } else if (p.k === 'horseRun') {
        drawHorse(px, p.y + 10, p.face, true);
      } else if (p.k === 'half') {
        const k = p.t / 60, sx = p.sx + (VW * 0.62 - p.sx) * k, sy = p.sy + (6 - p.sy) * k - Math.sin(k * Math.PI) * 30;
        R(sx, sy, 5, 10, '#ffd21f');
      } else if (p.k === 'wind') {
        if (p.paper) { R(p.x, p.y, 6, 4, '#f7f5ee'); R(p.x + 1, p.y + 1, 4, 1, '#999'); }
        else R(p.x, p.y, 10 + st.gust * 14, 1, 'rgba(255,255,255,.55)');
      }
    }
    if (S === 'clear') {
      ctx.fillStyle = '#fff'; ctx.font = '10px "Press Start 2P", monospace';
      const t = 'FASE CONCLUÍDA!';
      ctx.fillStyle = '#1a1020'; ctx.fillText(t, VW / 2 - ctx.measureText(t).width / 2 + 1, 81);
      ctx.fillStyle = '#ffd21f'; ctx.fillText(t, VW / 2 - ctx.measureText(t).width / 2, 80);
    }
  }

  function renderTitleBG() {
    const th = THEMES.rio;
    sky(th);
    BG.rio(titleCam);
    for (let tx = -1; tx < 23; tx++) {
      const x = Math.round(tx * TS - (titleCam % TS));
      R(x, 160, 16, 32, th.fill); R(x, 160, 16, 5, th.top); R(x + 4, 172, 2, 2, th.dot);
    }
    ctx.drawImage(SPR[(T >> 3) % 2 ? 'walk' : 'stand'][0], 150, 140);
  }

  function renderMap() {
    R(0, 0, VW, VH, '#2a6fd6');
    for (let y = 4; y < VH; y += 12) for (let x = ((y * 7 + T * 0.3) % 24) - 24; x < VW; x += 24) R(x, y, 8, 1, '#5b93e6');
    ctx.fillStyle = '#1f7a2e'; ctx.beginPath(); ctx.ellipse(170, 100, 160, 82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3ec04a'; ctx.beginPath(); ctx.ellipse(170, 96, 154, 76, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 14; i++) {
      const x = 40 + hr(i) * 260, y = 40 + hr(i + 20) * 110;
      circ(x, y, 5, '#2a9a3a'); circ(x - 3, y + 2, 4, '#2a9a3a');
    }
    const maxIdx = Math.min(progress, 6);
    for (let i = 0; i < MAPNODES.length - 1; i++) {
      const [a, b] = [MAPNODES[i], MAPNODES[i + 1]], open = i < maxIdx;
      for (let k = 1; k < 8; k++) {
        const t = k / 8;
        R(a[0] + (b[0] - a[0]) * t - 1, a[1] + (b[1] - a[1]) * t - 1, 3, 3, open ? '#f4e08a' : '#7ab87a');
      }
    }
    MAPNODES.forEach(([x, y], i) => {
      const locked = i > maxIdx, done = i < progress;
      circ(x, y + 2, 7, '#1a1020');
      circ(x, y, 7, locked ? '#7a8a7a' : done ? '#e8412c' : '#ffd21f');
      circ(x, y, 4, locked ? '#5a6a5a' : done ? '#ff8a6a' : '#fff2a0');
      ctx.fillStyle = '#1a1020'; ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText(String(i + 1), x - 3, y + 3);
    });
    const [nx, ny] = MAPNODES[mapIdx];
    ctx.drawImage(SPR.stand[0], nx - 7, ny - 24 + Math.round(Math.sin(T * 0.12) * 2));
    ctx.fillStyle = '#1a1020'; ctx.font = '8px "Press Start 2P", monospace'; ctx.fillText('SUPER FLÁVIO WORLD', 13, 17);
    ctx.fillStyle = '#fff'; ctx.fillText('SUPER FLÁVIO WORLD', 12, 16);
  }

  function hud() {
    if (!lv || !P) return;
    let sp = '';
    switch (lv.id) {
      case 'fantasma': sp = `Pontos ${st.pontos}/5 · Fantasma <span class="meter"><i style="width:${(P.meter / 150) * 100}%"></i></span>`; break;
      case 'rachadinha': sp = `Movimentado R$ ${fmtBR(st.queiroz / 1e6, 1)} mi`; break;
      case 'lacos': sp = `Crachás ${st.crachas}/2`; break;
      case 'chocolate': sp = `Bolso ${st.carry} · Depósitos ${fmtBR(st.deposits)}/1.512`; break;
      case 'vento': sp = `Provas levadas ${st.provas} · Vento ${st.gust > 0.5 ? '◀◀◀' : '◀'}`; break;
      case 'peixe': sp = `Emenda R$ ${emendaStr()}`; break;
      case 'darkhorse': sp = `Dark Horse US$ ${st.dollars}/24 mi`; break;
    }
    const s = `${lives}|${lv.i}|${sp}|${st.coins}`;
    if (s === hudCache) return;
    hudCache = s;
    $('hLives').textContent = `${heroName()} × ${lives}`;
    $('hLevel').textContent = `Fase ${lv.i! + 1}`;
    $('hSpecial').innerHTML = sp;
    $('hCoins').innerHTML = `<span class="coin"></span>× ${st.coins}`;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (S === 'title' || S === 'select') renderTitleBG();
    else if (S === 'map' || (S === 'dialog' && under === 'map')) renderMap();
    else if (lv) renderLevel();
    if (lv && under === 'play') hud();
  }

  function step() {
    T++;
    if (pressed.M) {
      muted = !muted;
      toast(muted ? 'Som desligado' : 'Som ligado');
    }
    if (toastT > 0 && --toastT === 0) $('toast').hidden = true;
    switch (S) {
      case 'title':
        titleCam += 0.8;
        if (confirmHit()) { sfx.pick(); setS('select'); }
        break;
      case 'select':
        titleCam += 0.8;
        if (pressed.L || pressed.R) {
          sfx.bump();
          const pk = $('pick');
          if (pk) {
            pk.classList.remove('shake');
            void pk.offsetWidth;
            pk.classList.add('shake');
          }
          const qp = $('quip');
          if (qp) qp.textContent = 'Só tem o Flavinho. Os outros estão na prisã, digo, foragid, digo, sob investigaçã, digo, indisponíveis!';
        }
        if (confirmHit()) { sfx.pick(); under = 'map'; setS('map'); }
        if (pressed.P) setS('title');
        break;
      case 'map': {
        const maxIdx = Math.min(progress, 6);
        if ((pressed.R || pressed.U) && mapIdx < maxIdx) { mapIdx++; sfx.sel(); mapBar(); }
        if ((pressed.L || pressed.D) && mapIdx > 0) { mapIdx--; sfx.sel(); mapBar(); }
        if (pressed.P) setS('title');
        if (confirmHit()) {
          loadLevel(mapIdx);
          sfx.pick();
          dialog([{
            tag: LEVELS[mapIdx].intro.tag || 'Missão',
            title: LEVELS[mapIdx].intro.title,
            body: LEVELS[mapIdx].intro.body.replace(/\bX\b/g, keyB())
          }], () => setS('play'), 'play');
        }
        break;
      }
      case 'dialog': updDialog(); break;
      case 'play':
        if (pressed.P) { setS('pause'); break; }
        if (lv?.id === 'vento' && --st.spawn <= 0) {
          st.spawn = Math.round(110 - 60 * st.gust);
          if (P.x > 12 * TS && P.x < lv.goal * TS - 6 * TS) {
            lv.ents.push({
              k: 'report', x: camX + VW + 8, y: 58 + hr(T) * 84, w: 14, h: 10,
              vx: -(1 + hr(T + 3) * 0.7), vy: 0, ph: hr(T + 5) * 6, act: true
            });
          }
        }
        updPlayer(); updEnts(); updCrumble(); updParts(); camera();
        if (S !== 'play' || !P || !lv) break;
        if (P.y > VH + 20) { killPlayer(true); break; }
        if (P.x + P.w > lv.goal * TS + 10) {
          const lock = goalLock();
          if (lock) {
            P.x = lv.goal * TS + 10 - P.w; P.vx = 0;
            if (toastT <= 0) toast(lock);
          } else {
            clearT = 150; P.inv = 0; sfx.clear(); setS('clear');
          }
        }
        break;
      case 'pause':
        if (confirmHit() || pressed.P) setS('play');
        else if (pressed.B) { under = 'map'; setS('map'); }
        break;
      case 'dying':
        if (!pitFall && dieT < 85 && P) { P.vy += 0.25; P.y += P.vy; }
        if (--dieT <= 0) { lives--; showCard(lives <= 0); }
        break;
      case 'card':
        if (confirmHit()) {
          if (cardMode === 'moro') lives = 22;
          loadLevel(lv!.i!);
          setS('play');
        } else if (pressed.P) {
          if (cardMode === 'moro') lives = 22;
          under = 'map';
          setS('map');
        }
        break;
      case 'clear':
        if (P) {
          P.vx = 1.2; P.face = 1; P.ext = 0; P.vy = Math.min(P.vy + 0.34, 5.5);
          const r = moveBody(P, P.vx, P.vy);
          if (r.land) { P.vy = 0; P.on = true; }
          P.anim += 1.2;
        }
        updParts(); camera();
        if (--clearT <= 0) finishLevel();
        break;
    }
    for (const k in pressed) pressed[k] = false;
  }

  // Animation Loop
  let acc = 0;
  let lastT = 0;
  let animId = 0;
  function frame(t: number) {
    animId = requestAnimationFrame(frame);
    if (!lastT) lastT = t;
    acc += Math.min(100, t - lastT);
    lastT = t;
    try {
      while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
      render();
    } catch (err) {
      acc = 0;
      console.error(err);
      for (const k in pressed) pressed[k] = false;
      if (lv && (S === 'play' || S === 'dying')) {
        try { loadLevel(lv.i!); setS('play'); toast('A fase reiniciou após um erro'); } catch (_) {}
      }
    }
  }

  // Event Listeners setup
  const onKeyDown = (e: KeyboardEvent) => {
    const b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    if (!K[b]) pressed[b] = true;
    K[b] = true;
    unlockAudio();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const b = KEYMAP[e.code];
    if (b) K[b] = false;
  };
  const onBlur = () => {
    for (const k in K) K[k] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const onPointerDownDpad = (e: PointerEvent) => {
    e.preventDefault();
    dpadId = e.pointerId;
    try { (dpad as any)?.setPointerCapture(e.pointerId); } catch (_) {}
    dpadAt(e);
    unlockAudio();
  };
  const onPointerMoveDpad = (e: PointerEvent) => {
    if (e.pointerId === dpadId) dpadAt(e);
  };
  const dpadEnd = (e: PointerEvent) => {
    if (e.pointerId !== dpadId) return;
    dpadId = null;
    for (const b in dirEl) setBtn(b, false, dirEl[b]);
  };

  dpad?.addEventListener('pointerdown', onPointerDownDpad);
  dpad?.addEventListener('pointermove', onPointerMoveDpad);
  dpad?.addEventListener('pointerup', dpadEnd);
  dpad?.addEventListener('pointercancel', dpadEnd);

  const touchButtons = document.querySelectorAll('.tbtn, .tpause');
  const buttonHandlers: { el: Element; down: (e: any) => void; up: (e: any) => void }[] = [];
  touchButtons.forEach(bt => {
    const b = (bt as HTMLElement).dataset.b;
    if (!b) return;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try { (bt as any).setPointerCapture(e.pointerId); } catch (_) {}
      setBtn(b, true, bt);
      unlockAudio();
    };
    const up = (e: PointerEvent) => {
      e.preventDefault();
      setBtn(b, false, bt);
    };
    bt.addEventListener('pointerdown', down as any);
    bt.addEventListener('pointerup', up as any);
    bt.addEventListener('pointercancel', up as any);
    bt.addEventListener('contextmenu', e => e.preventDefault());
    buttonHandlers.push({ el: bt, down, up });
  });

  const onResize = () => checkRotate();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  window.addEventListener('touchstart', enableTouch, { passive: true });

  const releaseAll = () => {
    for (const k in K) K[k] = false;
    dpadId = null;
    document.querySelectorAll('.touch .on, .tpause.on').forEach(el => el.classList.remove('on'));
  };
  window.addEventListener('touchend', (e) => { if (e.touches.length === 0) releaseAll(); }, { passive: true });
  window.addEventListener('touchcancel', (e) => { if (e.touches.length === 0) releaseAll(); }, { passive: true });

  const pointerDownScreens = ['title', 'select', 'dlg', 'card', 'pause'];
  const screenHandlers: { el: HTMLElement; fn: (e: Event) => void }[] = [];
  pointerDownScreens.forEach(id => {
    const el = $(id);
    if (!el) return;
    const fn = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('a')) return;
      pressed.J = true;
      unlockAudio();
    };
    el.addEventListener('pointerdown', fn);
    screenHandlers.push({ el, fn });
  });

  const stage = $('stage');
  const onStageDown = () => {
    if (S === 'map') { pressed.J = true; unlockAudio(); }
  };
  stage?.addEventListener('pointerdown', onStageDown);

  const onVisibilityChange = () => {
    lastT = 0; acc = 0;
    for (const k in K) K[k] = false;
    document.querySelectorAll('.on').forEach(el => el.classList.remove('on'));
    if (document.hidden && S === 'play') setS('pause');
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  $('dlg')?.addEventListener('scroll', updNext);

  if (window.matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints > 0 && window.matchMedia('(hover:none)').matches)) {
    enableTouch();
  }
  checkRotate();
  ui();
  animId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    dpad?.removeEventListener('pointerdown', onPointerDownDpad);
    dpad?.removeEventListener('pointermove', onPointerMoveDpad);
    dpad?.removeEventListener('pointerup', dpadEnd);
    dpad?.removeEventListener('pointercancel', dpadEnd);
    buttonHandlers.forEach(({ el, down, up }) => {
      el.removeEventListener('pointerdown', down as any);
      el.removeEventListener('pointerup', up as any);
      el.removeEventListener('pointercancel', up as any);
    });
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    window.removeEventListener('touchstart', enableTouch);
    screenHandlers.forEach(({ el, fn }) => el.removeEventListener('pointerdown', fn));
    stage?.removeEventListener('pointerdown', onStageDown);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    $('dlg')?.removeEventListener('scroll', updNext);
  };
}
