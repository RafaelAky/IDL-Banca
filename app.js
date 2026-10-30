/* =====================================================================
   Banca Final IDL Tech — Encerramento da Trilha 2026
   Prévia navegável. Estrutura de dados espelha o modelo previsto para o
   backend (events, schedule_items, projects, heroes, project_members,
   project_members, voting_sessions, voting_codes, votes, admins).
   Nesta prévia os dados vivem no aparelho (localStorage) e o painel
   administrativo exporta tudo em JSON para migrar ao banco real.
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'idltech.banca.v1';
  var LOCAL = 'idltech.local.v1';   // estado do próprio aparelho
  var SALT = 'idl-tech-banca-2026'; // sal do hash de identificação
  var SALT_SENHA = 'idl-senha-painel-2026';
  var SENHA_HASH = String(window.IDL_SENHA_HASH || '').trim().toLowerCase();

  /* ------------------------------ utilidades ------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nl2p(s) {
    var parts = String(s || '').split(/\n{1,}/).filter(function (t) { return t.trim(); });
    return parts.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function ico(id, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(hhmm) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim()); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function fromMin(v) { return pad2(Math.floor(v / 60)) + ':' + pad2(v % 60); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var toastTimer = null;
  function toast(msg) {
    var old = $('#toast'); if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'toast'; d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
    document.body.appendChild(d);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (d.parentNode) d.remove(); }, 2600);
  }

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }

  /* ------------------------- conteúdo de demonstração --------------------- */
  function demoData() {
    var seed = (window.IDL_SEED || { event: {}, schedule: [], projects: [] });
    var schedule = (seed.schedule || []).map(function (r, i) {
      return { id: 'sch_' + pad2(i + 1), start: r[0], end: r[1], name: r[2], desc: r[3], place: r[4] || '', demo: false };
    });
    var projects = (seed.projects || []).map(function (p) {
      return {
        id: p.id, name: p.name, slot: p.slot || '', block: p.block || '',
        category: p.category || '', group: p.group || '',
        members: (p.members || []).slice(), values: (p.values || []).slice(),
        // projetos feitos por mais de uma equipe (O Som do Respeito: manhã e tarde)
        teams: (p.teams || []).map(function (t) {
          return { label: t.label || '', hero: t.hero || '', members: (t.members || []).slice(), values: (t.values || []).slice() };
        }),
        heroes: (p.heroes || []).map(function (h) {
          return { id: h.id, name: h.name, inspiration: h.inspiration || '', story: h.story || '', image: h.image || '', video: h.video || '',
            candidato: !!h.candidato, campanha: h.campanha || '' };
        }),
        tagline: p.tagline || '', meaning: p.meaning || '', integration: p.integration || '',
        problem: p.problem || '', why: p.why || '',
        solution: p.solution || '', how: p.how || '', impact: p.impact || '',
        cover: '', gallery: [], video: '', eligible: true, demo: false
      };
    });
    return {
      version: 1, contentVersion: 10,
      event: JSON.parse(JSON.stringify(seed.event || {})),
      avisos: JSON.parse(JSON.stringify(seed.avisos || [])),
      retro: JSON.parse(JSON.stringify(seed.retro || { title: '', lead: '', photos: [] })),
      trilhei: JSON.parse(JSON.stringify(seed.trilhei || null)),
      schedule: schedule, projects: projects,
      voting: { keyword: 'TRILHA2026', results: {}, resultsPublic: false },
      clock: { simulated: false, baseReal: Date.now(), baseSim: Date.parse('2026-11-14T10:32:00-03:00') }
    };
  }

  /* -------------------------------- store -------------------------------- */
  var db = null;
  function load() {
    var raw = safeGet(KEY);
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || !db.event) db = demoData();
    // Versão 7: identidade Trilhei 2026 e a página “Por que Trilhei?”.
    // Preserva a logo e a configuração da votação já cadastradas.
    if ((db.contentVersion || 1) < 7) {
      var keepLogo = db.event && db.event.logo;
      var keepVoting = db.voting && db.voting.keyword ? db.voting : null;
      var fresh = demoData();
      if (keepLogo) fresh.event.logo = keepLogo;
      if (keepVoting) fresh.voting = keepVoting;
      if (db.clock) fresh.clock = db.clock;
      fresh.clock.simulated = false;   // o link vai para o público: vale o horário real
      db = fresh;
      safeSet(KEY, JSON.stringify(db));
    }
    // Versão 8: programação oficial de outubro (8h às 13h, 16 equipes em bloco contínuo).
    // Troca só a programação, os avisos e os horários das equipes; o resto do que
    // a organização editou no painel continua como está.
    if ((db.contentVersion || 1) < 8) {
      var novo = demoData();
      db.schedule = novo.schedule;
      db.avisos = novo.avisos;
      db.event = db.event || {};
      db.event.timeLabel = novo.event.timeLabel;
      db.event.recepcao = novo.event.recepcao;
      var porId = {};
      novo.projects.forEach(function (p) { porId[p.id] = p; });
      (db.projects || []).forEach(function (p) {
        var n = porId[p.id];
        if (n) { p.slot = n.slot; p.block = n.block; }
      });
      db.contentVersion = 8;
      safeSet(KEY, JSON.stringify(db));
    }
    // Versão 9: a votação do público passa a ser dos cinco Heróis candidatos.
    if ((db.contentVersion || 1) < 9) {
      var semente = {};
      demoData().projects.forEach(function (p) {
        (p.heroes || []).forEach(function (h) { semente[h.id] = h; });
      });
      (db.projects || []).forEach(function (p) {
        (p.heroes || []).forEach(function (h) {
          var n = semente[h.id];
          h.candidato = !!(n && n.candidato);
          if (n && n.campanha && !h.campanha) h.campanha = n.campanha;
        });
      });
      db.contentVersion = 9;
      safeSet(KEY, JSON.stringify(db));
    }
    // Versão 10: textos conferidos pôster por pôster, Marta e "Muito Além da
    // Reforma" fora, O Som do Respeito com as duas equipes, novo campo
    // "significado". Os textos voltam aos dos pôsteres; capa, galeria e vídeos
    // cadastrados no painel continuam onde estavam.
    if ((db.contentVersion || 1) < 10) {
      var nova = demoData();
      var antes = {}, heroiAntes = {};
      (db.projects || []).forEach(function (p) {
        antes[p.id] = p;
        (p.heroes || []).forEach(function (h) { heroiAntes[h.id] = h; });
      });
      db.projects = nova.projects.map(function (p) {
        var a = antes[p.id];
        if (a) {
          p.cover = a.cover || ''; p.gallery = a.gallery || []; p.video = a.video || '';
          if (a.eligible === false) p.eligible = false;
        }
        p.heroes.forEach(function (h) {
          var ha = heroiAntes[h.id];
          if (!ha) return;
          if (!h.video && ha.video) h.video = ha.video;
          if (/^data:image\//.test(ha.image || '')) h.image = ha.image;
          h.candidato = !!ha.candidato;
          if (ha.campanha) h.campanha = ha.campanha;
        });
        return p;
      });
      db.event = db.event || {};
      if (db.event.totalTrilheiros == null) db.event.totalTrilheiros = nova.event.totalTrilheiros;
      if (!db.event.votacaoAbre) db.event.votacaoAbre = nova.event.votacaoAbre;
      db.contentVersion = 10;
      safeSet(KEY, JSON.stringify(db));
    }
    if (!db.avisos) db.avisos = [];
    if (!db.clock) db.clock = { simulated: false, baseReal: Date.now(), baseSim: Date.now() };
    return db;
  }
  function save() { safeSet(KEY, JSON.stringify(db)); render(); enviarConteudo(); }

  var localState = (function () {
    var raw = safeGet(LOCAL); var o = null;
    if (raw) { try { o = JSON.parse(raw); } catch (e) { o = null; } }
    return o || { visited: [], voted: null, unlocked: false, code: null, hash: null, name: '', device: uid('dev'), bannerOff: false, admCardOff: false, admin: false, adminKey: '' };
  })();
  function saveLocal() { safeSet(LOCAL, JSON.stringify(localState)); }

  /* -------------------------------- relógio -------------------------------
     O evento acontece em Curitiba. O aplicativo lê sempre a hora de Curitiba,
     não a hora do aparelho de quem acessa — assim a programação corre certa
     mesmo para quem estiver com o fuso trocado ou fora do Paraná.
     ----------------------------------------------------------------------- */
  var TZ = 'America/Sao_Paulo';   // mesmo fuso de Curitiba
  var tzFmt = null;
  try {
    tzFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (e) { tzFmt = null; }

  // devolve { iso:'2026-11-14', min: minutos desde a meia-noite, hh, mm } em Curitiba
  function curitiba(base) {
    var d = base || new Date();
    if (tzFmt) {
      var p = {};
      tzFmt.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      var hh = +p.hour % 24;
      return {
        iso: p.year + '-' + p.month + '-' + p.day,
        hh: hh, mm: +p.minute,
        min: hh * 60 + (+p.minute)
      };
    }
    // navegador antigo sem suporte a fuso: usa a hora do aparelho
    return {
      iso: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
      hh: d.getHours(), mm: d.getMinutes(),
      min: d.getHours() * 60 + d.getMinutes()
    };
  }

  // instante de referência: o real, ou o simulado quando a organização
  // liga o ensaio no painel para testar as telas antes do dia
  function now() {
    var c = db.clock;
    if (c && c.simulated) return new Date(c.baseSim + (Date.now() - c.baseReal));
    return new Date();
  }
  function agora() { return curitiba(now()); }
  function nowMinutes() { return agora().min; }
  function isEventDay() { return agora().iso === db.event.dateISO; }

  // 'antes' · 'dia' · 'depois' — decide se as telas ao vivo valem
  function eventPhase() {
    var a = agora().iso, d = String(db.event.dateISO || '');
    if (!d) return 'dia';
    if (a === d) return 'dia';
    return a < d ? 'antes' : 'depois';
  }
  function aoVivo() { return eventPhase() === 'dia'; }

  // dias que faltam até o evento (contados em Curitiba)
  function daysUntil() {
    var d = String(db.event.dateISO || ''); if (!d) return null;
    var a = agora().iso;
    var ms = Date.parse(d + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z');
    return Math.round(ms / 86400000);
  }

  function itemStatus(it) {
    // fora do dia do evento nada fica "acontecendo agora":
    // antes, tudo é apenas programação; depois, tudo já aconteceu.
    var fase = eventPhase();
    if (fase === 'antes') return 'plan';
    if (fase === 'depois') return 'done';
    var m = nowMinutes(), s = toMin(it.start), e = toMin(it.end);
    if (s == null) return 'next';
    if (e != null && m >= e) return 'done';
    if (m >= s && (e == null || m < e)) return 'live';
    return 'next';
  }
  function ordered() {
    return db.schedule.slice().sort(function (a, b) { return (toMin(a.start) || 0) - (toMin(b.start) || 0); });
  }
  function liveItem() { return ordered().filter(function (i) { return itemStatus(i) === 'live'; })[0] || null; }
  function nextItem() { return ordered().filter(function (i) { return itemStatus(i) === 'next'; })[0] || null; }

  /* ------------------------------ derivações ------------------------------ */
  function byId(pid) { return db.projects.filter(function (p) { return p.id === pid; })[0] || null; }
  function allHeroes() {
    var out = [];
    db.projects.forEach(function (p) {
      (p.heroes || []).forEach(function (h) { out.push({ hero: h, project: p }); });
    });
    return out;
  }
  function heroById(hid) {
    var found = null;
    allHeroes().forEach(function (x) { if (x.hero.id === hid) found = x; });
    return found;
  }
  // a equipe de um Herói, quando o projeto tem mais de uma (O Som do Respeito)
  function equipeDoHeroi(p, hid) {
    return (p.teams || []).filter(function (t) { return t.hero === hid; })[0] || null;
  }

  /* ------------------------------ contadores ------------------------------
     Nenhum número fica escrito no código: tudo sai dos dados.
     Projetos: um por equipe — O Som do Respeito junta dois projetos (manhã e
     tarde) numa página só, então conta dois. Trilheiros: o total oficial
     definido no painel; sem ele, a soma dos nomes das equipes.            */
  function nProjetos() {
    return db.projects.reduce(function (n, p) { return n + Math.max(1, (p.teams || []).length); }, 0);
  }
  function nHerois() { return allHeroes().length; }
  function somaTrilheiros() {
    return db.projects.reduce(function (n, p) { return n + (p.members || []).length; }, 0);
  }
  function totalOficial() {
    if (remote.on && remote.totalTrilheiros > 0) return remote.totalTrilheiros;
    var t = parseInt(db.event && db.event.totalTrilheiros, 10);
    return t > 0 ? t : 0;
  }
  function nTrilheiros() { return totalOficial() || somaTrilheiros(); }

  // número por extenso, para os textos corridos (até 99 basta)
  function extenso(n, fem) {
    var u = ['zero', fem ? 'uma' : 'um', fem ? 'duas' : 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
      'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    var d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    n = Math.round(+n || 0);
    if (n < 0 || n > 99) return String(n);
    if (n < 20) return u[n];
    return d[Math.floor(n / 10)] + (n % 10 ? ' e ' + u[n % 10] : '');
  }
  function maiuscula(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  function projectsInSlot(it) {
    var a = toMin(it.start), b = toMin(it.end);
    if (a == null || b == null) return [];
    return db.projects.filter(function (p) {
      var m = toMin(p.slot);
      return m != null && m >= a && m < b;
    });
  }
  function durationOf(it) {
    var a = toMin(it.start), b = toMin(it.end);
    if (a == null || b == null || b <= a) return '';
    var d = b - a;
    if (d < 60) return d + ' min';
    var h = Math.floor(d / 60), r = d % 60;
    return h + 'h' + (r ? pad2(r) : '');
  }
  function faixaHorario(it) {
    return (!it.end || it.end === it.start) ? it.start : it.start + ' – ' + it.end;
  }
  // cada equipe tem 6 minutos de apresentação + 1 de troca
  var MIN_POR_EQUIPE = 7;
  function projectImage(p) {
    if (p.cover) return { src: p.cover, contain: false };
    var h = (p.heroes || [])[0];
    return h && h.image ? { src: h.image, contain: true } : { src: '', contain: false };
  }
  function initials(name) {
    return String(name || '?').replace(/\(.*?\)/g, ' ').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0] || ''; }).join('').toUpperCase() || '?';
  }

  /* ------------------------------- roteador ------------------------------- */
  var route = { name: 'home', param: null, tab: 'projetos' };
  function parseHash() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { name: 'home', param: null };
    return { name: parts[0], param: parts[1] || null };
  }
  function go(path) { location.hash = '#/' + String(path).replace(/^\/+/, ''); }

  /* Voltar para onde estava: cada lista guarda a posição da rolagem. Quem
     abre um projeto ou um Herói e volta cai exatamente onde parou; nas
     demais trocas de tela, a página começa do topo.                       */
  var posicoes = {};
  var LISTAS = { home: 1, projetos: 1, herois: 1, programacao: 1, trilha2026: 1, trilhei: 1 };
  var DETALHES = { projeto: 1, heroi: 1 };
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* segue */ }
  var guardando = false;
  window.addEventListener('scroll', function () {
    if (guardando || restaurando) return;
    guardando = true;
    requestAnimationFrame(function () { guardando = false; posicoes[location.hash || '#/'] = window.scrollY; });
  }, { passive: true });
  var restaurando = false;
  function irPara(y) {
    // 'instant' passa por cima do scroll-behavior: smooth do CSS (troca de tela é seca)
    try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
  }
  function restaurarPosicao(chave) {
    var y = posicoes[chave];
    restaurando = true;
    // a página ainda pode crescer enquanto as imagens carregam: confirma algumas vezes
    var tentativas = [0, 80, 250, 600], mexeu = false;
    function parar() { mexeu = true; }
    window.addEventListener('touchstart', parar, { once: true, passive: true });
    window.addEventListener('wheel', parar, { once: true, passive: true });
    tentativas.forEach(function (ms, i) {
      setTimeout(function () {
        if (!mexeu && (location.hash || '#/') === chave) irPara(y);
        if (i === tentativas.length - 1) { restaurando = false; posicoes[chave] = window.scrollY; }
      }, ms);
    });
  }
  var rotaAnterior = route.name;
  window.addEventListener('hashchange', function () {
    var r = parseHash();
    var deDetalhe = !!DETALHES[rotaAnterior];
    route.name = r.name; route.param = r.param;
    rotaAnterior = r.name;
    if (r.name === 'trilha2026' || r.name === 'admin') syncFotos();
    render();
    var chave = location.hash || '#/';
    if (deDetalhe && LISTAS[r.name] && posicoes[chave] > 0) restaurarPosicao(chave);
    else irPara(0);
    var app = $('#app'); if (app) app.focus({ preventScroll: true });
  });

  /* ------------------------------- navegação ------------------------------ */
  var NAV_BASE = [
    { id: 'home', label: 'Início', shortLabel: 'Início', icon: 'i-home' },
    { id: 'trilhei', label: 'Por que Trilhei?', shortLabel: 'Trilhei', icon: 'i-seed' },
    { id: 'programacao', label: 'Programação', shortLabel: 'Agenda', icon: 'i-clock' },
    { id: 'projetos', label: 'Heróis & Projetos', shortLabel: 'Heróis', icon: 'i-grid' },
    { id: 'trilha2026', label: 'A Trilha em 2026', midLabel: 'Fotos', shortLabel: 'Fotos', icon: 'i-eye' },
    { id: 'votacao', label: 'Votação', shortLabel: 'Votação', icon: 'i-vote' }
  ];
  var NAV_ADMIN = { id: 'admin', label: 'Painel administrativo', midLabel: 'Painel administrativo', shortLabel: 'Painel', icon: 'i-key', admin: true };

  // a aba do painel só existe para o CPF da organização.
  // para todo mundo o site abre normal, e ela simplesmente não é desenhada.
  function ehAdmin() {
    return !!localState.hash && ehContaDaOrg(localState.hash);
  }
  /* A aba Votação só aparece para o público quando a organização liga a
     chave "Mostrar a votação no site" no painel (abrir a votação também
     liga). Quem está com o painel aberto neste aparelho sempre vê.
     Sem banco (modo prévia), vale a data do evento.                       */
  function mostraVotacao() {
    if (localState.admin || localState.voted || votacaoAberta()) return true;
    if (remote.on) return remote.visivel;
    return eventPhase() !== 'antes';
  }
  function navItens() {
    var base = mostraVotacao() ? NAV_BASE : NAV_BASE.filter(function (n) { return n.id !== 'votacao'; });
    return ehAdmin() ? base.concat([NAV_ADMIN]) : base;
  }
  function navGroup(cur) {
    if (cur === 'heroi' || cur === 'projeto' || cur === 'herois') return 'projetos';
    if (cur === 'resultado') return 'votacao';
    return cur;
  }
  function renderNav() {
    var cur = navGroup(route.name);
    var open = votacaoAberta();
    var itens = navItens();

    function alerta(n) {
      return (n.id === 'votacao' && open && !localState.voted)
        ? '<span class="dot-alert" aria-hidden="true"></span>' : '';
    }

    var bn = $('#bottomNav');
    bn.innerHTML = '<ul>' + itens.map(function (n) {
      var sel = cur === n.id;
      return '<li><button class="navbtn' + (n.admin ? ' navbtn-adm' : '') + '" data-nav="' + n.id + '"' +
        (sel ? ' aria-current="page"' : '') + '>' +
        ico(n.icon) + alerta(n) +
        '<span class="lbl">' + esc(n.shortLabel || n.label) + '</span>' +
        '</button></li>';
    }).join('') + '</ul>';
    bn.setAttribute('data-n', itens.length);

    var dn = $('#deskNav');
    dn.innerHTML = itens.map(function (n) {
      var sel = cur === n.id;
      return '<button class="navbtn' + (n.admin ? ' navbtn-adm' : '') + '" data-nav="' + n.id + '"' +
        ' title="' + esc(n.label) + '" aria-label="' + esc(n.label) + '"' +
        (sel ? ' aria-current="page"' : '') + '>' +
        ico(n.icon) + alerta(n) +
        '<span class="lbl">' + esc(n.midLabel || n.label) + '</span>' +
        (n.shortLabel ? '<span class="lbl lbl-short">' + esc(n.shortLabel) + '</span>' : '') +
        '</button>';
    }).join('');
  }
  function renderBrand() {
    var slot = $('#logoSlot');
    // a marca do evento é o Trilhei; a logo do Instituto fica no rodapé
    slot.innerHTML = '<img class="lg-trilhei" src="img/kv/trilhei.webp" alt="Trilhei">' +
      '<img class="lg-idl" src="img/kv/idltech.webp" alt="Programa IDL Tech">';
    $('#brandSub').textContent = 'Formatura 2026';
  }

  /* ------------------------- componentes reutilizáveis -------------------- */
  /* Linguagem gráfica do KV Trilhei, usada com parcimônia:
     · sementes de dente-de-leão flutuando no ar;
     · traços lilás (a mão que semeia);
     · a árvore lilás quase transparente atrás das frases centrais;
     · uma palavra gigante, bem apagada, ao fundo;
     · a faixa laranja inclinada com "Trilhei" como separador.
     As logos (Trilhei, IDL Tech, Instituto) entram sempre como imagem, sem
     recolorir, distorcer, girar nem mudar a opacidade.                    */

  // a semente do dente-de-leão: haste e papilho, em traço
  function sementeSvg() {
    var raios = '', pontas = '';
    for (var i = 0; i < 9; i++) {
      var a = (-162 + i * 18) * Math.PI / 180;
      var x = (Math.cos(a) * 15).toFixed(1), y = (-14 + Math.sin(a) * 15).toFixed(1);
      raios += 'M0 -14L' + x + ' ' + y;
      pontas += '<circle cx="' + x + '" cy="' + y + '" r="1"/>';
    }
    return '<svg viewBox="-18 -32 36 56" aria-hidden="true" focusable="false">' +
      '<path d="M0 21C1.2 9-1 -1 0 -14' + raios + '" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' +
      '<g fill="currentColor">' + pontas + '<ellipse cx="0" cy="21.5" rx="1.5" ry="2.8"/></g></svg>';
  }
  // algumas sementes soltas no ar de uma faixa (posições fixas, nada aleatório)
  function sementesNoAr(n, cls) {
    // posições fixas, sempre perto das bordas, para nunca cruzar o texto
    var lugares = [[4, 12], [90, 18], [80, 64], [95, 82], [70, 8], [86, 40]];
    var out = '';
    for (var i = 0; i < Math.min(n || 4, lugares.length); i++) {
      var x = lugares[i][0], y = lugares[i][1];
      var tam = 26 + (i * 19) % 26, giro = -24 + (i * 29) % 48;
      out += '<span class="semente" style="left:' + x + '%;top:' + y + '%;--t:' + tam + 'px;--g:' + giro +
        'deg;--d:' + (i * 2.3).toFixed(1) + 's;--v:' + (11 + (i * 3) % 7) + 's">' + sementeSvg() + '</span>';
    }
    return '<span class="sementes-ar ' + (cls || '') + '" aria-hidden="true">' + out + '</span>';
  }
  function palavraFundo(txt, cls) {
    return '<span class="palavra-fundo ' + (cls || '') + '" aria-hidden="true">' + esc(txt) + '</span>';
  }
  function arvoreFundo(cls) {
    return '<span class="arvore-fundo ' + (cls || '') + '" aria-hidden="true"><img src="img/kv/arvore-lilas.webp" alt="" loading="lazy"></span>';
  }
  // a mão que semeia, em traço (lilás no claro, creme no escuro)
  function tracoMao(tom, cls) {
    var f = tom === 'creme' ? 'mao-creme' : 'mao';
    return '<span class="traco-mao ' + (cls || '') + '" aria-hidden="true"><img src="img/kv/' + f + '.webp" alt="" loading="lazy"></span>';
  }
  // faixa laranja inclinada, separando dois momentos da página
  function sepTrilhei() {
    var t = '';
    for (var i = 0; i < 14; i++) t += '<span>Trilhei</span>';
    return '<div class="sep-trilhei" aria-hidden="true"><div class="sep-faixa"><div class="sep-trilho">' + t + t + '</div></div></div>';
  }
  /* título no estilo do KV: caixa alta leve e a última linha em negrito,
     como "O QUE ACONTECE DEPOIS QUE / A SEMENTE É PLANTADA?". O texto não
     muda: só a forma de mostrar.                                          */
  function tituloKV(texto, fortes) {
    var p = String(texto || '').trim().split(/\s+/);
    var n = Math.max(1, Math.min(p.length - 1, fortes || Math.ceil(p.length / 3)));
    return '<span class="kv-leve">' + esc(p.slice(0, p.length - n).join(' ')) + '</span> ' +
      '<span class="kv-forte">' + esc(p.slice(p.length - n).join(' ')) + '</span>';
  }

  function idlFooter() {
    return '<footer class="faixa fx-claro rodape">' +
      '<div class="cont rodape-in">' +
      '<span class="footlogos">' +
      '<img class="f-tri" src="img/kv/trilhei.webp" alt="Trilhei">' +
      '<i aria-hidden="true"></i>' +
      '<img class="f-idl" src="img/kv/idltech.webp" alt="Programa IDL Tech">' +
      '</span>' +
      '<span class="eyebrow">De sementes a raízes · Formatura 2026</span>' +
      '<p>Os protagonistas são os trilheiros, seus Heróis e a transformação construída ao longo da Trilha.</p>' +
      '<span class="credito">Um programa do Instituto Dente de Leão</span>' +
      '</div></footer>';
  }

  /* faixa de abertura das páginas internas
     tom: 'escuro' (degradê roxo → lilás) ou 'claro'
     op: { centro, classe, palavra, sementes, arteDir }                     */
  function faixaTopo(tom, eyebrow, titulo, lead, extra, ilustra, op) {
    op = op || {};
    var escuro = tom === 'escuro' || tom === 'roxo';
    var cls = ['faixa', escuro ? 'fx-escuro' : 'fx-claro', 'topo'];
    if (op.centro) cls.push('topo-centro');
    if (op.classe) cls.push(op.classe);
    return '<section class="' + cls.join(' ') + '">' +
      (op.palavra ? palavraFundo(op.palavra) : '') +
      (escuro && op.sementes !== false ? sementesNoAr(3) : '') +
      '<div class="cont topo-in">' +
      '<div class="topo-txt">' +
      (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + '</span>' : '') +
      '<h1 class="titulo-pag">' + esc(titulo) + '</h1>' +
      (lead ? '<p class="lead">' + esc(lead) + '</p>' : '') +
      (extra || '') +
      '</div>' +
      (ilustra ? '<div class="topo-arte">' + ilustra + '</div>' : '') +
      '</div>' +
      '</section>';
  }

  function sechead(n, label) {
    return '<h2 class="sec-tit">' + esc(label) + '</h2>';
  }
  function hasStory(p) { return !!(p.meaning || p.problem || p.why || p.solution || p.how || p.impact); }

  // ações e impacto: um item por linha vira lista; texto corrido vira parágrafos
  function listaOuTexto(txt) {
    var linhas = String(txt || '').split(/\n+/).map(function (t) { return t.trim(); }).filter(Boolean);
    if (linhas.length > 1) return '<ul class="lista-kv">' + linhas.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
    return nl2p(txt);
  }
  // nomes em linha, separados por ponto médio (sem pastilhas)
  function listaNomes(nomes, cls) {
    return '<ul class="nomes ' + (cls || '') + '">' + (nomes || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
  }

  function statusChip(st) {
    if (st === 'live') return '<span class="chip chip-live"><span class="livedot"></span>Acontecendo agora</span>';
    if (st === 'done') return '<span class="chip chip-done">Concluído</span>';
    if (st === 'plan') return '';   // antes do dia a programação é só programação
    return '';
  }

  // moldura clara com o Herói apoiado na base — a ilustração nunca vai sobre fundo escuro
  function quadroHeroi(h, cls, attrs) {
    return '<span class="quadro ' + (cls || '') + '"' + (attrs || '') + '>' +
      (h && h.image ? '<img src="' + esc(h.image) + '" alt="' + (attrs && /aria-hidden/.test(attrs) ? '' : 'Ilustração do Herói ' + esc(h.name)) + '" loading="lazy">' : '<span class="quadro-vazio">' + ico('i-seed') + '</span>') +
      '</span>';
  }

  /* a turma reunida: os Heróis montados em código, como numa foto de turma.
     O site distribui os Heróis em fileiras (duas no computador, três no
     celular), com os rostos espaçados por igual e a fileira de trás
     encaixada nos vãos da fileira da frente. Sai alguém da lista, sai da
     foto; não há imagem pronta para editar. A posição é calculada em
     arrumarTurma(), logo depois de a tela ser desenhada.                  */
  function grupoHerois(cls, alturaMax) {
    var hs = allHeroes().filter(function (x) { return x.hero && x.hero.image; });
    if (!hs.length) return '';
    return '<div class="rolo-caixa"><div class="turma-rolo"><div class="turma ' + (cls || '') + '" data-hmax="' + (alturaMax || 300) + '">' + hs.map(function (x) {
      return '<button class="turma-p" data-go="heroi/' + esc(x.hero.id) + '" ' +
        'aria-label="' + esc(x.hero.name + ', Herói do projeto ' + x.project.name) + '">' +
        '<img src="' + esc(x.hero.image) + '" alt="" loading="lazy">' +
        '<span class="turma-nome" aria-hidden="true"><b>' + esc(x.hero.name) + '</b><small>' + esc(x.project.name) + '</small></span>' +
        '</button>';
    }).join('') + '</div></div>' +
      '<button type="button" class="rolo-seta rolo-ant" data-act="roloAnt" aria-label="Ver os Heróis anteriores">' + ico('i-arrow-left') + '</button>' +
      '<button type="button" class="rolo-seta rolo-prox" data-act="roloProx" aria-label="Ver mais Heróis">' + ico('i-chev') + '</button>' +
      '<span class="rolo-convite" aria-hidden="true">Deslize para ver os ' + hs.length + ' Heróis <i>' + ico('i-chev') + ico('i-chev') + '</i></span>' +
      '</div>' +
      '<div class="rolo-trilho" aria-hidden="true"><span></span></div>' +
      '<p class="turma-dica">Toque em um Herói para conhecer a história.</p>';
  }

  /* duas fileiras de Heróis atravessando a dobra, em sentidos opostos.
     Cada fileira repete a sua lista o bastante para cobrir telas largas e
     é duplicada para o laço não ter salto. Anima só com transform.        */
  function desfileHerois() {
    var hs = allHeroes().filter(function (x) { return x.hero && x.hero.image; });
    if (!hs.length) return '';
    var meio = Math.ceil(hs.length / 2);
    function fila(lista, cls) {
      if (!lista.length) return '';
      // repete até cobrir com folga uma tela de 4000 px (a fileira é duplicada para o laço)
      var vezes = Math.max(2, Math.ceil(20 / lista.length));
      var unidade = [];
      for (var k = 0; k < vezes; k++) unidade = unidade.concat(lista);
      var quadros = unidade.map(function (x) { return quadroHeroi(x.hero, 'quadro-desfile', ' aria-hidden="true"'); }).join('');
      return '<div class="desfile-fila ' + cls + '" style="--n:' + unidade.length + '">' +
        '<div class="desfile-trilho">' + quadros + quadros + '</div></div>';
    }
    return '<div class="desfile" aria-hidden="true">' + fila(hs.slice(0, meio), 'fila-a') + fila(hs.slice(meio), 'fila-b') + '</div>';
  }

  // quantos projetos o visitante já abriu (O Som do Respeito conta pelas duas equipes)
  function discoveryBar() {
    var total = nProjetos();
    if (!total) return '';
    var seen = db.projects.filter(function (p) { return localState.visited.indexOf(p.id) >= 0; })
      .reduce(function (n, p) { return n + Math.max(1, (p.teams || []).length); }, 0);
    return '<div class="descoberta">' +
      '<div class="dtrack" aria-hidden="true"><div class="dfill" style="width:' + (seen / total * 100).toFixed(1) + '%"></div></div>' +
      '<span class="tiny">' + seen + ' de ' + total + ' projetos conhecidos</span></div>';
  }

  /* =============================== ENTRADA =============================== */
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

  function viewEntrada() {
    var ev = db.event;
    return '<div class="gate">' +
      '<div class="gate-arte">' +
        '<span class="gate-dente" aria-hidden="true"><img src="img/kv/dente.svg" alt=""></span>' +
        '<p class="gate-lema">“Incentivamos sonhos e trabalhamos para que se tornem realidade”</p>' +
      '</div>' +
      '<div class="gate-in">' +
        '<span class="gate-logos"><img class="lg-trilhei" src="img/kv/trilhei.webp" alt="Trilhei"><i aria-hidden="true"></i><img class="lg-idl" src="img/kv/idltech.webp" alt="Programa IDL Tech"></span>' +
        '<span class="eyebrow">Formatura 2026</span>' +
        '<h1 class="gate-tit">' + esc(ev.name) + '</h1>' +
        '<p class="gate-sub">' + esc(ev.subtitle) + '</p>' +
        '<p class="gate-meta">' + esc([ev.dateLabel, ev.timeLabel, ev.place].filter(Boolean).join(' · ')) + '</p>' +
        '<form id="gateForm" class="stack" novalidate>' +
          '<div class="field"><label for="gname">Seu nome</label>' +
          '<input id="gname" name="gname" type="text" autocomplete="name" placeholder="Como quer ser chamado(a)" value="' + esc(localState.name || '') + '"></div>' +
          '<div class="field' + (flow.error ? ' err' : '') + '"><label for="gcpf">Seu CPF</label>' +
          '<input class="big" id="gcpf" name="gcpf" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14"></div>' +
          (flow.error ? '<span class="errmsg">' + ico('i-info') + esc(flow.error) + '</span>' : '') +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Entrar no evento</button>' +
        '</form>' +
        '<div class="gnote">' + ico('i-lock') +
          '<p><b>O CPF não é guardado.</b> Ele serve só para garantir um voto por pessoa: o aplicativo gera a partir dele um código embaralhado, e é só esse código que segue adiante. O número não sai do seu celular.</p></div>' +
      '</div></div>';
  }

  /* ================================= HOME ================================= */
  function minsLeft(hhmm) {
    var m = toMin(hhmm); if (m == null) return null;
    return m - nowMinutes();
  }
  function humanMin(n) {
    if (n == null) return '';
    if (n < 1) return 'agora';
    if (n < 60) return n + ' min';
    var h = Math.floor(n / 60), r = n % 60;
    return h + 'h' + (r ? pad2(r) : '');
  }
  function clockLabel() {
    var a = agora(); return pad2(a.hh) + ':' + pad2(a.mm);
  }
  function dayProgress() {
    var items = ordered();
    if (!items.length) return { pct: 0, first: '', last: '' };
    var s0 = toMin(items[0].start) || 0;
    var e0 = toMin(items[items.length - 1].end) || (s0 + 60);
    var pct = aoVivo() ? clamp((nowMinutes() - s0) / Math.max(1, e0 - s0), 0, 1) * 100 : (eventPhase() === 'depois' ? 100 : 0);
    return { pct: pct, first: items[0].start, last: items[items.length - 1].end };
  }

  function viewHome() {
    var ev = db.event, live = liveItem(), nxt = live ? null : nextItem();
    var open = votacaoAberta();

    // só aparece quando a organização liga o ensaio do relógio no painel
    var banner = (db.clock && db.clock.simulated && !localState.bannerOff) ?
      '<div class="banner"><span class="bi">' + ico('i-info') + '</span>' +
      '<p class="grow"><b>Ensaio ligado.</b> O relógio está adiantado para o dia do evento, só para a organização testar as telas. Desligue no painel antes de enviar o link.</p>' +
      '<button class="iconbtn" data-act="hideBanner" aria-label="Ocultar aviso">' + ico('i-x') + '</button></div>' : '';

    var meta = [['i-cal', ev.dateLabel], ['i-clock', ev.timeLabel], ['i-pin', ev.place]]
      .filter(function (m) { return m[1]; })
      .map(function (m) { return '<span>' + ico(m[0]) + esc(m[1]) + '</span>'; }).join('');

    var dp = dayProgress();
    var rail = (dp.first && aoVivo()) ? '<div class="dayrail">' +
      '<div class="row-between"><span class="eyebrow">A trilha do dia</span>' +
      '<span class="dayrail-hora"><span class="livedot"></span><span id="liveClock">' + clockLabel() + '</span></span></div>' +
      '<div class="rl"><div class="fill" id="dayFill" style="width:' + dp.pct.toFixed(1) + '%"></div>' +
      '<span class="mk" id="dayMk" style="left:' + dp.pct.toFixed(1) + '%"></span></div>' +
      '<div class="ends"><span class="tiny num">' + esc(dp.first) + '</span><span class="tiny num">' + esc(dp.last) + '</span></div></div>' : '';

    /* ---- acontecendo agora / daqui a pouco ---- */
    var fase = eventPhase();
    var nowHtml;
    if (fase === 'antes') {
      // ainda não é o dia: nada de “acontecendo agora”, só a programação
      var items0 = ordered();
      var previa = items0.slice(0, 4).map(function (it) {
        return '<li><span class="num">' + esc(it.start) + '</span><span>' + esc(it.name) + '</span></li>';
      }).join('');
      nowHtml = '<article class="nowcard is-soon" id="nowCard">' +
        '<p class="now-k"><span>' + esc(contagemTexto()) + '</span><span>' + esc(db.event.timeLabel || '') + '</span></p>' +
        '<h2 class="ttl">A programação do dia já está aqui</h2>' +
        '<p class="desc">Dê uma olhada no que vai acontecer. No dia ' + esc(db.event.dateLabel) +
        ' esta tela passa a acompanhar o horário de Curitiba e mostra sozinha o que está rolando a cada momento.</p>' +
        (previa ? '<ul class="peek">' + previa + (items0.length > 4 ? '<li class="more"><span>+ ' + (items0.length - 4) + ' momentos</span></li>' : '') + '</ul>' : '') +
        '<button class="btn btn-outline" data-nav="programacao">Ver programação completa ' + ico('i-chev') + '</button>' +
        '</article>';
    } else if (fase === 'depois') {
      nowHtml = '<article class="nowcard is-next" id="nowCard">' +
        '<p class="now-k"><span>Encerrado</span></p>' +
        '<h2 class="ttl">A Banca Final aconteceu</h2>' +
        '<p class="desc">Obrigado a quem esteve junto. Os projetos e os Heróis continuam aqui para serem revisitados.</p>' +
        '<button class="btn btn-outline" data-nav="projetos">Conhecer os projetos ' + ico('i-chev') + '</button>' +
        '</article>';
    } else if (live) {
      var s0 = toMin(live.start), e0 = toMin(live.end), pct = e0 ? clamp((nowMinutes() - s0) / (e0 - s0), 0, 1) * 100 : 0;
      nowHtml = '<article class="nowcard is-live" id="nowCard">' +
        '<p class="now-k"><span class="chip-live"><span class="livedot"></span>Acontecendo agora</span>' +
        '<span id="nowCountdown">termina em ' + humanMin(minsLeft(live.end)) + '</span></p>' +
        '<h2 class="ttl">' + esc(live.name) + '</h2>' +
        (live.desc ? '<p class="desc">' + esc(live.desc) + '</p>' : '') +
        '<p class="facts num">' + esc(live.start) + ' – ' + esc(live.end) + (live.place ? ' · ' + esc(live.place) : '') + '</p>' +
        '<div class="nowprog"><i id="nowProg" style="width:' + pct.toFixed(1) + '%"></i></div>' +
        '<button class="btn btn-primary" data-nav="programacao">Ver programação completa ' + ico('i-chev') + '</button>' +
        '</article>';
    } else if (nxt) {
      nowHtml = '<article class="nowcard is-next" id="nowCard">' +
        '<p class="now-k"><span>Daqui a pouco</span><span id="nowCountdown">em ' + humanMin(minsLeft(nxt.start)) + '</span></p>' +
        '<h2 class="ttl">' + esc(nxt.name) + '</h2>' +
        (nxt.desc ? '<p class="desc">' + esc(nxt.desc) + '</p>' : '') +
        '<p class="facts num">' + esc(nxt.start) + ' – ' + esc(nxt.end) + (nxt.place ? ' · ' + esc(nxt.place) : '') + '</p>' +
        '<button class="btn btn-outline" data-nav="programacao">Ver programação completa ' + ico('i-chev') + '</button>' +
        '</article>';
    } else {
      nowHtml = '<article class="nowcard is-next" id="nowCard">' +
        '<p class="now-k"><span>Programação</span></p>' +
        '<h2 class="ttl">Por enquanto, aproveite para conhecer os projetos e os Heróis</h2>' +
        '<button class="btn btn-outline" data-nav="projetos">Conhecer os projetos ' + ico('i-chev') + '</button>' +
        '</article>';
    }

    var shortcuts = '<div class="atalhos">' +
      '<button class="atalho" data-go="projetos">' +
      '<span class="at-t">Conheça os projetos</span>' +
      '<span class="at-s">Veja as ideias que chegaram até a Banca.</span>' +
      '<span class="at-go">Ver os ' + nProjetos() + ' projetos ' + ico('i-chev') + '</span></button>' +
      '<button class="atalho" data-go="herois">' +
      '<span class="at-t">Conheça os Heróis</span>' +
      '<span class="at-s">Descubra as histórias construídas pelos trilheiros.</span>' +
      '<span class="at-go">Ver os ' + nHerois() + ' Heróis ' + ico('i-chev') + '</span></button>' +
      '</div>';

    /* ---- a turma dos Heróis ---- */
    var nh = nHerois();
    var turma = nh ? '<section class="faixa fx-branco home-turma">' +
      palavraFundo('Heróis') +
      '<div class="cont turma-in">' +
      '<div class="turma-txt"><span class="eyebrow">Os Heróis da Trilha</span>' +
      '<h2 class="titulo">Cada grupo criou o seu</h2>' +
      '<p class="lead">' + maiuscula(extenso(nh)) + ' Heróis nasceram das histórias, das causas e das escolhas dos trilheiros ao longo do ano.</p>' +
      '<button class="btn btn-outline" data-go="herois">Ver todos os ' + nh + ' ' + ico('i-chev') + '</button></div>' +
      '<div class="turma-lugar">' + grupoHerois('turma-home', 300) + '</div>' +
      '</div></section>' : '';

    var retroPh = fotosDoSite();
    var fotos = retroPh.length ? '<section class="faixa fx-tint home-fotos">' +
      '<div class="cont fotos-in">' +
      '<div class="fotos-col">' + retroPh.slice(0, 3).map(function (p, i) {
        return '<span class="fotos-f f' + (i + 1) + '">' + imgFoto(p, '', ' loading="lazy"') + '</span>';
      }).join('') + '</div>' +
      '<div class="fotos-txt"><span class="eyebrow">Antes da Banca</span>' +
      '<h2 class="titulo">' + esc(db.retro.title || 'A Trilha em 2026') + '</h2>' +
      '<p class="lead">Um ano de rodas de conversa, visitas, ensaios e ideias que mudaram de forma pelo caminho.</p>' +
      '<button class="btn btn-outline" data-go="trilha2026">Ver a retrospectiva ' + ico('i-chev') + '</button></div>' +
      '</div></section>' : '';

    var avisoAdmin = (ehAdmin() && !localState.admin && !localState.admCardOff)
      ? '<div class="banner banner-adm"><span class="bi">' + ico('i-key') + '</span>' +
        '<div class="grow"><p><b>Seu painel administrativo está aqui.</b> Reconheci seu CPF. A aba <b>Painel</b>, no menu, abre o controle da votação, as respostas, as fotos e a edição dos textos. Só a equipe da organização a enxerga.</p>' +
        '<div class="row wrap" style="gap:8px;margin-top:10px">' +
        '<button class="btn btn-sm btn-primary" data-nav="admin">' + ico('i-key') + ' Abrir o painel</button>' +
        '<button class="btn btn-sm btn-ghost" data-act="hideAdmCard">Não mostrar de novo</button>' +
        '</div></div></div>'
      : '';

    var voteHtml;
    if (localState.voted) {
      voteHtml = '<section class="faixa fx-escuro home-voto">' + sementesNoAr(4) + '<div class="cont voto-in">' +
        '<span class="eyebrow">Votação dos Heróis</span>' +
        '<h2 class="titulo">Voto registrado</h2>' +
        '<p class="lead">Obrigado por fazer parte deste momento.</p>' +
        '<button class="btn btn-claro btn-lg" data-nav="votacao">Ver meu voto</button></div></section>';
    } else if (open) {
      voteHtml = '<section class="faixa fx-escuro home-voto is-open">' + sementesNoAr(4) + '<div class="cont voto-in">' +
        '<span class="chip-live"><span class="livedot"></span>Votação aberta</span>' +
        '<h2 class="titulo">Agora é com você</h2>' +
        '<p class="lead">' + (votoEmHerois() ? 'Escolha o Herói que mais te marcou entre os candidatos.' : 'Conheça os projetos e escolha aquele que mais te marcou.') + '</p>' +
        '<button class="btn btn-lg btn-laranja" data-nav="votacao">Votar agora</button></div></section>';
    } else if (!mostraVotacao()) {
      voteHtml = '';
    } else {
      var abre = String(db.event.votacaoAbre || '').trim();
      voteHtml = '<section class="faixa fx-escuro home-voto">' + sementesNoAr(4) + '<div class="cont voto-in">' +
        '<span class="eyebrow">Votação dos Heróis</span>' +
        '<h2 class="titulo">A votação abre no momento certo</h2>' +
        '<p class="lead">' + (votoEmHerois()
          ? 'A votação do Herói abre depois das campanhas' + (abre ? ', às ' + esc(abre) : '') + ', e fica aberta durante as apresentações. Até lá, conheça os candidatos.'
          : 'A organização libera a votação durante a Banca. Até lá, aproveite para conhecer todos os projetos antes de escolher.') + '</p>' +
        '<div class="voto-barra">' + discoveryBar() + '</div>' +
        '<button class="btn btn-claro" data-nav="votacao">Tenho a palavra-chave</button>' +
        '</div></section>';
    }

    return '<div class="view home">' +

      /* ---- a dobra: o nome do evento e os Heróis atravessando a tela ---- */
      '<section class="faixa fx-escuro dobra">' +
        desfileHerois() +
        '<div class="cont dobra-txt">' +
          '<span class="eyebrow">' + (firstName(localState.name) ? 'Olá, ' + esc(firstName(localState.name)) : 'Formatura 2026') + '</span>' +
          '<h1 class="mega">' + esc(ev.name) + '</h1>' +
          '<p class="dobra-sub">' + esc(ev.subtitle) + '</p>' +
          '<p class="dobra-meta">' + meta + '</p>' +
          rail +
        '</div>' +
      '</section>' +

      ((banner || avisoAdmin) ? '<div class="cont home-avisos">' + banner + avisoAdmin + '</div>' : '') +

      /* ---- os números ---- */
      '<section class="faixa fx-claro home-nums">' +
        '<div class="cont nums-in">' +
        '<div class="numgrid">' +
          '<div class="numitem"><span class="nv num" data-count="' + nProjetos() + '">0</span><span class="nk">projetos</span></div>' +
          '<div class="numitem"><span class="nv num" data-count="' + nTrilheiros() + '">0</span><span class="nk">trilheiros</span></div>' +
          '<div class="numitem"><span class="nv num" data-count="' + nHerois() + '">0</span><span class="nk">Heróis</span></div>' +
        '</div>' +
        '<div class="nums-lado">' +
        '<p class="numlegenda">Cada projeto é uma semente que a Trilha plantou ao longo do ano, e cada Herói carrega o que ficou em quem o construiu.</p>' +
        tracoMao('lilas', 'nums-mao') +
        '</div>' +
        '</div>' +
      '</section>' +

      '<section class="faixa fx-tint home-agora"><div class="cont agora-in">' +
      nowHtml + shortcuts + '</div></section>' +
      turma +
      sepTrilhei() +
      fotos +
      voteHtml +
      idlFooter() +
      '</div>';
  }

  /* ---- atualização ao vivo, sem redesenhar a tela ---- */
  function tickLive() {
    var el = $('#liveClock'); if (el) el.textContent = clockLabel();
    var live = liveItem(), nxt = live ? null : nextItem();
    var cd = $('#nowCountdown');
    if (cd && live) cd.textContent = 'termina em ' + humanMin(minsLeft(live.end));
    else if (cd && nxt) cd.textContent = 'em ' + humanMin(minsLeft(nxt.start));
    if (live) {
      var pr = $('#nowProg');
      if (pr) {
        var s0 = toMin(live.start), e0 = toMin(live.end);
        pr.style.width = (e0 ? clamp((nowMinutes() - s0) / (e0 - s0), 0, 1) * 100 : 0).toFixed(1) + '%';
      }
    }
    var dp = dayProgress(), f = $('#dayFill'), mk = $('#dayMk');
    if (f) f.style.width = dp.pct.toFixed(1) + '%';
    if (mk) mk.style.left = dp.pct.toFixed(1) + '%';
    var tl = $('#tl');
    if (tl) tl.style.setProperty('--tl-progress', dp.pct.toFixed(1) + '%');
  }

  function countUp() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    Array.prototype.forEach.call(els, function (el) {
      var target = +el.getAttribute('data-count') || 0;
      if (reduce) { el.textContent = target; return; }
      var t0 = performance.now(), dur = 900;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  // “faltam N dias”, em palavras
  function contagemTexto() {
    var n = daysUntil();
    if (n == null) return '';
    if (n > 1) return 'Faltam ' + n + ' dias';
    if (n === 1) return 'É amanhã';
    if (n === 0) return 'É hoje';
    return '';
  }
  function contagemChip() {
    var t = contagemTexto();
    if (!t) return '';
    return '<p class="topo-nota">' + ico('i-cal') + esc(t) + ' · ' + esc(db.event.timeLabel || '') + ' · horário de Curitiba</p>';
  }

  /* ============================== PROGRAMAÇÃO ============================= */
  function viewPrograma() {
    var items = ordered();
    if (!items.length) {
      return '<div class="view">' + faixaTopo('escuro', '', 'Programação', '', '', '') +
        '<div class="corpo"><div class="empty"><h2 class="h3">Programação ainda não publicada</h2>' +
        '<p>Assim que a organização cadastrar as atividades, elas aparecem aqui.</p></div></div></div>';
    }
    var dp = dayProgress();
    var body = items.map(function (it) {
      var st = itemStatus(it);
      var cd = '';
      if (st === 'live') cd = '<span class="tl-quando">termina em ' + humanMin(minsLeft(it.end)) + '</span>';
      else if (st === 'next' && aoVivo()) {
        var m = minsLeft(it.start);
        if (m != null && m <= 90) cd = '<span class="tl-quando">em ' + humanMin(m) + '</span>';
      }
      var extras = [durationOf(it), it.place].filter(Boolean).map(esc).join(' · ');
      return '<article class="tlitem ' + st + '"><span class="node" aria-hidden="true"></span>' +
        '<div class="tcard">' +
        '<div class="tl-cab"><span class="th num">' + esc(faixaHorario(it)) + '</span>' + statusChip(st) + cd + '</div>' +
        '<h2 class="tn">' + esc(it.name) + '</h2>' +
        (it.desc ? '<p class="td">' + esc(it.desc) + '</p>' : '') +
        (extras ? '<p class="tf">' + extras + '</p>' : '') +
        (function () {
          var ps = projectsInSlot(it);
          if (!ps.length) return '';
          return '<div class="tlprojs">' + ps.map(function (p) {
            return '<button class="tlproj" data-go="projeto/' + esc(p.id) + '"><b class="num">' + esc(p.slot) + '</b>' + esc(p.name) + '</button>';
          }).join('') + '</div>';
        })() +
        '</div></article>';
    }).join('');

    var fase = eventPhase();
    var lead = fase === 'dia'
      ? 'A trilha do dia, do credenciamento ao encerramento. O bloco em destaque é o que está acontecendo agora.'
      : fase === 'depois'
        ? 'A trilha do dia, do credenciamento ao encerramento — como aconteceu.'
        : 'A trilha do dia, do credenciamento ao encerramento. No dia ' + db.event.dateLabel + ', esta tela acompanha o horário de Curitiba e mostra sozinha o que está acontecendo em cada momento.';

    var ao = (fase === 'dia') ? liveItem() : null;
    var resumo = '<aside class="lateral">' +
      '<div class="painelinho">' +
      '<span class="eyebrow">O dia em resumo</span>' +
      '<dl class="mini-ficha">' +
      '<div><dt>Momentos</dt><dd class="num">' + items.length + '</dd></div>' +
      (dp.first ? '<div><dt>Começa</dt><dd class="num">' + esc(dp.first) + '</dd></div>' : '') +
      (dp.last ? '<div><dt>Termina</dt><dd class="num">' + esc(dp.last) + '</dd></div>' : '') +
      (db.event.place ? '<div><dt>Local</dt><dd>' + esc(db.event.place) + '</dd></div>' : '') +
      '</dl>' +
      (db.event.recepcao ? '<p class="tiny mini-nota">' + esc(db.event.recepcao) + '.</p>' : '') +
      (ao ? '<div class="mini-agora"><span class="chip-live"><span class="livedot"></span>Agora</span>' +
        '<b>' + esc(ao.name) + '</b><span class="num tiny">' + esc(ao.start) + ' – ' + esc(ao.end) + '</span></div>'
        : '<p class="tiny mini-nota">' + (fase === 'antes'
            ? 'No dia, o bloco que estiver acontecendo aparece destacado aqui, no horário de Curitiba.'
            : 'A Banca Final já foi encerrada.') + '</p>') +
      '<button class="btn btn-sm btn-outline btn-block" data-nav="projetos">Conhecer os projetos ' + ico('i-chev') + '</button>' +
      '</div>' +
      ((db.avisos || []).length ? '<div class="painelinho avisos">' +
        '<span class="eyebrow">Bom saber</span>' +
        db.avisos.map(function (a) {
          return '<div class="aviso"><b>' + esc(a[0]) + '</b><p>' + esc(a[1]) + '</p></div>';
        }).join('') + '</div>' : '') +
      '</aside>';

    return '<div class="view">' +
      faixaTopo('escuro', db.event.dateLabel, 'A trilha do dia', lead,
        (fase === 'antes' ? contagemChip() : ''), '', { palavra: 'Programação' }) +
      '<div class="corpo duas-colunas">' +
      '<div class="timeline' + (fase === 'antes' ? ' tl-plan' : '') + '" id="tl" style="--tl-progress:' + dp.pct.toFixed(1) + '%">' + body + '</div>' +
      resumo +
      '</div></div>';
  }

  /* =========================== HERÓIS & PROJETOS ========================== */
  var filt = { block: 'todos', q: '' };

  function viewProjetos(tab) {
    var isHeroes = tab === 'herois';
    var segmento = '<div class="segment' + (isHeroes ? ' on-2' : '') + '" role="tablist">' +
      '<span class="thumb" aria-hidden="true"></span>' +
      '<button role="tab" data-go="projetos" aria-selected="' + (!isHeroes) + '">Projetos</button>' +
      '<button role="tab" data-go="herois" aria-selected="' + (isHeroes) + '">Heróis</button>' +
      '</div>';
    var head = '<section class="faixa fx-claro topo topo-turma">' +
      '<div class="cont topo-in">' +
      '<div class="topo-txt"><span class="eyebrow">Trilha 2026</span>' +
      '<h1 class="titulo-pag">Conheça quem chegou até aqui</h1>' +
      '<p class="lead">Por trás de cada projeto existem pessoas, escolhas e uma jornada de transformação.</p>' +
      segmento + '</div>' +
      '<div class="topo-arte">' + grupoHerois('turma-topo', 270) + '</div>' +
      '</div></section>';

    var body;
    if (!isHeroes) {
      var list = db.projects.filter(function (p) {
        if (filt.block !== 'todos' && (p.block || '').toLowerCase() !== filt.block) return false;
        if (filt.q) {
          var hay = (p.name + ' ' + (p.category || '') + ' ' + (p.group || '') + ' ' + (p.members || []).join(' ') + ' ' +
            (p.heroes || []).map(function (h) { return h.name; }).join(' ')).toLowerCase();
          if (hay.indexOf(filt.q.toLowerCase()) < 0) return false;
        }
        return true;
      });

      var blocos = {};
      db.projects.forEach(function (p) { if (p.block) blocos[String(p.block).toLowerCase()] = p.block; });
      var nomesBlocos = Object.keys(blocos);
      if (nomesBlocos.length < 2 && filt.block !== 'todos') filt.block = 'todos';
      var chips = nomesBlocos.length < 2 ? '' : [['todos', 'Todos']].concat(nomesBlocos.map(function (k) { return [k, blocos[k]]; }))
        .map(function (f) {
          return '<button class="fchip" data-filter="' + esc(f[0]) + '" aria-pressed="' + (filt.block === f[0]) + '">' + esc(f[1]) + '</button>';
        }).join('');

      var tools = '<div class="ferramentas">' +
        '<div class="busca"><label for="projSearch" class="sr-only">Buscar projeto</label>' +
        ico('i-search') +
        '<input id="projSearch" type="search" placeholder="Buscar projeto, Herói ou trilheiro" value="' + esc(filt.q) + '">' +
        '</div>' +
        (chips ? '<div class="filters">' + chips + '</div>' : '') +
        discoveryBar() +
        '</div>';

      if (!list.length) {
        body = tools + '<div class="empty"><h2 class="h3">Nada encontrado</h2><p>Tente outro termo ou volte para todos os projetos.</p>' +
          '<button class="btn btn-sm btn-outline" style="margin-top:14px" data-filter="todos">Ver todos</button></div>';
      } else {
        var destaqueId = null;
        if (isEventDay()) {
          var mnow = nowMinutes();
          for (var fi = 0; fi < list.length; fi++) {
            var sm = toMin(list[fi].slot);
            if (sm != null && sm + MIN_POR_EQUIPE > mnow) { destaqueId = list[fi].id; break; }
          }
        }
        var indice = '<ol class="indice">' + list.map(function (p) {
          var aoVivoAgora = isEventDay() && toMin(p.slot) != null &&
            nowMinutes() >= toMin(p.slot) && nowMinutes() < toMin(p.slot) + MIN_POR_EQUIPE;
          var eqs = (p.teams || []).length;
          return '<li><button class="ind-item' + (p.id === destaqueId ? ' is-foco' : '') + '" data-go="projeto/' + esc(p.id) + '">' +
            '<span class="ind-hora num">' + (aoVivoAgora ? '<span class="chip-live"><span class="livedot"></span>Agora</span>' : esc(p.slot || '')) + '</span>' +
            '<span class="ind-txt">' +
              '<span class="ind-nome">' + esc(p.name) + '</span>' +
              '<span class="ind-sub">' + esc([p.group ? 'grupo ' + p.group : '', p.category || ''].filter(Boolean).join(' · ')) + '</span>' +
              (eqs > 1 ? '<span class="ind-nota">' + maiuscula(extenso(eqs, true)) + ' equipes, ' + extenso(eqs) + ' projetos integrados numa mesma apresentação</span>' : '') +
            '</span>' +
            '<span class="ind-herois">' + (p.heroes || []).map(function (h) { return quadroHeroi(h, 'quadro-mini', ' aria-hidden="true"'); }).join('') + '</span>' +
            (localState.visited.indexOf(p.id) >= 0 ? '<span class="ind-visto" title="Você já abriu este projeto">' + ico('i-vote') + '</span>' : '<span class="ind-seta" aria-hidden="true">' + ico('i-chev') + '</span>') +
            '</button></li>';
        }).join('') + '</ol>';
        body = tools + indice;
      }
    } else {
      var hs = allHeroes();
      if (!hs.length) {
        body = '<div class="empty"><h2 class="h3">Os Heróis estão chegando</h2><p>Cada grupo construiu um Herói ao longo da Trilha. Os perfis aparecem aqui assim que a organização cadastrá-los no painel.</p></div>';
      } else {
        body = playlistBand() + '<div class="grade-herois">' + hs.map(function (x) {
          return '<button class="cartao-heroi" data-go="heroi/' + esc(x.hero.id) + '">' +
            quadroHeroi(x.hero, 'quadro-cartao') +
            (videoId(x.hero.video) ? '<span class="ct-play" aria-hidden="true">' + ico('i-play') + '</span>' : '') +
            '<span class="ch-nome">' + esc(x.hero.name) + '</span>' +
            '<span class="ch-sub">' + esc((x.project.group ? 'grupo ' + x.project.group + ' · ' : '') + x.project.name) + '</span>' +
            '</button>';
        }).join('') + '</div>';
      }
    }
    return '<div class="view">' + head + '<div class="corpo">' + body + '</div></div>';
  }

  /* ============================ DETALHE PROJETO =========================== */
  function blocoHeroi(h, p) {
    return '<div class="heroi-linha">' +
      '<button class="hl-fig" data-go="heroi/' + esc(h.id) + '" aria-label="Conhecer o Herói ' + esc(h.name) + '">' + quadroHeroi(h, 'quadro-medio', ' aria-hidden="true"') +
      (videoId(h.video) ? '<span class="ct-play" aria-hidden="true">' + ico('i-play') + '</span>' : '') + '</button>' +
      '<div class="hl-cab"><h3 class="hl-nome">' + esc(h.name) + '</h3>' +
      (h.inspiration ? '<p class="hl-insp">' + (/signific/i.test(h.inspiration) ? esc(h.inspiration) : 'Inspirado em ' + esc(h.inspiration)) + '</p>' : '') +
      '</div>' +
      '<div class="hl-corpo">' + (h.story ? nl2p(h.story) : '') +
      '<button class="btn btn-sm btn-outline" data-go="heroi/' + esc(h.id) + '">Conhecer ' + esc(h.name) + ' ' + ico('i-chev') + '</button>' +
      '</div></div>';
  }

  function galeriaEquipe(p) {
    var fs = fotosDoProjeto(p.id);
    if (!fs.length) return '';
    return '<section class="detail-sec fotos-equipe">' + sechead('', 'Fotos da equipe') +
      '<div class="galeria">' + fs.map(function (f, i) {
        return '<figure class="gal-item">' +
          '<button class="gal-btn" data-act="lbOpen" data-lb="prj:' + esc(p.id) + '" data-i="' + i + '" aria-label="Ampliar foto' + (f[2] ? ': ' + esc(f[2]) : '') + '">' +
          imgFoto(f, null, ' loading="lazy"') + '</button>' +
          (f[2] ? '<figcaption>' + esc(f[2]) + '</figcaption>' : '') +
          '</figure>';
      }).join('') + '</div></section>';
  }

  /* blocos recolhíveis da página de projeto: no celular começam fechados
     (só o título e uma prévia); no computador, abertos. O que a pessoa
     abre ou fecha é lembrado enquanto ela navega.                         */
  var sfEstado = {};
  function sfAberta(chave) {
    if (sfEstado[chave] != null) return sfEstado[chave];
    return !!(window.matchMedia && matchMedia('(min-width: 1024px)').matches);
  }
  function previa(txt, lista) {
    var t = String(txt || '').trim();
    if (!t) return '';
    if (lista) {
      var n = t.split(/\n+/).filter(function (x) { return x.trim(); }).length;
      if (n > 1) return n + ' itens';
    }
    t = t.replace(/\s+/g, ' ');
    return t.length > 86 ? t.slice(0, 84).replace(/\s+\S*$/, '') + '…' : t;
  }
  function sanfona(chave, label, corpo, resumo, cls) {
    if (!corpo) return '';
    return '<details class="sanfona ' + (cls || '') + '" data-sf="' + esc(chave) + '"' + (sfAberta(chave) ? ' open' : '') + '>' +
      '<summary><span class="sf-cab"><span class="sf-tit">' + esc(label) + '</span>' +
      (resumo ? '<span class="sf-res">' + esc(resumo) + '</span>' : '') + '</span>' +
      '<span class="sf-ico" aria-hidden="true">' + ico('i-down') + '</span></summary>' +
      '<div class="sf-corpo">' + corpo + '</div></details>';
  }
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.classList && d.classList.contains('sanfona')) sfEstado[d.getAttribute('data-sf')] = d.open;
  }, true);

  function viewProjeto(id) {
    var p = byId(id);
    if (!p) return notFound('Projeto não encontrado', 'projetos', 'Voltar aos projetos');
    if (localState.visited.indexOf(p.id) < 0) { localState.visited.push(p.id); saveLocal(); }

    // textos corridos viram parágrafos; ações e impacto, uma lista
    var sec = function (label, txt, cls, lista) {
      if (!txt) return '';
      return '<section class="detail-sec ' + (cls || '') + '">' + sechead('', label) + (lista ? listaOuTexto(txt) : nl2p(txt)) + '</section>';
    };
    // os demais blocos abrem com um toque
    var bloco = function (k, label, txt, lista) {
      if (!txt) return '';
      return sanfona(p.id + ':' + k, label, lista ? listaOuTexto(txt) : nl2p(txt), previa(txt, lista));
    };
    var equipes = p.teams || [];

    var pessoas;
    if (equipes.length > 1) {
      pessoas = '<section class="detail-sec equipes">' +
        '<p class="small">Cada equipe construiu o seu projeto e o seu Herói. As ' + extenso(equipes.length, true) + ' apresentam juntas na Banca.</p>' +
        '<div class="equipes-grade">' + equipes.map(function (t) {
          var h = (p.heroes || []).filter(function (x) { return x.id === t.hero; })[0];
          return '<article class="equipe">' +
            '<h3 class="equipe-tit">' + esc(t.label) + '</h3>' +
            (h ? blocoHeroi(h, p) : '') +
            '<div class="equipe-dados">' +
            '<div><span class="eyebrow">Trilheiros</span>' + listaNomes(t.members) + '</div>' +
            '<div><span class="eyebrow">Valores</span>' + listaNomes(t.values, 'nomes-valores') + '</div>' +
            '</div></article>';
        }).join('') + '</div></section>';
    } else {
      var heroes = (p.heroes || []).length ? '<section class="detail-sec">' +
        sechead('', p.heroes.length > 1 ? 'Heróis deste projeto' : 'O Herói deste projeto') +
        p.heroes.map(function (h) { return blocoHeroi(h, p); }).join('') + '</section>' : '';
      var grupo = (p.members || []).length ? '<section class="detail-sec">' + sechead('', 'Quem construiu') +
        (p.group ? '<p class="small">Grupo ' + esc(p.group) + '</p>' : '') + listaNomes(p.members) + '</section>' : '';
      var valores = (p.values || []).length ? '<section class="detail-sec">' + sechead('', 'Valores do grupo') +
        listaNomes(p.values, 'nomes-valores') + '</section>' : '';
      pessoas = heroes + grupo + valores;
    }
    var nPessoas = equipes.length > 1
      ? equipes.reduce(function (a, t) { return a + (t.members || []).length; }, 0)
      : (p.members || []).length;
    var tituloPessoas = equipes.length > 1 ? 'As ' + extenso(equipes.length, true) + ' equipes' : 'Herói e trilheiros';
    var resumoPessoas = [
      (p.heroes || []).map(function (h) { return h.name; }).join(' e '),
      nPessoas ? nPessoas + ' trilheiros' : ''
    ].filter(Boolean).join(' · ');
    pessoas = sanfona(p.id + ':pessoas', tituloPessoas, pessoas, resumoPessoas, 'sf-pessoas');

    var gal = (p.gallery && p.gallery.length) ? '<section class="detail-sec">' + sechead('', 'Imagens do projeto') +
      '<div class="galeria">' + p.gallery.map(function (g) {
        return '<figure class="gal-item"><img src="' + esc(g) + '" alt="Imagem do ' + esc(p.name) + '" loading="lazy"></figure>';
      }).join('') + '</div></section>' : '';

    var vid = p.video ? '<section class="detail-sec">' + sechead('', 'Vídeo do projeto') +
      '<p><a href="' + esc(p.video) + '" target="_blank" rel="noopener">Assistir ao vídeo</a></p></section>' : '';

    var voteCta = (votacaoAberta() && !localState.voted && !votoEmHerois() && p.eligible !== false)
      ? '<button class="btn btn-primary btn-block btn-lg" data-nav="votacao">Votar neste momento</button>' : '';

    var ficha = '<dl class="ficha">' +
      (p.slot ? '<div><dt>Apresenta às</dt><dd class="num">' + esc(p.slot) + '</dd></div>' : '') +
      (p.block ? '<div><dt>Bloco</dt><dd>' + esc(p.block) + '</dd></div>' : '') +
      (p.group ? '<div><dt>Grupo</dt><dd>' + esc(p.group) + '</dd></div>' : '') +
      (equipes.length > 1 ? '<div><dt>Equipes</dt><dd>' + equipes.length + '</dd></div>' : '') +
      ((p.members || []).length ? '<div><dt>Trilheiros</dt><dd class="num">' + p.members.length + '</dd></div>' : '') +
      '</dl>';

    var idx = db.projects.indexOf(p);
    var prev = db.projects[(idx - 1 + db.projects.length) % db.projects.length];
    var next = db.projects[(idx + 1) % db.projects.length];
    var nav = db.projects.length > 1 ? '<nav class="pagenav">' +
      '<button data-go="projeto/' + esc(prev.id) + '"><span class="k">← Anterior</span><span class="v">' + esc(prev.name) + '</span></button>' +
      '<button data-go="projeto/' + esc(next.id) + '"><span class="k">Próximo →</span><span class="v">' + esc(next.name) + '</span></button>' +
      '</nav>' : '';

    var meta = [p.slot ? 'Apresenta às ' + p.slot : '', p.block, p.category].filter(Boolean).map(esc).join(' · ');
    var hs = (p.heroes || []).filter(function (h) { return h.image; });
    var figs = hs.length ? '<div class="det-figs n' + hs.length + '">' + hs.map(function (h) {
      return '<img src="' + esc(h.image) + '" alt="Ilustração do Herói ' + esc(h.name) + '">';
    }).join('') + '</div>' : '';

    return '<div class="view detalhe">' +
      '<section class="faixa fx-tint det-topo">' +
        '<div class="cont det-topo-in">' +
          '<div class="det-txt">' +
            '<button class="voltar" data-go="projetos">' + ico('i-arrow-left') + 'Projetos</button>' +
            (meta ? '<p class="det-meta">' + meta + '</p>' : '') +
            '<h1 class="titulo-pag">' + esc(p.name) + '</h1>' +
            (p.tagline ? '<p class="lead">' + esc(p.tagline) + '</p>' : '') +
          '</div>' +
          figs +
        '</div>' +
      '</section>' +
      '<div class="corpo duas-colunas">' +
        '<div class="detalhe-texto">' +
          (!hasStory(p) ? '<div class="empty"><h2 class="h3">Conteúdo a caminho</h2>' +
            '<p>Os trilheiros ainda estão preparando a apresentação deste projeto. Volte aqui no dia para conhecer a ideia por inteiro.</p></div>' : '') +
          sec('Significado', p.meaning, 'sec-significado') +
          '<div class="sanfonas">' +
          (hasStory(p) ? '<div class="sf-topo"><span class="eyebrow">O projeto por partes</span>' +
            '<button type="button" class="sf-tudo" data-act="sfTudo" data-p="' + esc(p.id) + '">' + (sfAberta(p.id + ':problema') ? 'Fechar tudo' : 'Abrir tudo') + '</button></div>' : '') +
          (equipes.length > 1 ? bloco('integracao', 'Integração dos projetos', p.integration) : '') +
          bloco('problema', 'O problema identificado', p.problem) +
          bloco('porque', 'Por que esse problema importa', p.why) +
          bloco('solucao', 'A solução proposta', p.solution) +
          bloco('como', 'Como funciona', p.how, true) +
          bloco('impacto', 'O impacto que pretende gerar', p.impact, true) +
          pessoas +
          '</div>' +
          galeriaEquipe(p) + gal + vid +
          voteCta + nav +
        '</div>' +
        '<aside class="lateral">' +
          '<div class="painelinho">' +
            '<span class="eyebrow">Ficha do projeto</span>' + ficha +
            '<button class="btn btn-sm btn-outline btn-block" data-go="projetos">Voltar aos projetos</button>' +
          '</div>' +
          '<div class="painelinho">' + discoveryBar() + '</div>' +
        '</aside>' +
      '</div>' +
      '</div>';
  }

  /* ============================= DETALHE HERÓI ============================ */
  function playlistBand() {
    var url = playlistUrl();
    if (!url) return '';
    var n = allHeroes().filter(function (x) { return videoId(x.hero.video); }).length;
    return '<a class="plband" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="pb-ic" aria-hidden="true">' + ico('i-play') + '</span>' +
      '<span class="grow"><b>Campanha do Herói · 2026</b>' +
      '<small>' + (n ? 'Assista às campanhas ' + (n === 1 ? 'do Herói' : 'dos Heróis') + ' — ou veja a playlist inteira no canal do Instituto.' : 'Veja a playlist no canal do Instituto.') + '</small></span>' +
      '<span class="pb-go" aria-hidden="true">' + ico('i-chev') + '</span></a>';
  }

  function heroVideoBlock(h) {
    var id = videoId(h.video);
    if (!id) return '';
    return '<section class="detail-sec">' + sechead('', 'A campanha do Herói') +
      '<button class="vidposter" data-act="playVideo" data-v="' + esc(id) + '" data-t="' + esc(h.name) + '" ' +
      'aria-label="Assistir à campanha do Herói ' + esc(h.name) + '">' +
      '<span class="vp-art" aria-hidden="true">' +
      (h.image ? '<img src="' + esc(h.image) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="vp-play" aria-hidden="true">' + ico('i-play') + '</span>' +
      '<span class="vp-text"><span class="vp-k">Assista</span>' +
      '<span class="vp-n">A campanha de ' + esc(h.name) + '</span>' +
      '<span class="vp-s">Vídeo no canal do Instituto</span></span>' +
      '</button></section>';
  }

  function viewHeroi(id) {
    var x = heroById(id);
    if (!x) return notFound('Herói não encontrado', 'herois', 'Voltar aos Heróis');
    var h = x.hero, p = x.project;
    var eq = equipeDoHeroi(p, h.id);
    var membros = eq ? eq.members : (p.members || []);
    var valores = eq ? eq.values : (p.values || []);

    var list = allHeroes();
    var hidx = 0;
    list.forEach(function (y, n) { if (y.hero.id === h.id) hidx = n; });
    var hprev = list[(hidx - 1 + list.length) % list.length];
    var hnext = list[(hidx + 1) % list.length];
    var hnav = list.length > 1 ? '<nav class="pagenav">' +
      '<button data-go="heroi/' + esc(hprev.hero.id) + '"><span class="k">← Anterior</span><span class="v">' + esc(hprev.hero.name) + '</span></button>' +
      '<button data-go="heroi/' + esc(hnext.hero.id) + '"><span class="k">Próximo →</span><span class="v">' + esc(hnext.hero.name) + '</span></button>' +
      '</nav>' : '';

    var insp = h.inspiration || '';

    return '<div class="view detalhe">' +
      '<section class="faixa fx-tint det-topo det-heroi">' +
        '<div class="cont det-topo-in">' +
          '<div class="det-txt">' +
            '<button class="voltar" data-go="herois">' + ico('i-arrow-left') + 'Heróis</button>' +
            '<p class="det-meta">' + esc(eq ? (p.group ? 'Grupo ' + p.group + ' · ' : '') + eq.label : (p.group ? 'Grupo ' + p.group : 'Herói da Trilha')) + '</p>' +
            '<h1 class="titulo-pag">' + esc(h.name) + '</h1>' +
            (insp ? '<p class="lead">' + (/signific/i.test(insp) ? esc(insp) : 'Inspirado em ' + esc(insp)) + '</p>' : '') +
            '<p class="det-nota num">Herói ' + (hidx + 1) + ' de ' + list.length + '</p>' +
            (ehCandidato(h) ? '<p class="det-candidato">' + ico('i-vote') + ' Candidato na votação do público</p>' : '') +
          '</div>' +
          '<div class="det-figs n1">' +
            (h.image ? '<img src="' + esc(h.image) + '" alt="Ilustração do Herói ' + esc(h.name) + '">' : '') +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="corpo duas-colunas">' +
        '<div class="detalhe-texto">' +
          ((ehCandidato(h) && h.campanha) ? '<p class="campanha-nota">' + esc(h.campanha) + '</p>' : '') +
          heroVideoBlock(h) +
          ((ehCandidato(h) && votacaoAberta() && !localState.voted)
            ? '<button class="btn btn-laranja btn-block btn-lg" data-nav="votacao">' + ico('i-vote') + ' Votar agora</button>' : '') +
          (h.story ? '<section class="detail-sec">' + sechead('', 'A história') + nl2p(h.story) + '</section>' : '') +
          (valores.length ? '<section class="detail-sec">' + sechead('', eq ? 'Valores da equipe' : 'Valores do grupo') + listaNomes(valores, 'nomes-valores') + '</section>' : '') +
          (membros.length ? '<section class="detail-sec">' + sechead('', 'Trilheiros' + (eq ? ' · ' + eq.label.toLowerCase() : (p.group ? ' · grupo ' + p.group : ''))) +
            listaNomes(membros) + '</section>' : '') +
          hnav +
        '</div>' +
        '<aside class="lateral">' +
          '<div class="painelinho">' +
            '<span class="eyebrow">O projeto deste Herói</span>' +
            '<button class="card-projeto" data-go="projeto/' + esc(p.id) + '">' +
            '<span class="h3">' + esc(p.name) + '</span>' +
            (p.tagline ? '<span class="small">' + esc(p.tagline) + '</span>' : '') +
            '<span class="card-go">Conhecer o projeto ' + ico('i-chev') + '</span></button>' +
            '<button class="btn btn-sm btn-outline btn-block" data-go="herois">Voltar aos Heróis</button>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '</div>';
  }

  function notFound(title, dest, label) {
    return '<div class="view"><div class="corpo"><div class="empty"><h2 class="h3">' + esc(title) + '</h2>' +
      '<p>O conteúdo pode ter sido removido pela organização.</p>' +
      '<button class="btn btn-outline" data-go="' + esc(dest) + '">' + esc(label) + '</button></div></div></div>';
  }

  /* ========================= POR QUE TRILHEI? ============================ */
  function viewTrilhei() {
    var t = db.trilhei;
    if (!t) return notFound('Página não encontrada', 'home', 'Voltar ao início');

    var blocos = (t.blocos || []).map(function (b) {
      if (b.tipo === 'escuro') {
        return '<section class="faixa fx-escuro tr-escuro">' + sementesNoAr(4) +
          '<div class="cont tr-in">' +
          '<div class="tr-txt">' +
          '<h2 class="titulo titulo-kv">' + tituloKV(b.title, 4) + '</h2>' +
          nl2p(b.texto) +
          '</div>' +
          tracoMao('creme', 'tr-mao') +
          '</div></section>';
      }
      if (b.tipo === 'arvore') {
        return '<section class="faixa fx-branco tr-arvore">' +
          arvoreFundo() +
          '<div class="cont tr-centro">' +
          '<h2 class="titulo titulo-grande">' + esc(b.title) + '</h2>' +
          '<p class="lead">' + esc(b.texto) + '</p></div>' +
          '</section>';
      }
      var itens = (b.itens || []).map(function (it) {
        return '<li><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></li>';
      }).join('');
      return '<section class="faixa fx-laranja tr-conceito">' +
        '<div class="cont tr-in">' +
        '<div class="tr-txt">' +
        '<span class="eyebrow">' + esc(b.eyebrow || '') + '</span>' +
        '<h2 class="titulo">' + esc(b.title) + '</h2>' +
        '</div>' +
        '<ul class="tr-lista">' + itens + '</ul>' +
        '</div></section>';
    }).join('');

    return '<div class="view tr-page">' +
      '<section class="faixa fx-claro tr-abre">' +
        '<span class="tr-dente" aria-hidden="true"><img src="img/kv/dente.svg" alt=""></span>' +
        '<div class="cont tr-abre-in">' +
          '<div class="tr-abre-txt">' +
            '<span class="eyebrow">' + esc(t.eyebrow || 'De sementes a raízes') + '</span>' +
            '<h1 class="titulo-pag">' + esc(t.title) + '</h1>' +
            (t.lead ? '<p class="lead">' + esc(t.lead) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +
      blocos +
      '<section class="faixa fx-claro tr-lema">' + palavraFundo('Trilhei') + '<div class="cont tr-fim">' +
      (t.lema ? '<p class="tr-lema-txt">“' + esc(t.lema) + '”</p>' : '') +
      '<button class="btn btn-primary btn-lg" data-nav="projetos">Conhecer os projetos e os Heróis ' + ico('i-chev') + '</button>' +
      '</div></section>' +
      idlFooter() +
      '</div>';
  }

  /* ============================ TRILHA EM 2026 ============================ */
  var filtFotos = 'todas';   // 'todas' · 'geral' · id de um projeto
  function fotosDaAba() {
    if (filtFotos === 'geral') return fotosGerais();
    if (filtFotos !== 'todas') return fotosDoProjeto(filtFotos);
    return fotosDoSite();
  }

  function viewRetro() {
    var r = db.retro || { photos: [] };
    var todas = fotosDoSite();
    if (!todas.length) {
      return '<div class="view">' + faixaTopo('escuro', 'Instituto Dente de Leão · IDL Tech', r.title || 'A Trilha em 2026', r.lead || '', '', '') +
        '<div class="corpo"><div class="empty"><h2 class="h3">Retrospectiva em preparação</h2>' +
        '<p>As fotos do ano aparecem aqui assim que forem cadastradas no painel.</p></div></div></div>';
    }
    // o filtro some se o projeto escolhido ficou sem fotos
    if (filtFotos !== 'todas' && filtFotos !== 'geral' && !fotosDoProjeto(filtFotos).length) filtFotos = 'todas';
    var ph = fotosDaAba();

    var comFotos = db.projects.filter(function (p) { return fotosDoProjeto(p.id).length; });
    var filtro = comFotos.length ? '<div class="fotos-filtro field">' +
      '<label for="filtroFotos">Mostrar</label>' +
      '<select id="filtroFotos" data-act="filtroFotos">' +
      '<option value="todas"' + (filtFotos === 'todas' ? ' selected' : '') + '>Todas as fotos (' + todas.length + ')</option>' +
      (fotosGerais().length ? '<option value="geral"' + (filtFotos === 'geral' ? ' selected' : '') + '>A Trilha ao longo do ano (' + fotosGerais().length + ')</option>' : '') +
      comFotos.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (filtFotos === p.id ? ' selected' : '') + '>' + esc(p.name) + ' (' + fotosDoProjeto(p.id).length + ')</option>';
      }).join('') +
      '</select></div>' : '';

    var tiles = ph.map(function (p, i) {
      var proj = p[5] ? byId(p[5]) : null;
      return '<button class="mtile' + (p[1] === 2 ? ' larga' : '') + '" data-act="lbOpen" data-lb="aba" data-i="' + i + '" aria-label="Ampliar foto' +
        (p[2] ? ': ' + esc(p[2]) : '') + (proj ? ', projeto ' + esc(proj.name) : '') + '">' +
        imgFoto(p, null, ' loading="lazy"') +
        (proj ? '<span class="mt-proj">' + esc(proj.name) + '</span>' : '') +
        '</button>';
    }).join('');

    var capa = fotoCapa(todas);
    return '<div class="view">' +
      '<section class="faixa fx-escuro retro-topo">' +
        (capa ? '<span class="retro-foto" aria-hidden="true">' + imgFoto(capa, '') + '</span>' : '') +
        '<div class="cont retro-in">' +
          '<button class="voltar" data-go="home">' + ico('i-arrow-left') + 'Início</button>' +
          '<span class="eyebrow">Instituto Dente de Leão · IDL Tech</span>' +
          '<h1 class="titulo-pag">' + esc(r.title || 'A Trilha em 2026') + '</h1>' +
          (r.lead ? '<p class="lead">' + esc(r.lead) + '</p>' : '') +
          '<p class="topo-nota num">' + todas.length + ' fotos do ano' + (comFotos.length ? ', com as das equipes' : '') + '</p>' +
        '</div>' +
      '</section>' +

      '<section class="faixa fx-claro home-nums">' +
        '<div class="cont nums-in">' +
        '<div class="numgrid">' +
          '<div class="numitem"><span class="nv num" data-count="' + nProjetos() + '">0</span><span class="nk">projetos</span></div>' +
          '<div class="numitem"><span class="nv num" data-count="' + nTrilheiros() + '">0</span><span class="nk">trilheiros</span></div>' +
          '<div class="numitem"><span class="nv num" data-count="' + nHerois() + '">0</span><span class="nk">Heróis</span></div>' +
        '</div>' +
        '<div class="nums-lado"><p class="numlegenda">Um ano de rodas de conversa, visitas, ensaios e ideias que mudaram de forma pelo caminho.</p></div>' +
        '</div>' +
      '</section>' +

      '<section class="faixa fx-branco retro-mosaico">' +
        '<div class="cont">' +
        '<div class="bloco-cab bloco-cab-lado"><div><span class="eyebrow">O ano inteiro</span>' +
        '<h2 class="titulo">A Trilha, foto a foto</h2></div>' + filtro + '</div>' +
        (comFotos.length ? '<p class="small fotos-expl">As fotos com o nome de um projeto foram enviadas pelas equipes e também aparecem na página de cada projeto.</p>' : '') +
        '<div class="mosaico">' + tiles + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="faixa fx-escuro retro-fim">' + sementesNoAr(4) + '<div class="cont voto-in">' +
        '<span class="eyebrow">' + esc(db.event.dateLabel || '') + '</span>' +
        '<h2 class="titulo">Tudo isso chega à Banca Final</h2>' +
        '<p class="lead">Conheça os projetos e os Heróis construídos ao longo do ano.</p>' +
        '<button class="btn btn-lg btn-claro" data-go="projetos">Conhecer os projetos ' + ico('i-chev') + '</button>' +
      '</div></section>' +
      idlFooter() +
      '</div>';
  }

  /* ============================ BANCO DE VOTOS ============================ */
  var BE = (window.IDL_BACKEND || {});
  var remote = { on: !!(BE.url && BE.anonKey), rodada: 0, visivel: false, aberta: false, resultadoPublico: false, exigeChave: false, totalTrilheiros: 0, carregou: false, erro: '' };
  var adminRes = { carregando: false, dados: null, erro: '' };
  var pubRes = { carregando: false, dados: null, erro: '', pediu: false };

  function sbUrl(path) { return String(BE.url || '').replace(/\/+$/, '') + path; }
  function sbHeaders() {
    return {
      'apikey': BE.anonKey,
      'Authorization': 'Bearer ' + BE.anonKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
  function sbRpc(fn, args) {
    if (!remote.on) return Promise.reject(new Error('sem backend'));
    return fetch(sbUrl('/rest/v1/rpc/' + fn), {
      method: 'POST', headers: sbHeaders(), body: JSON.stringify(args || {})
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (j) {
      // a senha guardada neste aparelho não vale mais (foi trocada no banco):
      // sai do painel e pede a senha de novo, em vez de falhar em silêncio
      if (j && j.erro === 'chave_invalida' && localState.admin) {
        localState.admin = false; localState.adminKey = ''; saveLocal();
        login.erro = 'A senha do painel mudou. Entre de novo com a senha atual.';
        setTimeout(function () { go('admin'); render(); }, 0);
      }
      return j;
    });
  }
  function sbEstado() {
    if (!remote.on) return Promise.reject(new Error('sem backend'));
    // select=* para não quebrar se o banco ainda estiver na versão anterior do supabase.sql
    return fetch(sbUrl('/rest/v1/estado_votacao?select=*'), { headers: sbHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (rows) { return rows && rows[0] ? rows[0] : null; });
  }

  function syncEstado(then) {
    if (!remote.on) return;
    sbEstado().then(function (row) {
      if (!row) return;
      var total = parseInt(row.total_trilheiros, 10) > 0 ? parseInt(row.total_trilheiros, 10) : 0;
      var mudou = (remote.aberta !== row.votacao_aberta) || (remote.resultadoPublico !== row.resultado_publico) ||
                  (remote.exigeChave !== !!row.exige_chave) || (remote.totalTrilheiros !== total) || !remote.carregou;
      if (remote.resultadoPublico !== !!row.resultado_publico) { pubRes.dados = null; pubRes.erro = ''; pubRes.pediu = false; }
      if (remote.visivel !== !!row.votacao_visivel) mudou = true;
      remote.visivel = !!row.votacao_visivel;
      remote.aberta = !!row.votacao_aberta;
      remote.resultadoPublico = !!row.resultado_publico;
      remote.exigeChave = !!row.exige_chave;
      remote.totalTrilheiros = total;
      // votos zerados pela organização: este aparelho pode votar de novo
      var rod = parseInt(row.rodada, 10) || 0;
      if (rod && rod !== remote.rodada) {
        remote.rodada = rod;
        if (localState.rodada && localState.rodada !== rod && localState.voted) {
          localState.voted = null;
          flow.picked = null; flow.error = ''; flow.busy = false;
          toast('A votação foi reiniciada pela organização. Você pode votar de novo.');
          mudou = true;
        }
        if (localState.rodada !== rod) { localState.rodada = rod; saveLocal(); }
      }
      remote.carregou = true; remote.erro = '';
      if (mudou && then !== false) render();
    }).catch(function () { remote.erro = 'offline'; });
  }

  function syncMeuVoto() {
    if (!remote.on || !localState.hash) return;
    sbRpc('consultar_voto', { p_hash: localState.hash }).then(function (r) {
      if (r && r.votou && !localState.voted) {
        // o banco confirma que este CPF já votou; em quem, só o próprio
        // aparelho que votou sabe — o servidor não revela isso a ninguém.
        localState.voted = { projectId: null };
        saveLocal(); render();
      }
    }).catch(function () {});
  }


  /* =========================== CONTEÚDO NA NUVEM ==========================
     Com o banco ligado, o que a organização edita no painel (evento,
     programação, projetos, Heróis, textos) é publicado na tabela
     public.conteudo e vale para todo mundo. Os aparelhos conferem a cada
     30 segundos se há versão nova (consulta leve: só o número da versão) e
     só então baixam o conteúdo. Enquanto o banco não tiver conteúdo salvo,
     vale o data.js. O relógio de ensaio continua sendo só do aparelho.     */
  var conteudo = { versao: null, timer: null, enviando: false };

  function aplicarConteudo(dados, versao) {
    var clock = db && db.clock;
    var voting = db && db.voting;
    db = dados;
    db.clock = clock || demoData().clock;
    if (!db.voting) db.voting = voting || demoData().voting;
    db._versaoNuvem = versao;
    conteudo.versao = versao;
    safeSet(KEY, JSON.stringify(db));
    render();
  }

  function syncConteudo() {
    if (!remote.on) return Promise.resolve();
    // não troca o conteúdo debaixo de quem está editando ou enviando
    if (admin.editor || conteudo.timer || conteudo.enviando) return Promise.resolve();
    if (conteudo.versao == null && db && db._versaoNuvem != null) conteudo.versao = db._versaoNuvem;
    return fetch(sbUrl('/rest/v1/conteudo?select=versao&id=eq.1'), { headers: sbHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (rows) {
        var v = rows && rows[0] ? rows[0].versao : null;
        if (v == null || v === conteudo.versao) return;
        return fetch(sbUrl('/rest/v1/conteudo?select=versao,dados&id=eq.1'), { headers: sbHeaders() })
          .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
          .then(function (rows2) {
            var row = rows2 && rows2[0];
            if (!row || !row.dados || !row.dados.event) return;
            if (admin.editor || conteudo.timer || conteudo.enviando) return;
            aplicarConteudo(row.dados, row.versao);
          });
      })
      .catch(function () { /* sem conexão: segue com o que já está no aparelho */ });
  }

  // publica o conteúdo do painel para todo mundo (agrupa edições seguidas)
  function enviarConteudo() {
    if (!remote.on || !localState.admin || !localState.adminKey) return;
    clearTimeout(conteudo.timer);
    conteudo.timer = setTimeout(function () {
      conteudo.timer = null;
      conteudo.enviando = true;
      var dados = JSON.parse(JSON.stringify(db));
      delete dados.clock; delete dados._versaoNuvem;
      sbRpc('salvar_conteudo', { p_chave: localState.adminKey, p_dados: dados }).then(function (r) {
        conteudo.enviando = false;
        if (r && r.ok) {
          conteudo.versao = r.versao; db._versaoNuvem = r.versao;
          safeSet(KEY, JSON.stringify(db));
          toast('Publicado para todo mundo.');
          return;
        }
        var cod = r && r.erro;
        toast(cod === 'chave_invalida' ? 'Salvei neste aparelho, mas a senha não confere com a do banco. Saia do painel e entre de novo.'
          : cod === 'conteudo_grande_demais' ? 'Salvei neste aparelho, mas o conteúdo ficou grande demais para publicar. Use a aba Trilha 2026 para fotos.'
          : 'Salvei neste aparelho, mas não consegui publicar. Tente salvar de novo.');
      }).catch(function (e) {
        conteudo.enviando = false;
        var m = String(e && e.message || '');
        // 404: a função salvar_conteudo não existe no banco (supabase.sql antigo)
        toast(m === 'http 404' ? 'Salvei neste aparelho, mas o banco ainda não tem a função de publicar. Rode o supabase.sql mais recente no Supabase.'
          : /^http /.test(m) ? 'Salvei neste aparelho, mas o banco recusou (' + m + '). Rode o supabase.sql mais recente e tente de novo.'
          : 'Salvei neste aparelho, mas não chegou ao banco. Confira a internet e salve de novo.');
      });
    }, 900);
  }

  /* ============================ FOTOS NA NUVEM ============================
     Sem banco ligado: as fotos ficam em db.retro.photos, neste aparelho.
     Com banco: vêm da tabela public.fotos e valem para todo mundo — quem
     está no painel acrescenta, tira e reordena, e o site inteiro atualiza.
     O conteúdo das fotos enviadas chega uma a uma, só quando a tela precisa,
     e fica na memória (nunca no armazenamento local do aparelho).          */
  var nuvem = { carregou: false, lista: [], dados: {}, pedindo: {}, erro: '', assinatura: '' };
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  function usaNuvem() { return remote.on && nuvem.carregou; }

  function syncFotos() {
    if (!remote.on) return Promise.resolve();
    // select=* traz também o projeto_id (fotos das equipes) sem quebrar um banco antigo
    var q = '/rest/v1/fotos_lista?select=*&order=ordem.asc,criado_em.asc';
    return fetch(sbUrl(q), { headers: sbHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (rows) {
        var ass = JSON.stringify(rows || []);
        var mudou = ass !== nuvem.assinatura || !nuvem.carregou;
        nuvem.lista = rows || []; nuvem.carregou = true; nuvem.erro = ''; nuvem.assinatura = ass;
        if (mudou) render();
      })
      .catch(function () { nuvem.erro = 'offline'; });
  }

  function pedirDado(id) {
    if (!id || nuvem.dados[id] || nuvem.pedindo[id]) return;
    nuvem.pedindo[id] = true;
    fetch(sbUrl('/rest/v1/fotos?select=dado&id=eq.' + encodeURIComponent(id)), { headers: sbHeaders() })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var d = rows && rows[0] && rows[0].dado;
        if (!d) return;
        nuvem.dados[id] = d;
        Array.prototype.forEach.call(document.querySelectorAll('img[data-foto="' + id + '"]'), function (img) {
          img.src = d; img.classList.remove('foto-carregando');
        });
      })
      .catch(function () {})
      .then(function () { delete nuvem.pedindo[id]; });
  }

  /* cada foto: [endereço, largura (1 ou 2), descrição, id, é capa, projeto]
     O projeto fica vazio nas fotos gerais da Trilha; nas fotos das equipes,
     guarda o id do projeto. A aba Fotos mostra as gerais primeiro, na ordem
     escolhida no painel, e depois as das equipes, na ordem dos projetos.   */
  function todasAsFotos() {
    if (usaNuvem()) {
      return nuvem.lista.map(function (f) {
        return [f.src || nuvem.dados[f.id] || '', f.larga ? 2 : 1, f.legenda || '', f.id, !!f.capa, f.projeto_id || ''];
      });
    }
    return (db.retro && db.retro.photos) || [];
  }
  function fotosDoSite() {
    var todas = todasAsFotos();
    var ordem = {};
    db.projects.forEach(function (p, i) { ordem[p.id] = i + 1; });
    var gerais = todas.filter(function (f) { return !f[5]; });
    var deEquipe = todas.filter(function (f) { return f[5] && ordem[f[5]]; });
    // ordenação estável: projeto a projeto, mantendo a ordem de cada um
    deEquipe = deEquipe.map(function (f, i) { return [f, i]; }).sort(function (a, b) {
      return (ordem[a[0][5]] - ordem[b[0][5]]) || (a[1] - b[1]);
    }).map(function (x) { return x[0]; });
    return gerais.concat(deEquipe);
  }
  function fotosGerais() { return todasAsFotos().filter(function (f) { return !f[5]; }); }
  function fotosDoProjeto(pid) { return todasAsFotos().filter(function (f) { return f[5] === pid; }); }
  // escopo: 'geral' (a Trilha) ou o id de um projeto
  function fotosDoEscopo(escopo) { return escopo === 'geral' ? fotosGerais() : fotosDoProjeto(escopo); }

  function imgFoto(p, alt, extra) {
    if (!p) return '';
    var src = p[0], id = p[3];
    if (!src && id) pedirDado(id);
    return '<img src="' + esc(src || PIXEL) + '"' +
      (id ? ' data-foto="' + esc(id) + '"' : '') +
      (src ? '' : ' class="foto-carregando"') +
      ' alt="' + esc(alt == null ? (p[2] || '') : alt) + '"' + (extra || '') + '>';
  }

  // a foto que abre a aba Fotos
  function fotoCapa(ph) {
    ph = (ph || []).filter(function (p) { return !p[5]; });
    if (!ph.length) return null;
    if (usaNuvem()) {
      var c = ph.filter(function (p) { return p[4]; })[0];
      if (c) return c;
    } else {
      var r = db.retro || {};
      if (r.capa) {
        var achou = ph.filter(function (p) { return p[0] === r.capa; })[0];
        if (achou) return achou;
      }
    }
    return ph.filter(function (p) { return p[1] === 2; })[0] || ph[0];
  }

  function erroFoto(cod) {
    if (cod === 'chave_invalida') return 'A senha deste aparelho não confere com a do banco. Saia do painel e entre de novo.';
    if (cod === 'foto_grande_demais') return 'Essa foto ficou grande demais mesmo depois de reduzida. Tente outra.';
    if (cod === 'endereco_invalido') return 'Use um link que comece com https://';
    if (cod === 'formato_invalido' || cod === 'sem_imagem') return 'Não consegui ler essa imagem.';
    return 'Não deu certo agora. Confira a internet e tente de novo.';
  }

  // chama uma função de fotos no banco com a senha do painel e atualiza o site
  function rpcFoto(fn, args) {
    args = args || {};
    args.p_chave = localState.adminKey || '';
    return sbRpc(fn, args).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
      return r;
    });
  }
  function depoisDeFoto(msg) {
    return syncFotos().then(function () { if (msg) toast(msg); render(); });
  }

  function votacaoAberta() { return remote.on ? remote.aberta : localState.unlocked; }

  /* ================================ VOTAÇÃO =============================== */
  // projetos que participam da votação (usado só se nenhum Herói for candidato)
  function eligibleProjects() {
    return db.projects.filter(function (p) { return p.eligible !== false; });
  }

  /* A votação do dia é dos Heróis: os candidatos cujas campanhas passam
     antes das apresentações. Com o banco ligado, quem manda na lista é o
     banco (tabela public.projetos, coluna elegivel); sem ele, vale o
     marcador "candidato" de cada Herói.                                   */
  var opcoesBanco = { carregou: false, ids: [] };
  function syncOpcoes() {
    if (!remote.on) return;
    fetch(sbUrl('/rest/v1/projetos?select=id,elegivel'), { headers: sbHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (rows) {
        var ids = (rows || []).filter(function (r) { return r.elegivel; }).map(function (r) { return r.id; });
        var mudou = !opcoesBanco.carregou || ids.join() !== opcoesBanco.ids.join();
        opcoesBanco = { carregou: true, ids: ids };
        if (mudou) render();
      })
      .catch(function () {});
  }
  function ehCandidato(h) {
    if (remote.on && opcoesBanco.carregou) return opcoesBanco.ids.indexOf(h.id) >= 0;
    return !!h.candidato;
  }
  function candidatos() {
    return allHeroes().filter(function (x) { return ehCandidato(x.hero); }).map(function (x) {
      return {
        id: x.hero.id, tipo: 'heroi', name: x.hero.name, image: x.hero.image, contain: true,
        video: x.hero.video, campanha: x.hero.campanha || '',
        sub: (x.project.group ? 'grupo ' + x.project.group + ' · ' : '') + x.project.name,
        go: 'heroi/' + x.hero.id
      };
    });
  }
  function votoEmHerois() {
    if (remote.on && opcoesBanco.carregou) {
      return opcoesBanco.ids.some(function (id) { return /^her_/.test(id); });
    }
    return allHeroes().some(function (x) { return x.hero.candidato; });
  }
  function opcoesDeVoto() {
    if (votoEmHerois()) return candidatos();
    return eligibleProjects().map(function (p) {
      var im = projectImage(p);
      return { id: p.id, tipo: 'projeto', name: p.name, image: im.src, contain: im.contain,
        video: '', campanha: '', sub: p.tagline || (p.slot ? 'Apresenta às ' + p.slot : ''), go: 'projeto/' + p.id };
    });
  }
  function opcaoPorId(id) {
    var achou = opcoesDeVoto().filter(function (o) { return o.id === id; })[0];
    if (achou) return achou;
    var x = heroById(id);
    if (x) return { id: id, tipo: 'heroi', name: x.hero.name, image: x.hero.image, sub: x.project.name, go: 'heroi/' + id };
    var p = byId(id);
    return p ? { id: id, tipo: 'projeto', name: p.name, image: projectImage(p).src, sub: p.tagline || '', go: 'projeto/' + id } : null;
  }
  // como chamar o que se vota, no texto da tela
  function nomeDoVoto(plural) {
    return votoEmHerois() ? (plural ? 'Heróis' : 'Herói') : (plural ? 'projetos' : 'projeto');
  }
  // apuração da prévia (vale só neste aparelho; no app publicado quem conta é o banco)
  function tally() {
    var t = {}, res = (db.voting && db.voting.results) || {};
    opcoesDeVoto().forEach(function (o) { t[o.id] = +res[o.id] || 0; });
    if (localState.voted && localState.voted.projectId) {
      t[localState.voted.projectId] = (t[localState.voted.projectId] || 0) + 1;
    }
    return t;
  }

  var flow = { picked: null, error: '', busy: false, palavra: '' };

  function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
  function validCPF(raw) {
    var c = onlyDigits(raw);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    var i, s = 0;
    for (i = 0; i < 9; i++) s += (+c[i]) * (10 - i);
    var d1 = (s * 10) % 11; if (d1 === 10) d1 = 0;
    if (d1 !== +c[9]) return false;
    s = 0; for (i = 0; i < 10; i++) s += (+c[i]) * (11 - i);
    var d2 = (s * 10) % 11; if (d2 === 10) d2 = 0;
    return d2 === +c[10];
  }
  function maskCPF(v) {
    var c = onlyDigits(v).slice(0, 11), o = '';
    for (var i = 0; i < c.length; i++) {
      if (i === 3 || i === 6) o += '.';
      if (i === 9) o += '-';
      o += c[i];
    }
    return o;
  }
  function pad2h(b) { return (b < 16 ? '0' : '') + b.toString(16); }
  function sha256(text) {
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), pad2h).join('');
      });
    }
    var h = 0; for (var i = 0; i < text.length; i++) { h = (h * 31 + text.charCodeAt(i)) >>> 0; }
    return Promise.resolve(('00000000' + h.toString(16)).slice(-8) + 'semcrypto');
  }
  // O CPF vira um código irreversível. O número nunca sai do aparelho.
  function makeCode(hex) {
    var t = String(hex).replace(/[^0-9a-f]/gi, '').toUpperCase();
    while (t.length < 10) t += '0';
    return t.slice(0, 5) + '-' + t.slice(5, 10);
  }

  var ERROS = {
    votacao_fechada: 'A votação não está aberta neste momento.',
    ja_votou: 'Seu voto já foi registrado. Obrigado por participar.',
    projeto_invalido: 'Essa opção não está participando da votação.',
    identificacao_invalida: 'Não consegui confirmar sua identificação. Informe o CPF de novo.',
    palavra_invalida: 'Palavra-chave incorreta. Confira o que foi anunciado no palco.',
    chave_invalida: 'Chave de administrador incorreta.'
  };

  function viewVotacao() {
    /* ---------- já votou ---------- */
    if (localState.voted) {
      var vp = localState.voted.projectId ? opcaoPorId(localState.voted.projectId) : null;
      return '<div class="view view-faixa">' +
        faixaTopo('escuro', 'Votação', 'Seu voto está registrado',
          'Obrigado por fazer parte deste momento. Cada voto é único e anônimo.', '', '') +
        '<div class="corpo"><div class="painel-centro">' +
        (vp ? '<div class="painelinho painelinho-destaque">' +
          '<span class="eyebrow">Seu voto foi para</span>' +
          '<div class="h3" style="margin-top:8px">' + esc(vp.name) + '</div>' +
          (localState.code ? '<p class="tiny" style="margin-top:10px">seu código: <b class="num">' + esc(localState.code) + '</b></p>' : '') +
          '</div>' : '') +
        '<div class="botoeira">' +
        '<button class="btn btn-outline" data-go="' + (votoEmHerois() ? 'herois' : 'projetos') + '">Conhecer os outros ' + nomeDoVoto(true) + '</button>' +
        (remote.on && remote.resultadoPublico ? '<button class="btn btn-primary" data-go="resultado">Ver o resultado</button>' : '') +
        '</div></div></div></div>';
    }

    /* ---------- votação ainda fechada ---------- */
    if (!votacaoAberta()) {
      if (!remote.on) {
        // modo prévia: destrava com a palavra-chave, só neste aparelho
        return '<div class="view view-faixa">' +
          faixaTopo('escuro', 'Votação', 'Ainda não é hora de votar',
            textoEspera(false),
            '', '') +
          '<div class="corpo"><div class="painel-centro">' +
          '<form id="kwForm" class="painelinho painelinho-destaque stack">' +
          '<span class="ic-trava" aria-hidden="true">' + ico('i-lock') + '</span>' +
          '<div class="field' + (flow.error ? ' err' : '') + '">' +
          '<label for="kw">Palavra-chave da prévia</label>' +
          '<input class="big" id="kw" type="text" autocomplete="off" autocapitalize="characters" placeholder="ANUNCIADA NO PALCO"></div>' +
          (flow.error ? '<span class="errmsg">' + ico('i-info') + esc(flow.error) + '</span>' : '') +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Destravar votação</button>' +
          '</form>' +
          '<div class="painelinho painelinho-claro">' + discoveryBar() + '</div>' +
          '</div>' + gradeEspera() + '</div></div>';
      }
      return '<div class="view view-faixa">' +
        faixaTopo('escuro', 'Votação', 'Ainda não é hora de votar',
          textoEspera(true),
          '', '') +
        '<div class="corpo"><div class="painel-centro">' +
        '<div class="painelinho painelinho-destaque">' +
        '<span class="ic-trava" aria-hidden="true">' + ico('i-lock') + '</span>' +
        (remote.erro ? '<span class="errmsg">' + ico('i-info') + 'Sem conexão com o servidor. Verifique sua internet.</span>' : '') +
        discoveryBar() +
        '</div></div>' + gradeEspera() + '</div></div>';
    }

    var head = faixaTopo('escuro', 'Votação aberta', 'A votação começou',
      votoEmHerois()
        ? 'Qual Herói mais te marcou? Assista às campanhas, se quiser, e escolha um. Você vota uma vez só.'
        : 'Qual projeto mais te marcou? Considere a proposta, o impacto e a apresentação dos trilheiros antes de escolher.',
      '', '');

    /* ---------- falta a identificação ---------- */
    if (remote.on && !localState.hash) {
      return '<div class="view view-faixa">' + head +
        '<div class="corpo"><div class="painel-centro"><form class="painelinho painelinho-destaque stack" id="idForm" novalidate>' +
        '<div class="field' + (flow.error ? ' err' : '') + '">' +
        '<label for="voterId">Confirme seu CPF para votar</label>' +
        '<input class="big" id="voterId" name="voterId" type="text" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14">' +
        '<span class="hint">O número não é enviado nem guardado: o aplicativo gera a partir dele um código embaralhado, e é só esse código que chega ao servidor.</span>' +
        '</div>' +
        (flow.error ? '<span class="errmsg">' + ico('i-info') + esc(flow.error) + '</span>' : '') +
        '<button class="btn btn-primary btn-block btn-lg" type="submit">Continuar</button>' +
        '</form></div></div></div>';
    }

    /* ---------- escolha ---------- */
    var list = opcoesDeVoto();
    if (!list.length) {
      return '<div class="view view-faixa">' + head +
        '<div class="corpo"><div class="empty"><h2 class="h3">Ninguém liberado para a votação ainda</h2>' +
        '<p>A organização ainda está definindo quem participa.</p></div></div></div>';
    }

    var cards = list.map(function (o) {
      var vidId = videoId(o.video);
      return '<div class="cartao-voto' + (o.tipo === 'heroi' ? ' cv-heroi' : '') + '">' +
        quadroHeroi({ image: o.image, name: o.name }, 'quadro-voto', ' aria-hidden="true"') +
        '<span class="cv-txt"><span class="cv-nome">' + esc(o.name) + '</span>' +
        '<span class="cv-sub">' + esc(o.sub) + '</span>' +
        (o.campanha ? '<span class="cv-camp">' + esc(o.campanha) + '</span>' : '') + '</span>' +
        '<div class="cv-acoes">' +
        (vidId ? '<button class="btn btn-sm btn-ghost" data-act="playVideo" data-v="' + esc(vidId) + '" data-t="' + esc(o.name) + '">' + ico('i-play') + ' Campanha</button>' : '') +
        '<button class="btn btn-sm btn-primary" data-pick="' + esc(o.id) + '">Votar</button>' +
        '</div></div>';
    }).join('');

    return '<div class="view view-faixa">' + head +
      '<div class="corpo stack-lg">' +
      (localState.code ? '<div class="banner"><span class="bi">' + ico('i-lock') + '</span><p class="grow">Seu código de votação é <b>' + esc(localState.code) + '</b>. Ele é único, vale um voto e não revela quem você é.</p></div>' : '') +
      '<div class="grade-voto">' + cards + '</div>' +
      discoveryBar() +
      '</div></div>';
  }



  function textoEspera(comBanco) {
    var base = votoEmHerois()
      ? 'Antes das apresentações passam as campanhas dos Heróis candidatos. Conheça cada um e guarde o seu favorito.'
      : 'Conheça os projetos, acompanhe as apresentações e guarde o seu favorito.';
    return base + (comBanco
      ? ' Assim que a organização abrir a votação, esta tela muda sozinha — não precisa recarregar.'
      : ' A organização vai abrir a votação no momento certo.');
  }

  /* o que mostrar enquanto a votação não abre: os candidatos ou os projetos */
  function gradeEspera() {
    if (!votoEmHerois()) return gradeProjetosResumo(12);
    var cs = candidatos();
    if (!cs.length) return '';
    return '<section class="bloco-projetos">' +
      '<div class="bloco-cab"><span class="eyebrow">Candidatos</span>' +
      '<h2 class="titulo">Os ' + extenso(cs.length) + ' Heróis que concorrem</h2></div>' +
      '<div class="grade-herois grade-candidatos">' + cs.map(function (o) {
        return '<button class="cartao-heroi" data-go="' + esc(o.go) + '">' +
          quadroHeroi({ image: o.image, name: o.name }, 'quadro-cartao') +
          (videoId(o.video) ? '<span class="ct-play" aria-hidden="true">' + ico('i-play') + '</span>' : '') +
          '<span class="ch-nome">' + esc(o.name) + '</span>' +
          '<span class="ch-sub">' + esc(o.sub) + '</span>' +
          '</button>';
      }).join('') + '</div></section>';
  }

  /* grade compacta dos projetos, usada nas telas de espera da votação */
  function gradeProjetosResumo(limite) {
    var list = db.projects.slice(0, limite || 12);
    if (!list.length) return '';
    return '<section class="bloco-projetos">' +
      '<div class="bloco-cab"><span class="eyebrow">Enquanto isso</span>' +
      '<h2 class="titulo">Conheça os projetos antes de escolher</h2></div>' +
      '<ol class="indice">' + list.map(function (p) {
        return '<li><button class="ind-item" data-go="projeto/' + esc(p.id) + '">' +
          '<span class="ind-hora num">' + esc(p.slot || '') + '</span>' +
          '<span class="ind-txt"><span class="ind-nome">' + esc(p.name) + '</span>' +
          '<span class="ind-sub">' + esc(p.group ? 'grupo ' + p.group : (p.category || '')) + '</span></span>' +
          '<span class="ind-herois">' + (p.heroes || []).map(function (h) { return quadroHeroi(h, 'quadro-mini', ' aria-hidden="true"'); }).join('') + '</span>' +
          '<span class="ind-seta" aria-hidden="true">' + ico('i-chev') + '</span>' +
          '</button></li>';
      }).join('') + '</ol>' +
      (db.projects.length > list.length ? '<button class="btn btn-outline btn-block" data-nav="projetos" style="margin-top:18px">Ver todos os ' + nProjetos() + ' projetos ' + ico('i-chev') + '</button>' : '') +
      '</section>';
  }

  /* --------------------------- folha de confirmação ----------------------- */
  function confirmSheet(p) {
    return '<div class="sheet-bg" id="sheetBg" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">' +
      '<div class="sheet stack">' +
      '<span class="grab" aria-hidden="true"></span>' +
      '<span class="eyebrow">Seu voto vai para</span>' +
      '<h2 id="sheetTitle" class="display" style="font-size:25px">' + esc(p.name) + '</h2>' +
      '<p class="lead">Depois de confirmar, seu voto não poderá ser alterado.</p>' +
      (remote.on && remote.exigeChave
        ? '<div class="field' + (flow.error ? ' err' : '') + '"><label for="palavraVoto">Palavra-chave anunciada no palco</label>' +
          '<input class="big" id="palavraVoto" type="text" autocomplete="off" autocapitalize="characters" ' +
          'placeholder="ANUNCIADA NO PALCO" value="' + esc(flow.palavra || '') + '" data-act="setPalavra">' +
          '<span class="hint">Ela confirma que você está aqui, no evento.</span></div>'
        : '') +
      (flow.error ? '<span class="errmsg">' + ico('i-info') + esc(flow.error) + '</span>' : '') +
      '<button class="btn btn-primary btn-block btn-lg" data-act="confirmVote"' + (flow.busy ? ' disabled' : '') + '>' +
      (flow.busy ? 'Registrando…' : 'Confirmar meu voto') + '</button>' +
      '<button class="btn btn-block btn-ghost" data-act="cancelVote"' + (flow.busy ? ' disabled' : '') + '>Voltar</button>' +
      '</div></div>';
  }

  function submitVote() {
    if (flow.busy) return;
    var pid = flow.picked;
    if (!pid) return;
    flow.busy = true; flow.error = ''; renderOverlay();

    function sucesso() {
      localState.voted = { projectId: pid };
      if (remote.rodada) localState.rodada = remote.rodada;
      saveLocal();
      flow.busy = false; flow.picked = null; flow.error = '';
      renderOverlay(); render(); seedBurst();
    }
    function falha(msg) {
      flow.busy = false; flow.error = msg; renderOverlay();
    }

    if (!remote.on) {
      // modo prévia: registra só neste aparelho
      setTimeout(sucesso, 550);
      return;
    }
    if (!navigator.onLine) {
      falha('Seu voto ainda não foi confirmado. Verifique sua conexão e tente novamente.');
      return;
    }

    var campo = $('#palavraVoto');
    if (campo) flow.palavra = campo.value;

    if (remote.exigeChave && !String(flow.palavra || '').trim()) {
      falha('Informe a palavra-chave anunciada no palco.');
      return;
    }

    sbRpc('registrar_voto', {
      p_hash: localState.hash,
      p_projeto: pid,
      p_palavra: remote.exigeChave ? String(flow.palavra || '').trim() : null
    }).then(function (r) {
      if (r && r.ok) { sucesso(); return; }
      var cod = r && r.erro;
      if (cod === 'ja_votou') {
        localState.voted = { projectId: null }; saveLocal();
        flow.busy = false; flow.picked = null; renderOverlay(); render();
        toast(ERROS.ja_votou);
        syncMeuVoto();
        return;
      }
      if (cod === 'votacao_fechada') { remote.aberta = false; }
      falha(ERROS[cod] || 'Não consegui registrar seu voto. Tente novamente.');
    }).catch(function () {
      falha('Seu voto ainda não foi confirmado. Verifique sua conexão e tente novamente.');
    });
  }

  /* ------------------ microanimação: sementes de dente-de-leão ------------ */
  function seedBurst() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var old = document.getElementById('seedcanvas'); if (old) old.remove();
    var cv = document.createElement('canvas');
    cv.id = 'seedcanvas'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    var ctx = cv.getContext('2d');
    var seeds = [], N = 34;
    for (var i = 0; i < N; i++) {
      seeds.push({
        x: W * (0.5 + (Math.random() - 0.5) * 0.25),
        y: H * (0.62 + Math.random() * 0.12),
        vx: (Math.random() - 0.5) * 2.4 * dpr,
        vy: (-1.1 - Math.random() * 2.1) * dpr,
        r: (4 + Math.random() * 4) * dpr,
        a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.05,
        life: 0, max: 110 + Math.random() * 60
      });
    }
    var t0 = performance.now();
    (function step(t) {
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      seeds.forEach(function (s) {
        if (s.life > s.max) return;
        alive = true; s.life++;
        s.x += s.vx + Math.sin((t - t0) / 420 + s.a) * 0.6 * dpr;
        s.y += s.vy; s.vy += 0.008 * dpr; s.a += s.va;
        var o = Math.max(0, 1 - s.life / s.max);
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
        ctx.globalAlpha = o * 0.95;
        ctx.strokeStyle = '#eaa644'; ctx.lineWidth = 1.1 * dpr; ctx.lineCap = 'round';
        for (var k = 0; k < 7; k++) {
          var ang = (Math.PI * 2 / 7) * k;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * s.r, Math.sin(ang) * s.r);
          ctx.stroke();
        }
        ctx.fillStyle = '#c6934f';
        ctx.beginPath(); ctx.arc(0, 0, 1.5 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      if (alive) requestAnimationFrame(step); else cv.remove();
    })(t0);
  }

  /* =============================== RESULTADO ============================== */
  function viewResultado(isAdmin) {
    var rows, total;
    var herois = votoEmHerois();
    var destinoVer = herois ? 'herois' : 'projetos';
    var verTodos = '<button class="btn btn-outline" data-go="' + destinoVer + '">Conhecer ' + (herois ? 'os Heróis' : 'os projetos') + '</button>';
    function espera(titulo, texto, extra) {
      return '<div class="view view-faixa">' +
        faixaTopo('escuro', 'Resultado', titulo, texto, '', '') +
        '<div class="corpo"><div class="painel-centro"><div class="botoeira">' + (extra || '') + verTodos + '</div></div></div></div>';
    }

    if (remote.on) {
      if (!remote.resultadoPublico && !isAdmin) {
        return espera('O resultado ainda não foi publicado',
          'A organização divulga o resultado no momento certo. Esta tela muda sozinha assim que isso acontecer.');
      }
      if (!pubRes.dados && !pubRes.erro) {
        if (!pubRes.pediu) { pubRes.pediu = true; setTimeout(loadPublicResult, 0); }
        return espera('Buscando a apuração…', 'Só um instante.');
      }
      if (pubRes.erro) {
        return espera('Não consegui buscar o resultado', pubRes.erro,
          '<button class="btn btn-primary" data-act="reloadResult">Tentar de novo</button>');
      }
      total = pubRes.dados.total || 0;
      rows = (pubRes.dados.projetos || []).map(function (r) {
        var o = opcaoPorId(r.id);
        return { p: o || { id: r.id, name: r.nome || r.id }, n: r.votos || 0 };
      });
    } else {
      var t = tally(); total = 0;
      Object.keys(t).forEach(function (k) { total += t[k]; });
      rows = opcoesDeVoto()
        .map(function (o) { return { p: o, n: t[o.id] || 0 }; })
        .sort(function (a, b) { return b.n - a.n; });
    }

    var max = rows.length ? Math.max(1, rows[0].n) : 1;
    var bars = rows.map(function (r, i) {
      var pct = total ? (r.n / total * 100) : 0;
      return '<div class="resultbar' + (i === 0 && r.n > 0 ? ' is-top' : '') + '">' +
        '<div class="rb-top"><span class="rb-name">' + esc(r.p.name) + '</span>' +
        '<span class="rb-val">' + r.n + ' ' + (r.n === 1 ? 'voto' : 'votos') + ' · ' + pct.toFixed(0) + '%</span></div>' +
        '<div class="track"><div class="bar" data-w="' + (r.n / max * 100).toFixed(1) + '"></div></div>' +
        '</div>';
    }).join('');

    var top = rows[0] && rows[0].n > 0 ? rows[0].p : null;

    return '<div class="view view-faixa">' +
      faixaTopo('escuro', 'Banca Final IDL Tech · Trilha 2026',
        herois ? 'O Herói escolhido pelo público' : 'Os projetos escolhidos pelo público',
        herois ? 'Cada Herói nasceu das histórias e das causas de um grupo de trilheiros ao longo do ano.'
               : 'Todos estes projetos chegaram até a Banca. Cada um carrega uma jornada de transformação.',
        '', '') +
      '<div class="corpo"><div class="painel-centro painel-resultado">' +
      (top ? '<div class="painelinho painelinho-destaque vencedor">' +
        (top.image ? '<figure class="pr-fig pr-fig-grande"><img src="' + esc(top.image) + '" alt=""></figure>' : '') +
        '<span class="eyebrow">' + (herois ? 'Herói mais votado' : 'Projeto mais lembrado pelo público') + '</span>' +
        '<h2 class="h2">' + esc(top.name) + '</h2>' +
        (top.sub ? '<p class="small">' + esc(top.sub) + '</p>' : '') +
        '</div>' : '') +
      '<section class="painelinho"><span class="eyebrow">Votos · ' + total + ' ' + (total === 1 ? 'voto' : 'votos') + ' no total</span>' +
      '<div>' + bars + '</div></section>' +
      '<div class="botoeira">' +
      (remote.on ? '<button class="btn btn-outline btn-sm" data-act="reloadResult">Atualizar números</button>' : '') +
      verTodos + '</div>' +
      (isAdmin && remote.on && !remote.resultadoPublico ? '<p class="tiny" style="text-align:center">Prévia da organização — o público ainda não vê esta tela.</p>' : '') +
      '</div></div></div>';
  }


  function loadPublicResult() {
    if (!remote.on) return;
    pubRes.carregando = true;
    sbRpc('resultado', { p_chave: localState.adminKey || '' }).then(function (r) {
      pubRes.carregando = false;
      if (r && r.liberado) { pubRes.dados = r; pubRes.erro = ''; }
      else { pubRes.dados = null; pubRes.erro = 'O resultado ainda não está liberado.'; }
      render();
    }).catch(function () {
      pubRes.carregando = false; pubRes.dados = null;
      pubRes.erro = 'Sem conexão com o servidor. Verifique sua internet.';
      render();
    });
  }

  /* ========================= PAINEL ADMINISTRATIVO ======================== */
  var admin = { tab: 'geral', editor: null, confirm: null, copy: null, fotosDe: null };

  var ADMIN_TABS = [
    ['geral', 'Visão geral'], ['votacao', 'Votação'], ['evento', 'Evento'],
    ['programacao', 'Programação'], ['projetos', 'Projetos'],
    ['herois', 'Heróis'], ['retro', 'Trilha 2026'], ['dados', 'Dados']
  ];

  var login = { erro: '', ocupado: false };

  // o CPF da conta não fica escrito em lugar nenhum: o config.js guarda só
  // o código embaralhado, do qual não se volta ao número
  // aceita um código ou uma lista deles: uma entrada por pessoa da organização
  var ADMIN_HASHES = [].concat(window.IDL_ADMIN || []).map(function (h) {
    return String(h || '').trim().toLowerCase();
  }).filter(Boolean);
  function ehContaDaOrg(hash) {
    if (!ADMIN_HASHES.length) return true;   // nenhuma conta configurada: não trava o painel
    return ADMIN_HASHES.indexOf(String(hash || '').toLowerCase()) >= 0;
  }

  function viewAdmin() {
    if (!localState.admin) {
      var jaIdentificada = !!localState.hash && ehContaDaOrg(localState.hash);
      return '<div class="view view-faixa">' +
        faixaTopo('escuro', 'Acesso restrito', 'Painel da organização',
          'Só os CPFs da organização entram aqui. Esta senha é pedida uma vez só neste aparelho — depois a aba Painel abre direto.',
          '', '') +
        '<div class="corpo"><div class="painel-centro">' +
        '<form id="pinForm" class="painelinho painelinho-destaque stack">' +
        '<span class="ic-trava" aria-hidden="true">' + ico('i-key') + '</span>' +
        (jaIdentificada
          ? '<div class="banner"><span class="bi">' + ico('i-lock') + '</span><p class="grow">' +
            'Reconheci o CPF com que você entrou no aplicativo' + (firstName(localState.name) ? ', ' + esc(firstName(localState.name)) : '') +
            '. Falta só a senha.</p></div>'
          : '<div class="field' + (login.erro ? ' err' : '') + '">' +
            '<label for="admCpf">CPF da conta</label>' +
            '<input class="big" id="admCpf" type="text" inputmode="numeric" autocomplete="off" ' +
            'placeholder="000.000.000-00" maxlength="14"></div>') +
        '<div class="field' + (login.erro ? ' err' : '') + '">' +
        '<label for="pin">Senha</label>' +
        '<input class="big" id="pin" type="password" autocomplete="current-password" placeholder="••••••••"></div>' +
        (login.erro ? '<span class="errmsg">' + ico('i-info') + esc(login.erro) + '</span>' : '') +
        '<button class="btn btn-primary btn-block btn-lg" type="submit"' + (login.ocupado ? ' disabled' : '') + '>' +
        (login.ocupado ? 'Verificando…' : 'Entrar no painel') + '</button></form>' +
        '<div class="gnote">' + ico('i-lock') +
        '<p>Seu CPF já disse <b>quem</b> é — e só os CPFs da organização abrem esta aba. A senha existe porque um CPF circula em ficha de matrícula e lista de presença, ' +
        'e sem ela quem soubesse o seu número poderia abrir a votação fora de hora ou ver o resultado antes de você publicar.</p></div>' +
        (!SENHA_HASH
          ? '<span class="errmsg">' + ico('i-info') + 'Nenhuma senha configurada. Preencha o IDL_SENHA_HASH no config.js.</span>' : '') +
        '<button class="btn btn-ghost btn-sm" data-go="home">Voltar ao aplicativo</button>' +
        '</div></div></div>';
    }

    var tabs = '<div class="tabs" role="tablist">' + ADMIN_TABS.map(function (t) {
      var curto = { programacao: 'Agenda', retro: 'Fotos', geral: 'Geral' }[t[0]];
      return '<button role="tab" data-atab="' + t[0] + '" aria-selected="' + (admin.tab === t[0]) + '">' +
        (curto ? '<span class="tb-l">' + esc(t[1]) + '</span><span class="tb-c">' + esc(curto) + '</span>' : esc(t[1])) + '</button>';
    }).join('') + '</div>';

    return '<div class="adminbar"><div class="adminbar-in">' +
      '<div><div class="h3">Painel da organização</div>' +
      '<div class="tiny">' + (firstName(localState.name) ? esc(firstName(localState.name)) + ' · ' : '') +
      'conta ' + esc(localState.code || '—') + '</div></div>' +
      '<div class="row"><button class="btn btn-sm btn-outline" data-go="home">Ver aplicativo</button>' +
      '<button class="btn btn-sm btn-ghost" data-act="askLogout">Sair</button></div>' +
      '</div>' + tabs + '</div>' +
      '<div class="adminwrap"><div class="view stack-lg">' + adminTab() + '</div></div>';
  }

  function adminTab() {
    if (admin.tab === 'geral') return adminGeral();
    if (admin.tab === 'evento') return adminEvento();
    if (admin.tab === 'programacao') return adminPrograma();
    if (admin.tab === 'projetos') return adminProjetos();
    if (admin.tab === 'herois') return adminHerois();
    if (admin.tab === 'votacao') return adminVotacao();
    if (admin.tab === 'retro') return adminRetro();
    return adminDados();
  }

  function fieldText(id, label, val, hint, type) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" name="' + id + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '">' +
      (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function fieldArea(id, label, val, hint) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" name="' + id + '">' + esc(val || '') + '</textarea>' +
      (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function fieldImg(id, label, val, hint) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<div class="row" style="gap:10px">' +
      '<div class="logo-slot" style="width:56px;height:56px;border-radius:12px">' +
      (val ? '<img src="' + esc(val) + '" alt="">' : '<span>sem<br>imagem</span>') + '</div>' +
      '<input id="' + id + '" name="' + id + '" type="file" accept="image/*" data-img="' + id + '" style="border:0;padding:0;min-height:auto;font-size:12.5px">' +
      (val ? '<button type="button" class="iconbtn" data-clearimg="' + id + '" aria-label="Remover imagem">' + ico('i-trash') + '</button>' : '') +
      '</div>' + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') +
      '<input type="hidden" name="' + id + '__data" value="' + esc(val || '') + '"></div>';
  }

  /* --- evento --- */
  function adminEvento() {
    var e = db.event;
    return '<form id="eventForm" class="stack">' +
      '<h2 class="h2">Informações gerais do evento</h2>' +
      '<p class="small">Tudo aqui aparece na tela inicial. Nada está fixo no código.</p>' +
      fieldImg('logo', 'Logo do Instituto', e.logo) +
      fieldText('name', 'Nome do evento', e.name) +
      fieldText('subtitle', 'Subtítulo', e.subtitle) +
      fieldText('dateISO', 'Data (usada pelo aplicativo)', e.dateISO, 'Define quando os status “Acontecendo agora” passam a valer.', 'date') +
      fieldText('dateLabel', 'Data (como aparece na tela)', e.dateLabel) +
      fieldText('timeLabel', 'Horário (como aparece na tela)', e.timeLabel) +
      fieldText('place', 'Local', e.place) +
      fieldText('playlist', 'Playlist das campanhas no YouTube', e.playlist,
        'Cole o link da playlist (ou só o código que vem depois de list=). Ela aparece na aba Heróis.') +
      fieldText('votacaoAbre', 'Horário em que a votação dos Heróis abre', e.votacaoAbre,
        'Aparece no aviso da Início enquanto a votação está fechada. Ex.: 9h30.') +
      '<div class="field"><label for="totalTrilheiros">Total de trilheiros</label>' +
      '<input id="totalTrilheiros" name="totalTrilheiros" type="number" min="1" step="1" inputmode="numeric" value="' + (totalOficial() || '') + '">' +
      '<span class="hint">É o número que aparece nos contadores do site. Somando os nomes das equipes, os pôsteres chegam a ' + somaTrilheiros() +
      ', porque alguns nomes aparecem em mais de um grupo. Informe aqui o total oficial; se deixar em branco, o site usa a soma.' +
      (remote.on ? ' Com o banco ligado, o número vale para todo mundo assim que você salvar.' : '') + '</span></div>' +
      '<button class="btn btn-primary" type="submit">' + ico('i-save') + ' Salvar</button>' +
      '</form>';
  }

  /* --- visão geral: tudo o que a organização precisa ver de uma vez --- */
  function adminGeral() {
    var fase = eventPhase(), a = agora();
    var aberta = remote.on ? remote.aberta : localState.unlocked;
    var res = adminRes.dados;
    var totalVotos = res && res.liberado ? (res.total || 0) : null;

    var estadoVot = !remote.on ? 'Modo prévia'
      : remote.erro ? 'Sem conexão'
      : (aberta ? 'Aberta' : 'Fechada');

    var faseTxt = fase === 'dia' ? 'É hoje' : fase === 'depois' ? 'Já aconteceu' : contagemTexto();

    var cartoes = '<div class="statgrid">' +
      '<div class="stat"><div class="sv" style="font-size:19px">' + esc(estadoVot) + '</div><div class="sl">Votação</div></div>' +
      '<div class="stat"><div class="sv">' + (totalVotos == null ? '—' : totalVotos) + '</div><div class="sl">Votos recebidos</div></div>' +
      '<div class="stat"><div class="sv" style="font-size:19px">' + esc(faseTxt || '—') + '</div><div class="sl">' + esc(db.event.dateLabel || 'Data do evento') + '</div></div>' +
      '<div class="stat"><div class="sv">' + pad2(a.hh) + ':' + pad2(a.mm) + '</div><div class="sl">Agora em Curitiba</div></div>' +
      '</div>';

    var comandos = '<section class="stack">' +
      '<h3 class="h3">Comandos rápidos</h3>' +
      '<p class="small">A votação pode ser aberta a qualquer momento — inclusive antes do dia do evento.</p>' +
      '<div class="row wrap" style="gap:8px">' +
      (remote.on
        ? (aberta
          ? '<button class="btn btn-danger" data-act="askClose">Encerrar votação</button>'
          : '<button class="btn btn-primary" data-act="askOpen">Abrir votação agora</button>') +
          '<button class="btn btn-outline" data-act="pubResult">' + (remote.resultadoPublico ? 'Ocultar resultado' : 'Publicar resultado') + '</button>' +
          '<button class="btn btn-outline" data-act="loadResult">Atualizar as respostas</button>'
        : '<button class="btn btn-outline" data-atab="votacao">Abrir a aba Votação</button>') +
      '</div>' +
      (remote.on && aberta
        ? '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">A votação está aberta para todo mundo agora. O resultado só aparece para o público quando você publicar.</p></div>'
        : '') +
      '</section>';


    var atalhos = [
      ['evento', 'i-cal', 'Informações do evento', 'Nome, data, horário, local, playlist dos vídeos e total de trilheiros.'],
      ['programacao', 'i-clock', 'Programação do dia', db.schedule.length + ' atividades — criar, editar, reordenar.'],
      ['projetos', 'i-grid', 'Textos e fotos dos projetos', db.projects.length + ' páginas de projeto (' + nProjetos() + ' projetos): textos, trilheiros e fotos das equipes.'],
      ['herois', 'i-spark', 'Textos e vídeos dos Heróis', nHerois() + ' Heróis: história, inspiração, ilustração e vídeo.'],
      ['votacao', 'i-vote', 'Votação e palavra-chave', 'Abrir, encerrar, trocar a palavra do palco e apurar.'],
      ['retro', 'i-eye', 'A Trilha em 2026', fotosDoSite().length + ' fotos na aba Fotos, contando as das equipes.'],
      ['dados', 'i-save', 'Relógio e backup', 'Ensaio do relógio, exportar e importar o conteúdo.']
    ].map(function (t) {
      return '<button class="card card-btn shortcut" data-atab="' + t[0] + '">' +
        '<span class="ic">' + ico(t[1]) + '</span>' +
        '<span><span class="st">' + esc(t[2]) + '</span><br><span class="ss">' + esc(t[3]) + '</span></span></button>';
    }).join('');

    // sem banco não há o que buscar; com banco, a primeira busca sai daqui
    if (remote.on && !adminRes.dados && !adminRes.carregando && !adminRes.erro && localState.adminKey) setTimeout(loadResult, 0);

    return '<div class="stack-lg">' +
      painelResultado() +
      '<section class="stack">' +
      '<h2 class="h2">Visão geral</h2>' +
      '<p class="small">Tudo o que a organização controla está aqui dentro. Esta conta é a única com acesso.</p>' +
      cartoes + '</section>' +
      comandos +
      '<section class="stack"><h3 class="h3">Onde editar cada coisa</h3>' +
      '<div class="shortcuts">' + atalhos + '</div></section>' +
      '</div>';
  }

  /* ---- quem está ganhando: o bloco do topo da visão geral ----
     Com o banco ligado, os números vêm da função resultado (com a senha do
     painel); sem banco, da prévia deste aparelho. Atualiza sozinho a cada
     15 segundos enquanto o painel está aberto. Empate no primeiro lugar
     aparece como empate: o painel não escolhe um vencedor.               */
  var RES_INTERVALO = 15000;
  function apuracaoHerois() {
    var linhas, total, quando;
    if (remote.on) {
      var r = adminRes.dados;
      if (!r || !r.liberado) return null;
      total = r.total || 0;
      linhas = (r.projetos || []).map(function (x) { return { id: x.id, nome: x.nome, votos: +x.votos || 0 }; });
      quando = adminRes.quando || Date.now();
    } else {
      var t = tally();
      total = 0;
      Object.keys(t).forEach(function (k) { total += t[k]; });
      linhas = opcoesDeVoto().map(function (o) { return { id: o.id, nome: o.name, votos: t[o.id] || 0 }; });
      quando = Date.now();
    }
    linhas.forEach(function (l) {
      var x = heroById(l.id), p = x ? x.project : byId(l.id);
      l.nome = x ? x.hero.name : (p ? p.name : (l.nome || l.id));
      l.imagem = x ? x.hero.image : (p ? projectImage(p).src : '');
      l.projeto = x ? x.project.name : '';
      l.instituicao = p ? (p.group || '') : '';
      l.pct = total ? l.votos / total * 100 : 0;
    });
    linhas.sort(function (a, b) { return b.votos - a.votos || String(a.nome).localeCompare(String(b.nome), 'pt'); });
    // posição com empate: quem tem os mesmos votos divide a mesma posição
    linhas.forEach(function (l, i) {
      l.pos = (i > 0 && l.votos === linhas[i - 1].votos) ? linhas[i - 1].pos : i + 1;
    });
    return { linhas: linhas, total: total, quando: quando };
  }
  function horaCuritiba(ms) {
    var c = curitiba(new Date(ms));
    var d = new Date(ms);
    return pad2(c.hh) + ':' + pad2(c.mm) + ':' + pad2(d.getSeconds());
  }
  function pctTxt(v) { return (Math.round(v * 10) / 10).toString().replace('.', ',') + '%'; }
  function votosTxt(n) { return n + ' ' + (n === 1 ? 'voto' : 'votos'); }

  function painelResultado() {
    var a = apuracaoHerois();
    var cab = '<div class="pr-cab"><div><span class="eyebrow">Votação dos Heróis</span>' +
      '<h2 class="h2">Quem está ganhando</h2></div>';
    if (!a) {
      var msg = adminRes.carregando ? 'Buscando a apuração no banco…'
        : adminRes.erro ? adminRes.erro
        : 'Buscando a apuração no banco…';
      return '<section class="painel-res" id="painelRes">' + cab + '</div>' +
        '<p class="small">' + esc(msg) + '</p>' +
        (adminRes.erro ? '<button class="btn btn-sm btn-outline" data-act="loadResult">Tentar de novo</button>' : '') +
        '</section>';
    }
    var linhas = a.linhas, total = a.total;
    var max = linhas.length ? linhas[0].votos : 0;
    var lideres = linhas.filter(function (l) { return max > 0 && l.votos === max; });

    var nota = '<p class="pr-nota tiny">' + votosTxt(total) + ' no total · atualizado às <b class="num">' + horaCuritiba(a.quando) + '</b>, horário de Curitiba' +
      (remote.on ? ' · a apuração se atualiza sozinha a cada 15 segundos enquanto o painel estiver aberto.' : ' · modo prévia: só contam os votos feitos neste aparelho.') + '</p>';

    function figura(l, cls) {
      return '<figure class="pr-fig ' + (cls || '') + '">' +
        (l.imagem ? '<img src="' + esc(l.imagem) + '" alt="Ilustração do Herói ' + esc(l.nome) + '">' : '') + '</figure>';
    }
    function ficha(l) {
      return '<dl class="pr-ficha">' +
        (l.projeto ? '<div><dt>Projeto</dt><dd>' + esc(l.projeto) + '</dd></div>' : '') +
        (l.instituicao ? '<div><dt>Instituição</dt><dd>' + esc(l.instituicao) + '</dd></div>' : '') +
        '<div><dt>Votos</dt><dd class="num">' + l.votos + '</dd></div>' +
        '<div><dt>Percentual</dt><dd class="num">' + pctTxt(l.pct) + '</dd></div>' +
        '</dl>';
    }

    var destaque;
    if (!total) {
      destaque = '<div class="pr-vazio"><p>Ainda não há votos registrados. Assim que a votação abrir e os primeiros votos chegarem, o Herói mais votado aparece aqui.</p></div>';
    } else if (lideres.length > 1) {
      destaque = '<div class="pr-empate">' +
        '<p class="pr-empate-tit"><b>Empate no primeiro lugar.</b> ' + maiuscula(extenso(lideres.length)) + ' Heróis estão com ' + votosTxt(max) +
        ' cada. Enquanto o empate durar, nenhum deles aparece como vencedor.</p>' +
        '<div class="pr-empate-grade">' + lideres.map(function (l) {
          return '<div class="pr-lider">' + figura(l) + '<div><h3 class="pr-nome">' + esc(l.nome) + '</h3>' + ficha(l) + '</div></div>';
        }).join('') + '</div></div>';
    } else {
      var v = lideres[0];
      destaque = '<div class="pr-vencedor">' + figura(v, 'pr-fig-grande') +
        '<div class="pr-vtxt"><span class="eyebrow">' + (remote.on && !remote.aberta ? 'Herói mais votado' : 'Herói mais votado até agora') + '</span>' +
        '<h3 class="pr-nome pr-nome-grande">' + esc(v.nome) + '</h3>' + ficha(v) + '</div></div>';
    }

    var ranking = '<ol class="pr-ranking">' + linhas.map(function (l) {
      return '<li class="pr-linha' + (total && l.votos === max ? ' is-topo' : '') + '">' +
        '<span class="pr-pos num">' + l.pos + 'º</span>' +
        figura(l, 'pr-fig-mini') +
        '<span class="pr-meio"><b>' + esc(l.nome) + '</b><span class="tiny">' + esc([l.projeto, l.instituicao].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="track"><span class="bar" style="width:' + (max ? (l.votos / max * 100) : 0).toFixed(1) + '%"></span></span></span>' +
        '<span class="pr-num"><b class="num">' + l.votos + '</b><span class="tiny num">' + pctTxt(l.pct) + '</span></span>' +
        '</li>';
    }).join('') + '</ol>';

    return '<section class="painel-res" id="painelRes">' + cab +
      (remote.on ? '<button class="btn btn-sm btn-ghost" data-act="loadResult">Atualizar agora</button>' : '') + '</div>' +
      destaque +
      '<h3 class="h3 pr-sub">Ranking dos ' + extenso(linhas.length) + ' candidatos</h3>' +
      ranking + nota +
      '</section>';
  }

  // busca a apuração sem redesenhar a tela inteira (não atrapalha quem está digitando)
  function atualizarApuracaoSilenciosa() {
    function trocar() {
      var bloco = $('#painelRes');
      if (bloco) bloco.outerHTML = painelResultado();
    }
    if (!remote.on) { trocar(); return; }
    if (!localState.adminKey) return;
    sbRpc('resultado', { p_chave: localState.adminKey }).then(function (r) {
      if (r && r.liberado) { adminRes.dados = r; adminRes.erro = ''; adminRes.quando = Date.now(); }
      trocar();
    }).catch(function () { /* mantém os últimos números na tela */ });
  }

  // barras da apuração, usadas na visão geral e na aba Votação
  function resumoApuracao(limite) {
    if (!remote.on) {
      return '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">' +
        '<b>Modo prévia.</b> Esta cópia não está ligada ao banco de votos, então não há respostas para mostrar. ' +
        'Na cópia publicada, com o <b>config.js</b> preenchido, as respostas aparecem aqui.</p></div>';
    }
    if (adminRes.carregando) return '<p class="small">Buscando as respostas…</p>';
    if (adminRes.erro) return '<span class="errmsg">' + ico('i-info') + esc(adminRes.erro) + '</span>';
    var res = adminRes.dados;
    if (!res || !res.liberado) {
      return '<p class="small">Toque em <b>Atualizar as respostas</b> para buscar a apuração no banco.</p>';
    }
    var projs = res.projetos || [];
    if (!res.total) return '<p class="small">Nenhum voto registrado até agora.</p>';
    var mostrar = limite ? projs.slice(0, limite) : projs;
    var barras = mostrar.map(function (p, i) {
      var pct = res.total ? (p.votos / res.total * 100) : 0;
      var local = opcaoPorId(p.id);
      return '<div class="resultbar' + (i === 0 && p.votos > 0 ? ' is-top' : '') + '">' +
        '<div class="rb-top"><span class="rb-name">' + esc((local && local.name) || p.nome || p.id) + '</span>' +
        '<span class="rb-val">' + p.votos + ' · ' + pct.toFixed(0) + '%</span></div>' +
        '<div class="track"><div class="bar" data-w="' + pct.toFixed(1) + '"></div></div></div>';
    }).join('');
    return '<div class="statgrid" style="margin-bottom:14px">' +
      '<div class="stat"><div class="sv">' + (res.total || 0) + '</div><div class="sl">Votos no total</div></div>' +
      '<div class="stat"><div class="sv">' + projs.filter(function (p) { return p.votos > 0; }).length + '</div><div class="sl">' + (votoEmHerois() ? 'Heróis com voto' : 'Projetos votados') + '</div></div>' +
      '</div>' + barras +
      (limite && projs.length > limite
        ? '<p class="tiny" style="margin-top:10px">mais ' + (projs.length - limite) +
          ' na aba Votação</p>'
        : '');
  }

  /* --- programação --- */
  function adminPrograma() {
    var items = ordered();
    var rows = items.length ? items.map(function (it, i) {
      return '<div class="listrow">' +
        '<div class="stack-sm" style="gap:2px;flex:none;width:96px">' +
        '<span class="mono tiny">' + esc(it.start) + '</span><span class="mono tiny">' + esc(it.end) + '</span></div>' +
        '<div class="grow"><div class="h3" style="font-size:14.5px">' + esc(it.name) + '</div>' +
        '<div class="tiny">' + esc(it.place || 'sem local') + (it.demo ? ' · exemplo' : '') + '</div></div>' +
        '<button class="iconbtn" data-move="sch:' + esc(it.id) + ':-1" aria-label="Mover para cima"' + (i === 0 ? ' disabled' : '') + '>' + ico('i-up') + '</button>' +
        '<button class="iconbtn" data-move="sch:' + esc(it.id) + ':1" aria-label="Mover para baixo"' + (i === items.length - 1 ? ' disabled' : '') + '>' + ico('i-down') + '</button>' +
        '<button class="iconbtn" data-edit="schedule:' + esc(it.id) + '" aria-label="Editar">' + ico('i-pencil') + '</button>' +
        '<button class="iconbtn" data-del="schedule:' + esc(it.id) + '" aria-label="Excluir">' + ico('i-trash') + '</button>' +
        '</div>';
    }).join('') : '<div class="empty"><p>Nenhuma atividade cadastrada.</p></div>';

    return '<div class="stack">' +
      '<div class="row-between"><h2 class="h2">Programação</h2>' +
      '<button class="btn btn-sm btn-primary" data-edit="schedule:new">' + ico('i-plus') + ' Adicionar</button></div>' +
      '<p class="small">Reordene com as setas. Os horários definem automaticamente o que aparece como “Acontecendo agora”.</p>' +
      '<div>' + rows + '</div></div>';
  }

  /* --- projetos --- */
  function adminProjetos() {
    var foco = admin.fotosDe ? byId(admin.fotosDe) : null;
    if (foco) {
      return '<div class="stack-lg">' +
        '<div class="stack">' +
        '<button class="btn btn-sm btn-ghost" data-act="fotosVoltar">' + ico('i-arrow-left') + ' Todos os projetos</button>' +
        '<h2 class="h2">Fotos da equipe · ' + esc(foco.name) + '</h2>' +
        '<p class="small">Estas fotos aparecem na seção <b>Fotos da equipe</b>, na página do projeto, e também na aba Fotos, com o nome do projeto. ' +
        'No dia do evento dá para enviar direto do celular: as fotos são reduzidas aqui mesmo antes de seguir.</p>' +
        '</div>' +
        gerenciadorFotos(foco.id) +
        '</div>';
    }
    var rows = db.projects.length ? db.projects.map(function (p, i) {
      return '<div class="listrow">' +
        '<div class="logo-slot" style="width:46px;height:46px;border-radius:10px;border-style:solid">' +
        (projectImage(p).src ? '<img src="' + esc(projectImage(p).src) + '" alt="" style="object-fit:contain">' : '<span>capa</span>') + '</div>' +
        '<div class="grow"><div class="h3" style="font-size:14.5px">' + esc(p.name) + '</div>' +
        '<div class="tiny">' + (p.slot ? p.slot + ' · ' : '') + ((p.teams || []).length > 1 ? p.teams.length + ' equipes · ' : '') + (p.members || []).length + ' trilheiro(s) · ' + (p.heroes || []).length + ' Herói(s)' + (p.eligible === false ? ' · fora da votação' : '') + (p.demo ? ' · exemplo' : '') + '</div></div>' +
        '<button class="btn btn-sm btn-outline btn-fotos" data-act="fotosDe" data-p="' + esc(p.id) + '">' + ico('i-eye') + ' Fotos (' + fotosDoProjeto(p.id).length + ')</button>' +
        '<button class="iconbtn" data-move="prj:' + esc(p.id) + ':-1" aria-label="Mover para cima"' + (i === 0 ? ' disabled' : '') + '>' + ico('i-up') + '</button>' +
        '<button class="iconbtn" data-move="prj:' + esc(p.id) + ':1" aria-label="Mover para baixo"' + (i === db.projects.length - 1 ? ' disabled' : '') + '>' + ico('i-down') + '</button>' +
        '<button class="iconbtn" data-edit="project:' + esc(p.id) + '" aria-label="Editar">' + ico('i-pencil') + '</button>' +
        '<button class="iconbtn" data-del="project:' + esc(p.id) + '" aria-label="Excluir">' + ico('i-trash') + '</button>' +
        '</div>';
    }).join('') : '<div class="empty"><p>Nenhum projeto cadastrado.</p></div>';

    return '<div class="stack">' +
      '<div class="row-between"><h2 class="h2">Projetos</h2>' +
      '<button class="btn btn-sm btn-primary" data-edit="project:new">' + ico('i-plus') + ' Adicionar</button></div>' +
      '<p class="small">O lápis edita os textos e os trilheiros. O botão <b>Fotos</b> abre as fotos da equipe daquele projeto.</p>' +
      '<div>' + rows + '</div></div>';
  }

  /* --- heróis --- */
  function semVideo() {
    var faltam = allHeroes().filter(function (x) { return !videoId(x.hero.video); });
    if (!faltam.length) return '';
    return '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">' +
      '<b>' + faltam.length + (faltam.length === 1 ? ' Herói ainda não tem vídeo' : ' Heróis ainda não têm vídeo') + ':</b> ' +
      esc(faltam.map(function (x) { return x.hero.name; }).join(', ')) + '. ' +
      'Para ligar um vídeo, toque no lápis do Herói e cole o link do YouTube no campo <b>Vídeo da campanha</b>.</p></div>';
  }

  function adminHerois() {
    var hs = allHeroes();
    var rows = hs.length ? hs.map(function (x) {
      return '<div class="listrow">' +
        '<div class="logo-slot" style="width:46px;height:46px;border-radius:12px;border-style:' + (x.hero.image ? 'solid' : 'dashed') + '">' +
        (x.hero.image ? '<img src="' + esc(x.hero.image) + '" alt="" style="object-fit:contain">' : '<span>' + esc(initials(x.hero.name)) + '</span>') + '</div>' +
        '<div class="grow"><div class="h3" style="font-size:14.5px">' + esc(x.hero.name) +
        (videoId(x.hero.video) ? ' <span class="chip chip-soft" style="font-size:10px;vertical-align:middle">vídeo</span>' : '') + '</div>' +
        '<div class="tiny">' + esc(x.project.name) + (x.project.group ? ' · grupo ' + esc(x.project.group) : '') + '</div></div>' +
        '<button class="iconbtn" data-edit="hero:' + esc(x.hero.id) + '" aria-label="Editar">' + ico('i-pencil') + '</button>' +
        '<button class="iconbtn" data-del="hero:' + esc(x.hero.id) + '" aria-label="Excluir">' + ico('i-trash') + '</button>' +
        '</div>';
    }).join('') : '<div class="empty"><p>Nenhum Herói cadastrado.</p></div>';

    return '<div class="stack">' +
      '<div class="row-between"><h2 class="h2">Heróis</h2>' +
      '<button class="btn btn-sm btn-primary" data-edit="hero:new">' + ico('i-plus') + ' Adicionar</button></div>' +
      '<p class="small">Cada Herói pertence a um projeto. Os trilheiros do grupo são editados dentro do projeto.</p>' +
      semVideo() +
      '<div>' + rows + '</div></div>';
  }

  /* --- votação --- */

  function adminVotacao() {
    var link = siteBase() + '/#/telao';
    return '<div class="stack-lg">' +
      '<section class="stack">' +
      '<h2 class="h2">Telão</h2>' +
      '<p class="small">Abra no computador ligado ao projetor: mostra o QR Code grande da votação e uma animação ilustrativa de votos chegando aos candidatos (não usa os votos reais). ' +
      'Se a palavra-chave do palco estiver ativa e este aparelho estiver com o painel aberto, ela aparece no telão sozinha. Em outro computador, coloque-a no fim do endereço: <b>#/telao/SUAPALAVRA</b>.</p>' +
      '<div class="row wrap" style="gap:8px"><a class="btn btn-primary" href="#/telao" target="_blank" rel="noopener">' + ico('i-eye') + ' Abrir o telão</a></div>' +
      '<p class="tiny">' + esc(link) + '</p>' +
      '</section>' + adminVotacaoBase() + '</div>';
  }
  function adminVotacaoBase() {
    var v = db.voting, elig = opcoesDeVoto();

    // quem concorre: os Heróis marcados como candidatos
    var projRows = allHeroes().map(function (x) {
      return '<div class="listrow">' +
        '<label class="row grow" style="gap:11px;cursor:pointer">' +
        '<input type="checkbox" data-cand="' + esc(x.hero.id) + '"' + (ehCandidato(x.hero) ? ' checked' : '') + ' style="width:19px;height:19px;accent-color:var(--brand-primary)">' +
        (x.hero.image ? '<img src="' + esc(x.hero.image) + '" alt="" style="width:34px;height:44px;object-fit:contain;object-position:bottom">' : '') +
        '<span class="grow"><span class="h3" style="font-size:14.5px">' + esc(x.hero.name) + '</span>' +
        '<br><span class="tiny">' + esc((x.project.group ? 'grupo ' + x.project.group + ' · ' : '') + x.project.name) + '</span></span></label>' +
        '</div>';
    }).join('');
    var tituloLista = '<h3 class="h3">Heróis candidatos na votação <span class="tiny" style="font-weight:400">(' + candidatos().length + ' marcados)</span></h3>';

    if (!remote.on) {
      return '<div class="stack-lg">' +
        '<section class="stack">' +
        '<h2 class="h2">Votação</h2>' +
        '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">' +
        '<b>Modo prévia.</b> Esta cópia do aplicativo não está ligada ao banco de votos, então a votação vale só no aparelho de quem está usando. ' +
        'Na cópia publicada — com o <b>config.js</b> preenchido — os botões abaixo abrem e fecham a votação para todo mundo ao mesmo tempo.</p></div>' +
        '<div class="field"><label for="kwv">Palavra-chave da prévia</label>' +
        '<form id="kwAdminForm" class="row wrap" style="gap:8px;align-items:flex-end">' +
        '<input id="kwv" name="kwv" type="text" value="' + esc(v.keyword || '') + '" autocapitalize="characters" style="flex:1 1 180px">' +
        '<button class="btn btn-primary" type="submit">' + ico('i-save') + ' Salvar</button></form></div>' +
        '</section>' +
        '<section class="stack">' + tituloLista + '<p class="small">Marque quem aparece na tela de votação.</p><div>' + projRows + '</div></section>' +
        '</div>';
    }

    var status = remote.erro ? 'Sem conexão' : (remote.aberta ? 'Aberta' : 'Fechada');

    var resBlock = resumoApuracao(0);

    return '<div class="stack-lg">' +
      '<section class="stack">' +
      '<h2 class="h2">Votação no site</h2>' +
      '<label class="chave-vis' + (remote.visivel ? ' is-on' : '') + '">' +
      '<input type="checkbox" data-act="toggleVisivel"' + (remote.visivel ? ' checked' : '') + (remote.aberta ? ' disabled' : '') + '>' +
      '<span class="cv-trilho" aria-hidden="true"><span></span></span>' +
      '<span class="cv-txt"><b>' + (remote.visivel ? 'A aba Votação está visível para todos' : 'A aba Votação está escondida') + '</b>' +
      '<span class="tiny">' + (remote.aberta ? 'Com a votação aberta, ela fica sempre visível.'
        : remote.visivel ? 'Quem abrir o site vê a aba Votação e os candidatos. A votação em si continua fechada até você abrir.'
        : 'Ninguém vê a aba Votação no site. Ligue quando quiser mostrar — abrir a votação também liga.') + '</span></span>' +
      '</label>' +
      '</section>' +
      '<section class="stack">' +
      '<h2 class="h2">Controle da votação</h2>' +
      '<div class="statgrid">' +
      '<div class="stat"><div class="sv" style="font-size:20px">' + status + '</div><div class="sl">Estado agora</div></div>' +
      '<div class="stat"><div class="sv" style="font-size:20px">' + (remote.resultadoPublico ? 'Público' : 'Privado') + '</div><div class="sl">Resultado</div></div>' +
      '<div class="stat"><div class="sv">' + elig.length + '</div><div class="sl">' + (votoEmHerois() ? 'Heróis candidatos' : 'Projetos elegíveis') + '</div></div>' +
      '</div>' +
      '<p class="small">Você já está autenticada com a senha da organização — não precisa informá-la de novo aqui. ' +
      'A votação pode ser aberta a qualquer momento, inclusive antes do dia do evento.</p>' +
      '<div class="row wrap" style="gap:8px">' +
      (remote.aberta
        ? '<button class="btn btn-danger" data-act="askClose">Encerrar votação</button>'
        : '<button class="btn btn-primary" data-act="askOpen">Abrir votação</button>') +
      '<button class="btn btn-outline" data-act="pubResult">' + (remote.resultadoPublico ? 'Ocultar resultado do público' : 'Publicar resultado') + '</button>' +
      '<button class="btn btn-outline" data-act="loadResult">Atualizar números</button>' +
      '</div>' +
      '<div class="zerar-votos">' +
      '<div><b>Zerar votos</b><p class="tiny">Apaga todos os votos e libera todos os aparelhos para votar de novo. Use depois dos ensaios. ' +
      (remote.aberta ? 'Para zerar, encerre a votação primeiro.' : 'Não dá para desfazer.') + '</p></div>' +
      '<button class="btn btn-danger btn-sm" data-act="askZerar"' + (remote.aberta ? ' disabled' : '') + '>' + ico('i-trash') + ' Zerar votos</button>' +
      '</div>' +
      (remote.aberta ? '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">A votação está aberta para todo mundo. O resultado continua invisível para o público até você publicá-lo.</p></div>' : '') +
      '</section>' +

      '<section class="stack">' +
      '<h3 class="h3">Palavra-chave do palco <span class="tiny" style="font-weight:400">(opcional)</span></h3>' +
      '<p class="small">Com uma palavra-chave definida, além do CPF o app pede a palavra anunciada no evento — só vota quem está na sala. ' +
      'Deixe em branco e salve para não exigir nada. Agora: <b>' + (remote.exigeChave ? 'exigindo palavra-chave' : 'só o CPF') + '</b>.</p>' +
      '<form id="palavraAdminForm" class="row wrap" style="gap:10px;align-items:flex-end">' +
      '<div class="field" style="flex:1 1 220px"><label for="palavraEvento">Nova palavra-chave</label>' +
      '<input id="palavraEvento" name="palavraEvento" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" ' +
      'placeholder="ex.: DENTEDELEAO" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600"></div>' +
      '<button class="btn btn-primary" type="submit" style="min-height:53px">' + ico('i-save') + ' Salvar</button></form>' +
      '<p class="tiny">Por segurança a palavra atual não é exibida. Salvar substitui a anterior.</p>' +
      '</section>' +

      '<section class="stack">' +
      '<div class="row-between"><h3 class="h3">Respostas da votação</h3>' +
      '<button class="btn btn-sm btn-outline" data-act="exportVotos">' + ico('i-save') + ' Baixar</button></div>' +
      '<p class="small">Um voto por CPF, garantido pelo banco. O aplicativo nunca guarda o número de ninguém — só um código embaralhado — então a apuração mostra os totais, não quem votou em quem.</p>' +
      resBlock + '</section>' +

      '<section class="stack">' +
      tituloLista +
      '<p class="small">Marque quem aparece na tela de votação. A mudança vai para o banco e vale para todo mundo na hora.</p>' +
      '<div>' + projRows + '</div></section>' +
      '</div>';
  }

  /* --- fotos: o mesmo gerenciador serve à aba Fotos e às equipes --- */
  function avisoFotos() {
    if (usaNuvem()) {
      return '<div class="banner banner-ok"><span class="bi">' + ico('i-vote') + '</span>' +
        '<p class="grow"><b>Salvo para todo mundo.</b> Cada foto que você acrescenta, tira ou reordena aqui vai para o banco de dados do evento e aparece na hora para quem abrir o site. Quem já está com ele aberto vê a mudança em até um minuto.</p></div>';
    }
    if (remote.on) {
      return '<div class="banner"><span class="bi">' + ico('i-info') + '</span>' +
        '<p class="grow">' + (nuvem.erro ? 'Não consegui falar com o banco de dados agora. Confira a internet — as fotos voltam a aparecer assim que a conexão voltar.' : 'Carregando as fotos do banco de dados…') + '</p></div>';
    }
    return '<div class="banner"><span class="bi">' + ico('i-info') + '</span>' +
      '<p class="grow">Este endereço ainda não está ligado ao banco de dados do evento, então as fotos que você mexe aqui ficam <b>só neste aparelho</b>. ' +
      'No site publicado com o banco ligado (o mesmo da votação), esta mesma tela passa a salvar para todo mundo, na hora.</p></div>';
  }

  function gerenciadorFotos(escopo) {
    var ph = fotosDoEscopo(escopo);
    var geral = escopo === 'geral';
    var capaP = geral ? fotoCapa(ph) : null;
    var nuvemOn = usaNuvem();
    var da = ' data-esc="' + esc(escopo) + '"';
    var enviando = fotoEnvio.ocupado && fotoEnvio.escopo === escopo;

    var lista = ph.length ? ph.map(function (p, i) {
      var ehCapa = !!capaP && (nuvemOn ? p[3] === capaP[3] : p[0] === capaP[0]);
      return '<div class="fotorow' + (ehCapa ? ' e-capa' : '') + '">' +
        '<span class="fr-im">' + imgFoto(p, '') + '</span>' +
        '<div class="fr-mid">' +
          '<label class="sr-only" for="cap' + i + '">Legenda da foto ' + (i + 1) + '</label>' +
          '<input id="cap' + i + '" name="cap' + i + '" type="text" placeholder="' + (geral ? 'Descrição da foto (opcional)' : 'Legenda (opcional)') + '" value="' + esc(p[2] || '') + '">' +
          '<div class="fr-opts">' +
            '<label><input type="checkbox" name="w' + i + '"' + (p[1] === 2 ? ' checked' : '') + '> ocupa duas colunas na aba Fotos</label>' +
            (geral ? '<button type="button" class="fr-capa' + (ehCapa ? ' on' : '') + '" data-act="fotoCapa" data-i="' + i + '"' + da + '>' +
              ico('i-eye') + (ehCapa ? 'foto de capa' : 'usar como capa') + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="fr-btns">' +
          '<button type="button" class="iconbtn" data-act="fotoSobe" data-i="' + i + '"' + da + ' aria-label="Subir foto ' + (i + 1) + '"' + (i === 0 ? ' disabled' : '') + '>' + ico('i-up') + '</button>' +
          '<button type="button" class="iconbtn" data-act="fotoDesce" data-i="' + i + '"' + da + ' aria-label="Descer foto ' + (i + 1) + '"' + (i === ph.length - 1 ? ' disabled' : '') + '>' + ico('i-down') + '</button>' +
          '<button type="button" class="iconbtn iconbtn-danger" data-act="fotoApaga" data-i="' + i + '"' + da + ' aria-label="Remover foto ' + (i + 1) + '">' + ico('i-trash') + '</button>' +
        '</div>' +
      '</div>';
    }).join('') : '<div class="empty"><h3 class="h3">Nenhuma foto ainda</h3>' +
        '<p>' + (geral ? 'Use os botões acima para acrescentar as fotos do ano.' : 'Use os botões acima para acrescentar as fotos desta equipe. Elas aparecem na página do projeto e também na aba Fotos.') + '</p></div>';

    return '<section class="stack">' +
        '<div class="row-between wrap" style="gap:12px">' +
          '<div><h3 class="h3">Fotos <span class="tiny">(' + ph.length + ')</span></h3>' +
          '<p class="small" style="margin-top:4px">' + (geral
            ? 'Acrescente, tire, reordene e escolha qual abre a página.'
            : 'Acrescente várias de uma vez, escreva uma legenda se quiser, tire e reordene.') + '</p></div>' +
          '<div class="row wrap" style="gap:8px">' +
            '<button type="button" class="btn btn-sm btn-primary" data-act="fotoEscolher"' + da + (fotoEnvio.ocupado ? ' disabled' : '') + '>' + ico('i-plus') +
              (enviando ? ' Enviando ' + fotoEnvio.feito + ' de ' + fotoEnvio.total + '…' : ' Adicionar do aparelho') + '</button>' +
            '<button type="button" class="btn btn-sm btn-outline" data-act="fotoLink"' + da + '>' + ico('i-plus') + ' Adicionar por link</button>' +
          '</div>' +
        '</div>' +
        '<input id="fotoInput" type="file" accept="image/*" multiple hidden' + da + '>' +
        '<p class="tiny">As fotos tiradas no celular são reduzidas aqui mesmo antes de seguir: o maior lado fica com cerca de 1600 pixels, em formato WebP, para carregar rápido sem perder a nitidez.</p>' +
        avisoFotos() +
        '<div class="fotolista">' + lista + '</div>' +
        (!nuvemOn && ph.length ? '<p class="tiny">Espaço usado por este conteúdo neste aparelho: <b class="num">' + tamanhoConteudo() + '</b>. O navegador costuma guardar até cerca de 5 MB.</p>' : '') +
        (ph.length ? '<button class="btn btn-primary" type="button" data-act="fotoSalvarTextos"' + da + '>' + ico('i-save') + (geral ? ' Salvar descrições' : ' Salvar legendas') + '</button>' : '') +
      '</section>';
  }

  /* --- retrospectiva --- */
  function adminRetro() {
    var r = db.retro || { title: '', lead: '', photos: [] };
    var nEquipe = fotosDoSite().length - fotosGerais().length;
    return '<div class="stack-lg">' +
      '<form id="retroForm" class="stack">' +
        '<h2 class="h2">A Trilha em 2026</h2>' +
        '<p class="small">É a aba <b>Fotos</b> do aplicativo. A primeira dobra usa a foto de capa; o restante aparece no mosaico. ' +
        'As fotos das equipes' + (nEquipe ? ' (' + nEquipe + ' agora)' : '') + ' também entram no mosaico, com o nome do projeto, e são cuidadas na aba <b>Projetos</b>, em cada projeto.</p>' +
        fieldText('rtitle', 'Título da página', r.title) +
        fieldArea('rlead', 'Texto de abertura', r.lead) +
        '<button class="btn btn-primary" type="submit">' + ico('i-save') + ' Salvar título e texto</button>' +
      '</form>' +
      gerenciadorFotos('geral') +
    '</div>';
  }

  var fotoEnvio = { ocupado: false, feito: 0, total: 0, escopo: '' };

  /* quanto do armazenamento local o conteúdo já ocupa */
  function tamanhoConteudo() {
    try {
      var n = JSON.stringify(db).length;
      return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
    } catch (e) { return '—'; }
  }

  /* grava o conteúdo avisando quando o navegador recusa por falta de espaço */
  function salvarConteudo() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { return false; }
  }

  /* reduz a foto no próprio aparelho antes de enviar: cerca de 1600 px no
     maior lado, em WebP. Foto de celular chega com 4000 px e vários MB; assim
     ela segue leve e continua nítida na tela. Navegador que não gera WebP
     (Safari antigo) cai para JPEG.                                         */
  var FOTO_MAX = 1600;
  function prepararFoto(file, pronto) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      var f = Math.min(1, FOTO_MAX / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * f)), ch = Math.max(1, Math.round(h * f));
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var cx = cv.getContext('2d');
      cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cw, ch);
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, cw, ch);
      var dado = '';
      try { dado = cv.toDataURL('image/webp', 0.8); } catch (e) { dado = ''; }
      if (dado.indexOf('data:image/webp') !== 0) dado = cv.toDataURL('image/jpeg', 0.8);
      // o banco aceita até ~1,6 MB por foto; se passar, reduz a qualidade
      if (dado.length > 1500000) {
        try { dado = cv.toDataURL('image/webp', 0.62); } catch (e2) { /* fica a anterior */ }
        if (dado.indexOf('data:image/webp') !== 0) dado = cv.toDataURL('image/jpeg', 0.62);
      }
      URL.revokeObjectURL(url);
      pronto(dado, cw, ch);
    };
    img.onerror = function () { URL.revokeObjectURL(url); pronto('', 0, 0); };
    img.src = url;
  }

  // manda as fotos uma a uma para o banco, na ordem em que foram escolhidas
  function enviarParaNuvem(novas, escopo) {
    fotoEnvio = { ocupado: true, feito: 0, total: novas.length, escopo: escopo };
    render();
    var falhou = '';
    var cadeia = Promise.resolve();
    novas.forEach(function (n) {
      cadeia = cadeia.then(function () {
        if (falhou) return;
        return rpcFoto('adicionar_foto', { p_dado: n[0], p_legenda: n[2] || '', p_larga: n[1] === 2, p_projeto: escopo === 'geral' ? null : escopo })
          .then(function () { fotoEnvio.feito++; render(); })
          .catch(function (e) { falhou = e && e.message; });
      });
    });
    cadeia.then(function () {
      var ok = fotoEnvio.feito;
      fotoEnvio = { ocupado: false, feito: 0, total: 0, escopo: '' };
      return depoisDeFoto(falhou
        ? (ok ? ok + ' foto(s) enviada(s). ' : '') + erroFoto(falhou)
        : (ok === 1 ? 'Foto publicada para todo mundo.' : ok + ' fotos publicadas para todo mundo.'));
    });
  }

  function adicionarFotos(files, escopo) {
    escopo = escopo || 'geral';
    var lista = Array.prototype.slice.call(files).filter(function (f) { return /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name || ''); });
    if (!lista.length) { toast('Escolha arquivos de imagem.'); return; }
    var restantes = lista.length, novas = [], lidas = [];
    toast(lista.length === 1 ? 'Preparando a foto…' : 'Preparando ' + lista.length + ' fotos…');
    lista.forEach(function (f, idx) {
      prepararFoto(f, function (dado, w, h) {
        // guarda na posição escolhida, mesmo que as fotos terminem fora de ordem
        if (dado) lidas[idx] = [dado, w >= h ? 2 : 1, ''];
        restantes--;
        if (restantes) return;
        novas = lidas.filter(Boolean);
        if (!novas.length) { toast('Não consegui ler essas imagens.'); return; }
        if (remote.on) { enviarParaNuvem(novas, escopo); return; }
        if (escopo !== 'geral') novas.forEach(function (n) { n[3] = null; n[4] = false; n[5] = escopo; });
        db.retro = db.retro || { photos: [] };
        db.retro.photos = (db.retro.photos || []).concat(novas);
        if (!salvarConteudo()) {
          db.retro.photos = db.retro.photos.slice(0, db.retro.photos.length - novas.length);
          salvarConteudo();
          toast('Não coube: o armazenamento deste navegador está cheio. Remova fotos antigas ou use “Adicionar por link”.');
          render(); return;
        }
        toast(novas.length === 1 ? 'Foto acrescentada.' : novas.length + ' fotos acrescentadas.');
        render();
      });
    });
  }


  /* --- dados --- */
  function adminDados() {
    var c = db.clock, d = new Date(c.baseSim + (c.simulated ? (Date.now() - c.baseReal) : 0));
    var localIso = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    var a = agora();
    var fase = eventPhase();
    var faseTxt = fase === 'dia' ? 'É o dia do evento — a programação está correndo ao vivo.'
      : fase === 'depois' ? 'O evento já aconteceu.'
      : 'Ainda não é o dia. A programação aparece completa, mas sem “Acontecendo agora”.';

    return '<div class="stack-lg">' +
      '<section class="stack">' +
      '<h2 class="h2">Relógio</h2>' +
      '<div class="statgrid">' +
      '<div class="stat"><div class="sv">' + pad2(a.hh) + ':' + pad2(a.mm) + '</div><div class="sl">Agora em Curitiba</div></div>' +
      '<div class="stat"><div class="sv" style="font-size:19px">' + esc(a.iso.split('-').reverse().join('/')) + '</div><div class="sl">Data de hoje</div></div>' +
      '</div>' +
      '<p class="small">O aplicativo lê sempre o horário de Curitiba, não o do aparelho de quem acessa. ' + esc(faseTxt) + '</p>' +
      (c.simulated ? '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">' +
        '<b>O ensaio está ligado.</b> As telas estão vendo um horário fingido. <b>Desligue antes de enviar o link</b>, senão quem abrir vai ver “Acontecendo agora” fora de hora.</p></div>' : '') +
      '<h3 class="h3" style="margin-top:6px">Ensaio do dia do evento</h3>' +
      '<p class="small">Serve só para a organização conferir, antes de 14/11, como ficam as telas “Acontecendo agora”. Vale apenas neste aparelho — não muda nada para quem abre o link.</p>' +
      '<label class="checkline"><input type="checkbox" data-act="toggleClock"' + (c.simulated ? ' checked' : '') + '>' +
      '<span><b style="font-size:14px">Ligar o ensaio do relógio</b><br><span class="tiny">Deixe desligado para valer o horário de verdade.</span></span></label>' +
      '<div class="field"><label for="simTime">Data e hora do ensaio</label>' +
      '<input id="simTime" type="datetime-local" value="' + esc(localIso) + '" data-act="setClock"></div>' +
      '</section>' +

      '<section class="stack">' +
      '<h2 class="h2">Migrar para o banco real</h2>' +
      '<p class="small">Exporte tudo que você cadastrar aqui. O arquivo JSON segue o modelo de dados previsto (events, schedule_items, projects, heroes, project_members, voting_sessions) e pode ser importado direto no banco quando o aplicativo for publicado.</p>' +
      '<div class="row wrap" style="gap:8px">' +
      '<button class="btn btn-outline" data-act="exportJson">' + ico('i-save') + ' Exportar conteúdo (JSON)</button>' +
      '<button class="btn btn-outline" data-act="importJson">Importar conteúdo</button>' +
      '</div></section>' +

      '<section class="dangerzone stack">' +
      '<h3 class="h3">Zona de risco</h3>' +
      '<p class="small">Estas ações afetam apenas este aparelho, nesta prévia.</p>' +
      '<div class="row wrap" style="gap:8px">' +
      '<button class="btn btn-sm btn-outline" data-act="signOut">Sair da identificação</button>' +
      '<button class="btn btn-sm btn-outline" data-act="clearVotes">Refazer teste da votação</button>' +
      '<button class="btn btn-sm btn-danger" data-act="resetAll">Restaurar demonstração</button>' +
      '</div></section></div>';
  }

  /* ----------------------------- editor (sheet) --------------------------- */
  var FIELDS = {
    schedule: function (o) {
      return '<div class="row" style="gap:10px">' +
        '<div class="grow">' + fieldText('start', 'Início', o.start, '', 'time') + '</div>' +
        '<div class="grow">' + fieldText('end', 'Fim', o.end, '', 'time') + '</div></div>' +
        fieldText('name', 'Nome da atividade', o.name) +
        fieldArea('desc', 'Descrição breve', o.desc) +
        fieldText('place', 'Local, sala ou palco', o.place, 'Opcional.');
    },
    project: function (o) {
      var opts = db.projects; void opts;
      return fieldText('name', 'Nome do projeto', o.name) +
        fieldArea('tagline', 'Frase curta que explica o projeto', o.tagline) +
        '<div class="row" style="gap:10px">' +
        '<div class="grow">' + fieldText('slot', 'Horário da apresentação', o.slot, '', 'time') + '</div>' +
        '<div class="grow">' + fieldText('block', 'Bloco', o.block, 'Manhã ou Tarde.') + '</div></div>' +
        fieldText('category', 'Categoria', o.category, 'Opcional.') +
        fieldText('group', 'Grupo', o.group, 'Ex.: ABASC, Educa, INH, Senhorinha.') +
        ((o.teams || []).length
          ? '<p class="small">Este projeto junta ' + extenso(o.teams.length, true) + ' equipes. Os trilheiros e os valores ficam em cada uma.</p>' +
            o.teams.map(function (t, i) {
              var h = (o.heroes || []).filter(function (x) { return x.id === t.hero; })[0];
              return '<fieldset class="equipe-campos"><legend>' + esc(t.label || ('Equipe ' + (i + 1))) + (h ? ' · Herói ' + esc(h.name) : '') + '</legend>' +
                fieldText('team' + i + '_label', 'Nome da equipe', t.label) +
                fieldText('team' + i + '_members', 'Trilheiros', (t.members || []).join(', '), 'Separe por vírgula.') +
                fieldText('team' + i + '_values', 'Valores', (t.values || []).join(', '), 'Separe por vírgula.') +
                '</fieldset>';
            }).join('')
          : fieldText('members', 'Trilheiros do grupo', (o.members || []).join(', '), 'Separe por vírgula.') +
            fieldText('values', 'Valores do grupo', (o.values || []).join(', '), 'Separe por vírgula.')) +
        fieldImg('cover', 'Imagem de capa', o.cover, 'Se ficar vazia, o app usa a ilustração do Herói.') +
        fieldArea('meaning', 'Significado do projeto', o.meaning) +
        ((o.teams || []).length ? fieldArea('integration', 'Integração dos projetos', o.integration) : '') +
        fieldArea('problem', 'Problema identificado', o.problem) +
        fieldArea('why', 'Por que esse problema importa', o.why) +
        fieldArea('solution', 'Solução proposta', o.solution) +
        fieldArea('how', 'Como funciona (ações)', o.how, 'Uma ação por linha: cada linha vira um item da lista.') +
        fieldArea('impact', 'Impacto que pretende gerar', o.impact, 'Um item por linha.') +
        fieldText('video', 'Vídeo do projeto', o.video, 'Opcional — cole o link do YouTube.') +
        '<label class="checkline"><input type="checkbox" name="eligible"' + (o.eligible !== false ? ' checked' : '') + '>' +
        '<span><b style="font-size:14px">Participa da votação</b></span></label>';
    },
    hero: function (o) {
      var sel = '<div class="field"><label for="projectId">Projeto</label>' +
        '<select id="projectId" name="projectId"><option value="">— selecione —</option>' +
        db.projects.map(function (p) {
          return '<option value="' + esc(p.id) + '"' + (o.projectId === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>';
        }).join('') + '</select></div>';
      return fieldText('name', 'Nome do Herói', o.name) +
        fieldImg('image', 'Ilustração do Herói', o.image) +
        fieldText('inspiration', 'Pessoa de inspiração / significado do nome', o.inspiration) +
        fieldArea('story', 'História do Herói', o.story) +
        fieldText('video', 'Vídeo da campanha', o.video,
          'Cole o link do YouTube (ou só o código do vídeo). Deixe em branco se este Herói ainda não tem vídeo.') + sel;
    }
  };
  var TITLES = { schedule: 'atividade', project: 'projeto', hero: 'Herói' };

  function editorSheet() {
    var e = admin.editor, kind = e.kind, o = e.data;
    return '<div class="sheet-bg" id="sheetBg" role="dialog" aria-modal="true" aria-labelledby="edTitle">' +
      '<form class="sheet stack" id="editorForm">' +
      '<span class="grab" aria-hidden="true"></span>' +
      '<h2 id="edTitle" class="h2">' + (e.isNew ? 'Nova ' : 'Editar ') + esc(TITLES[kind]) + '</h2>' +
      FIELDS[kind](o) +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Salvar</button>' +
      '<button class="btn btn-block btn-ghost" type="button" data-act="closeSheet">Cancelar</button>' +
      '</form></div>';
  }

  function confirmSheetGeneric(c) {
    return '<div class="sheet-bg" id="sheetBg" role="dialog" aria-modal="true" aria-labelledby="cfTitle">' +
      '<div class="sheet stack">' +
      '<span class="grab" aria-hidden="true"></span>' +
      '<h2 id="cfTitle" class="h2">' + esc(c.title) + '</h2>' +
      '<p class="lead">' + esc(c.body) + '</p>' +
      '<button class="btn btn-block btn-lg ' + (c.danger ? 'btn-danger' : 'btn-primary') + '" data-act="confirmYes">' + esc(c.yes) + '</button>' +
      '<button class="btn btn-block btn-ghost" data-act="closeSheet">Cancelar</button>' +
      '</div></div>';
  }

  function copySheet(c) {
    return '<div class="sheet-bg" id="sheetBg" role="dialog" aria-modal="true" aria-labelledby="cpTitle">' +
      '<div class="sheet stack">' +
      '<span class="grab" aria-hidden="true"></span>' +
      '<h2 id="cpTitle" class="h2">' + esc(c.title) + '</h2>' +
      '<p class="small">' + esc(c.hint) + '</p>' +
      '<textarea class="copyarea" id="copyBox"' + (c.editable ? '' : ' readonly') + '>' + esc(c.text) + '</textarea>' +
      (c.editable
        ? '<button class="btn btn-primary btn-block" data-act="' + esc(c.acao || 'doImport') + '">' + esc(c.botao || 'Importar') + '</button>'
        : '<button class="btn btn-primary btn-block" data-act="copyText">Copiar</button>') +
      '<button class="btn btn-block btn-ghost" data-act="closeSheet">Fechar</button>' +
      '</div></div>';
  }

  /* ================================ TELÃO ==================================
     Tela para o projetor: o QR Code grande que leva direto à votação e uma
     animação de votos chegando aos Heróis candidatos. A animação é
     INTERPRETATIVA: os "votos" são sorteados aqui mesmo, não vêm do banco,
     e ela nunca mostra números, posição nem quem está na frente — de tempos
     em tempos as barras esvaziam e recomeçam. O aviso fica sempre na tela.
     A palavra-chave do palco pode ir no endereço: #/telao/PALAVRA.         */
  var telao = { timer: null, raf: null, bolhas: null, ultimo: 0, anim: {}, qrUrl: '', qrSvg: '', libPedida: false };

  function siteBase() {
    var oficial = String(window.IDL_SITE_URL || '').trim().replace(/\/+$/, '');
    return oficial || (location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/+$/, ''));
  }
  function telaoUrlVoto() { return siteBase() + '/#/votacao'; }
  function telaoQrSvg(texto) {
    if (typeof window.qrcode !== 'function') return '';
    var q = window.qrcode(0, 'M');
    q.addData(texto); q.make();
    var n = q.getModuleCount(), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR Code para a votação">' +
      '<rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="#2e006a"/></svg>';
  }
  function telaoGarantirQr() {
    var url = telaoUrlVoto();
    if (telao.qrSvg && telao.qrUrl === url) return;
    if (typeof window.qrcode === 'function') { telao.qrUrl = url; telao.qrSvg = telaoQrSvg(url); return; }
    if (telao.libPedida) return;
    telao.libPedida = true;
    var sc = document.createElement('script');
    sc.src = 'vendor/qrcode.js';
    sc.onload = function () { telao.qrUrl = url; telao.qrSvg = telaoQrSvg(url); if (route.name === 'telao') render(); };
    document.head.appendChild(sc);
  }

  // sementes que atravessam o fundo devagar, de baixo para cima
  function telaoFundo() {
    var out = '';
    for (var i = 0; i < 16; i++) {
      var x = (i * 61) % 100, tam = 18 + (i * 13) % 30, dur = 16 + (i * 7) % 14, atraso = -((i * 5.3) % dur);
      out += '<span class="tl-fundo-s" style="left:' + x + '%;--t:' + tam + 'px;--dur:' + dur + 's;--atr:' + atraso.toFixed(1) +
        's;--balanco:' + (20 + (i * 11) % 50) + 'px">' + sementeSvg() + '</span>';
    }
    return '<span class="tl-fundo" aria-hidden="true">' + out + '</span>';
  }
  function telaoPalavraDoBanco() {
    if (!remote.on || !localState.admin || !localState.adminKey || route.param) return;
    if (telao.palavraEm && Date.now() - telao.palavraEm < 30000) return;
    telao.palavraEm = Date.now();
    sbRpc('ler_chave_evento', { p_chave: localState.adminKey }).then(function (r) {
      var p = r && r.ok ? (r.palavra || '') : '';
      if (p !== telao.palavra) { telao.palavra = p; if (route.name === 'telao') render(); }
    }).catch(function () {});
  }
  function viewTelao() {
    telaoGarantirQr();
    var cs = candidatos();
    if (!cs.length) cs = opcoesDeVoto().slice(0, 6);
    // a palavra vem do endereço (#/telao/PALAVRA) ou, se este aparelho estiver
    // com o painel aberto, do próprio banco
    var palavra = route.param ? decodeURIComponent(route.param).trim() : (remote.exigeChave ? telao.palavra : '');
    var aberta = votacaoAberta();
    var estado = aberta
      ? '<span class="tl-estado is-aberta"><i></i>Votação aberta</span>'
      : '<span class="tl-estado"><i></i>' + esc(db.event.votacaoAbre ? 'A votação abre às ' + db.event.votacaoAbre : 'A votação abre em breve') + '</span>';
    var host = siteBase().replace(/^https?:\/\//, '') || 'o site do evento';

    var cartoes = cs.map(function (o) {
      return '<li class="tl-cand" data-tl="' + esc(o.id) + '">' +
        '<span class="tl-quadro">' + (o.image ? '<img src="' + esc(o.image) + '" alt="">' : sementeSvg()) + '</span>' +
        '<span class="tl-nome">' + esc(o.name) + '</span>' +
        '<span class="tl-tubo" aria-hidden="true"><span class="tl-enche">' +
          '<svg class="tl-onda" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V20 H0Z"/></svg>' +
        '</span></span>' +
        '<span class="tl-halo" aria-hidden="true"></span>' +
        '</li>';
    }).join('');

    return '<div class="telao">' +
      telaoFundo() +
      '<header class="tl-topo">' +
        '<span class="tl-logos"><img src="img/kv/trilhei.webp" alt="Trilhei"><i aria-hidden="true"></i><img src="img/kv/idltech.webp" alt="Programa IDL Tech"></span>' +
        estado +
      '</header>' +
      '<div class="tl-corpo">' +
        '<section class="tl-palco">' +
          '<span class="eyebrow">' + esc(db.event.name || 'Banca Final IDL Tech') + '</span>' +
          '<h1 class="tl-tit">Escolha o Herói da Trilha 2026</h1>' +
          '<ol class="tl-cands" style="--n:' + cs.length + '">' + cartoes + '</ol>' +
          '<p class="tl-aviso">' + ico('i-info') + '<span><b>Animação ilustrativa.</b> As barras sobem e descem ao acaso: não mostram os votos reais nem quem está na frente. O resultado só é revelado no palco.</span></p>' +
        '</section>' +
        '<aside class="tl-qr">' +
          '<span class="tl-qr-cab">Aponte a câmera do celular</span>' +
          '<div class="tl-qr-img">' + (telao.qrSvg || '<span class="tl-qr-carrega">Gerando o QR Code…</span>') + '</div>' +
          '<span class="tl-qr-url">' + esc(host) + '</span>' +
          (palavra ? '<div class="tl-palavra"><span>Palavra-chave</span><b>' + esc(palavra) + '</b></div>' : '') +
          '<p class="tl-qr-pe">Informe seu CPF, escolha o seu Herói e confirme. Um voto por pessoa.</p>' +
        '</aside>' +
      '</div>' +
      '<button class="tl-tela-cheia" data-act="telaoTelaCheia" title="Tela cheia">Tela cheia</button>' +
      '</div>';
  }

  /* A animação: cada Herói tem um "nível" que sobe e desce o tempo todo —
     duas ondas lentas somadas, mais empurrões aleatórios para cima (semente
     chegando) e para baixo (semente indo embora) que se desfazem sozinhos.
     Nada acumula: ninguém fica na frente por muito tempo e não há números. */
  function telaoAnimEstado(id) {
    var a = telao.anim[id];
    if (!a) {
      a = telao.anim[id] = {
        f1: .18 + Math.random() * .22, f2: .5 + Math.random() * .5,
        p1: Math.random() * 6.3, p2: Math.random() * 6.3,
        base: 42 + Math.random() * 12, imp: 0, nivel: 40
      };
    }
    return a;
  }
  function telaoSemente(el, dir) {
    var tubo = el.querySelector('.tl-tubo');
    if (!tubo) return;
    var sem = document.createElement('span');
    sem.className = 'tl-voa ' + (dir > 0 ? 'tl-sobe' : 'tl-desce');
    sem.style.setProperty('--dx', ((Math.random() - .5) * 90).toFixed(0) + 'px');
    sem.style.setProperty('--gx', ((Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 80)).toFixed(0) + 'px');
    sem.innerHTML = sementeSvg();
    el.appendChild(sem);
    setTimeout(function () { if (sem.parentNode) sem.parentNode.removeChild(sem); }, 2300);
  }
  function telaoBolha(el) {
    var enche = el.querySelector('.tl-enche');
    if (!enche) return;
    var bo = document.createElement('i');
    bo.className = 'tl-bolha';
    bo.style.left = (15 + Math.random() * 70).toFixed(0) + '%';
    bo.style.setProperty('--s', (4 + Math.random() * 7).toFixed(0) + 'px');
    bo.style.animationDuration = (1.6 + Math.random() * 1.6).toFixed(2) + 's';
    enche.appendChild(bo);
    setTimeout(function () { if (bo.parentNode) bo.parentNode.removeChild(bo); }, 3400);
  }
  // empurrão aleatório: na maioria das vezes para cima, às vezes para baixo
  function telaoEmpurrao() {
    var itens = document.querySelectorAll('.tl-cand');
    if (!itens.length) return;
    var el = itens[Math.floor(Math.random() * itens.length)];
    var a = telaoAnimEstado(el.getAttribute('data-tl'));
    var dir = Math.random() < .68 ? 1 : -1;
    a.imp += dir * (9 + Math.random() * 14);
    a.imp = Math.max(-30, Math.min(34, a.imp));
    telaoSemente(el, dir);
    if (dir > 0) { el.classList.remove('tl-pulso'); void el.offsetWidth; el.classList.add('tl-pulso'); }
    else { el.classList.remove('tl-recua'); void el.offsetWidth; el.classList.add('tl-recua'); }
  }
  function telaoQuadro(ts) {
    if (route.name !== 'telao') { telao.raf = null; return; }
    var t = ts / 1000, dt = telao.ultimo ? Math.min(.1, t - telao.ultimo) : .016;
    telao.ultimo = t;
    Array.prototype.forEach.call(document.querySelectorAll('.tl-cand'), function (el) {
      var a = telaoAnimEstado(el.getAttribute('data-tl'));
      a.imp *= Math.pow(.55, dt);   // o empurrão some em poucos segundos
      var alvo = a.base + 20 * Math.sin(t * a.f1 + a.p1) + 8 * Math.sin(t * a.f2 + a.p2) + a.imp;
      alvo = Math.max(10, Math.min(94, alvo));
      a.nivel += (alvo - a.nivel) * Math.min(1, dt * 3.2);
      var enche = el.querySelector('.tl-enche');
      if (enche) enche.style.transform = 'translateY(' + (100 - a.nivel).toFixed(2) + '%)';
      var q = el.querySelector('.tl-quadro');
      if (q) q.style.transform = 'translateY(' + ((50 - a.nivel) * .22).toFixed(1) + 'px) rotate(' + (Math.sin(t * a.f2 * 1.3 + a.p1) * 1.6).toFixed(2) + 'deg)';
      el.style.setProperty('--brilho', (a.nivel / 100).toFixed(3));
    });
    telao.raf = requestAnimationFrame(telaoQuadro);
  }
  function telaoMontar() {
    if (route.name !== 'telao') {
      if (telao.timer) { clearTimeout(telao.timer); telao.timer = null; }
      if (telao.bolhas) { clearInterval(telao.bolhas); telao.bolhas = null; }
      return;
    }
    if (!telao.anim) telao.anim = {};
    telaoPalavraDoBanco();
    if (!telao.raf) { telao.ultimo = 0; telao.raf = requestAnimationFrame(telaoQuadro); }
    if (!telao.bolhas) {
      telao.bolhas = setInterval(function () {
        if (route.name !== 'telao') return;
        Array.prototype.forEach.call(document.querySelectorAll('.tl-cand'), function (el) {
          if (Math.random() < .55) telaoBolha(el);
        });
      }, 420);
    }
    if (telao.timer) return;
    (function proximo() {
      if (route.name !== 'telao') { telao.timer = null; return; }
      telaoEmpurrao();
      telao.timer = setTimeout(proximo, 260 + Math.random() * 640);
    })();
  }

  /* ================================ RENDER =============================== */
  var lastLiveId = null;
  var lastPhase = null;   // 'antes' · 'dia' · 'depois'

  function currentView() {
    switch (route.name) {
      case 'programacao': return viewPrograma();
      case 'projetos': return viewProjetos('projetos');
      case 'herois': return viewProjetos('herois');
      case 'projeto': return viewProjeto(route.param);
      case 'heroi': return viewHeroi(route.param);
      case 'votacao': return mostraVotacao() ? viewVotacao() : viewHome();
      case 'trilha2026': return viewRetro();
      case 'trilhei': return viewTrilhei();
      case 'resultado': return viewResultado(localState.admin);
      case 'admin': return viewAdmin();
      case 'telao': return viewTelao();
      default: return viewHome();
    }
  }


  /* ---- revelação suave das seções, uma vez, ao entrarem na tela ---- */
  var observador = null, redeDeSeguranca = null;
  function revelar(raiz) {
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var alvos = raiz.querySelectorAll('.faixa > .cont, .corpo > *, .detalhe-texto > *, .lateral > *');
    function mostrarTudo() {
      Array.prototype.forEach.call(alvos, function (el) { el.classList.add('vis'); });
    }
    if (reduz || !('IntersectionObserver' in window)) { mostrarTudo(); return; }
    if (observador) observador.disconnect();
    if (redeDeSeguranca) clearTimeout(redeDeSeguranca);
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); observador.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(alvos, function (el) {
      el.classList.add('revela');
      observador.observe(el);
    });
    // rede de segurança: nada pode ficar invisível, aconteça o que acontecer
    redeDeSeguranca = setTimeout(mostrarTudo, 4000);
  }

  /* ---- foto da turma: posição de cada Herói ----
     O rosto nem sempre fica no meio da ilustração (capa, escudo, braço
     erguido). focoDoRosto() lê a própria imagem e acha o centro da cabeça,
     para que os rostos fiquem espaçados por igual.                         */
  var focos = {};
  function focoDoRosto(img) {
    var src = img.getAttribute('src') || '';
    if (focos[src] != null) return focos[src];
    var f = 0.5;
    try {
      var H = 240, W = Math.max(1, Math.round(img.naturalWidth * H / img.naturalHeight));
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, W, H);
      var d = cx.getImageData(0, 0, W, H).data;
      var topo = -1, y, x;
      for (y = 0; y < H && topo < 0; y++) for (x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { topo = y; break; }
      if (topo >= 0) {
        var alt = H - topo, centros = [];
        for (y = Math.round(topo + alt * 0.10); y < topo + alt * 0.20; y++) {
          var melhor = 0, ini = 0, corrida = 0, comeco = 0;
          for (x = 0; x < W; x++) {
            if (d[(y * W + x) * 4 + 3] > 40) { if (!corrida) comeco = x; corrida++; if (corrida > melhor) { melhor = corrida; ini = comeco; } }
            else corrida = 0;
          }
          if (melhor) centros.push((ini + melhor / 2) / W);
        }
        if (centros.length) { centros.sort(function (a, b) { return a - b; }); f = centros[Math.floor(centros.length / 2)]; }
      }
    } catch (e) { f = 0.5; }   // imagem de outro endereço: fica no meio
    focos[src] = clamp(f, 0.25, 0.75);
    return focos[src];
  }

  function arrumarTurma(t) {
    var ps = Array.prototype.slice.call(t.querySelectorAll('.turma-p'));
    var rolo = t.parentNode;
    var n = ps.length;
    var S = 0.46;        // espaço de cada rosto, em fração da altura
    var SOBE = 0.32;     // quanto cada fileira de trás sobe
    // celular, turma do Início: três fileiras bem separadas e Heróis maiores,
    // para dar para tocar em cada um com folga (a foto desliza para o lado)
    var celHome = t.classList.contains('turma-home') && window.innerWidth < 760;
    if (celHome) { S = 0.66; SOBE = 0.56; }
    var hMax = +t.getAttribute('data-hmax') || 300;
    t.style.width = '';
    var W = (rolo && rolo.clientWidth) || t.clientWidth;
    if (!n || !W) return;
    var r = n < 4 ? 1 : (celHome && n >= 7 ? 3 : 2);
    var maior = Math.ceil(n / r);
    var h = Math.min(hMax, W / (maior * S + S));
    // fora do início, a turma não desliza: no celular ganha uma terceira fileira e cabe inteira
    var podeRolar = t.classList.contains('turma-home');
    if (!podeRolar && h < 150 && n >= 7) {
      r = 3; maior = Math.ceil(n / r);
      h = Math.min(hMax, W / (maior * S + S));
    }
    // tela estreita: a foto mantém duas fileiras num tamanho bom e passa a
    // deslizar para o lado, em vez de espremer os Heróis
    var rola = podeRolar && h < 150;
    if (rola) {
      h = Math.min(hMax, celHome ? 175 : 190);
      W = Math.ceil((maior * S + S) * h);
      t.style.width = W + 'px';
    }
    if (rolo) {
      rolo.classList.toggle('rola', rola);
      var cx0 = rolo.parentNode;
      if (cx0 && cx0.classList.contains('rolo-caixa')) { cx0.classList.toggle('tem-rola', rola); roloEstado(rolo); }
    }
    var filas = [];
    for (var k0 = 0; k0 < r; k0++) filas.push([]);
    ps.forEach(function (p, i) { filas[i % r].push(p); });
    var alturaTotal = 0;
    filas.forEach(function (fila, k) {
      var escala = 1 - 0.05 * k, base = k * SOBE * h, c = fila.length;
      fila.forEach(function (p, j) {
        var img = p.querySelector('img');
        var asp = (img && img.naturalWidth) ? img.naturalWidth / img.naturalHeight : 0.45;
        var varia = 0.97 + ((j * 7 + k * 3) % 5) * 0.015;     // alturas um pouco diferentes, como gente de verdade
        var alt = h * escala * varia, larg = S * h;
        var cx = W / 2 + (j - (c - 1) / 2) * S * h;
        p.style.left = (cx - larg / 2).toFixed(1) + 'px';
        p.style.bottom = base.toFixed(1) + 'px';
        p.style.width = larg.toFixed(1) + 'px';
        p.style.height = alt.toFixed(1) + 'px';
        // na mesma fileira, os mais estreitos ficam na frente dos mais largos
        p.style.zIndex = String((r - k) * 100 + Math.round((1 - Math.min(asp, 1)) * 50));
        if (img) {
          var f = (img.complete && img.naturalWidth) ? focoDoRosto(img) : 0.5;
          img.style.transform = 'translateX(' + (-f * 100).toFixed(1) + '%)';
        }
        alturaTotal = Math.max(alturaTotal, base + alt);
      });
    });
    t.style.height = Math.ceil(alturaTotal + 6) + 'px';
    t.classList.add('turma-pronta');
  }
  // setas, sombras e trilho acompanham a posição do deslize
  function roloEstado(rolo) {
    var cx = rolo.parentNode;
    if (!cx || !cx.classList.contains('rolo-caixa')) return;
    var max = rolo.scrollWidth - rolo.clientWidth;
    var x = rolo.scrollLeft;
    cx.classList.toggle('no-inicio', x <= 4);
    cx.classList.toggle('no-fim', x >= max - 4);
    if (x > 24) cx.classList.add('ja-rolou');
    var tr = cx.nextElementSibling;
    if (tr && tr.classList.contains('rolo-trilho')) {
      tr.style.display = cx.classList.contains('tem-rola') ? '' : 'none';
      var b = tr.firstElementChild;
      var vis = rolo.clientWidth / Math.max(1, rolo.scrollWidth);
      if (b) { b.style.width = (vis * 100).toFixed(1) + '%'; b.style.left = (max > 0 ? (x / max) * (1 - vis) * 100 : 0).toFixed(1) + '%'; }
    }
  }
  document.addEventListener('scroll', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('turma-rolo')) roloEstado(t);
  }, true);
  // na primeira vez que aparece, a foto "cutuca" para o lado, mostrando que desliza
  var roloVisto = null;
  function roloCutucar(raiz) {
    if (!('IntersectionObserver' in window)) return;
    if (roloVisto) roloVisto.disconnect();
    roloVisto = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        roloVisto.unobserve(e.target);
        var r = e.target, cx = r.parentNode;
        if (!cx.classList.contains('tem-rola') || r.scrollLeft > 4) return;
        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        setTimeout(function () {
          r.scrollTo({ left: 90, behavior: 'smooth' });
          setTimeout(function () { r.scrollTo({ left: 0, behavior: 'smooth' }); setTimeout(function () { cx.classList.remove('ja-rolou'); }, 500); }, 650);
        }, 500);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call((raiz || document).querySelectorAll('.turma-rolo'), function (r) { roloVisto.observe(r); });
  }

  function ajustarTurmas(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll('.turma'), function (t) {
      Array.prototype.forEach.call(t.querySelectorAll('img'), function (im) {
        if (!im.complete) im.addEventListener('load', function () { arrumarTurma(t); }, { once: true });
      });
      arrumarTurma(t);
    });
  }
  var turmaTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(turmaTimer);
    turmaTimer = setTimeout(function () { ajustarTurmas(); }, 150);
  });

  // chamada fixa para votar, em todas as telas, enquanto a votação estiver aberta
  function ctaVotar() {
    if (!votacaoAberta() || localState.voted) return '';
    if (route.name === 'votacao' || route.name === 'admin' || route.name === 'telao' || route.name === 'resultado') return '';
    return '<a class="cta-votar" href="#/votacao"><span class="cta-ponto" aria-hidden="true"></span>' +
      '<span><b>A votação está aberta</b><span class="cta-sub">Toque para escolher o seu Herói</span></span>' + ico('i-chev') + '</a>';
  }

  function render() {
    renderBrand(); renderNav();
    var app = $('#app');
    var ehTelao = route.name === 'telao';
    // o site é aberto a todos: o CPF só é pedido na tela de votação, quando ela abre
    var gated = false;
    document.body.classList.toggle('is-gated', gated);
    document.body.classList.toggle('is-telao', ehTelao);
    var adminFull = route.name === 'admin' && localState.admin;
    document.body.classList.toggle('is-painel', adminFull);
    app.className = gated || ehTelao ? '' : (adminFull ? '' : 'shell');
    app.innerHTML = (gated ? viewEntrada() : currentView()) + ctaVotar();
    renderOverlay();

    // microanimação quando a atividade ao vivo muda
    var lv = liveItem(), card = $('#nowCard');
    if (card && lv && lv.id !== lastLiveId && lastLiveId !== null) card.classList.add('just-changed');
    lastLiveId = lv ? lv.id : null;

    countUp();
    tickLive();
    telaoMontar();
    if (ehTelao) return;
    revelar(app);
    ajustarTurmas(app);
    roloCutucar(app);

    // revelação das barras de resultado
    var bars = app.querySelectorAll('.track .bar');
    if (bars.length) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Array.prototype.forEach.call(bars, function (b) { b.style.width = b.getAttribute('data-w') + '%'; });
        });
      });
    }
  }

  function renderOverlay() {
    var ov = $('#overlay'), html = '';
    if (vid.id) html = videoLightbox();
    else if (lb.i != null) html = lightbox();
    else if (admin.editor) html = editorSheet();
    else if (admin.confirm) html = confirmSheetGeneric(admin.confirm);
    else if (admin.copy) html = copySheet(admin.copy);
    else if (flow.picked) {
      var p = opcaoPorId(flow.picked);
      if (p) html = confirmSheet(p);
    }
    ov.innerHTML = html;
    document.body.style.overflow = html ? 'hidden' : '';
    if (html && (admin.editor || admin.copy)) {
      var f = ov.querySelector('input, textarea');
      if (f) f.focus({ preventScroll: true });
    }
  }

  var lb = { i: null, escopo: 'aba' };
  // fotos que o visor percorre: as da aba Fotos (com o filtro escolhido) ou as de uma equipe
  function listaLb() {
    if (/^prj:/.test(lb.escopo || '')) return fotosDoProjeto(lb.escopo.slice(4));
    return fotosDaAba();
  }
  var vid = { id: null, nome: '' };

  // aceita um ID puro ou qualquer endereço do YouTube colado pela organização
  function videoId(v) {
    var t = String(v || '').trim();
    if (!t) return '';
    if (/^[\w-]{11}$/.test(t)) return t;
    var m = t.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function videoUrl(v) {
    var id = videoId(v);
    return id ? 'https://www.youtube.com/watch?v=' + id : '';
  }
  function playlistUrl() {
    var pl = String((db.event && db.event.playlist) || '').trim();
    if (!pl) return '';
    if (/^https?:/i.test(pl)) return pl;
    return 'https://www.youtube.com/playlist?list=' + pl;
  }

  function videoLightbox() {
    var id = videoId(vid.id);
    if (!id) return '';
    var src = 'https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1&hl=pt-BR&cc_lang_pref=pt';
    return '<div class="lb lb-video" id="lbBox" role="dialog" aria-modal="true" aria-label="Campanha do Herói">' +
      '<div class="lbtop"><span>' + esc(vid.nome ? 'Campanha · ' + vid.nome : 'Campanha do Herói') + '</span>' +
      '<button class="lbclose" data-act="vidClose" aria-label="Fechar">' + ico('i-x') + '</button></div>' +
      '<div class="vframe"><iframe src="' + esc(src) + '" title="' + esc('Campanha do Herói ' + (vid.nome || '')) + '" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
      'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>' +
      '<div class="lbcap"><div class="lbnav">' +
      '<a class="vidout" href="' + esc(videoUrl(id)) + '" target="_blank" rel="noopener noreferrer">' +
      ico('i-play') + ' Abrir no YouTube</a>' +
      '<button data-act="vidClose">Fechar</button>' +
      '</div>' +
      '<p class="tiny">Se o vídeo não aparecer aqui, toque em “Abrir no YouTube”.</p>' +
      '</div></div>';
  }

  function lightbox() {
    var ph = listaLb();
    var p = ph[lb.i];
    if (!p) return '';
    return '<div class="lb" id="lbBox" role="dialog" aria-modal="true" aria-label="Foto ampliada">' +
      '<div class="lbtop"><span>' + (lb.i + 1) + ' de ' + ph.length + '</span>' +
      '<button class="lbclose" data-act="lbClose" aria-label="Fechar">' + ico('i-x') + '</button></div>' +
      '<div class="lbimg">' + imgFoto(p) + '</div>' +
      '<div class="lbcap">' +
      ((p[2] || p[5]) ? '<p class="lbleg">' + esc(p[2] || '') + (p[5] && byId(p[5]) ? (p[2] ? ' · ' : '') + '<b>' + esc(byId(p[5]).name) + '</b>' : '') + '</p>' : '') +
      '<div class="lbnav">' +
      '<button data-act="lbPrev">' + ico('i-arrow-left') + ' Anterior</button>' +
      '<button data-act="lbNext">Próxima ' + ico('i-chev') + '</button>' +
      '</div></div></div>';
  }

  function closeSheet() { lb.i = null; vid.id = null; vid.nome = ''; admin.editor = null; admin.confirm = null; admin.copy = null; flow.picked = null; flow.error = ''; renderOverlay(); }

  /* ============================ ações / eventos =========================== */
  function findObj(kind, id) {
    if (kind === 'hero') { var x = heroById(id); return x ? x.hero : null; }
    var col = kind === 'schedule' ? db.schedule : db.projects;
    return col.filter(function (x) { return x.id === id; })[0];
  }
  function colOf(kind) { return kind === 'schedule' ? db.schedule : db.projects; }

  function openEditor(kind, id) {
    var isNew = id === 'new';
    var blank = {
      schedule: { start: '', end: '', name: '', desc: '', place: '' },
      project: { name: '', tagline: '', category: '', slot: '', block: '', group: '', members: [], values: [], teams: [], cover: '', meaning: '', integration: '', problem: '', why: '', solution: '', how: '', impact: '', video: '', gallery: [], heroes: [], eligible: true },
      hero: { name: '', image: '', inspiration: '', story: '', projectId: '' }
    }[kind];
    var data;
    if (isNew) data = JSON.parse(JSON.stringify(blank));
    else if (kind === 'hero') {
      var x = heroById(id);
      data = x ? JSON.parse(JSON.stringify(x.hero)) : JSON.parse(JSON.stringify(blank));
      if (x) data.projectId = x.project.id;
    } else data = JSON.parse(JSON.stringify(findObj(kind, id)));
    admin.editor = { kind: kind, isNew: isNew, id: isNew ? null : id, data: data };
    renderOverlay();
  }

  function saveEditor(form) {
    var e = admin.editor, kind = e.kind, fd = new FormData(form), o = {};
    ['start', 'end', 'name', 'desc', 'place', 'tagline', 'category', 'slot', 'block', 'group', 'meaning', 'integration',
      'problem', 'why', 'solution', 'how', 'impact', 'video', 'inspiration', 'story', 'projectId'].forEach(function (k) {
        if (fd.has(k)) o[k] = String(fd.get(k) || '').trim();
      });
    ['cover', 'image'].forEach(function (k) {
      if (fd.has(k + '__data')) o[k] = String(fd.get(k + '__data') || '');
    });
    var listy = function (k) {
      return String(fd.get(k) || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    };
    if (kind === 'project') {
      o.eligible = fd.get('eligible') != null;
      var eqs = (e.data.teams || []);
      if (eqs.length) {
        // equipes: cada uma guarda os seus; o projeto fica com a soma
        o.teams = eqs.map(function (t, i) {
          return { label: String(fd.get('team' + i + '_label') || '').trim() || t.label, hero: t.hero,
            members: listy('team' + i + '_members'), values: listy('team' + i + '_values') };
        });
        o.members = [].concat.apply([], o.teams.map(function (t) { return t.members; }));
        o.values = [].concat.apply([], o.teams.map(function (t) { return t.values; }));
      } else {
        o.members = listy('members');
        o.values = listy('values');
      }
    }
    if (!o.name) { toast('Informe um nome.'); return; }
    if (kind === 'schedule' && toMin(o.start) == null) { toast('Informe o horário de início.'); return; }

    if (kind === 'hero') {
      if (!o.projectId) { toast('Escolha o projeto deste Herói.'); return; }
      var target = byId(o.projectId);
      if (!target) { toast('Projeto não encontrado.'); return; }
      target.heroes = target.heroes || [];
      // aceita um link inteiro do YouTube e guarda só o código do vídeo
      var vraw = String(o.video || '').trim();
      var vcode = vraw ? videoId(vraw) : '';
      if (vraw && !vcode) { toast('Não reconheci esse link do YouTube. Confira e tente de novo.'); return; }

      if (e.isNew) {
        o.id = uid('her');
        target.heroes.push({ id: o.id, name: o.name, image: o.image || '', inspiration: o.inspiration || '', story: o.story || '', video: vcode });
      } else {
        var cur = heroById(e.id);
        if (cur && cur.project.id !== o.projectId) {
          cur.project.heroes = cur.project.heroes.filter(function (h) { return h.id !== e.id; });
          target.heroes.push({ id: e.id, name: o.name, image: o.image || '', inspiration: o.inspiration || '', story: o.story || '', video: vcode });
        } else if (cur) {
          cur.hero.name = o.name; cur.hero.image = o.image || '';
          cur.hero.inspiration = o.inspiration || ''; cur.hero.story = o.story || '';
          cur.hero.video = vcode;
        }
      }
      admin.editor = null; save(); toast(vcode ? 'Salvo — vídeo ligado a este Herói.' : 'Salvo.'); return;
    }

    if (e.isNew) {
      o.id = uid(kind.slice(0, 3));
      o.demo = false;
      if (kind === 'project') { o.gallery = []; o.heroes = []; }
      colOf(kind).push(o);
    } else {
      var t = findObj(kind, e.id);
      Object.keys(o).forEach(function (k) { t[k] = o[k]; });
      t.demo = false;
    }
    admin.editor = null;
    save(); toast('Salvo.');
  }

  function readImage(file, cb) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('Imagem muito grande (máx. 8 MB).'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1100, w = img.width, h = img.height;
        if (w > max || h > max) { var r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        var out;
        try { out = cv.toDataURL('image/jpeg', 0.84); } catch (err) { out = fr.result; }
        cb(out);
      };
      img.onerror = function () { cb(fr.result); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function offerFile(filename, text, mime) {
    var use = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads') : Promise.resolve(null);
    use.then(function (d) {
      if (!d || typeof d.save !== 'function') throw new Error('sem downloads');
      return d.save({ filename: filename, data: text, mimeType: mime || 'text/plain' });
    }).then(function () { toast('Arquivo salvo.'); })
      .catch(function () {
        admin.copy = { title: filename, hint: 'O download direto não está disponível aqui. Copie o conteúdo abaixo e cole em um arquivo.', text: text, editable: false };
        renderOverlay();
      });
  }

  function exportPayload() {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      events: [db.event],
      schedule_items: ordered().map(function (i, n) { return { id: i.id, position: n, start_time: i.start, end_time: i.end, name: i.name, description: i.desc, place: i.place }; }),
      projects: db.projects.map(function (p, n) {
        return { id: p.id, position: n, name: p.name, slot: p.slot, block: p.block, group: p.group, values: p.values, teams: p.teams || [], tagline: p.tagline, meaning: p.meaning || '', integration: p.integration || '', category: p.category, problem: p.problem, why_it_matters: p.why, solution: p.solution, how_it_works: p.how, impact: p.impact, video_url: p.video, is_eligible: p.eligible !== false, cover_image: p.cover ? '(imagem embutida)' : null };
      }),
      heroes: allHeroes().map(function (x) {
        return { id: x.hero.id, project_id: x.project.id, name: x.hero.name, inspiration: x.hero.inspiration, story: x.hero.story };
      }),
      project_members: db.projects.reduce(function (acc, p) {
        (p.members || []).forEach(function (m) { acc.push({ project_id: p.id, name: m }); });
        return acc;
      }, []),
      voting_sessions: [{ identification: 'cpf_hash', keyword: db.voting.keyword, backend: remote.on ? 'supabase' : 'local', results_public: db.voting.resultsPublic }],
      results: db.voting.results || {}
    }, null, 2);
  }

  function importPayload(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { toast('JSON inválido.'); return; }
    if (o.events && o.events[0]) db.event = Object.assign(db.event, o.events[0]);
    if (Array.isArray(o.schedule_items)) {
      db.schedule = o.schedule_items.map(function (i) {
        return { id: i.id || uid('sch'), start: i.start_time || i.start, end: i.end_time || i.end, name: i.name, desc: i.description || i.desc || '', place: i.place || '', demo: false };
      });
    }
    if (Array.isArray(o.projects)) {
      db.projects = o.projects.map(function (p) {
        var antigo = byId(p.id) || {};
        return { id: p.id || uid('prj'), name: p.name, slot: p.slot || antigo.slot || '', block: p.block || antigo.block || '', group: p.group || antigo.group || '',
          members: antigo.members || [], values: p.values || antigo.values || [], teams: p.teams || antigo.teams || [], heroes: antigo.heroes || [],
          tagline: p.tagline || '', meaning: p.meaning || '', integration: p.integration || '', category: p.category || '', cover: '', problem: p.problem || '', why: p.why_it_matters || '', solution: p.solution || '', how: p.how_it_works || '', impact: p.impact || '', video: p.video_url || '', gallery: [], eligible: p.is_eligible !== false, demo: false };
      });
    }
    admin.copy = null;
    save(); toast('Conteúdo importado.');
  }

  // confere a senha no banco. Usa entrar_admin quando existe; se o banco
  // ainda estiver na versão anterior do supabase.sql, cai para definir_votacao,
  // que valida a chave sem alterar nada.
  function entrarComo(senha) {
    function aceitou() {
      login.ocupado = false; login.erro = '';
      localState.admin = true; localState.adminKey = senha; saveLocal(); render();
      loadResult();   // a visão geral já abre com as respostas na tela
    }
    function recusou(msg) {
      login.ocupado = false; login.erro = msg || 'Senha incorreta.'; render();
    }
    sbRpc('entrar_admin', { p_chave: senha }).then(function (r) {
      if (r && r.ok) aceitou(); else recusou();
    }).catch(function () {
      sbRpc('definir_votacao', { p_chave: senha, p_aberta: null, p_resultado: null }).then(function (r) {
        if (r && r.ok) aceitou(); else recusou();
      }).catch(function () {
        recusou('Sem conexão com o servidor. Verifique sua internet.');
      });
    });
  }

  function setVotacao(aberta, resultado) {
    if (!remote.on) {
      toast('Esta cópia está em modo prévia — abra a votação na versão publicada.');
      return;
    }
    var chave = localState.adminKey || '';
    if (!chave) { toast('Entre de novo com a senha da organização.'); localState.admin = false; saveLocal(); go('admin'); return; }
    sbRpc('definir_votacao', { p_chave: chave, p_aberta: aberta, p_resultado: resultado }).then(function (r) {
      if (r && r.ok) {
        if (aberta != null) remote.aberta = aberta;
        if (resultado != null) remote.resultadoPublico = resultado;
        render();
        toast(aberta === true ? 'Votação aberta.' : aberta === false ? 'Votação encerrada.' : 'Atualizado.');
        syncEstado(false);
      } else {
        toast(ERROS[r && r.erro] || 'Não consegui atualizar.');
      }
    }).catch(function () { toast('Sem conexão com o servidor.'); });
  }

  function zerarVotos() {
    var chave = localState.adminKey || '';
    if (!chave) { toast('Entre de novo com a senha da organização.'); localState.admin = false; saveLocal(); go('admin'); return; }
    sbRpc('zerar_votos', { p_chave: chave }).then(function (r) {
      if (r && r.ok) {
        remote.rodada = r.rodada || remote.rodada;
        localState.rodada = remote.rodada; localState.voted = null; saveLocal();
        adminRes.dados = null;
        toast('Votos zerados. Os aparelhos são liberados para votar de novo em alguns segundos.');
        loadResult();
        return;
      }
      var cod = r && r.erro;
      toast(cod === 'votacao_aberta' ? 'Encerre a votação antes de zerar os votos.'
        : (ERROS[cod] || 'Não consegui zerar os votos.'));
    }).catch(function (e) {
      toast(String(e && e.message) === 'http 404' ? 'O banco ainda não tem a função de zerar. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.');
    });
  }

  function loadResult() {
    if (!remote.on) { toast('Disponível na versão publicada.'); return; }
    adminRes.carregando = true; adminRes.erro = ''; render();
    sbRpc('resultado', { p_chave: localState.adminKey || '' }).then(function (r) {
      adminRes.carregando = false;
      if (r && r.liberado) { adminRes.dados = r; adminRes.erro = ''; adminRes.quando = Date.now(); }
      else { adminRes.dados = null; adminRes.erro = 'O resultado está fechado. Confira a chave de administrador.'; }
      render();
    }).catch(function () {
      adminRes.carregando = false; adminRes.erro = 'Sem conexão com o servidor.'; render();
    });
  }

  /* ------------------------------- delegação ------------------------------ */
  document.addEventListener('click', function (ev) {
    var t = ev.target;

    var bg = t.closest && t.closest('#sheetBg');
    if (bg && t === bg) { closeSheet(); return; }
    var lbb = t.closest && t.closest('#lbBox');
    if (lbb && (t === lbb || (t.className === 'lbimg'))) {
      if (vid.id) { vid.id = null; vid.nome = ''; } else { lb.i = null; }
      renderOverlay(); return;
    }

    var el = t.closest && t.closest('[data-nav],[data-go],[data-act],[data-atab],[data-edit],[data-del],[data-move],[data-pick],[data-clearimg],[data-filter]');
    if (!el) return;

    if (el.hasAttribute('data-filter')) {
      filt.block = el.getAttribute('data-filter'); render(); return;
    }
    if (el.hasAttribute('data-nav')) { go(el.getAttribute('data-nav')); return; }
    if (el.hasAttribute('data-go')) { go(el.getAttribute('data-go')); return; }
    if (el.hasAttribute('data-atab')) { admin.tab = el.getAttribute('data-atab'); admin.fotosDe = null; render(); return; }
    if (el.hasAttribute('data-pick')) { flow.picked = el.getAttribute('data-pick'); flow.error = ''; renderOverlay(); return; }

    if (el.hasAttribute('data-clearimg')) {
      var fid = el.getAttribute('data-clearimg');
      if (admin.editor) { admin.editor.data[fid] = ''; renderOverlay(); }
      else if (fid === 'logo') { db.event.logo = ''; save(); toast('Logo removida.'); }
      return;
    }
    if (el.hasAttribute('data-edit')) {
      var pe = el.getAttribute('data-edit').split(':'); openEditor(pe[0], pe[1]); return;
    }
    if (el.hasAttribute('data-del')) {
      var pd = el.getAttribute('data-del').split(':');
      admin.confirm = {
        title: 'Excluir este item?', body: 'Essa ação não pode ser desfeita.', yes: 'Sim, excluir', danger: true,
        run: function () {
          if (pd[0] === 'hero') {
            var x = heroById(pd[1]);
            if (x) x.project.heroes = x.project.heroes.filter(function (h) { return h.id !== pd[1]; });
          } else {
            var col = colOf(pd[0]);
            var i = col.findIndex(function (y) { return y.id === pd[1]; });
            if (i >= 0) col.splice(i, 1);
          }
          save(); toast('Item excluído.');
        }
      };
      renderOverlay(); return;
    }
    if (el.hasAttribute('data-move')) {
      var pm = el.getAttribute('data-move').split(':'), dir = +pm[2];
      if (pm[0] === 'sch') {
        var arr = ordered(), i2 = arr.findIndex(function (x) { return x.id === pm[1]; }), j = i2 + dir;
        if (j < 0 || j >= arr.length) return;
        var a = arr[i2], b = arr[j], s = a.start, e2 = a.end;
        a.start = b.start; a.end = b.end; b.start = s; b.end = e2;
      } else {
        var i3 = db.projects.findIndex(function (x) { return x.id === pm[1]; }), k = i3 + dir;
        if (k < 0 || k >= db.projects.length) return;
        var tmp = db.projects[i3]; db.projects[i3] = db.projects[k]; db.projects[k] = tmp;
      }
      save(); return;
    }

    var act = el.getAttribute('data-act');
    if (!act || el.tagName === 'INPUT') return;
    var escFoto = el.getAttribute('data-esc') || 'geral';
    if (act === 'sfTudo') {
      var ds = document.querySelectorAll('details.sanfona');
      var abrir = Array.prototype.some.call(ds, function (d) { return !d.open; });
      Array.prototype.forEach.call(ds, function (d) { d.open = abrir; sfEstado[d.getAttribute('data-sf')] = abrir; });
      el.textContent = abrir ? 'Fechar tudo' : 'Abrir tudo';
      return;
    }
    if (act === 'roloAnt' || act === 'roloProx') {
      var rl = el.parentNode && el.parentNode.querySelector('.turma-rolo');
      if (rl) rl.scrollBy({ left: (act === 'roloProx' ? 1 : -1) * rl.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }
    if (act === 'telaoTelaCheia') {
      var de = document.documentElement;
      if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
      else if (de.requestFullscreen) de.requestFullscreen().catch(function () {});
      return;
    }
    if (act === 'hideBanner') { localState.bannerOff = true; saveLocal(); render(); }
    else if (act === 'hideAdmCard') { localState.admCardOff = true; saveLocal(); render(); }
    else if (act === 'closeSheet') closeSheet();
    else if (act === 'cancelVote') { if (!flow.busy) { flow.picked = null; flow.error = ''; flow.palavra = ''; renderOverlay(); } }
    else if (act === 'confirmVote') submitVote();
    else if (act === 'confirmYes') { var c = admin.confirm; admin.confirm = null; if (c && c.run) c.run(); renderOverlay(); }
    else if (act === 'askLogout') {
      admin.confirm = { title: 'Sair do painel?', body: 'Nada do conteúdo se perde. Só que, para voltar, este aparelho vai pedir a senha de novo.', yes: 'Sim, sair',
        run: function () { localState.admin = false; localState.adminKey = ''; login.erro = ''; adminRes.dados = null; saveLocal(); go('home'); } };
      renderOverlay();
    }
    else if (act === 'logout') { localState.admin = false; localState.adminKey = ''; login.erro = ''; adminRes.dados = null; saveLocal(); go('home'); }
    else if (act === 'lbOpen') { lb.i = +el.getAttribute('data-i') || 0; lb.escopo = el.getAttribute('data-lb') || 'aba'; renderOverlay(); }
    else if (act === 'lbClose') { lb.i = null; renderOverlay(); }
    else if (act === 'playVideo') {
      vid.id = el.getAttribute('data-v') || '';
      vid.nome = el.getAttribute('data-t') || '';
      renderOverlay();
    }
    else if (act === 'vidClose') { vid.id = null; vid.nome = ''; renderOverlay(); }
    else if (act === 'lbPrev' || act === 'lbNext') {
      var n = listaLb().length;
      if (n) lb.i = ((lb.i + (act === 'lbNext' ? 1 : -1)) % n + n) % n;
      renderOverlay();
    }
    else if (act === 'loadResult') loadResult();
    else if (act === 'reloadResult') { pubRes.dados = null; pubRes.erro = ''; pubRes.pediu = false; render(); }
    else if (act === 'askOpen') {
      admin.confirm = { title: 'Abrir a votação agora?', body: 'Todo mundo com o aplicativo aberto vai poder votar imediatamente. Cada CPF vale um voto só.', yes: 'Sim, abrir',
        run: function () { setVotacao(true, null); } };
      renderOverlay();
    }
    else if (act === 'askClose') {
      admin.confirm = { title: 'Encerrar a votação?', body: 'Ninguém mais conseguirá votar. Os votos já registrados continuam guardados.', yes: 'Sim, encerrar', danger: true,
        run: function () { setVotacao(false, null); } };
      renderOverlay();
    }
    else if (act === 'askZerar') {
      if (!remote.on) { toast('Disponível na versão publicada.'); return; }
      if (remote.aberta) { toast('Encerre a votação antes de zerar os votos.'); return; }
      var tot = adminRes.dados && adminRes.dados.liberado ? (adminRes.dados.total || 0) : null;
      admin.confirm = {
        title: 'Zerar os votos?',
        body: (tot != null ? 'Há ' + tot + (tot === 1 ? ' voto registrado' : ' votos registrados') + '. ' : '') +
          'Todos serão apagados e cada aparelho poderá votar de novo. Use só para recomeçar depois de um ensaio.',
        yes: 'Continuar', danger: true,
        run: function () {
          admin.confirm = {
            title: 'Tem certeza?', body: 'Esta é a última confirmação. Os votos apagados não voltam.',
            yes: 'Sim, apagar todos os votos', danger: true,
            run: function () { zerarVotos(); }
          };
        }
      };
      renderOverlay();
    }
    else if (act === 'pubResult') setVotacao(null, !remote.resultadoPublico);
    else if (act === 'copyNames') {
      var names = opcoesDeVoto().map(function (p) { return p.name; }).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(names).then(function () { toast('Nomes copiados.'); }, function () { toast('Não consegui copiar.'); });
      else { admin.copy = { title: 'Nomes dos projetos', hint: 'Copie e cole como opções da pergunta "Projeto escolhido".', text: names, editable: false }; renderOverlay(); }
    }
    else if (act === 'exportVotos') {
      var r = adminRes.dados;
      if (!r || !r.liberado) { toast('Atualize as respostas primeiro.'); return; }
      var linhas = [(votoEmHerois() ? 'heroi' : 'projeto') + ';votos;percentual'];
      (r.projetos || []).forEach(function (p) {
        var loc = opcaoPorId(p.id);
        var pct = r.total ? (p.votos / r.total * 100) : 0;
        linhas.push('"' + String((loc && loc.name) || p.nome || p.id).replace(/"/g, '""') + '";' + p.votos + ';' + pct.toFixed(1).replace('.', ','));
      });
      linhas.push('"TOTAL";' + (r.total || 0) + ';100,0');
      offerFile('respostas-votacao-banca-idl.csv', linhas.join('\n'), 'text/csv');
    }
    else if (act === 'exportJson') offerFile('conteudo-banca-idl-tech.json', exportPayload(), 'application/json');
    else if (act === 'fotosDe') { admin.fotosDe = el.getAttribute('data-p'); render(); window.scrollTo(0, 0); }
    else if (act === 'fotosVoltar') { admin.fotosDe = null; render(); }
    else if (act === 'fotoEscolher') { var fi = $('#fotoInput'); if (fi) fi.click(); }
    else if (act === 'fotoLink') {
      admin.copy = { title: 'Adicionar foto por link', hint: 'Cole o endereço da imagem (precisa terminar em .jpg, .png ou .webp e estar aberta na internet). Uma por linha.', text: '', editable: true, acao: 'doFotoLink', botao: 'Adicionar', escopo: escFoto };
      renderOverlay();
    }
    else if (act === 'doFotoLink') {
      var box = $('#copyBox'); if (!box) return;
      var escL = (admin.copy && admin.copy.escopo) || 'geral';
      var urls = String(box.value || '').split(/[\n,\s]+/).map(function (t) { return t.trim(); })
        .filter(function (t) { return /^https?:\/\//i.test(t); });
      if (!urls.length) { toast('Nenhum endereço válido.'); return; }
      admin.copy = null; renderOverlay();
      if (remote.on) {
        var falhaLink = '', feitosLink = 0, cadeiaLink = Promise.resolve();
        urls.forEach(function (u) {
          cadeiaLink = cadeiaLink.then(function () {
            if (falhaLink) return;
            return rpcFoto('adicionar_foto', { p_src: u, p_legenda: '', p_larga: false, p_projeto: escL === 'geral' ? null : escL })
              .then(function () { feitosLink++; })
              .catch(function (e) { falhaLink = e && e.message; });
          });
        });
        cadeiaLink.then(function () {
          depoisDeFoto(falhaLink ? erroFoto(falhaLink) : (feitosLink === 1 ? 'Foto publicada para todo mundo.' : feitosLink + ' fotos publicadas para todo mundo.'));
        });
        return;
      }
      db.retro = db.retro || { photos: [] };
      db.retro.photos = (db.retro.photos || []).concat(urls.map(function (u) {
        return escL === 'geral' ? [u, 1, ''] : [u, 1, '', null, false, escL];
      }));
      salvarConteudo();
      toast(urls.length === 1 ? 'Foto acrescentada.' : urls.length + ' fotos acrescentadas.');
      render();
    }
    else if (act === 'fotoApaga') {
      var iDel = +el.getAttribute('data-i');
      var alvoDel = fotosDoEscopo(escFoto)[iDel];
      if (!alvoDel) return;
      admin.confirm = { title: 'Remover esta foto?', body: usaNuvem()
          ? 'Ela sai do site para todo mundo. Dá para acrescentar de novo depois.'
          : 'Ela sai do site neste aparelho. Dá para acrescentar de novo depois.', yes: 'Sim, remover', danger: true,
        run: function () {
          if (remote.on) {
            rpcFoto('remover_foto', { p_id: alvoDel[3] })
              .then(function () { return depoisDeFoto('Foto removida para todo mundo.'); })
              .catch(function (e) { toast(erroFoto(e && e.message)); });
            return;
          }
          var fotos = (db.retro && db.retro.photos) || [];
          var pos = fotos.indexOf(alvoDel);
          if (pos < 0) return;
          fotos.splice(pos, 1);
          if (!alvoDel[5] && db.retro.capa === alvoDel[0]) {
            var outra = fotos.filter(function (f) { return !f[5]; })[0];
            db.retro.capa = (outra && outra[0]) || '';
          }
          salvarConteudo(); toast('Foto removida.'); render();
        } };
      renderOverlay();
    }
    else if (act === 'fotoSobe' || act === 'fotoDesce') {
      var iM = +el.getAttribute('data-i');
      var alvo = act === 'fotoSobe' ? iM - 1 : iM + 1;
      var doEsc = fotosDoEscopo(escFoto);
      if (alvo < 0 || alvo >= doEsc.length) return;
      if (remote.on) {
        var ids = doEsc.map(function (f) { return f[3]; });
        var t2 = ids[iM]; ids[iM] = ids[alvo]; ids[alvo] = t2;
        // mostra a ordem nova na hora e confirma no banco
        var la = nuvem.lista, pa = -1, pb = -1;
        la.forEach(function (f, k) { if (f.id === ids[iM]) pa = k; if (f.id === ids[alvo]) pb = k; });
        if (pa >= 0 && pb >= 0) { var t3 = la[pa]; la[pa] = la[pb]; la[pb] = t3; }
        render();
        rpcFoto('ordenar_fotos', { p_ids: ids })
          .then(function () { return depoisDeFoto(''); })
          .catch(function (e) { toast(erroFoto(e && e.message)); syncFotos(); });
        return;
      }
      var arr = (db.retro && db.retro.photos) || [];
      var ka = arr.indexOf(doEsc[iM]), kb = arr.indexOf(doEsc[alvo]);
      if (ka < 0 || kb < 0) return;
      var tmp = arr[ka]; arr[ka] = arr[kb]; arr[kb] = tmp;
      salvarConteudo(); render();
    }
    else if (act === 'fotoCapa') {
      var iC = +el.getAttribute('data-i');
      var fs = fotosGerais();
      if (!fs[iC]) return;
      if (remote.on) {
        rpcFoto('definir_capa_foto', { p_id: fs[iC][3] })
          .then(function () { return depoisDeFoto('Foto de capa definida para todo mundo.'); })
          .catch(function (e) { toast(erroFoto(e && e.message)); });
        return;
      }
      db.retro.capa = fs[iC][0];
      salvarConteudo(); toast('Foto de capa definida.'); render();
    }
    else if (act === 'fotoSalvarTextos') {
      var fotos2 = fotosDoEscopo(escFoto);
      var lido = fotos2.map(function (p2, i2) {
        var cx = $('#cap' + i2), wx = document.querySelector('[name="w' + i2 + '"]');
        return { legenda: cx ? String(cx.value || '').trim() : (p2[2] || ''), larga: wx ? wx.checked : p2[1] === 2 };
      });
      if (remote.on) {
        var itens = fotos2.map(function (p2, i2) { return { id: p2[3], legenda: lido[i2].legenda, larga: lido[i2].larga }; });
        rpcFoto('atualizar_fotos', { p_itens: itens })
          .then(function () { return depoisDeFoto(escFoto === 'geral' ? 'Descrições salvas para todo mundo.' : 'Legendas salvas para todo mundo.'); })
          .catch(function (e) { toast(erroFoto(e && e.message)); });
        return;
      }
      fotos2.forEach(function (p2, i2) { p2[2] = lido[i2].legenda; p2[1] = lido[i2].larga ? 2 : 1; });
      salvarConteudo(); toast(escFoto === 'geral' ? 'Descrições salvas.' : 'Legendas salvas.'); render();
    }
    else if (act === 'importJson') { admin.copy = { title: 'Importar conteúdo', hint: 'Cole aqui o JSON exportado anteriormente. O conteúdo atual será substituído.', text: '', editable: true }; renderOverlay(); }
    else if (act === 'doImport') { importPayload($('#copyBox').value); }
    else if (act === 'copyText') {
      var box = $('#copyBox'); box.select();
      if (navigator.clipboard) navigator.clipboard.writeText(box.value).then(function () { toast('Copiado.'); }, function () { toast('Selecione e copie manualmente.'); });
      else toast('Selecione e copie manualmente.');
    }
    else if (act === 'clearDemo') {
      admin.confirm = { title: 'Remover conteúdo de exemplo?', body: 'Projetos, Heróis e atividades marcados como “exemplo” serão apagados. O que você cadastrou permanece.', yes: 'Sim, remover', danger: true,
        run: function () {
          db.schedule = db.schedule.filter(function (x) { return !x.demo; });
          db.projects = db.projects.filter(function (x) { return !x.demo; });
          db.demoLoaded = false; save(); toast('Conteúdo de exemplo removido.');
        } };
      renderOverlay();
    }
    else if (act === 'clearVotes') {
      admin.confirm = { title: 'Refazer o teste da votação?', body: 'Destrava, código e voto deste aparelho voltam ao início, para você testar o fluxo de novo.', yes: 'Sim, refazer', danger: true,
        run: function () { localState.voted = null; localState.unlocked = false; localState.code = null; localState.hash = null; saveLocal(); render(); toast('Votação reiniciada neste aparelho.'); } };
      renderOverlay();
    }
    else if (act === 'resetAll') {
      admin.confirm = { title: 'Restaurar demonstração?', body: remote.on ? 'Todo o conteúdo volta ao que está no data.js — e isso é publicado para todo mundo.' : 'Todo o conteúdo deste aparelho volta ao estado inicial.', yes: 'Sim, restaurar', danger: true,
        run: function () { db = demoData(); localState.voted = null; localState.unlocked = false; localState.code = null; localState.hash = null; localState.visited = []; saveLocal(); save(); toast('Demonstração restaurada.'); } };
      renderOverlay();
    }
  });

  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.hasAttribute && t.hasAttribute('data-img')) {
      var fid = t.getAttribute('data-img');
      readImage(t.files && t.files[0], function (data) {
        if (fid === 'logo') { db.event.logo = data; save(); toast('Logo atualizada.'); }
        else if (admin.editor) { admin.editor.data[fid] = data; renderOverlay(); }
      });
      return;
    }
    if (t.hasAttribute && t.hasAttribute('data-cand')) {
      var hx = heroById(t.getAttribute('data-cand'));
      if (hx) hx.hero.candidato = t.checked;
      var marcados = Array.prototype.map.call(document.querySelectorAll('[data-cand]:checked'), function (c) { return c.getAttribute('data-cand'); });
      if (remote.on) {
        sbRpc('definir_candidatos', { p_chave: localState.adminKey || '', p_ids: marcados }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
          opcoesBanco = { carregou: true, ids: marcados };
          save(); toast('Candidatos atualizados para todo mundo.');
        }).catch(function (e) {
          toast(e && e.message === 'chave_invalida' ? 'A senha deste aparelho não confere com a do banco. Saia e entre de novo.' : 'Não deu certo agora. Tente de novo.');
          syncOpcoes();
        });
      } else {
        save(); toast('Candidatos atualizados.');
      }
      return;
    }

    var act = t.getAttribute && t.getAttribute('data-act');
    if (act === 'filtroFotos') { filtFotos = t.value || 'todas'; render(); var sel = $('#filtroFotos'); if (sel) sel.focus({ preventScroll: true }); return; }
    if (act === 'setPalavra') { flow.palavra = t.value; }
    else if (act === 'toggleVisivel') {
      var quer = !!t.checked;
      if (!remote.on) { toast('Disponível na versão publicada.'); t.checked = !quer; return; }
      sbRpc('definir_visibilidade', { p_chave: localState.adminKey || '', p_visivel: quer }).then(function (r) {
        if (r && r.ok) { remote.visivel = !!r.visivel; render(); toast(r.visivel ? 'A aba Votação agora aparece para todos.' : 'A aba Votação foi escondida do site.'); }
        else { t.checked = !quer; if (!(r && r.erro === 'chave_invalida')) toast('Não consegui mudar agora. Tente de novo.'); }
      }).catch(function (e) {
        t.checked = !quer;
        toast(String(e && e.message) === 'http 404' ? 'O banco ainda não tem essa opção. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.');
      });
      return;
    }
    else if (act === 'toggleClock') { db.clock.simulated = t.checked; db.clock.baseReal = Date.now(); if (!t.checked) db.clock.baseSim = Date.now(); save(); }
    else if (act === 'setClock') {
      var v = Date.parse(t.value);
      if (!isNaN(v)) { db.clock.baseSim = v; db.clock.baseReal = Date.now(); db.clock.simulated = true; save(); }
    }
  });

  var searchTimer = null;
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'projSearch') {
      var v = ev.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        filt.q = v; render();
        var f = $('#projSearch');
        if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
      }, 260);
      return;
    }
    if (ev.target.id === 'voterId' || ev.target.id === 'gcpf' || ev.target.id === 'admCpf') {
      var p = ev.target.selectionStart, before = ev.target.value;
      void p;
      ev.target.value = maskCPF(before);
      if (p === before.length) ev.target.setSelectionRange(ev.target.value.length, ev.target.value.length);
    }
  });

  document.addEventListener('submit', function (ev) {
    var f = ev.target; ev.preventDefault();

    if (f.id === 'pinForm') {
      var campoCpf = $('#admCpf');
      var senha = String($('#pin').value || '').trim();
      if (!senha) { login.erro = 'Informe a senha.'; render(); return; }

      function comHash(h) {
        if (!ehContaDaOrg(h)) {
          login.ocupado = false;
          login.erro = 'Este CPF não tem acesso ao painel.';
          render(); return;
        }
        if (!remote.on) {
          // sem banco: confere contra o código embaralhado do config.js
          sha256(senha + '|' + SALT_SENHA).then(function (hs) {
            login.ocupado = false;
            if (SENHA_HASH && hs === SENHA_HASH) {
              login.erro = ''; localState.admin = true; localState.adminKey = senha; saveLocal(); render();
            } else {
              login.erro = 'Senha incorreta.'; render();
            }
          });
          return;
        }
        entrarComo(senha);
      }

      // quem já entrou no aplicativo com o CPF não precisa digitar de novo
      if (!campoCpf) {
        login.ocupado = true; login.erro = ''; render();
        comHash(localState.hash);
        return;
      }

      var cpf = String(campoCpf.value || '').trim();
      if (!validCPF(cpf)) { login.erro = 'CPF inválido. Confira os números e tente de novo.'; render(); return; }
      login.ocupado = true; login.erro = ''; render();
      // o CPF vira código embaralhado aqui mesmo; o número não vai a lugar nenhum
      sha256(onlyDigits(cpf) + '|' + SALT).then(function (h) {
        if (ehContaDaOrg(h) && !localState.hash) { localState.hash = h; localState.code = makeCode(h); saveLocal(); }
        comHash(h);
      });
      return;
    }
    if (f.id === 'eventForm') {
      var fd = new FormData(f);
      ['name', 'subtitle', 'dateISO', 'dateLabel', 'timeLabel', 'place'].forEach(function (k) {
        db.event[k] = String(fd.get(k) || '').trim();
      });
      var pl = String(fd.get('playlist') || '').trim();
      var plm = pl.match(/[?&]list=([\w-]+)/);
      db.event.playlist = plm ? plm[1] : pl;
      db.event.votacaoAbre = String(fd.get('votacaoAbre') || '').trim();
      var tt = parseInt(String(fd.get('totalTrilheiros') || '').trim(), 10);
      db.event.totalTrilheiros = tt > 0 ? tt : '';
      if (remote.on) {
        sbRpc('definir_total_trilheiros', { p_chave: localState.adminKey || '', p_total: tt > 0 ? tt : null }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
          remote.totalTrilheiros = tt > 0 ? tt : 0;
          save(); toast('Evento atualizado. O total de trilheiros já vale para todo mundo.');
        }).catch(function (e) {
          save();
          toast(e && e.message === 'chave_invalida' ? 'Salvei neste aparelho, mas a senha não confere com a do banco. Saia e entre de novo.'
            : 'Salvei neste aparelho. O total de trilheiros não chegou ao banco: confira se o supabase.sql novo já foi rodado.');
        });
        return;
      }
      save(); toast('Evento atualizado.');
      return;
    }
    if (f.id === 'editorForm') { saveEditor(f); return; }
    if (f.id === 'gateForm') {
      var raw = $('#gcpf').value.trim();
      if (!validCPF(raw)) { flow.error = 'CPF inválido. Confira os números e tente de novo.'; render(); return; }
      var nm = String($('#gname').value || '').trim();
      sha256(onlyDigits(raw) + '|' + SALT).then(function (h) {
        localState.name = nm;
        localState.hash = h;
        localState.code = makeCode(h);
        flow.error = ''; saveLocal(); go('home'); render();
        syncMeuVoto();
      });
      return;
    }
    if (f.id === 'idForm') {
      var rawv = $('#voterId').value.trim();
      if (!validCPF(rawv)) { flow.error = 'CPF inválido. Confira os números e tente de novo.'; render(); return; }
      sha256(onlyDigits(rawv) + '|' + SALT).then(function (h) {
        localState.hash = h; localState.code = makeCode(h);
        flow.error = ''; saveLocal(); render(); syncMeuVoto();
      });
      return;
    }
    if (f.id === 'kwForm') {
      var typed = String($('#kw').value || '').trim().toUpperCase().replace(/\s+/g, '');
      var want = String(db.voting.keyword || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!want) { flow.error = 'A organização ainda não definiu a palavra-chave.'; render(); return; }
      if (typed !== want) { flow.error = 'Palavra-chave incorreta. Confira o que foi anunciado e tente de novo.'; render(); return; }
      flow.error = ''; localState.unlocked = true; saveLocal(); render(); toast('Votação destravada.');
      return;
    }
    if (f.id === 'palavraAdminForm') {
      if (!remote.on) { toast('Disponível na versão publicada.'); return; }
      var chaveAdm = localState.adminKey || '';
      if (!chaveAdm) { toast('Entre de novo com a senha da organização.'); localState.admin = false; saveLocal(); go('admin'); return; }
      var nova = String(new FormData(f).get('palavraEvento') || '').trim();
      sbRpc('definir_chave_evento', { p_chave: chaveAdm, p_nova: nova }).then(function (r) {
        if (r && r.ok) {
          remote.exigeChave = !!r.exige_chave;
          render();
          toast(r.exige_chave ? 'Palavra-chave salva.' : 'Palavra-chave removida — agora basta o CPF.');
        } else {
          toast(ERROS[r && r.erro] || 'Não consegui salvar.');
        }
      }).catch(function () { toast('Sem conexão com o servidor.'); });
      return;
    }
    if (f.id === 'kwAdminForm') {
      db.voting.keyword = String(new FormData(f).get('kwv') || '').trim().toUpperCase();
      save(); toast('Palavra-chave salva.');
      return;
    }
    if (f.id === 'retroForm') {
      var fd2 = new FormData(f);
      db.retro.title = String(fd2.get('rtitle') || '').trim();
      db.retro.lead = String(fd2.get('rlead') || '').trim();
      save(); toast('Título e texto salvos.');
      return;
    }
    if (f.id === 'resultsForm') {
      var fr = new FormData(f), res = {};
      db.projects.forEach(function (p) { if (fr.has(p.id)) res[p.id] = Math.max(0, +fr.get(p.id) || 0); });
      db.voting.results = res; save(); toast('Números salvos.');
      return;
    }
  });

  document.addEventListener('change', function (ev) {
    var alvo = ev.target;
    if (alvo && alvo.id === 'fotoInput' && alvo.files && alvo.files.length) {
      adicionarFotos(alvo.files, alvo.getAttribute('data-esc') || 'geral');
      alvo.value = '';
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeSheet(); return; }
    if (lb.i == null) return;
    var n = listaLb().length;
    if (!n) return;
    if (ev.key === 'ArrowRight') { lb.i = (lb.i + 1) % n; renderOverlay(); }
    if (ev.key === 'ArrowLeft') { lb.i = (lb.i - 1 + n) % n; renderOverlay(); }
  });

  /* ---------------------- acesso discreto ao painel ---------------------- */
  (function () {
    var taps = 0, timer = null;
    $('#brandBtn').addEventListener('click', function () {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 1400);
      if (taps >= 4) { taps = 0; go('admin'); }
      else if (taps === 1) { if (route.name !== 'home') go('home'); }
    });
  })();

  /* ------------------------------ sincronismo ---------------------------- */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { load(); render(); }
  });

  /* ----------------------- funcionar com internet fraca ------------------ */
  // guarda páginas, textos e imagens no aparelho (sw.js). A votação, o painel
  // e tudo que vem do banco continuam indo sempre à internet.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* segue sem cache */ });
    });
  }

  /* --------------------------------- init -------------------------------- */
  load();
  var r0 = parseHash(); route.name = r0.name; route.param = r0.param;
  render();

  if (remote.on) {
    syncEstado();
    syncMeuVoto();
    syncFotos();
    syncOpcoes();
    syncConteudo();
    setInterval(function () { syncEstado(); }, 12000);
    setInterval(function () { syncFotos(); }, 60000);
    setInterval(function () { syncConteudo(); }, 30000);
    window.addEventListener('focus', function () { syncEstado(); syncFotos(); syncOpcoes(); syncConteudo(); });
  }

  // painel aberto: a apuração dos Heróis se atualiza sozinha a cada 15 segundos
  setInterval(function () {
    if (route.name !== 'admin' || !localState.admin) return;
    if (document.visibilityState === 'hidden') return;
    if (!$('#painelRes')) return;
    atualizarApuracaoSilenciosa();
  }, RES_INTERVALO);

  setInterval(function () {
    // a virada do dia do evento redesenha a tela mesmo fora de Início
    var fase = eventPhase();
    if (lastPhase !== null && fase !== lastPhase) { lastPhase = fase; render(); return; }
    lastPhase = fase;

    if (route.name !== 'home' && route.name !== 'programacao') return;
    var lv = liveItem(), id = lv ? lv.id : null;
    if (id !== lastLiveId) { render(); return; }
    tickLive();
  }, 1000);

})();
