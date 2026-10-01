import { useEffect } from 'react';
import { initGame } from './game/engine.ts';

export default function App() {
  useEffect(() => {
    const cleanup = initGame();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <div className="stage" id="stage">
        <canvas id="game" width="336" height="192" aria-label="Super Flávio World"></canvas>

        <div id="hud" className="px" hidden>
          <div id="hLives"></div>
          <div id="hLevel"></div>
          <div id="hSpecial"></div>
          <div id="hCoins"></div>
        </div>

        <div id="title" className="ov center px">
          <div className="logo" aria-label="Super Flávio World">
            <div className="s">Super</div>
            <div className="f">
              <span>F</span><span>L</span><span>Á</span><span>V</span><span>I</span><span>O</span>
            </div>
            <div className="w">World</div>
          </div>
          <div className="press" id="pressTxt">Aperte Z para começar</div>
          <div className="disc">
            Esse jogo é uma paródia baseada em fatos reais. Fontes checadas e exibidas após cada fase.
          </div>
        </div>

        <div id="select" className="ov center px" hidden>
          <div className="sel">
            <h2>Selecione o jogador</h2>
            <div className="pick" id="pick">
              <span className="arrow">◀</span>
              <canvas id="selSprite" width="14" height="20"></canvas>
              <span className="arrow">▶</span>
            </div>
            <div style={{ display: 'grid', gap: 'calc(1.4 * var(--u))' }}>
              <div className="name">Flavinho</div>
              <ul>
                <li>Pulo <b>■■■□□</b></li>
                <li>Velocidade <b>■■■□□</b></li>
                <li>Blindagem <b>■■■■■</b></li>
                <li>Vidas <b>5</b></li>
              </ul>
              <div className="quip" id="quip">1 de 1 jogador disponível.</div>
            </div>
            <div className="ctl" id="ctl">
              <div><b>Setas</b> andar<br /><b>Z</b> pular</div>
              <div><b>X</b> correr / ação<br /><b>Esc</b> pausa</div>
            </div>
          </div>
          <div className="press" id="pickTxt">Aperte Z para escolher</div>
        </div>

        <div id="mapbar" className="px" hidden>
          <div>
            <div className="t1" id="mT1"></div>
            <div className="t2" id="mT2"></div>
          </div>
          <div className="t3" id="mT3"></div>
        </div>

        <div id="dlg" className="dlg px" hidden role="dialog" aria-live="polite"></div>

        <div id="card" className="ov card px" hidden>
          <div className="roll" id="roll"></div>
        </div>

        <div id="pause" className="ov center px" hidden>
          <div className="go-head">Pausa</div>
          <div className="go-hint" id="pauseTxt">Z continua · X volta ao mapa</div>
        </div>

        <div id="toast" className="px" hidden></div>

        <div id="urna" className="ov px" hidden>
          <div className="urna">
            <div className="u-bezel">
              <div className="u-scr" id="urnaScr"></div>
              <div id="credits" hidden>
                <div className="crawl" id="crawl">
                  <div className="logo" aria-label="Super Flávio World">
                    <div className="s">Super</div>
                    <div className="f">
                      <span>F</span><span>L</span><span>Á</span><span>V</span><span>I</span><span>O</span>
                    </div>
                    <div className="w">World</div>
                  </div>
                  <p>Este jogo é uma paródia, mas é baseado em fatos reais, a partir de notícias checadas.</p>
                  <p>É uma iniciativa independente, que tenta conscientizar sobre os problemas que cercam um dos candidatos a presidente.</p>
                  <div className="cr-big">No dia 4 de outubro,<br />vote consciente.</div>
                </div>
                <div className="cr-hint" id="crHint" hidden></div>
              </div>
            </div>
            <div className="u-side">
              <div className="u-label">Super Flávio<br />World</div>
              <div className="u-pad" aria-hidden="true">
                <div className="u-keys">
                  <span>1</span><span>2</span><span>3</span>
                  <span>4</span><span>5</span><span>6</span>
                  <span>7</span><span>8</span><span>9</span>
                  <span className="z">0</span>
                </div>
                <div className="u-acts">
                  <span className="br">Branco</span>
                  <span className="co">Corrige</span>
                  <span className="cf" id="urnaOk">Confirma</span>
                </div>
              </div>
            </div>
            <div className="u-vents" aria-hidden="true"></div>
          </div>
        </div>

      </div>

      <div className="touch" id="touch" aria-label="Controles na tela">
        <div className="dpad" id="dpad" aria-label="Andar">
          <span className="l">◀</span>
          <span className="r">▶</span>
        </div>
        <div className="btns">
          <button className="tbtn b" data-b="B" aria-label="Correr ou ação">
            B
          </button>
          <button className="tbtn a" data-b="J" aria-label="Pular">
            A
          </button>
        </div>
      </div>

      <button className="tpause" data-b="P" aria-label="Pausa">
        II
      </button>

      <div id="rotate" hidden role="dialog" aria-label="Gire o celular">
        <div className="rlogo" aria-label="Super Flávio World">
          <div className="s">Super</div>
          <div className="f">
            <span>F</span><span>L</span><span>Á</span><span>V</span><span>I</span><span>O</span>
          </div>
          <div className="w">World</div>
        </div>
        <div className="phone" aria-hidden="true"></div>
        <h2>Gire o celular para começar</h2>
        <p>O jogo é na horizontal, com os controles na tela.</p>
        <small>Esse jogo é uma paródia baseada em fatos reais. Fontes checadas e exibidas após cada fase.</small>
      </div>

      <div className="legend">
        <b>Setas</b> andam &nbsp;·&nbsp; <b>Z</b> pula &nbsp;·&nbsp; <b>X</b> corre / ação &nbsp;·&nbsp; <b>Esc</b> pausa &nbsp;·&nbsp; <b>M</b> som
      </div>
    </>
  );
}
