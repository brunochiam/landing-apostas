/* Animações de entrada da página educativa "Aposta contra você."
   JS puro, sem dependências. Cada elemento anima uma única vez.
   Tempos e atrasos ficam em css/animacoes.css (variáveis --duracao, --stagger etc.). */
(function () {
  'use strict';
  var raiz = document.documentElement;
  raiz.classList.add('anim-ok'); // avisa o script inline do <head> que carregamos

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temObserver = 'IntersectionObserver' in window;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var css = getComputedStyle(raiz);
  var ms = function (nome) { return parseFloat(css.getPropertyValue(nome)) || 0; };

  try { iniciarExtras(); } catch (e) { /* extras são opcionais */ }

  // Sem IntersectionObserver ou com reduced motion: tudo já no estado final.
  if (semMovimento || !temObserver) { raiz.classList.remove('js'); return; }

  // Qualquer erro daqui em diante: mostra tudo (o conteúdo nunca fica escondido).
  var observer = null, pendentes = [], agendado = false;
  try { principal(); } catch (e) { raiz.classList.remove('js'); }

  function principal() {

  /* ---------- 1. Mapa seletor → tipo de animação (+ atraso) ---------- */
  var mapa = [
    ['.secao .rotulo', 'rotulo'],
    ['.secao .titulo', 'titulo'],
    ['.secao .apoio', 'subir', function () { return ms('--atraso-apoio'); }],
    ['.secao .ressalva', 'fade', function () { return ms('--atraso-ressalva'); }],
    ['.secao .texto p', 'subir', function (el, i) { return Math.min(i, 5) * ms('--stagger'); }],
    ['.secao .nota-fonte', 'fade'],
    ['.divisor-frase', 'divisor'],
    ['.lista-3 li', 'subir', function (el, i) { return (i % 3) * ms('--stagger-lista'); }],
    ['.dados .dado', 'subir', function (el, i) { return Math.min(i, 5) * ms('--stagger'); }],
    ['.canal', 'fade', function (el, i) { return Math.min(i, 5) * ms('--stagger-canal'); }],
    ['.aviso-urgencia', 'fade'],
    ['.acesso-direto', 'fade'],
    ['.foto:not(.foto-vazia)', 'foto'],
    ['.foto-vazia', 'fade'],
    ['.grafismo', 'traco'],
    ['.rodape', 'fade']
  ];

  mapa.forEach(function (regra) {
    $$(regra[0]).forEach(function (el) {
      if (el.hasAttribute('data-anim')) return;
      var tipo = regra[1];
      // Seção de ajuda: conteúdo sensível, só fade suave.
      if (el.closest('#ajuda') && tipo !== 'fade') tipo = 'fade';
      if (tipo === 'titulo') dividirLinhas(el);
      el.setAttribute('data-anim', tipo);
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      if (regra[2]) el.style.setProperty('--atraso', regra[2](el, i) + 'ms');
      marcarTracos(el);
      pendentes.push(el);
    });
  });

  /* ---------- 2. Hero: sequência ao carregar (o KV não anima) ---------- */
  var hero = [$$('.topo')[0], $$('.hero-chamada .apoio')[0], $$('.hero-chamada .texto')[0]].concat($$('.hero-chamada .botao'));
  hero.forEach(function (el, i) {
    if (!el) return;
    el.setAttribute('data-anim', i === 0 ? 'fade' : 'subir-hero');
    el.style.setProperty('--atraso', (i === 0 ? 0 : 150 + (i - 1) * ms('--stagger')) + 'ms');
  });
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    hero.forEach(function (el) { if (el) revelar(el); });
  }); });

  /* ---------- 3. Observer: revela ao entrar na tela ---------- */
  observer = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      var grande = e.rootBounds && e.intersectionRect.height >= e.rootBounds.height * 0.5;
      if (e.isIntersecting && (e.intersectionRatio >= 0.2 || grande)) revelar(e.target);
    });
    checarAcima();
  }, { threshold: [0, 0.2], rootMargin: '0px 0px -10% 0px' });
  pendentes.forEach(function (el) { observer.observe(el); });

  // Elementos que ficaram acima da tela (recarga no meio, âncora, scroll rápido)
  // aparecem na hora, já no estado final.
  ['scroll', 'resize', 'load', 'pageshow', 'hashchange'].forEach(function (ev) {
    window.addEventListener(ev, agendarChecagem, { passive: true });
  });
  } // fim de principal()

  function checarAcima() {
    agendado = false;
    pendentes.slice().forEach(function (el) {
      if (el.getBoundingClientRect().bottom < 0) revelar(el, true);
    });
  }
  function agendarChecagem() { if (!agendado) { agendado = true; requestAnimationFrame(checarAcima); } }

  /* ---------- Funções ---------- */
  function revelar(el, imediato) {
    var idx = pendentes.indexOf(el);
    if (idx > -1) { pendentes.splice(idx, 1); observer && observer.unobserve(el); }
    if (el.classList.contains('visivel')) return;
    if (imediato) {
      el.classList.add('imediato', 'visivel');
      return finalizar(el);
    }
    el.style.willChange = 'opacity, transform';
    el.classList.add('visivel');
    $$('.numero[data-valor]', el).forEach(contar);
    setTimeout(function () { finalizar(el); }, 2400); // maior atraso + duração
  }

  function finalizar(el) {
    el.style.willChange = '';
    el.classList.add('feito'); // libera as máscaras dos títulos
    $$('[data-traco]', el).concat(el.hasAttribute('data-traco') ? [el] : []).forEach(function (t) {
      t.removeAttribute('data-traco'); t.removeAttribute('pathLength');
    });
  }

  // Quebra o título nos <br> (linhas lógicas, então não depende da largura da tela).
  function dividirLinhas(h) {
    var rotulo = Array.prototype.map.call(h.childNodes, function (n) {
      return n.nodeName === 'BR' ? ' ' : n.textContent;
    }).join('');
    h.setAttribute('aria-label', rotulo.replace(/\s+/g, ' ').trim());
    var grupos = [[]];
    Array.prototype.slice.call(h.childNodes).forEach(function (n) {
      if (n.nodeName === 'BR') grupos.push([]); else grupos[grupos.length - 1].push(n);
    });
    h.textContent = '';
    grupos.forEach(function (nos, i) {
      var mascara = document.createElement('span'), linha = document.createElement('span');
      mascara.className = 'linha-mascara'; linha.className = 'linha';
      linha.style.setProperty('--i', i);
      nos.forEach(function (n) { linha.appendChild(n); });
      mascara.appendChild(linha); h.appendChild(mascara);
    });
    h.classList.add('dividido');
  }

  // Traço que se desenha: pathLength=1 em path/circle/rect (exceto os já tracejados).
  function marcarTracos(el) {
    $$('path, circle, rect', el).forEach(function (s) {
      if (s.hasAttribute('stroke-dasharray')) return;
      s.setAttribute('pathLength', '1'); s.setAttribute('data-traco', '');
    });
  }

  // Contagem 0 → valor final, com leitor de tela lendo só o valor final.
  function contar(n) {
    var final = n.textContent, alvo = parseFloat(n.dataset.valor);
    var pre = n.dataset.prefixo || '', suf = n.dataset.sufixo || '';
    var sr = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = final;
    n.setAttribute('aria-hidden', 'true'); n.parentNode.insertBefore(sr, n.nextSibling);
    var dur = ms('--duracao-contagem'), inicio = null;
    function passo(t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / dur, 1), suave = 1 - Math.pow(1 - p, 3);
      n.textContent = pre + Math.round(alvo * suave).toLocaleString('pt-BR') + suf;
      if (p < 1) return requestAnimationFrame(passo);
      n.textContent = final; n.removeAttribute('aria-hidden'); sr.remove();
    }
    requestAnimationFrame(passo);
  }

  /* ---------- Extras: menu da seção atual + barra de leitura ---------- */
  function iniciarExtras() {
    var topo = document.querySelector('.topo');
    if (topo) {
      var barra = document.createElement('div');
      barra.className = 'barra-leitura'; barra.setAttribute('aria-hidden', 'true');
      topo.appendChild(barra);
      var atualizar = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      };
      window.addEventListener('scroll', function () { requestAnimationFrame(atualizar); }, { passive: true });
      window.addEventListener('resize', atualizar); atualizar();
    }
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.menu a[href^="#"]');
    var spy = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var ativo = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('ativo', ativo);
          if (ativo) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { spy.observe(s); });
  }
})();
