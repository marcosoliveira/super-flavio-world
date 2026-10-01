import { ROWS, TS, hr } from './sources.ts';

export interface LevelDef {
  id: string;
  name: string;
  year: string;
  w: number;
  theme: string;
  hero?: string;
  intro: {
    tag?: string;
    title: string;
    body: string;
  };
  outro: {
    body: string;
    note: string;
    src: string[];
  };
  death: {
    head: string;
    sub: string;
  };
  deathBy?: Record<string, { head: string; sub: string }>;
  pitDeath?: {
    head: string;
    sub: string;
  };
  make: (b: any) => void;
}

export interface LevelData {
  w: number;
  g: string[][];
  ents: any[];
  goal: number;
  start: { x: number; y: number };
  i?: number;
  id?: string;
  D?: LevelDef;
  cr?: Record<string, any>;
  th?: any;
  coinVal?: number;
}

export const THEMES: Record<string, any> = {
  brasilia: { sky: ['#ff9a6b', '#ffd9a0'], top: '#9ccc3c', fill: '#c2703a', dot: '#a4582a', brick: '#b85c38', block: '#8a6a50', plat: '#f0b44a' },
  rio: { sky: ['#5aa8ff', '#bfe6ff'], top: '#3ec04a', fill: '#8b5a2b', dot: '#6e4420', brick: '#c8743a', block: '#9a7050', plat: '#ffcf4a' },
  night: { sky: ['#0b0f2e', '#2a2a5e'], top: '#2f8a5a', fill: '#3a2f4a', dot: '#2a2238', brick: '#5a4a7a', block: '#4a4060', plat: '#8a7ad8' },
  choco: { sky: ['#f7b7c8', '#ffe4c8'], top: '#ffc6dc', fill: '#6b3a1e', dot: '#54291a', brick: '#8a4a2a', block: '#7a4424', plat: '#ff8ab4', liquid: '#4a2412', liq2: '#6e3a1e' },
  vento: { sky: ['#7d8ba3', '#c8d2de'], top: '#dfe4ea', fill: '#8a8f99', dot: '#767b85', brick: '#9aa0aa', block: '#6f7580', plat: '#dfe4ea' },
  praia: { sky: ['#4fb2ff', '#ffe9b0'], top: '#f6de94', fill: '#d9b060', dot: '#c49a4c', brick: '#d9844a', block: '#b98a50', plat: '#8a5a30', liquid: '#1f78d0', liq2: '#5fb2ff' },
  estudio: { sky: ['#4a3f7a', '#c39ad0'], top: '#e8c040', fill: '#4a3a2a', dot: '#3a2d20', brick: '#7a2a2a', block: '#5a4a3a', plat: '#c0302a' }
};

export const MAPNODES: [number, number][] = [
  [34, 128],
  [78, 100],
  [118, 134],
  [160, 96],
  [204, 128],
  [246, 92],
  [292, 60]
];

export const LEVELS: LevelDef[] = [
  {
    id: 'fantasma',
    name: 'O Fantasma da Câmara',
    year: '2000',
    w: 152,
    theme: 'brasilia',
    intro: {
      title: 'Fase 1 · O Fantasma da Câmara',
      body: 'Você ganhou um cargo de 40 horas semanais na Câmara, em Brasília. O detalhe: você mora, estuda e estagia no Rio. Sua missão é bater o ponto de segunda a sexta sem ninguém perceber que você não está lá. Segure X para ficar invisível e encoste nos 5 relógios de ponto: só vale se ninguém te ver. Se um servidor esbarrar em você visível, acabou. As moedas recarregam a invisibilidade.'
    },
    outro: {
      body: 'Aos 19 anos, Flávio teve um cargo de 40 horas semanais na Câmara dos Deputados, em Brasília, enquanto estudava e estagiava no Rio. Para a BBC News Brasil, "tudo indica" que era um funcionário fantasma.',
      note: 'É uma investigação jornalística. Não há condenação sobre esse ponto.',
      src: ['bbc26']
    },
    death: { head: 'Flagrado!', sub: 'Um servidor percebeu que você nunca estava lá.' },
    make(b) {
      b.g(0, 40); b.coin(7, 6, 4); b.e('walk', 14, 9, { skin: 'servidor', vx: -0.45 }); b.ponto(23, 'segunda');
      b.t(27, 6, '?'); b.t(28, 6, 'B'); b.t(29, 6, '?'); b.e('walk', 32, 9, { skin: 'servidor', vx: -0.45 }); b.e('walk', 37, 9, { skin: 'servidor', vx: -0.45 });
      b.g(44, 80); b.p(47, 7, 4); b.coin(47, 6, 4); b.ponto(51, 'terça');
      b.e('walk', 62, 9, { skin: 'servidor', vx: -0.45 }); b.t(64, 6, '?'); b.e('walk', 68, 9, { skin: 'servidor', vx: -0.45 }); b.coin(70, 8, 5); b.ponto(75, 'quarta');
      b.g(84, 122); b.stairs(88, 4); b.stairs(95, 4, -1); b.coin(91, 5, 2); b.coin(98, 8, 2); b.ponto(101, 'quinta');
      b.e('walk', 108, 9, { skin: 'servidor', vx: -0.45 }); b.ponto(114, 'sexta'); b.coin(116, 8, 4); b.e('walk', 119, 9, { skin: 'servidor', vx: -0.45 });
      b.g(126, 151); b.coin(129, 7, 3); b.goal(140);
    }
  },
  {
    id: 'rachadinha',
    name: 'O Assessor de Wall Street',
    year: 'Alerj · 2003 a 2018',
    w: 172,
    theme: 'rio',
    hero: 'queiroz',
    intro: {
      tag: 'Surpresa!',
      title: 'Fase 2 · O Assessor de Wall Street',
      body: 'Surpresa: nesta fase você não é o Flavinho. Você é o Queiroz, o chefe de gabinete de confiança na Alerj. Recolha os salários dos assessores e não esqueça de rachar: metade de cada um vai pro chefe. Fuja das lupas e dos fiscais do Coaf. Segure X para correr.'
    },
    outro: {
      body: 'Segundo a denúncia do Ministério Público do Rio, assessores do gabinete de Flávio na Alerj devolviam parte dos salários a Fabrício Queiroz, apontado como operador do esquema, e o dinheiro chegava indiretamente ao próprio Flávio. Queiroz movimentou cerca de R$ 7 milhões, valor incompatível com a renda dele.',
      note: 'Foi denúncia, não condenação. A divisão pela metade é licença do jogo.',
      src: ['bbc22', 'bbc26']
    },
    death: { head: 'Movimentação atípica!', sub: 'O Coaf viu os milhões passando pela sua conta.' },
    make(b) {
      b.g(0, 25); b.coin(5, 8, 5); b.t(10, 6, '?'); b.t(11, 6, 'B'); b.t(12, 6, '?'); b.e('walk', 17, 9, { skin: 'fiscal' }); b.e('walk', 23, 9, { skin: 'fiscal' });
      b.g(29, 60); b.p(33, 7, 4); b.coin(33, 6, 4); b.e('fly', 40, 5, { skin: 'lupa' }); b.e('walk', 45, 9, { skin: 'fiscal' }); b.e('walk', 50, 9, { skin: 'fiscal' }); b.coin(52, 8, 6);
      b.g(64, 100); b.p(70, 7, 6, 'B'); b.t(72, 7, '?'); b.t(73, 7, '?'); b.coin(70, 6, 6); b.e('walk', 79, 9, { skin: 'fiscal' }); b.e('walk', 85, 9, { skin: 'fiscal' }); b.e('fly', 88, 4, { skin: 'lupa' }); b.coin(90, 8, 7);
      b.p(102, 7, 2);
      b.g(105, 140); b.stairs(108, 3); b.coin(110, 5, 1); b.e('walk', 114, 9, { skin: 'fiscal' }); b.e('walk', 119, 9, { skin: 'fiscal' }); b.e('fly', 121, 5, { skin: 'lupa' }); b.e('walk', 125, 9, { skin: 'fiscal' }); b.e('fly', 131, 4, { skin: 'lupa' }); b.coin(126, 8, 8);
      b.g(144, 171); b.coin(146, 8, 7); b.goal(160);
    }
  },
  {
    id: 'lacos',
    name: 'Laços de Família',
    year: '2003 a 2019',
    w: 172,
    theme: 'night',
    intro: {
      title: 'Fase 3 · Laços de Família',
      body: 'Hora de fazer amizades. Recolha os 2 crachás do gabinete: um pra mãe e outro pra mulher do seu homenageado. E não esqueça de distribuir as medalhas dele pelo caminho: aperte X para arremessar. Sem os dois crachás, a saída não abre.'
    },
    outro: {
      body: 'Flávio homenageou na Alerj Adriano da Nóbrega, ex-PM acusado de chefiar uma milícia e um grupo de matadores. A mãe e a então mulher de Adriano trabalharam no gabinete de Flávio. Adriano foi morto numa operação policial na Bahia, em 2020.',
      note: 'Os vínculos são documentados. Não provam participação em crime.',
      src: ['globo19', 'g119', 'bbc20']
    },
    death: { head: 'Virou manchete!', sub: 'A homenagem saiu no jornal, com foto.' },
    make(b) {
      b.g(0, 30); b.t(12, 6, '?'); b.t(13, 6, '?'); b.e('walk', 17, 9, { skin: 'manchete' }); b.e('walk', 25, 9, { skin: 'manchete' });
      b.g(34, 70); b.p(39, 7, 5); b.e('cracha', 41, 6, { w: 12, h: 14 }); b.e('walk', 48, 9, { skin: 'manchete' }); b.e('fly', 52, 4, { skin: 'camera' }); b.e('walk', 57, 9, { skin: 'manchete' }); b.coin(59, 8, 4); b.e('walk', 64, 9, { skin: 'manchete' });
      b.p(72, 8, 2);
      b.g(75, 110); b.p(80, 7, 7, 'B'); b.t(83, 7, '?'); b.coin(80, 6, 7); b.e('fly', 86, 3, { skin: 'camera' }); b.e('walk', 91, 9, { skin: 'manchete' }); b.e('walk', 96, 9, { skin: 'manchete' }); b.e('walk', 101, 9, { skin: 'manchete' }); b.stairs(105, 3);
      b.g(114, 171); b.p(117, 8, 3); b.p(121, 6, 4); b.e('cracha', 123, 5, { w: 12, h: 14 }); b.e('walk', 129, 9, { skin: 'manchete' }); b.e('walk', 135, 9, { skin: 'manchete' }); b.e('fly', 139, 4, { skin: 'camera' }); b.e('walk', 144, 9, { skin: 'manchete' }); b.coin(146, 8, 4); b.goal(158);
    }
  },
  {
    id: 'chocolate',
    name: 'A Fantástica Fábrica de Depósitos',
    year: '2015 a 2018',
    w: 172,
    theme: 'choco',
    intro: {
      title: 'Fase 4 · A Fantástica Fábrica de Depósitos',
      body: 'Bem-vindo à loja de chocolates. Pegue o dinheiro vivo e deposite nos caixas eletrônicos. Cada nota no bolso deixa o pulo mais pesado, então fracione. Meta: 1.512 depósitos. Não caia no chocolate derretido.'
    },
    outro: {
      body: 'A loja de chocolates ligada a Flávio, no Via Parque Shopping, recebeu 1.512 depósitos em dinheiro vivo entre 2015 e 2018, muitos fracionados, em sequência e com o mesmo valor. Investigadores trataram os depósitos como indício de possível lavagem de dinheiro.',
      note: 'Depósito atípico não prova origem criminosa. Não houve condenação.',
      src: ['g1kop', 'jnkop']
    },
    death: { head: 'Depósito atípico!', sub: 'Alguém resolveu contar os depósitos.' },
    pitDeath: { head: 'Derreteu!', sub: 'Afundou no chocolate junto com o extrato.' },
    make(b) {
      b.g(0, 34); b.bill(5, 8, 5); b.e('atm', 14, 8, { w: 16, h: 32 }); b.e('walk', 20, 9, { skin: 'bombom', vx: -1 }); b.p(22, 10, 9, '>'); b.bill(24, 7, 5); b.e('walk', 29, 9, { skin: 'bombom', vx: -1 });
      b.g(38, 72); b.p(42, 7, 4); b.bill(42, 6, 4); b.e('atm', 50, 8, { w: 16, h: 32 }); b.e('walk', 55, 9, { skin: 'bombom', vx: -1 }); b.p(58, 10, 9, '<'); b.bill(60, 8, 6); b.e('walk', 65, 9, { skin: 'bombom', vx: -1 });
      b.g(76, 110); b.p(80, 7, 6, 'B'); b.t(82, 7, '?'); b.bill(80, 6, 6); b.e('atm', 90, 8, { w: 16, h: 32 }); b.e('walk', 95, 9, { skin: 'bombom', vx: -1 }); b.bill(96, 8, 6); b.e('walk', 101, 9, { skin: 'bombom', vx: -1 }); b.e('walk', 105, 9, { skin: 'bombom', vx: -1 });
      b.g(114, 150); b.p(116, 10, 8, '>'); b.bill(118, 8, 6); b.e('atm', 128, 8, { w: 16, h: 32 }); b.e('walk', 134, 9, { skin: 'bombom', vx: -1 }); b.bill(136, 7, 4); b.e('walk', 141, 9, { skin: 'bombom', vx: -1 });
      b.g(153, 171); b.e('atm', 156, 8, { w: 16, h: 32 }); b.goal(164);
    }
  },
  {
    id: 'vento',
    name: 'E as Provas, o Vento Levou',
    year: '2021',
    w: 162,
    theme: 'vento',
    intro: {
      title: 'Fase 5 · E as Provas, o Vento Levou',
      body: 'Uma ventania sopra em Brasília e leva os relatórios do Coaf embora. Desvie das provas voando, ou pule em cima delas. Para atravessar os buracos, pise nos carimbos: eles aguentam pouco e despencam carimbando ANULADO. Chegue ao STF. Segure X para correr.'
    },
    outro: {
      body: 'Em novembro de 2021, o STF anulou relatórios do Coaf usados na investigação, por uma questão processual. Sem as provas principais, o caso da rachadinha foi arquivado sem julgamento do mérito.',
      note: 'Arquivamento não é absolvição. Ninguém decidiu se ele era culpado ou inocente.',
      src: ['stf', 'bbc22']
    },
    death: { head: 'Atropelado pelas provas!', sub: 'Calma: no fim, elas foram anuladas.' },
    pitDeath: { head: 'O vento levou!', sub: 'Você foi arquivado junto com as provas.' },
    make(b) {
      b.g(0, 24);
      b.p(26, 8, 4, 'C'); b.p(31, 8, 4, 'C');
      b.g(36, 60); b.t(46, 6, '?'); b.t(47, 6, 'B'); b.t(48, 6, '?'); b.coin(54, 8, 4);
      b.p(62, 8, 3, 'C'); b.p(66, 8, 3, 'C'); b.p(70, 8, 3, 'C');
      b.g(74, 100); b.p(85, 7, 4, 'C'); b.coin(85, 6, 4);
      b.p(102, 8, 3, 'C'); b.p(106, 8, 3, 'C'); b.p(110, 8, 3, 'C');
      b.g(114, 161); b.coin(128, 8, 4); b.goal(150);
    }
  },
  {
    id: 'peixe',
    name: 'Quase 200 Mil',
    year: '2023',
    w: 162,
    theme: 'praia',
    intro: {
      title: 'Fase 6 · Quase 200 Mil',
      body: 'Destine a emenda pro projeto no Rio. Junte as 20 moedas até chegar em R$ 199.999,79. Nesse mar tem Peixe, e ele pula da água sem avisar. Na areia, cuidado com os celulares: a PF anda lendo as conversas. E perto do fim tem um auditor do TCU fazendo as contas.'
    },
    outro: {
      body: 'Em 2023, Flávio destinou uma emenda de R$ 199.999,79 a um projeto no Rio. Diálogos obtidos pela Polícia Federal mostram uma assessora dele negociando a emenda com Robson Calixto, o Peixe, condenado pelo STF no caso Marielle. O TCU apontou indícios de desvio.',
      note: 'A PF investiga. Flávio diz que o repasse foi legal.',
      src: ['g1em', 'p360', 'em']
    },
    death: { head: 'Pescado!', sub: 'Caiu na rede da PF, é Peixe!' },
    deathBy: {
      celular: { head: 'Printado!', sub: 'A conversa foi parar no relatório da PF.' },
      tcu: { head: 'Auditado!', sub: 'O TCU achou indícios de desvio na sua emenda.' }
    },
    pitDeath: { head: 'Pescado!', sub: 'Caiu na rede da PF, é Peixe!' },
    make(b) {
      b.g(0, 20); b.coin(8, 8, 5);
      b.p(23, 7, 2); b.e('fish', 22, 12); b.e('fish', 26, 12);
      b.g(28, 50); b.e('walk', 36, 9, { skin: 'celular', vx: -0.6 }); b.e('walk', 44, 9, { skin: 'celular', vx: -0.6 });
      b.p(53, 8, 2); b.p(57, 7, 2); b.e('fish', 52, 12); b.e('fish', 55, 12); b.e('fish', 59, 12);
      b.g(61, 90); b.p(65, 7, 5, 'B'); b.coin(65, 6, 5); b.e('walk', 76, 9, { skin: 'celular', vx: -0.6 }); b.e('walk', 83, 9, { skin: 'celular', vx: -0.6 });
      b.p(91, 8, 10); b.coin(93, 6, 5); b.e('fish', 93, 12); b.e('fish', 96, 12); b.e('fish', 99, 12);
      b.g(101, 130); b.coin(105, 8, 5); b.e('walk', 116, 9, { skin: 'celular', vx: -0.6 }); b.e('walk', 123, 9, { skin: 'celular', vx: -0.6 });
      b.p(133, 8, 2); b.p(136, 8, 2); b.e('fish', 132, 12); b.e('fish', 135, 12); b.e('fish', 138, 12);
      b.g(139, 161); b.e('walk', 145, 9, { skin: 'tcu', vx: -0.35 }); b.goal(150);
    }
  },
  {
    id: 'darkhorse',
    name: 'Show Me the Money',
    year: '2026',
    w: 182,
    theme: 'estudio',
    intro: {
      title: 'Fase 7 · Show Me the Money',
      body: 'Luz, câmera, patrocínio! Monte no Dark Horse e siga a nuvem do Banco Master: ela chove dólares pro filme. Meta: US$ 24 milhões. Fuja dos agentes da PF. Se levar um golpe montado, você perde o cavalo, não a vida.'
    },
    outro: {
      body: 'Flávio negociou cerca de US$ 24 milhões (perto de R$ 130 milhões) com Daniel Vorcaro, dono do Banco Master, para o filme Dark Horse, sobre o pai. Cerca de R$ 60 milhões teriam sido repassados. Ele confirma o pedido.',
      note: 'Diz que foi patrocínio privado e nega irregularidade. A PF investiga.',
      src: ['bbcdh', 'veja', 'jndh', 'valor']
    },
    death: { head: 'Corta!', sub: 'A PF entrou no set sem ser convidada.' },
    pitDeath: { head: 'Corta!', sub: 'Caiu do set. A cena vai pro relatório da PF.' },
    make(b) {
      b.g(0, 30); b.e('horse', 5, 9, { w: 20, h: 14 }); b.e('cloud', 16, 1, { w: 28, h: 16, act: true }); b.e('walk', 18, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 26, 9, { skin: 'pf', vx: -0.6 });
      b.g(33, 70); b.p(40, 7, 4); b.bag(41, 6); b.bag(42, 6); b.e('walk', 45, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 51, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 58, 9, { skin: 'pf', vx: -0.7 }); b.e('walk', 65, 9, { skin: 'pf', vx: -0.6 });
      b.g(73, 110); b.p(76, 7, 7, 'B'); b.t(79, 7, '?'); b.bag(80, 6); b.e('walk', 87, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 93, 9, { skin: 'pf', vx: -0.7 }); b.e('walk', 99, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 105, 9, { skin: 'pf', vx: -0.7 });
      b.bag(112, 6);
      b.g(113, 150); b.stairs(118, 3); b.bag(120, 6); b.e('walk', 125, 9, { skin: 'pf', vx: -0.6 }); b.e('walk', 131, 9, { skin: 'pf', vx: -0.7 }); b.e('walk', 139, 9, { skin: 'pf', vx: -0.6 }); b.bag(145, 8);
      b.g(153, 181); b.goal(170);
    }
  }
];

export function build(D: LevelDef): LevelData {
  const w = D.w;
  const g: string[][] = [...Array(ROWS)].map(() => Array(w).fill(' '));
  const L: LevelData = { w, g, ents: [], goal: w - 10, start: { x: 2 * TS, y: 8 * TS } };
  const b = {
    g(x0: number, x1: number, top = 10) {
      for (let x = x0; x <= x1; x++) for (let y = top; y < ROWS; y++) g[y][x] = '#';
    },
    p(x: number, y: number, n: number, c = '-') {
      for (let i = 0; i < n; i++) g[y][x + i] = c;
    },
    t(x: number, y: number, c: string) {
      g[y][x] = c;
    },
    col(x: number, y0: number, y1: number, c: string) {
      for (let y = y0; y <= y1; y++) g[y][x] = c;
    },
    stairs(x: number, h: number, dir = 1) {
      for (let i = 0; i < h; i++) {
        const cx = x + i * dir;
        for (let y = 10 - (i + 1); y < 10; y++) g[y][cx] = 'X';
      }
    },
    coin(x: number, y: number, n = 1) {
      for (let i = 0; i < n; i++) L.ents.push({ k: 'coin', x: (x + i) * TS + 3, y: y * TS + 4, w: 10, h: 12 });
    },
    bill(x: number, y: number, n = 1) {
      for (let i = 0; i < n; i++) L.ents.push({ k: 'bill', x: (x + i) * TS + 2, y: y * TS + 4, w: 12, h: 9 });
    },
    ponto(x: number, day: string) {
      L.ents.push({ k: 'ponto', x: x * TS + 1, y: 7 * TS + 12, w: 14, h: 28, day, done: false });
    },
    bag(x: number, y: number) {
      L.ents.push({ k: 'bag', x: x * TS + 2, y: y * TS + 2, w: 12, h: 12, vy: 0, life: 1e9 });
    },
    e(k: string, x: number, y: number, o: any = {}) {
      L.ents.push(Object.assign({ k, x: x * TS + 1, y: y * TS, w: 14, h: 14, vx: -0.5, vy: 0, ph: Math.floor(hr(x) * 70) }, o));
    },
    goal(x: number) {
      L.goal = x;
    }
  };
  D.make(b);
  return L;
}
