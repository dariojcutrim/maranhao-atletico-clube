/* ===================================================================
   Botões de COR na barra do editor de texto do painel.

   O editor do Sveltia só tem os botões nativos (negrito, itálico...) e
   não permite criar botões próprios pela configuração. Este script
   acrescenta dois: AZUL e VERMELHO (as cores do MAC).

   Como funciona: o cliente seleciona a palavra/frase e clica no botão.
   O texto é envolvido por um marcador que o site converte em cor:
       [[palavra]]  ->  azul do MAC      (build.js)
       ((palavra))  ->  vermelho do MAC  (build.js)
   O cliente NUNCA digita esses marcadores — só seleciona e clica.
   Clicar de novo com a mesma seleção remove a cor.

   Por que marcador e não cor "de verdade": o painel grava o texto em
   Markdown, que não tem cor. Testamos aplicar cor real no editor — ela
   aparece na tela mas é DESCARTADA ao salvar. O marcador é a única
   forma de a cor sobreviver.

   Este arquivo é nosso e roda junto do painel; se um dia os botões
   sumirem depois de atualizar o Sveltia, é aqui que se olha.
   =================================================================== */
(() => {
  'use strict';

  const CORES = [
    { nome: 'azul',     rotulo: 'Azul do MAC',     cor: '#16357d', abre: '[[', fecha: ']]' },
    { nome: 'vermelho', rotulo: 'Vermelho do MAC', cor: '#d8362a', abre: '((', fecha: '))' },
  ];

  const MARCA = 'data-mac-cor';

  /** Envolve (ou desfaz) a seleção com o marcador da cor escolhida. */
  function aplicar(editorEl, { abre, fecha }) {
    const ed = editorEl.__lexicalEditor;
    if (!ed) return;

    ed.focus();
    ed.update(() => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

      const texto = sel.toString();
      if (!texto.trim()) return;

      // Já está colorido? Então remove (funciona como liga/desliga).
      const jaTem = texto.startsWith(abre) && texto.endsWith(fecha);
      const novo = jaTem
        ? texto.slice(abre.length, -fecha.length)
        : abre + texto + fecha;

      // insertText respeita o histórico do editor (Ctrl+Z funciona).
      document.execCommand('insertText', false, novo);
    });
  }

  /** Cria um botão no mesmo estilo visual dos botões nativos. */
  function criarBotao(barra, def, editorEl) {
    const modelo = barra.querySelector('button');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = modelo ? modelo.className : '';
    b.setAttribute(MARCA, def.nome);
    b.setAttribute('aria-label', def.rotulo);
    b.title = def.rotulo + ' — selecione o texto e clique';
    b.innerHTML =
      '<span style="display:inline-flex;align-items:center;justify-content:center;' +
      'width:15px;height:15px;border-radius:50%;background:' + def.cor + ';' +
      'color:#fff;font-weight:700;font-size:10px;line-height:1;' +
      'font-family:system-ui,sans-serif">A</span>';

    b.addEventListener('mousedown', (e) => e.preventDefault()); // não perde a seleção
    b.addEventListener('click', (e) => {
      e.preventDefault();
      aplicar(editorEl, def);
    });
    barra.appendChild(b);
  }

  /** Acha as barras de ferramentas de editores de texto e injeta os botões. */
  function instalar() {
    document.querySelectorAll('[data-lexical-editor="true"]').forEach((editorEl) => {
      const campo = editorEl.closest('div');
      if (!campo) return;

      // A barra do editor é a que tem o botão de Negrito.
      const barras = [...(campo.parentElement || campo).querySelectorAll('[role="toolbar"]')];
      const barra = barras.find((t) =>
        [...t.querySelectorAll('button')].some((x) => /bold|negrito/i.test(x.getAttribute('aria-label') || ''))
      );
      if (!barra || barra.querySelector('[' + MARCA + ']')) return; // já instalado

      const alvo = barra.querySelector('.inner') || barra;
      CORES.forEach((def) => criarBotao(alvo, def, editorEl));
    });
  }

  // O painel monta e desmonta campos o tempo todo (é uma página dinâmica),
  // então observamos a página e reinstalamos quando aparecem editores novos.
  const observador = new MutationObserver(() => {
    clearTimeout(observador._t);
    observador._t = setTimeout(instalar, 120);
  });

  const iniciar = () => {
    instalar();
    observador.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
