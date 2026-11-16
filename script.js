/* =========================================================
   MEMÓRIA MORTAL — Jogo da Memória (HTML5 + CSS3 + JS puro)
   ---------------------------------------------------------
   Organização do arquivo:
   1. Dados: pares, personagens e dificuldades
   2. Arte: desenhos em SVG de cada carta (feitos no código)
   3. Sons: efeitos sintetizados com Web Audio (sem arquivos)
   4. Recordes: leitura e gravação no localStorage
   5. Estado do jogo e referências do DOM
   6. Funções do jogo (baralho, cartas, jogadas, pontuação)
   7. Telas, eventos e inicialização
   ========================================================= */

'use strict';

/* =========================================================
   1. DADOS
   ========================================================= */

const TOTAL_PARES = 5;

// Cada par tem um texto que aparece quando o jogador acerta.
const PARES = [
  {
    nomes: 'Coringa + Arlequina',
    frase: 'Coringa e Arlequina: o palhaço e a parceira que riu primeiro.',
  },
  {
    nomes: 'Pé de cabra + Capuz Vermelho',
    frase: 'Pé de cabra e Capuz Vermelho: a lembrança que não sai da cabeça de Jason.',
  },
  {
    nomes: 'Mulher-Gato + Batman',
    frase: 'Mulher-Gato e Batman: gato e morcego, brigando pelos mesmos telhados.',
  },
  {
    nomes: 'Asa Noturna + Estelar',
    frase: 'Asa Noturna e Estelar: um pouco de luz no meio da escuridão.',
  },
  {
    nomes: 'Alfred + Espanador de pó',
    frase: 'Alfred e o espanador: alguém tem que manter a Mansão em ordem.',
  },
];

// Configuração de cada nível (bônus do desafio extra).
//   previa  = tempo (ms) que as cartas ficam abertas no começo
//   atraso  = tempo (ms) até desvirar um par errado
//   tempo   = tempo total da partida em segundos
const DIFICULDADES = {
  facil:   { nome: 'Fácil',   previa: 3500, atraso: 1200, tempo: 120 },
  medio:   { nome: 'Médio',   previa: 1800, atraso: 900,  tempo: 75 },
  dificil: { nome: 'Difícil', previa: 0,    atraso: 600,  tempo: 50 },
};

// Pontuação
const PONTOS_ACERTO = 100;
const PONTOS_COMBO = 50;       // extra por acerto seguido
const PENALIDADE_ERRO = 10;
const BONUS_POR_SEGUNDO = 5;   // segundos que sobraram viram pontos

const FRASES_VITORIA = [
  'Você lembrou de tudo. Que pena: a memória é onde a loucura se esconde.',
  'Todos os pares no lugar. Gotham não merecia tanta sorte.',
  'Boa memória! Agora só falta esquecer o que viu aqui.',
];

const FRASES_DERROTA = [
  'HA HA HA HA! O tempo acabou e a piada foi sua.',
  'Esqueceu onde estavam? Ao menos algo nesta cidade é esquecível.',
  'Um dia ruim é tudo que separa a vitória da derrota. Tente de novo.',
];

/* =========================================================
   2. ARTE — cada personagem é um SVG desenhado aqui mesmo
   ========================================================= */

// Envolve o desenho com contorno grosso de tinta, como na HQ.
const svg = (interno) =>
  `<svg class="arte" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
  `<g stroke="#0b0710" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${interno}</g></svg>`;

// Fundo de tijolos para as cartas de objetos.
const TIJOLOS =
  `<g stroke="#0b0710" stroke-opacity=".35" stroke-width="2" fill="none">` +
  `<path d="M0 32H120M0 64H120M0 96H120M0 128H120M40 0V32M80 0V32M20 32V64M60 32V64M100 32V64M40 64V96M80 64V96M20 96V128M60 96V128M100 96V128M40 128V160M80 128V160"/></g>`;

const ARTE = {
  coringa: svg(`
    <rect x="50" y="88" width="20" height="22" fill="#d5d8c6"/>
    <path d="M4 160 Q8 112 60 104 Q112 112 116 160Z" fill="#5b2a86"/>
    <path d="M44 106 L60 144 L76 106 Q60 114 44 106Z" fill="#f4efe0"/>
    <path d="M44 106 L34 150 L58 132Z M76 106 L86 150 L62 132Z" fill="#3b1659"/>
    <path d="M60 122 L47 114 L47 132Z M60 122 L73 114 L73 132Z" fill="#ff7a1a"/>
    <circle cx="60" cy="123" r="4" fill="#d9541e"/>
    <ellipse cx="60" cy="62" rx="29" ry="36" fill="#eef0e2"/>
    <path d="M29 58 Q18 20 44 12 Q60 4 76 12 Q102 20 91 58 Q84 36 74 30 Q60 36 46 30 Q36 36 29 58Z" fill="#2e9b3f"/>
    <path d="M30 42 L14 32 L32 28Z M90 42 L106 32 L88 28Z M52 14 L58 2 L64 14Z" fill="#2e9b3f"/>
    <ellipse cx="48" cy="58" rx="8" ry="5.5" fill="#2a0f3d"/>
    <ellipse cx="72" cy="58" rx="8" ry="5.5" fill="#2a0f3d"/>
    <circle cx="50" cy="57" r="2" fill="#fff" stroke="none"/>
    <circle cx="74" cy="57" r="2" fill="#fff" stroke="none"/>
    <path d="M39 48 Q48 42 57 49 M63 49 Q72 42 81 48" fill="none" stroke-width="2.5"/>
    <path d="M60 60 L56 73 L63 73" fill="none" stroke-width="2"/>
    <path d="M32 76 Q60 112 88 76 Q60 90 32 76Z" fill="#b3121d"/>
    <path d="M36 79 Q60 96 84 79 Q60 88 36 79Z" fill="#fff" stroke="none"/>
    <path d="M44 85 L44 90 M52 88 L52 96 M60 89 L60 98 M68 88 L68 96 M76 85 L76 90" fill="none" stroke-width="1.6"/>
  `),

  arlequina: svg(`
    <path d="M34 50 Q14 62 20 96 Q30 84 36 68Z" fill="#c4161f"/>
    <path d="M86 50 Q106 62 100 96 Q90 84 84 68Z" fill="#161016"/>
    <rect x="52" y="90" width="16" height="16" fill="#f4efe0"/>
    <path d="M6 160 Q10 114 60 108 Q110 114 114 160Z" fill="#c4161f"/>
    <path d="M60 110 L86 136 L60 160 L34 136Z" fill="#161016"/>
    <path d="M32 108 Q60 126 88 108 L82 98 Q60 110 38 98Z" fill="#f4efe0"/>
    <ellipse cx="60" cy="68" rx="25" ry="30" fill="#f4efe0"/>
    <path d="M38 46 Q14 42 8 12 Q28 16 48 30Z" fill="#c4161f"/>
    <path d="M82 46 Q106 42 112 12 Q92 16 72 30Z" fill="#161016"/>
    <path d="M60 22 Q38 30 35 50 Q48 42 60 44Z" fill="#c4161f"/>
    <path d="M60 22 Q82 30 85 50 Q72 42 60 44Z" fill="#161016"/>
    <circle cx="8" cy="12" r="6" fill="#f2c230"/>
    <circle cx="112" cy="12" r="6" fill="#f2c230"/>
    <path d="M34 60 Q60 52 86 60 L85 72 Q72 76 62 68 L58 68 Q48 76 35 72Z" fill="#161016"/>
    <ellipse cx="47" cy="64" rx="5.5" ry="3.8" fill="#fff" stroke="none"/>
    <ellipse cx="73" cy="64" rx="5.5" ry="3.8" fill="#fff" stroke="none"/>
    <circle cx="47" cy="64" r="2.3" fill="#2c6fd1" stroke="none"/>
    <circle cx="73" cy="64" r="2.3" fill="#2c6fd1" stroke="none"/>
    <path d="M60 68 L58 76 L62 76" fill="none" stroke-width="2"/>
    <path d="M49 85 Q60 93 71 85 Q60 80 49 85Z" fill="#c4161f"/>
    <path d="M82 78 L86 83 L82 88 L78 83Z" fill="#c4161f" stroke-width="2"/>
  `),

  pedecabra: svg(`
    ${TIJOLOS}
    <g transform="rotate(32 60 84)">
      <path d="M52 152 L52 46 Q52 12 84 12 L92 26 Q66 28 66 50 L66 152 L60 160 Z" fill="#8a8798"/>
      <path d="M52 152 L52 132 L66 132 L66 152 L60 160Z" fill="#c4161f"/>
      <path d="M84 12 L92 26 L80 30 L74 18Z" fill="#c4161f"/>
      <path d="M57 50 L57 126" stroke="#d5d3e0" stroke-width="2.5" fill="none"/>
    </g>
    <circle cx="26" cy="132" r="4" fill="#c4161f"/>
    <circle cx="36" cy="146" r="2.5" fill="#c4161f"/>
    <circle cx="20" cy="150" r="2" fill="#c4161f"/>
  `),

  capuzvermelho: svg(`
    <rect x="50" y="92" width="20" height="18" fill="#2a2630"/>
    <path d="M6 160 Q10 112 60 106 Q110 112 114 160Z" fill="#1c1a22"/>
    <path d="M60 120 Q54 116 46 122 Q50 124 52 130 Q56 127 60 128 Q64 127 68 130 Q70 124 74 122 Q66 116 60 120Z" fill="#c4161f"/>
    <path d="M30 72 Q26 20 60 16 Q94 20 90 72 Q90 98 74 102 L46 102 Q30 98 30 72Z" fill="#c4161f"/>
    <path d="M35 82 Q60 92 85 82 L83 98 Q60 108 37 98Z" fill="#2a2630"/>
    <path d="M36 54 Q48 46 58 56 L56 68 Q46 72 38 66Z" fill="#f4efe0"/>
    <path d="M84 54 Q72 46 62 56 L64 68 Q74 72 82 66Z" fill="#f4efe0"/>
    <path d="M43 30 Q52 23 63 23" fill="none" stroke="#ff6b6b" stroke-width="3"/>
    <path d="M48 92 L72 92 M50 97 L70 97" stroke="#6a6578" stroke-width="2" fill="none"/>
  `),

  mulhergato: svg(`
    <rect x="52" y="92" width="16" height="18" fill="#e8b99a"/>
    <path d="M6 160 Q10 114 60 108 Q110 114 114 160Z" fill="#1a1722"/>
    <path d="M60 112 L60 160" stroke="#f2c230" stroke-width="2.5" fill="none"/>
    <circle cx="60" cy="118" r="3.5" fill="#f2c230"/>
    <ellipse cx="60" cy="72" rx="24" ry="28" fill="#e8b99a"/>
    <path d="M34 64 Q28 30 38 12 L52 32 Q60 28 68 32 L82 12 Q92 30 86 64 Q84 44 60 42 Q36 44 34 64Z" fill="#1a1722"/>
    <circle cx="46" cy="40" r="9" fill="#f2c230"/>
    <circle cx="74" cy="40" r="9" fill="#f2c230"/>
    <circle cx="46" cy="40" r="4.5" fill="#2a2630"/>
    <circle cx="74" cy="40" r="4.5" fill="#2a2630"/>
    <path d="M42 66 Q48 59 54 66 Q48 70 42 66Z" fill="#fff"/>
    <path d="M66 66 Q72 59 78 66 Q72 70 66 66Z" fill="#fff"/>
    <circle cx="48" cy="65" r="2.3" fill="#3fb54a" stroke="none"/>
    <circle cx="72" cy="65" r="2.3" fill="#3fb54a" stroke="none"/>
    <path d="M60 68 L58 76 L62 76" fill="none" stroke-width="2"/>
    <path d="M50 84 Q60 91 70 84 Q60 80 50 84Z" fill="#c4161f"/>
  `),

  batman: svg(`
    <path d="M0 160 Q2 104 34 94 L86 94 Q118 104 120 160Z" fill="#26304d"/>
    <rect x="48" y="88" width="24" height="22" fill="#2a2e3a"/>
    <path d="M14 160 Q18 112 60 106 Q102 112 106 160Z" fill="#6b7384"/>
    <ellipse cx="60" cy="134" rx="18" ry="10" fill="#f2c230"/>
    <path d="M60 127 Q55 123 48 128 Q52 130 54 134 Q57 132 60 133 Q63 132 66 134 Q68 130 72 128 Q65 123 60 127Z" fill="#0b0710" stroke="none"/>
    <path d="M32 74 Q28 40 36 6 L48 30 Q60 26 72 30 L84 6 Q92 40 88 74 Q88 100 70 104 L50 104 Q32 100 32 74Z" fill="#2a2e3a"/>
    <path d="M40 80 Q60 75 80 80 Q80 98 70 102 L50 102 Q40 98 40 80Z" fill="#e8b99a"/>
    <path d="M52 91 Q60 94 68 91" fill="none" stroke-width="2"/>
    <path d="M37 56 L56 62 L54 69 L40 65Z" fill="#f4efe0"/>
    <path d="M83 56 L64 62 L66 69 L80 65Z" fill="#f4efe0"/>
    <path d="M60 66 L57 78 L63 78" fill="none" stroke-width="1.8"/>
  `),

  asanoturna: svg(`
    <rect x="52" y="90" width="16" height="18" fill="#e8b99a"/>
    <path d="M8 160 Q12 114 60 108 Q108 114 112 160Z" fill="#14121a"/>
    <path d="M28 118 L42 160 M92 118 L78 160" stroke="#2fa8ff" stroke-width="6" fill="none"/>
    <path d="M60 110 L46 142 L60 130 L74 142Z" fill="#2fa8ff"/>
    <ellipse cx="60" cy="68" rx="24" ry="29" fill="#e8b99a"/>
    <path d="M34 64 Q26 20 60 14 Q94 20 86 64 Q82 42 60 38 Q38 42 34 64Z" fill="#14121a"/>
    <path d="M44 24 L38 8 L56 18Z M68 18 L84 6 L82 26Z" fill="#14121a"/>
    <path d="M34 56 Q60 48 86 56 L84 70 Q72 74 62 66 L58 66 Q48 74 36 70Z" fill="#14121a"/>
    <path d="M41 60 L55 62 L53 66 L42 64Z" fill="#fff" stroke="none"/>
    <path d="M79 60 L65 62 L67 66 L78 64Z" fill="#fff" stroke="none"/>
    <path d="M60 68 L58 77 L62 77" fill="none" stroke-width="2"/>
    <path d="M50 85 Q60 90 72 82" fill="none" stroke-width="2.5"/>
  `),

  estelar: svg(`
    <path d="M28 56 Q6 100 20 154 Q36 124 40 90Z" fill="#b01a3a"/>
    <path d="M92 56 Q114 100 100 154 Q84 124 80 90Z" fill="#b01a3a"/>
    <rect x="52" y="90" width="16" height="18" fill="#f08a24"/>
    <path d="M16 160 Q20 114 60 108 Q100 114 104 160Z" fill="#6a2fa3"/>
    <path d="M38 108 Q60 124 82 108 L78 100 Q60 112 42 100Z" fill="#f2c230"/>
    <circle cx="60" cy="126" r="5.5" fill="#3fe05a"/>
    <ellipse cx="60" cy="66" rx="24" ry="29" fill="#f08a24"/>
    <path d="M30 60 Q20 10 60 8 Q100 10 90 60 Q80 30 60 30 Q40 30 30 60Z" fill="#c21e44"/>
    <path d="M30 60 Q34 76 38 90 Q42 70 40 52Z M90 60 Q86 76 82 90 Q78 70 80 52Z" fill="#c21e44"/>
    <ellipse cx="48" cy="62" rx="8" ry="5.5" fill="#47e65a"/>
    <ellipse cx="72" cy="62" rx="8" ry="5.5" fill="#47e65a"/>
    <path d="M39 52 Q48 48 56 54 M64 54 Q72 48 81 52" fill="none" stroke-width="2.5"/>
    <path d="M60 64 L58 74 L62 74" fill="none" stroke-width="2"/>
    <path d="M52 82 Q60 88 68 82" fill="none" stroke-width="2.5"/>
    <path d="M104 14 L106.5 21 L114 23.5 L106.5 26 L104 33 L101.5 26 L94 23.5 L101.5 21Z" fill="#47e65a" stroke-width="2"/>
  `),

  alfred: svg(`
    <rect x="50" y="90" width="20" height="18" fill="#d9b690"/>
    <path d="M6 160 Q10 114 60 108 Q110 114 114 160Z" fill="#14121a"/>
    <path d="M45 108 L60 152 L75 108Z" fill="#f4efe0"/>
    <path d="M45 108 L34 150 L58 132Z M75 108 L86 150 L62 132Z" fill="#2a2630"/>
    <path d="M60 116 L47 108 L47 124Z M60 116 L73 108 L73 124Z" fill="#14121a"/>
    <ellipse cx="60" cy="66" rx="24" ry="30" fill="#ecc8a8"/>
    <path d="M36 62 Q28 46 36 36 Q42 50 41 64Z M84 62 Q92 46 84 36 Q78 50 79 64Z" fill="#c9c9d1"/>
    <path d="M36 44 Q40 32 60 31 Q80 32 84 44 Q76 36 60 36 Q44 36 36 44Z" fill="#c9c9d1"/>
    <path d="M40 53 Q47 49 55 53 M65 53 Q73 49 80 53" fill="none" stroke="#c9c9d1" stroke-width="3.5"/>
    <circle cx="48" cy="61" r="2.6" fill="#14121a" stroke="none"/>
    <circle cx="72" cy="61" r="2.6" fill="#14121a" stroke="none"/>
    <path d="M60 62 L56 76 Q60 79 64 76" fill="none" stroke-width="2"/>
    <path d="M42 82 Q51 74 60 80 Q69 74 78 82 Q69 88 60 83 Q51 88 42 82Z" fill="#c9c9d1"/>
    <path d="M54 93 Q60 95 66 93" fill="none" stroke-width="2"/>
    <path d="M42 70 Q44 76 46 78 M78 70 Q76 76 74 78" fill="none" stroke-width="1.2" stroke-opacity=".5"/>
  `),

  espanador: svg(`
    <path d="M0 150 H120 M0 118 H120" stroke="#0b0710" stroke-opacity=".3" stroke-width="2" fill="none"/>
    <g transform="rotate(24 60 90)">
      <rect x="55" y="74" width="10" height="82" rx="4" fill="#9a5a2b"/>
      <path d="M58 84 V150" stroke="#c98a4b" stroke-width="2" fill="none"/>
      <rect x="51" y="66" width="18" height="12" rx="2" fill="#f2c230"/>
      <g fill="#d9d2e9">
        <ellipse cx="60" cy="38" rx="9" ry="30" transform="rotate(-48 60 66)"/>
        <ellipse cx="60" cy="38" rx="9" ry="30" transform="rotate(48 60 66)"/>
      </g>
      <g fill="#b7a6d6">
        <ellipse cx="60" cy="38" rx="9" ry="30" transform="rotate(-24 60 66)"/>
        <ellipse cx="60" cy="38" rx="9" ry="30" transform="rotate(24 60 66)"/>
      </g>
      <ellipse cx="60" cy="36" rx="9" ry="30" fill="#e9e4f2"/>
      <path d="M60 66 V12" stroke="#8d7cb0" stroke-width="2" fill="none"/>
    </g>
    <g fill="#d5d0c4" stroke="none">
      <circle cx="20" cy="44" r="2.5"/><circle cx="30" cy="22" r="2"/><circle cx="102" cy="52" r="2.5"/>
      <circle cx="94" cy="30" r="1.8"/><circle cx="14" cy="76" r="1.8"/><circle cx="106" cy="86" r="2"/>
    </g>
  `),
};

// Verso das cartas: carinha do Coringa sobre fundo roxo.
const VERSO = `
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g stroke="#0b0710" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <rect x="9" y="9" width="102" height="142" rx="6" fill="none" stroke="#7dff6a" stroke-opacity=".5" stroke-width="2"/>
      <ellipse cx="60" cy="84" rx="26" ry="33" fill="#eef0e2"/>
      <path d="M33 78 Q22 40 46 30 L42 16 L58 26 L62 12 L74 26 L86 18 L80 34 Q98 44 87 78 Q80 56 72 50 Q60 56 48 50 Q40 56 33 78Z" fill="#2e9b3f"/>
      <ellipse cx="50" cy="80" rx="6" ry="4" fill="#2a0f3d"/>
      <ellipse cx="70" cy="80" rx="6" ry="4" fill="#2a0f3d"/>
      <path d="M38 98 Q60 124 82 98 Q60 108 38 98Z" fill="#b3121d"/>
      <path d="M42 101 Q60 112 78 101 Q60 106 42 101Z" fill="#fff" stroke="none"/>
      <path d="M20 22 l5 7 -5 7 -5 -7z M100 22 l5 7 -5 7 -5 -7z M20 124 l5 7 -5 7 -5 -7z M100 124 l5 7 -5 7 -5 -7z" fill="#c4161f" stroke-width="2"/>
    </g>
  </svg>`;

// Os 10 personagens. "par" liga as duas cartas que combinam.
const PERSONAGENS = [
  { par: 0, nome: 'Coringa',        arte: ARTE.coringa,       cores: ['#6a2fa3', '#2a0f3d'] },
  { par: 0, nome: 'Arlequina',      arte: ARTE.arlequina,     cores: ['#d9541e', '#7a1d12'] },
  { par: 1, nome: 'Pé de cabra',    arte: ARTE.pedecabra,     cores: ['#8a6d2a', '#3d2d0f'] },
  { par: 1, nome: 'Capuz Vermelho', arte: ARTE.capuzvermelho, cores: ['#a31621', '#3a0a10'] },
  { par: 2, nome: 'Mulher-Gato',    arte: ARTE.mulhergato,    cores: ['#2e7d6b', '#0f2f2a'] },
  { par: 2, nome: 'Batman',         arte: ARTE.batman,        cores: ['#c9a227', '#5a4510'] },
  { par: 3, nome: 'Asa Noturna',    arte: ARTE.asanoturna,    cores: ['#1d3f8e', '#0c1a3d'] },
  { par: 3, nome: 'Estelar',        arte: ARTE.estelar,       cores: ['#3a8f4a', '#123a1f'] },
  { par: 4, nome: 'Alfred',         arte: ARTE.alfred,        cores: ['#7d6a8f', '#2f2640'] },
  { par: 4, nome: 'Espanador',      arte: ARTE.espanador,     cores: ['#9a7b3c', '#3a2c12'] },
];

/* =========================================================
   3. SONS (Web Audio — nenhum arquivo de áudio necessário)
   ========================================================= */

let audioCtx = null;
let somLigado = localStorage.getItem('memoria-mortal:som') !== 'desligado';

function garantirAudio() {
  if (!audioCtx) {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (Contexto) audioCtx = new Contexto();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// Toca uma nota que desliza de freqInicial até freqFinal.
function tom(freqInicial, freqFinal, duracao, tipo = 'square', volume = 0.08, atraso = 0) {
  if (!somLigado || !audioCtx) return;
  const t0 = audioCtx.currentTime + atraso;
  const osc = audioCtx.createOscillator();
  const ganho = audioCtx.createGain();

  osc.type = tipo;
  osc.frequency.setValueAtTime(freqInicial, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqFinal, 1), t0 + duracao);

  ganho.gain.setValueAtTime(0.0001, t0);
  ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);

  osc.connect(ganho).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.02);
}

// Risada sinistra: "ha-ha-ha-ha" com notas serrilhadas.
function risada() {
  const base = [330, 310, 330, 300, 320, 280, 300, 250];
  base.forEach((f, i) => tom(f * 1.6, f * 0.9, 0.11, 'sawtooth', 0.07, i * 0.15 + (i > 3 ? 0.1 : 0)));
}

const SONS = {
  virar:  () => tom(520, 760, 0.09, 'triangle', 0.09),
  acerto: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, f, 0.14, 'triangle', 0.1, i * 0.09)),
  erro:   () => { tom(170, 80, 0.35, 'sawtooth', 0.1); tom(160, 70, 0.35, 'square', 0.05, 0.05); },
  vitoria: () => {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => tom(f, f, 0.18, 'square', 0.07, i * 0.13));
    setTimeout(risada, 900);
  },
  derrota: () => risada(),
};

function tocar(nome) {
  SONS[nome] && SONS[nome]();
}

/* =========================================================
   4. RECORDES (localStorage) — um recorde por dificuldade
   ========================================================= */

const chaveRecorde = (dif) => `memoria-mortal:recorde:${dif}`;

function lerRecorde(dif) {
  try {
    return JSON.parse(localStorage.getItem(chaveRecorde(dif)));
  } catch (e) {
    return null;
  }
}

function salvarRecorde(dif, dados) {
  try {
    localStorage.setItem(chaveRecorde(dif), JSON.stringify(dados));
  } catch (e) {
    /* modo privado ou storage cheio: o jogo continua normalmente */
  }
}

/* =========================================================
   5. ESTADO E ELEMENTOS DO DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);

const el = {
  telaInicio: $('tela-inicio'),
  telaJogo: $('tela-jogo'),
  modal: $('modal-fim'),
  modalCaixa: document.querySelector('.modal-caixa'),
  tabuleiro: $('tabuleiro'),
  legenda: $('legenda'),
  listaPares: $('lista-pares'),
  recordes: $('recordes'),
  hudPontos: $('hud-pontos'),
  hudTempo: $('hud-tempo'),
  hudTempoCaixa: $('hud-tempo-caixa'),
  hudTentativas: $('hud-tentativas'),
  hudPares: $('hud-pares'),
  hudCombo: $('hud-combo'),
  hudComboCaixa: $('hud-combo-caixa'),
  btnJogar: $('btn-jogar'),
  btnReiniciar: $('btn-reiniciar'),
  btnMenu: $('btn-menu'),
  btnSom: $('btn-som'),
  btnNovamente: $('btn-novamente'),
  btnFimMenu: $('btn-fim-menu'),
  fimTitulo: $('fim-titulo'),
  fimFrase: $('fim-frase'),
  fimPontos: $('fim-pontos'),
  fimTentativas: $('fim-tentativas'),
  fimErros: $('fim-erros'),
  fimTempo: $('fim-tempo'),
  fimCombo: $('fim-combo'),
  fimRecorde: $('fim-recorde'),
  fimNovoRecorde: $('fim-novo-recorde'),
};

const estado = {
  dificuldade: 'medio',
  cartas: [],
  primeira: null,
  segunda: null,
  bloqueado: true,
  emJogo: false,
  pontos: 0,
  tentativas: 0,
  acertos: 0,
  erros: 0,
  combo: 0,
  melhorCombo: 0,
  tempoRestanteMs: 0,
  relogioId: null,
  agendados: [],
};

/* =========================================================
   6. FUNÇÕES DO JOGO
   ========================================================= */

// setTimeout "rastreável": permite cancelar tudo ao reiniciar.
function agendar(fn, ms) {
  const id = setTimeout(fn, ms);
  estado.agendados.push(id);
  return id;
}

function limparAgendados() {
  estado.agendados.forEach(clearTimeout);
  estado.agendados = [];
  pararRelogio();
}

// Embaralhamento Fisher-Yates.
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function criarBaralho() {
  return embaralhar(PERSONAGENS.map((p) => ({ ...p, el: null, encontrada: false })));
}

function formatarTempo(ms) {
  const total = Math.ceil(ms / 1000);
  const min = Math.floor(total / 60);
  const seg = String(total % 60).padStart(2, '0');
  return `${min}:${seg}`;
}

function atualizarLegenda(texto) {
  el.legenda.textContent = texto;
}

function atualizarHud() {
  el.hudPontos.textContent = estado.pontos;
  el.hudTempo.textContent = formatarTempo(estado.tempoRestanteMs);
  el.hudTentativas.textContent = estado.tentativas;
  el.hudPares.textContent = `${estado.acertos}/${TOTAL_PARES}`;
  el.hudCombo.textContent = `x${estado.combo}`;

  el.hudTempoCaixa.classList.toggle('urgente', estado.emJogo && estado.tempoRestanteMs <= 10000);
  el.hudComboCaixa.classList.toggle('quente', estado.combo >= 2);
}

// ---------- tabuleiro ----------

function renderizarTabuleiro() {
  el.tabuleiro.innerHTML = '';

  estado.cartas.forEach((carta, i) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'carta entrando';
    botao.dataset.indice = i;
    botao.style.setProperty('--i', i);
    botao.setAttribute('aria-label', `Carta ${i + 1}, virada para baixo`);
    botao.innerHTML = `
      <div class="carta-interna">
        <div class="face verso">${VERSO}</div>
        <div class="face frente" style="--c1:${carta.cores[0]};--c2:${carta.cores[1]}">
          ${carta.arte}
          <span class="nome">${carta.nome}</span>
        </div>
      </div>`;

    // remove a classe de entrada para não repetir a animação depois
    botao.addEventListener('animationend', () => botao.classList.remove('entrando'), { once: true });

    carta.el = botao;
    el.tabuleiro.appendChild(botao);
  });
}

function virarCarta(carta, indice) {
  carta.el.classList.add('virada');
  carta.el.setAttribute('aria-label', `Carta ${indice + 1}: ${carta.nome}`);
  tocar('virar');
}

function desvirarCarta(carta, indice) {
  carta.el.classList.remove('virada', 'erro');
  carta.el.setAttribute('aria-label', `Carta ${indice + 1}, virada para baixo`);
}

// ---------- partida ----------

function iniciarPartida() {
  limparAgendados();
  garantirAudio();

  const cfg = DIFICULDADES[estado.dificuldade];

  Object.assign(estado, {
    cartas: criarBaralho(),
    primeira: null,
    segunda: null,
    bloqueado: true,
    emJogo: true,
    pontos: 0,
    tentativas: 0,
    acertos: 0,
    erros: 0,
    combo: 0,
    melhorCombo: 0,
    tempoRestanteMs: cfg.tempo * 1000,
  });

  el.modal.hidden = true;
  mostrarTela('jogo');
  renderizarTabuleiro();
  atualizarHud();

  if (cfg.previa > 0) {
    atualizarLegenda('Memorize as cartas... elas vão sumir.');
    agendar(() => {
      estado.cartas.forEach((c, i) => virarCarta(c, i));
    }, 700);
    agendar(() => {
      estado.cartas.forEach((c, i) => desvirarCarta(c, i));
      liberarJogo();
    }, 700 + cfg.previa + 600);
  } else {
    agendar(liberarJogo, 900);
  }
}

function liberarJogo() {
  estado.bloqueado = false;
  atualizarLegenda('Sua vez. Vire duas cartas.');
  iniciarRelogio();
}

function iniciarRelogio() {
  const fim = Date.now() + estado.tempoRestanteMs;
  estado.relogioId = setInterval(() => {
    estado.tempoRestanteMs = Math.max(0, fim - Date.now());
    atualizarHud();
    if (estado.tempoRestanteMs <= 0) encerrarPartida(false);
  }, 100);
}

function pararRelogio() {
  clearInterval(estado.relogioId);
  estado.relogioId = null;
}

function aoClicarNaCarta(evento) {
  const botao = evento.target.closest('.carta');
  if (!botao || estado.bloqueado || !estado.emJogo) return;

  const indice = Number(botao.dataset.indice);
  const carta = estado.cartas[indice];

  // ignora cartas já abertas ou já encontradas
  if (botao.classList.contains('virada') || carta.encontrada) return;

  virarCarta(carta, indice);

  if (!estado.primeira) {
    estado.primeira = { carta, indice };
    return;
  }

  estado.segunda = { carta, indice };
  estado.tentativas++;
  estado.bloqueado = true;
  verificarPar();
  atualizarHud();
}

function verificarPar() {
  const { primeira, segunda } = estado;
  const acertou = primeira.carta.par === segunda.carta.par;

  if (acertou) {
    registrarAcerto(primeira, segunda);
  } else {
    registrarErro(primeira, segunda);
  }
}

function registrarAcerto(a, b) {
  estado.acertos++;
  estado.combo++;
  estado.melhorCombo = Math.max(estado.melhorCombo, estado.combo);
  estado.pontos += PONTOS_ACERTO + (estado.combo - 1) * PONTOS_COMBO;

  [a, b].forEach(({ carta }) => {
    carta.encontrada = true;
    carta.el.classList.add('par');
  });

  tocar('acerto');
  atualizarLegenda(PARES[a.carta.par].frase);

  estado.primeira = null;
  estado.segunda = null;

  if (estado.acertos === TOTAL_PARES) {
    agendar(() => encerrarPartida(true), 900);
  } else {
    estado.bloqueado = false;
  }
}

function registrarErro(a, b) {
  const cfg = DIFICULDADES[estado.dificuldade];

  estado.erros++;
  estado.combo = 0;
  estado.pontos = Math.max(0, estado.pontos - PENALIDADE_ERRO);

  tocar('erro');
  atualizarLegenda('Errou! Essas duas não combinam.');

  agendar(() => {
    a.carta.el.classList.add('erro');
    b.carta.el.classList.add('erro');
  }, 450);

  agendar(() => {
    desvirarCarta(a.carta, a.indice);
    desvirarCarta(b.carta, b.indice);
    estado.primeira = null;
    estado.segunda = null;
    estado.bloqueado = false;
    atualizarHud();
  }, 450 + cfg.atraso);
}

// ---------- fim de jogo ----------

function encerrarPartida(venceu) {
  if (!estado.emJogo) return;

  estado.emJogo = false;
  estado.bloqueado = true;
  pararRelogio();

  const cfg = DIFICULDADES[estado.dificuldade];
  const tempoGastoMs = cfg.tempo * 1000 - estado.tempoRestanteMs;

  if (venceu) {
    const segundosSobrando = Math.floor(estado.tempoRestanteMs / 1000);
    estado.pontos += segundosSobrando * BONUS_POR_SEGUNDO;
  }

  atualizarHud();

  // Recorde: só vale se a pessoa venceu a partida.
  let novoRecorde = false;
  let recorde = lerRecorde(estado.dificuldade);
  if (venceu && (!recorde || estado.pontos > recorde.pontos)) {
    recorde = { pontos: estado.pontos, tentativas: estado.tentativas, tempo: tempoGastoMs };
    salvarRecorde(estado.dificuldade, recorde);
    novoRecorde = true;
  }

  if (venceu) {
    tocar('vitoria');
  } else {
    // revela as cartas que faltavam
    estado.cartas.forEach((c, i) => {
      if (!c.encontrada) virarCarta(c, i);
    });
    tocar('derrota');
  }

  agendar(() => mostrarFim(venceu, tempoGastoMs, recorde, novoRecorde), venceu ? 300 : 1500);
}

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarFim(venceu, tempoGastoMs, recorde, novoRecorde) {
  el.modalCaixa.classList.toggle('vitoria', venceu);
  el.fimTitulo.textContent = venceu ? 'A PIADA É SUA!' : 'HA HA HA! FIM DE JOGO';
  el.fimFrase.textContent = sortear(venceu ? FRASES_VITORIA : FRASES_DERROTA);

  el.fimPontos.textContent = estado.pontos;
  el.fimTentativas.textContent = estado.tentativas;
  el.fimErros.textContent = estado.erros;
  el.fimTempo.textContent = formatarTempo(tempoGastoMs);
  el.fimCombo.textContent = `x${estado.melhorCombo}`;
  el.fimRecorde.textContent = recorde
    ? `${recorde.pontos} pts (${DIFICULDADES[estado.dificuldade].nome})`
    : 'Ainda sem recorde';
  el.fimNovoRecorde.hidden = !novoRecorde;

  el.modal.hidden = false;
  el.btnNovamente.focus();
}

/* =========================================================
   7. TELAS, EVENTOS E INICIALIZAÇÃO
   ========================================================= */

function mostrarTela(nome) {
  el.telaInicio.classList.toggle('ativa', nome === 'inicio');
  el.telaJogo.classList.toggle('ativa', nome === 'jogo');
}

function voltarAoMenu() {
  limparAgendados();
  estado.emJogo = false;
  estado.bloqueado = true;
  el.modal.hidden = true;
  mostrarTela('inicio');
  atualizarRecordes();
}

function atualizarRecordes() {
  const partes = Object.keys(DIFICULDADES).map((chave) => {
    const r = lerRecorde(chave);
    return `${DIFICULDADES[chave].nome}: ${r ? r.pontos + ' pts' : '—'}`;
  });
  el.recordes.textContent = `Recordes  |  ${partes.join('  |  ')}`;
}

function montarListaDePares() {
  el.listaPares.innerHTML = PARES.map((p) => `<li>${p.nomes}</li>`).join('');
}

function atualizarBotaoSom() {
  el.btnSom.textContent = somLigado ? 'Som: ligado' : 'Som: desligado';
  el.btnSom.setAttribute('aria-pressed', String(!somLigado));
}

function alternarSom() {
  somLigado = !somLigado;
  localStorage.setItem('memoria-mortal:som', somLigado ? 'ligado' : 'desligado');
  atualizarBotaoSom();
  garantirAudio();
}

function iniciar() {
  montarListaDePares();
  atualizarRecordes();
  atualizarBotaoSom();

  document.querySelectorAll('input[name="dificuldade"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      estado.dificuldade = radio.value;
    });
  });

  el.btnJogar.addEventListener('click', iniciarPartida);
  el.btnNovamente.addEventListener('click', iniciarPartida);
  el.btnReiniciar.addEventListener('click', iniciarPartida);
  el.btnMenu.addEventListener('click', voltarAoMenu);
  el.btnFimMenu.addEventListener('click', voltarAoMenu);
  el.btnSom.addEventListener('click', alternarSom);
  el.tabuleiro.addEventListener('click', aoClicarNaCarta);
}

iniciar();
