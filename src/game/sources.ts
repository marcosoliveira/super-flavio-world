export const SRC: Record<string, [string, string]> = {
  bbc22: ["BBC News Brasil, 13/10/2022", "https://www.bbc.com/portuguese/brasil-63232593"],
  bbc26: ["BBC News Brasil, 14/05/2026", "https://www.bbc.com/portuguese/articles/crmpv9r7mz9o"],
  stf: ["STF Notícias, 30/11/2021", "https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=477496&ori=1"],
  globo19: ["O Globo, 22/01/2019", "https://oglobo.globo.com/politica/flavio-bolsonaro-empregou-mae-mulher-de-chefe-do-escritorio-do-crime-em-seu-gabinete-23391490"],
  g119: ["g1, 22/01/2019", "https://g1.globo.com/rj/rio-de-janeiro/noticia/2019/01/22/flavio-bolsonaro-contratou-mae-de-foragido-de-operacao-contra-milicia-ex-assessora-e-citada-pelo-coaf.ghtml"],
  bbc20: ["BBC News Brasil, 10/02/2020", "https://www.bbc.com/portuguese/brasil-51447905"],
  g1kop: ["g1, 20/08/2020", "https://g1.globo.com/rj/rio-de-janeiro/noticia/2020/08/20/loja-de-chocolates-de-flavio-bolsonaro-recebeu-1512-depositos-em-dinheiro-entre-2015-e-2018.ghtml"],
  jnkop: ["Jornal Nacional, 20/08/2020", "https://g1.globo.com/jornal-nacional/noticia/2020/08/20/extratos-revelam-depositos-sucessivos-em-especie-e-com-mesmo-valor-em-conta-de-franquia-de-flavio-bolsonaro.ghtml"],
  bbcdh: ["BBC News Brasil, 13/05/2026", "https://www.bbc.com/portuguese/articles/clyp4zgr3llo"],
  veja: ["Veja, 13/05/2026", "https://veja.abril.com.br/politica/flavio-bolsonaro-confirma-que-pediu-dinheiro-a-vorcaro-patrocinio-privado-para-filme-privado/"],
  jndh: ["Jornal Nacional, 13/05/2026", "https://g1.globo.com/jornal-nacional/noticia/2026/05/13/mensagens-mostram-que-flavio-bolsonaro-cobrou-dinheiro-de-vorcaro-para-concluir-filme-sobre-o-ex-presidente-jair-bolsonaro.ghtml"],
  valor: ["Valor Econômico, 12/09/2026", "https://valor.globo.com/politica/noticia/2026/09/12/relatrio-da-pf-sobre-dark-horse-mostra-mensagens-de-flvio-cobrando-vorcaro.ghtml"],
  g1em: ["g1, 22/09/2026", "https://g1.globo.com/politica/noticia/2026/09/22/flavio-bolsonaro-destinou-emenda-a-miliciano-condenado-por-morte-de-marielle-veja-prints-de-conversa-com-assessora-do-senador.ghtml"],
  p360: ["Poder360, 22/09/2026", "https://www.poder360.com.br/poder-congresso/assessora-de-flavio-tratou-de-emenda-com-miliciano-do-caso-marielle/"],
  em: ["Estado de Minas, 23/09/2026", "https://www.em.com.br/politica/2026/09/amp/7506425-flavio-bolsonaro-destinou-emenda-a-miliciano-condenado-no-caso-marielle.html"],
  cnnpl: ["CNN Brasil, 25/07/2026", "https://www.cnnbrasil.com.br/eleicoes/pl-oficializa-candidatura-de-flavio-bolsonaro-a-presidencia/"],
  ndmais: ["ND+, mandato no Senado", "https://ndmais.com.br/politica/quando-termina-mandato-flavio-bolsonaro-senado/"],
  cf86: ["Constituição Federal, art. 86, § 4º", "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm"],
  g1moro: ["g1, 28/08/2026", "https://g1.globo.com/politica/eleicoes/2026/noticia/2026/08/28/flavio-bolsonaro-entrevista-globo.ghtml"]
};

// Largura lógica da tela do jogo. A altura é sempre 192; no celular a largura acompanha
// a proporção da tela (de 336 a 520), para ocupar a tela inteira sem distorcer nem cortar.
export let VW = 336;
export const VW_MIN = 336;
export const VW_MAX = 520;
export function setVW(v: number) { VW = v; }
export const VH = 192;
export const TS = 16;
export const ROWS = 12;

export const hr = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const fmtBR = (n: number, d = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
