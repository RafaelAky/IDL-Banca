/* =====================================================================
   IDL — Encerramento da Trilha 2026 (Banca Final IDL Tech)
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
      version: 1, contentVersion: 11,
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
    corrigirTextos(db);
    if (!db.avisos) db.avisos = [];
    if (!db.clock) db.clock = { simulated: false, baseReal: Date.now(), baseSim: Date.now() };
    return db;
  }

  /* Correções de texto conferidas nos pôsteres mais recentes. Valem para o
     conteúdo guardado no aparelho e para o que vem do banco, sem apagar o
     que a organização editou no painel: só troca o trecho exato.
     Versão 11 · "Projeto final 3" (30/10/2026).                          */
  var CORRECOES = [
    ['prj_ouvir', 'problem', 'A falta da escuta compassiva', 'A falta de escuta compassiva']
  ];
  // o "?v=3" no fim força o navegador a buscar de novo (ignora um "não
  // encontrado" que tenha ficado guardado antes de as imagens subirem)
  var IMAGENS_NOVAS = {
    'img/heroi-01.webp': 'img/heroi-01-v2.webp?v=3',    // Clara
    'img/heroi-14.webp': 'img/heroi-14-v2.webp?v=3',    // Karol
    'img/heroi-16.webp': 'img/heroi-16-v2.webp?v=3',    // Lydia
    'img/heroi-17b.webp': 'img/heroi-17b-v2.webp?v=3',  // Neo
    'img/heroi-06.webp': 'img/heroi-06-v2.webp?v=3'     // Duda: a bota da direita agora vai até o chão
  };
  // conteúdo salvo antes com o endereço sem o "?v=3"
  Object.keys(IMAGENS_NOVAS).forEach(function (k) { IMAGENS_NOVAS[IMAGENS_NOVAS[k].split('?')[0]] = IMAGENS_NOVAS[k]; });
  function corrigirTextos(d) {
    if (!d || !d.projects) return d;
    CORRECOES.forEach(function (c) {
      d.projects.forEach(function (p) {
        if (p.id === c[0] && typeof p[c[1]] === 'string' && p[c[1]].indexOf(c[2]) >= 0) p[c[1]] = p[c[1]].split(c[2]).join(c[3]);
      });
    });
    // ilustrações novas (30/10/2026): troca só quem ainda usa a imagem antiga
    d.projects.forEach(function (p) {
      (p.heroes || []).forEach(function (h) { if (IMAGENS_NOVAS[h.image]) h.image = IMAGENS_NOVAS[h.image]; });
    });
    if ((d.contentVersion || 1) < 11) d.contentVersion = 11;
    return d;
  }
  function save() { safeSet(KEY, JSON.stringify(db)); render(); enviarConteudo(); }

  var localState = (function () {
    var raw = safeGet(LOCAL); var o = null;
    if (raw) { try { o = JSON.parse(raw); } catch (e) { o = null; } }
    o = o || { visited: [], voted: null, unlocked: false, code: null, hash: null, name: '', device: uid('dev'), bannerOff: false, admCardOff: false, admin: false, adminKey: '' };
    if (!Array.isArray(o.visited)) o.visited = [];   // dado antigo ou incompleto no aparelho
    if (!o.device) o.device = uid('dev');
    return o;
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
  /* miniatura leve (640 px de altura) das ilustrações dos Heróis, para listas,
     cards e a turma. As páginas de detalhe e o telão usam a imagem grande.
     Se a miniatura não existir no servidor, a imagem grande entra no lugar. */
  function mini(src) {
    var m = /^(?:\.?\/)?img\/(heroi-[\w-]+\.webp)(\?.*)?$/.exec(String(src || ''));
    return m ? 'img/mini/' + m[1] + (m[2] || '') : src;
  }
  function projectImage(p) {
    if (p.cover) return { src: p.cover, contain: false };
    var h = (p.heroes || [])[0];
    return h && h.image ? { src: mini(h.image), contain: true } : { src: '', contain: false };
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
    return !!localState.admin;
  }
  /* A aba Votação só aparece para o público quando a organização liga a
     chave "Mostrar a votação no site" no painel (abrir a votação também
     liga). Vale para todos, inclusive o aparelho da organização.
     Sem banco (modo prévia), vale a data do evento.                       */
  function mostraVotacao() {
    if (votacaoAberta()) return true;
    if (remote.on) return remote.visivel;
    if (localState.admin || localState.voted) return true;
    return eventPhase() !== 'antes';
  }
  var NAV_BANCA = { id: 'banca', label: 'Banca', shortLabel: 'Banca', icon: 'i-users' };
  /* MODO PÓS-EVENTO: ligado no painel (aba Evento) quando a Banca termina.
     O Início vira agradecimento + vencedores + fotos, e a aba Votação dá
     lugar a "Vencedores". Desligar volta tudo ao modo de evento.          */
  function posEvento() { return !!(db && db.posEvento); }
  var NAV_VENC = { id: 'resultado', label: 'Vencedores', shortLabel: 'Vencedores', icon: 'i-spark' };
  function navItens() {
    var base = mostraVotacao() ? NAV_BASE : NAV_BASE.filter(function (n) { return n.id !== 'votacao'; });
    if (posEvento()) {
      base = NAV_BASE.filter(function (n) { return n.id !== 'votacao'; });
      if (!remote.on || remote.resultadoPublico) base = base.concat([NAV_VENC]);
    }
    if (bancaLogada()) base = base.concat([NAV_BANCA]);
    return ehAdmin() ? base.concat([NAV_ADMIN]) : base;
  }
  function navGroup(cur) {
    if (cur === 'heroi' || cur === 'projeto' || cur === 'herois') return 'projetos';
    if (cur === 'resultado') return posEvento() ? 'resultado' : 'votacao';
    if (cur === 'decisao') return 'banca';
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

  /* rodapé institucional (igual ao do site do Instituto), no fim de todas
     as páginas públicas; os links rápidos levam às páginas desta Banca.   */
  var IDL_REDES = [
    { n: 'Instagram', u: 'https://www.instagram.com/institutodentedeleao/',
      d: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/>' },
    { n: 'YouTube', u: 'https://www.youtube.com/@Institutodentedele%C3%A3oIDL',
      d: '<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" stroke="none"/><path d="M10 9l5 3-5 3z" fill="#fff" stroke="none"/>' },
    { n: 'LinkedIn', u: 'https://www.linkedin.com/company/institutodentedele%C3%A3o',
      d: '<rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="currentColor" stroke="none"/><path d="M7.5 10.2v6.6M7.5 7.3v.1M11 16.8v-6.6M11 13c0-1.7 1-2.9 2.6-2.9s2.4 1.1 2.4 2.9v3.8" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>' }
  ];
  function florInstituto() {
    var p = '';
    for (var i = 0; i < 16; i++) p += '<path d="M50 50 L46 14 L50 2 L54 14 Z" transform="rotate(' + (i * 22.5) + ' 50 50)" fill="' + (i % 2 ? '#f6b54a' : '#f39a1f') + '"/>';
    return '<svg class="rf-flor" viewBox="0 0 100 100" aria-hidden="true">' + p +
      '<circle cx="50" cy="50" r="15" fill="#e8860f"/>' +
      '<path d="M50 40v20M40 50h20M43 43l14 14M57 43L43 57" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
  }
  function idlFooter() {
    var links = navItens().filter(function (n) { return !n.admin; }).map(function (n) {
      return '<li><a href="#/' + (n.id === 'home' ? '' : n.id) + '">' + esc(n.label) + '</a></li>';
    }).join('');
    return '<footer class="rodape-idl">' +
      '<div class="cont rf-in">' +
        '<div class="rf-marca">' +
          '<a class="rf-logo" href="https://institutodentedeleao.com.br/" aria-label="Instituto Dente de Leão"><img src="img/logo-instituto.webp?v=1" width="820" height="169" alt="Instituto Dente de Leão"></a>' +
          '<p>Instituto Dente de Leão. Fortalecendo pessoas, semeando consciência e transformando realidades.</p>' +
        '</div>' +
        '<nav class="rf-col" aria-label="Links rápidos"><h2>Links rápidos</h2><ul>' + links + '</ul></nav>' +
        '<div class="rf-col"><h2>Siga-nos</h2>' +
          '<p class="rf-contato"><b>Contato</b>' +
          '<a href="mailto:contato@institutodentedeleao.com.br">contato@institutodentedeleao.com.br</a>' +
          '<a href="https://wa.me/5511917041808" target="_blank" rel="noopener">+55 11 91704-1808</a>' +
          '<span>Curitiba, Paraná – Brasil</span></p>' +
          '<div class="rf-redes">' + IDL_REDES.map(function (r) {
            return '<a href="' + r.u + '" target="_blank" rel="noopener" aria-label="' + r.n + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + r.d + '</svg></a>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="rf-base"><div class="cont">© ' + new Date().getFullYear() + ' Instituto Dente de Leão. Todos os direitos reservados.</div></div>' +
      '</footer>';
  }
  function comRodape() { return !/^(telao|mesa|admin|banca|decisao|mosaico|controle)$/.test(route.name); }

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
      (h && h.image ? '<img src="' + esc(mini(h.image)) + '" alt="' + (attrs && /aria-hidden/.test(attrs) ? '' : 'Ilustração do Herói ' + esc(h.name)) + '" loading="lazy">' : '<span class="quadro-vazio">' + ico('i-seed') + '</span>') +
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
        '<img src="' + esc(mini(x.hero.image)) + '" alt="" loading="lazy">' +
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

  /* carrossel da página inicial: troca sozinho a cada 8 s, pausa com o mouse
     em cima ou com a aba em segundo plano; setas, pontos e deslize no celular */
  var carrossel = { i: 0, n: 2, timer: null, pausado: false, TEMPO: 8000 };
  function carIr(k, manual) {
    carrossel.i = (k + carrossel.n) % carrossel.n;
    var raiz = document.querySelector('.carrossel');
    if (raiz) {
      Array.prototype.forEach.call(raiz.querySelectorAll('.car-slide'), function (el, j) { el.classList.toggle('is-ativo', j === carrossel.i); });
      Array.prototype.forEach.call(raiz.querySelectorAll('.car-pontos button'), function (b, j) {
        var at = j === carrossel.i;
        b.classList.remove('is-ativo'); void b.offsetWidth;   // reinicia a barrinha de tempo
        if (at) { b.classList.add('is-ativo'); b.setAttribute('aria-current', 'true'); } else b.removeAttribute('aria-current');
      });
    }
    if (manual) carAgendar();
  }
  function carAgendar() {
    clearTimeout(carrossel.timer);
    carrossel.timer = setTimeout(function () {
      if (route.name === 'home' && !carrossel.pausado && document.visibilityState !== 'hidden' &&
          !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) carIr(carrossel.i + 1);
      carAgendar();
    }, carrossel.TEMPO);
  }
  carAgendar();
  document.addEventListener('mouseover', function (e) { carrossel.pausado = !!(e.target.closest && e.target.closest('.carrossel')); });
  (function () {
    var x0 = null;
    document.addEventListener('touchstart', function (e) { x0 = (e.target.closest && e.target.closest('.car-slides')) ? e.touches[0].clientX : null; }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) carIr(carrossel.i + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
  })();

  function viewHome() {
    var ev = db.event, live = liveItem(), nxt = live ? null : nextItem(), pos = posEvento();
    // banner do Herói vencedor (depois do evento) entra como o primeiro
    var temVenc = vencedoresPublicos().length > 0;
    if (carrossel.n !== (temVenc ? 3 : 2)) { carrossel.n = temVenc ? 3 : 2; carrossel.i = 0; }
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
    var rail = (dp.first && aoVivo() && !pos) ? '<div class="dayrail">' +
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

    if (pos) {
      nowHtml = '<article class="nowcard is-next pos-prox" id="nowCard">' +
        '<p class="now-k"><span>Vem aí</span></p>' +
        '<h2 class="ttl">A próxima Trilha já está sendo preparada</h2>' +
        '<p class="desc">Os projetos e os Heróis de 2026 continuam aqui. Acompanhe o Instituto Dente de Leão para saber quando começa a próxima turma e a próxima Banca.</p>' +
        '<a class="btn btn-outline" href="https://institutodentedeleao.com.br/" target="_blank" rel="noopener">Conheça o Instituto ' + ico('i-chev') + '</a>' +
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
    if (pos) {
      // no pós-evento, a faixa da votação vira a dos vencedores (se já foram publicados)
      var vPub = vencedoresPublicos();
      voteHtml = vPub.length ? '<section class="faixa fx-branco home-venc"><div class="cont">' +
        '<div class="hv-cab"><span class="eyebrow">Banca Final · ' + esc(ev.dateLabel || '') + '</span><h2 class="titulo">Os vencedores da Trilha 2026</h2></div>' +
        vencedoresHtml(vPub.map(function (x) { return opcaoPorId(x.hero.id); }).filter(Boolean), pubRes.dados && pubRes.dados.banca) +
        '</div></section>' : '';
    } else if (localState.voted) {
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

      /* ---- a dobra: banners que se alternam ----
         1) o evento, com os Heróis atravessando a tela e a chamada para os projetos
         2) o Instituto Dente de Leão, com o link para o site dele            */
      '<section class="carrossel" aria-roledescription="carrossel" aria-label="Destaques">' +
      '<div class="car-slides">' +
      slideVencedor(carrossel.i === 0 && temVenc) +
      '<section class="faixa fx-escuro dobra car-slide' + (carrossel.i === (temVenc ? 1 : 0) ? ' is-ativo' : '') + '" aria-roledescription="slide">' +
        desfileHerois() +
        '<div class="cont dobra-txt">' +
          (pos
          ? '<span class="eyebrow">Trilha 2026 · concluída</span>' +
            '<h1 class="mega">Obrigado por trilhar com a gente</h1>' +
            '<p class="dobra-sub">' + esc(ev.name) + (ev.dateLabel ? ' · ' + esc(ev.dateLabel) : '') + '</p>' +
            '<div class="dobra-chamada">' +
              '<p>Obrigado aos trilheiros, às famílias, aos jurados e aos parceiros. Os ' + nProjetos() + ' projetos e os Heróis criados ao longo do ano continuam aqui.</p>' +
              '<button class="btn btn-lg btn-laranja inst-btn" data-nav="' + (temVenc ? 'resultado' : 'projetos') + '">' + (temVenc ? 'Ver os vencedores' : 'Conheça os projetos') + '</button>' +
            '</div>'
          : '<span class="eyebrow">' + (firstName(localState.name) ? 'Olá, ' + esc(firstName(localState.name)) : 'Formatura 2026') + '</span>' +
          '<h1 class="mega">' + esc(ev.name) + '</h1>' +
          '<p class="dobra-sub">' + esc(ev.subtitle) + '</p>' +
          '<p class="dobra-meta">' + meta + '</p>' +
          rail +
          '<div class="dobra-chamada">' +
            '<p>Cada projeto é uma ideia que nasceu na Trilha para transformar a comunidade. Conheça os ' +
              nProjetos() + ' projetos e os Heróis criados pelos trilheiros.</p>' +
            '<button class="btn btn-lg btn-laranja inst-btn" data-nav="projetos">Conheça os projetos</button>' +
          '</div>') +
        '</div>' +
      '</section>' +
      '<section class="faixa dobra-inst car-slide' + (carrossel.i === (temVenc ? 2 : 1) ? ' is-ativo' : '') + '" aria-roledescription="slide">' +
        '<img class="inst-foto" src="img/banner-instituto.webp" alt="" loading="lazy">' +
        '<div class="cont inst-txt">' +
          '<span class="eyebrow">Instituto Dente de Leão</span>' +
          '<h2 class="inst-tit">Alcançamos<br>para transformar.</h2>' +
          '<p class="inst-lead">O Instituto Dente de Leão existe para gerar transformação na sociedade por meio das pessoas, reforçando a crença de que atitudes íntegras, compromisso com o bem e responsabilidade individual geram impacto real no coletivo.</p>' +
          '<a class="btn btn-lg btn-laranja inst-btn" href="https://institutodentedeleao.com.br/">Conheça o Instituto</a>' +
        '</div>' +
      '</section>' +
      '</div>' +
      '<button type="button" class="car-seta car-ant" data-act="carAnt" aria-label="Banner anterior">' + ico('i-arrow-left') + '</button>' +
      '<button type="button" class="car-seta car-prox" data-act="carProx" aria-label="Próximo banner">' + ico('i-chev') + '</button>' +
      '<div class="car-pontos">' + (temVenc ? [0, 1, 2] : [0, 1]).map(function (k) {
        return '<button type="button" data-act="carIr" data-i="' + k + '" aria-label="Banner ' + (k + 1) + '"' +
          (carrossel.i === k ? ' class="is-ativo" aria-current="true"' : '') + '><i></i></button>';
      }).join('') + '</div>' +
      '</section>' +

      (pos ? '' : cartaoPalco()) +
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

      (pos ? voteHtml : '') +
      '<section class="faixa fx-tint home-agora"><div class="cont agora-in">' +
      nowHtml + shortcuts + '</div></section>' +
      turma +
      sepTrilhei() +
      fotos +
      (pos ? '' : voteHtml) +
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
            var noPalco = remote.palco === p.id;
            return '<button class="tlproj' + (noPalco ? ' is-palco' : '') + '" data-go="projeto/' + esc(p.id) + '"><b class="num">' + esc(p.slot) + '</b>' + esc(p.name) +
              (noPalco ? '<span class="pc-ao-vivo"><i></i>No palco</span>' : '') + '</button>';
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
    // setas nas pontas (e deslizar o dedo / teclado), como nos Heróis
    var setasP = db.projects.length > 1 ?
      '<button class="det-seta esq" data-heroi-passo="-1" data-go="projeto/' + esc(prev.id) + '" aria-label="Projeto anterior: ' + esc(prev.name) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>' + esc(prev.name) + '</span></button>' +
      '<button class="det-seta dir" data-heroi-passo="1" data-go="projeto/' + esc(next.id) + '" aria-label="Próximo projeto: ' + esc(next.name) + '">' +
        '<span>' + esc(next.name) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' : '';
    var entraP = heroiEntrada; heroiEntrada = '';
    var figs = hs.length ? '<div class="det-figs n' + hs.length + '">' + florGirando() + setasP.replace(/det-seta /g, 'det-seta no-cel ') + hs.map(function (h) {
      return '<img' + clsPe(h.image) + ' src="' + esc(h.image) + '" alt="Ilustração do Herói ' + esc(h.name) + '">';
    }).join('') + '</div>' : '';

    return '<div class="view detalhe view-passa' + (entraP ? ' entra-' + entraP : '') + '" data-prev="projeto/' + esc(prev.id) + '" data-next="projeto/' + esc(next.id) + '">' +
      '<section class="faixa fx-tint det-topo det-projeto">' +
        fundoDetalhe((p.heroes || []).map(function (h) { return String(h.name || '').split(/\s+[—–-]\s+/)[0]; }).join(' · ')) +
        (hs.length ? setasP.replace(/det-seta /g, 'det-seta no-pc ') : setasP) +
        '<div class="cont det-topo-in">' +
          '<div class="det-txt">' +
            '<button class="voltar" data-go="projetos">' + ico('i-arrow-left') + 'Projetos</button>' +
            (remote.palco === p.id ? '<span class="pc-ao-vivo"><i></i>No palco agora</span>' : '') +
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
      (h.image ? '<img src="' + esc(mini(h.image)) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="vp-play" aria-hidden="true">' + ico('i-play') + '</span>' +
      '<span class="vp-text"><span class="vp-k">Assista</span>' +
      '<span class="vp-n">A campanha de ' + esc(h.name) + '</span>' +
      '<span class="vp-s">Vídeo no canal do Instituto</span></span>' +
      '</button></section>';
  }

  /* fundo das páginas de Herói e de projeto: sementes de dente-de-leão
     subindo devagar (a flor do Instituto gira atrás dos personagens)     */
  // a flor do Instituto, em roxo, girando bem devagar atrás dos personagens.
  // A imagem vai embutida aqui mesmo (não depende de outro arquivo no servidor).
  var FLOR_ROXA = 'data:image/webp;base64,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';
  function florGirando() {
    return '<span class="df-flor" aria-hidden="true"><img src="' + FLOR_ROXA + '" alt=""></span>';
  }
  function fundoDetalhe(nome) {
    // só o nome curto: "Miguel — Eco Mensageiro" vira "Miguel"
    nome = String(nome || '').split(/\s+[—–-]\s+/)[0].trim();
    var sem = '';
    for (var i = 0; i < 10; i++) {
      var x = 4 + (i * 37) % 92, tam = 16 + (i * 11) % 26, dur = 22 + (i * 7) % 16;
      var atraso = -((i * 6.7) % dur), bal = 18 + (i * 13) % 40;
      sem += '<span class="df-semente" style="left:' + x + '%;--t:' + tam + 'px;--dur:' + dur + 's;--atr:' + atraso.toFixed(1) +
        's;--bal:' + bal + 'px;--gir:' + (((i % 2) ? 1 : -1) * (10 + i * 3)) + 'deg">' + sementeSvg() + '</span>';
    }
    return '<span class="det-fundo" aria-hidden="true">' + sem + '</span>';
  }

  // ilustrações cujo arquivo já termina cortado nos pés (conferido nos arquivos)
  var PE_CORTADO = { 'img/heroi-05.webp': 1 };
  function clsPe(src) { return PE_CORTADO[src] ? ' class="pe-cortado"' : ''; }
  /* passar de Herói: setas nas pontas, deslizar o dedo no celular e as setas do teclado */
  var heroiEntrada = '';
  function passarHeroi(passo) {
    var v = document.querySelector('.view-passa');
    if (!v) return;
    var destino = v.getAttribute(passo > 0 ? 'data-next' : 'data-prev');
    if (!destino) return;
    heroiEntrada = passo > 0 ? 'dir' : 'esq';
    go(destino);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-heroi-passo]');
    if (b) heroiEntrada = b.getAttribute('data-heroi-passo') > 0 ? 'dir' : 'esq';
  }, true);
  (function () {
    var x0 = null, y0 = 0;
    document.addEventListener('touchstart', function (e) {
      x0 = null;
      if (!document.querySelector('.view-passa') || e.touches.length !== 1) return;
      if (e.target.closest && e.target.closest('input, textarea, select, video, iframe, .pagenav')) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) passarHeroi(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if (e.key === 'ArrowRight') passarHeroi(1);
      else if (e.key === 'ArrowLeft') passarHeroi(-1);
    });
  })();

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
    var setas = list.length > 1 ?
      '<button class="det-seta esq" data-heroi-passo="-1" data-go="heroi/' + esc(hprev.hero.id) + '" aria-label="Herói anterior: ' + esc(hprev.hero.name) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>' + esc(hprev.hero.name) + '</span></button>' +
      '<button class="det-seta dir" data-heroi-passo="1" data-go="heroi/' + esc(hnext.hero.id) + '" aria-label="Próximo Herói: ' + esc(hnext.hero.name) + '">' +
        '<span>' + esc(hnext.hero.name) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' : '';
    var entra = heroiEntrada; heroiEntrada = '';

    return '<div class="view detalhe view-heroi view-passa' + (entra ? ' entra-' + entra : '') + '" data-prev="heroi/' + esc(hprev.hero.id) + '" data-next="heroi/' + esc(hnext.hero.id) + '">' +
      '<section class="faixa fx-tint det-topo det-heroi">' + fundoDetalhe(h.name) + setas.replace(/det-seta /g, 'det-seta no-pc ') +
        '<div class="cont det-topo-in">' +
          '<div class="det-txt">' +
            '<button class="voltar" data-go="herois">' + ico('i-arrow-left') + 'Heróis</button>' +
            '<p class="det-meta">' + esc(eq ? (p.group ? 'Grupo ' + p.group + ' · ' : '') + eq.label : (p.group ? 'Grupo ' + p.group : 'Herói da Trilha')) + '</p>' +
            '<h1 class="titulo-pag">' + esc(h.name) + '</h1>' +
            (insp ? '<p class="lead">' + (/signific/i.test(insp) ? esc(insp) : 'Inspirado em ' + esc(insp)) + '</p>' : '') +
            '<p class="det-nota num">Herói ' + (hidx + 1) + ' de ' + list.length + '</p>' +
            (ehCandidato(h) ? '<p class="det-candidato">' + ico('i-vote') + ' Candidato na votação do público</p>' : '') +
          '</div>' +
          '<div class="det-figs n1">' + florGirando() + setas.replace(/det-seta /g, 'det-seta no-cel ') +
            (h.image ? '<img' + clsPe(h.image) + ' src="' + esc(h.image) + '" alt="Ilustração do Herói ' + esc(h.name) + '">' : '') +
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
      '</div>';
  }

  /* ============================ BANCO DE VOTOS ============================ */
  var BE = (window.IDL_BACKEND || {});
  var remote = { on: !!(BE.url && BE.anonKey), rodada: 0, visivel: false, palco: null, revelar: false, revelarBanca: false, slide: null, pausa: false, decisao: false, avaliacoes: false, aberta: false, resultadoPublico: false, exigeChave: false, totalTrilheiros: 0, carregou: false, erro: '' };
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
    var pedido = Date.now();
    sbEstado().then(function (row) {
      // resposta pedida antes da última troca de slide feita aqui terminar: velha, ignora
      if (pedido < apres.corte) return;
      aplicarEstado(row, then);
    }).catch(function () { remote.erro = 'offline'; });
  }
  function aplicarEstado(row, then) {
      if (!row) return;
      // troca de slide feita neste aparelho e ainda não confirmada: mantém a nossa
      if (apres.pend) {
        if ((row.slide || '') === (apres.pend.key || '') || Date.now() - apres.pend.t > 5000) { if (!apres.voando) apres.pend = null; }
        else { row = JSON.parse(JSON.stringify(row)); row.pausa = false; row.slide = apres.pend.key || null; row.revelar_telao = apres.pend.key === 'revelaHeroi'; row.revelar_banca = apres.pend.key === 'revelaBanca'; if (apres.pend.palco !== null) row.palco = apres.pend.palco || null; else row.palco = remote.palco; }
      }
      var total = parseInt(row.total_trilheiros, 10) > 0 ? parseInt(row.total_trilheiros, 10) : 0;
      var mudou = (remote.aberta !== row.votacao_aberta) || (remote.resultadoPublico !== row.resultado_publico) ||
                  (remote.exigeChave !== !!row.exige_chave) || (remote.totalTrilheiros !== total) || !remote.carregou;
      if (remote.resultadoPublico !== !!row.resultado_publico) { pubRes.dados = null; pubRes.erro = ''; pubRes.pediu = false; }
      if (remote.visivel !== !!row.votacao_visivel) mudou = true;
      remote.visivel = !!row.votacao_visivel;
      if (row.pausa != null && remote.pausa !== !!row.pausa) { remote.pausa = !!row.pausa; mudou = true; }
      if (row.slide !== undefined && remote.slide !== (row.slide || null)) { remote.slide = row.slide || null; mudou = true; }
      if (row.revelar_banca != null && remote.revelarBanca !== !!row.revelar_banca) {
        remote.revelarBanca = !!row.revelar_banca; mudou = true;
        if (remote.revelarBanca) telao.revelInicio = Date.now(); telao.vencBanca = null;
      }
      if (row.avaliacoes_abertas != null && remote.avaliacoes !== !!row.avaliacoes_abertas) { remote.avaliacoes = !!row.avaliacoes_abertas; mudou = true; }
      if (remote.decisao !== !!row.decisao_aberta) { remote.decisao = !!row.decisao_aberta; mudou = true; banca.dec.dados = null; if (route.name === 'decisao') carregarDecisao(); }
      var palcoNovo = row.palco || null;
      if (remote.palco !== palcoNovo) { var tinhaPalco = remote.carregou; remote.palco = palcoNovo; mudou = true; if (tinhaPalco && palcoNovo) bancaAvisoPalco(palcoNovo); }
      if (remote.revelar !== !!row.revelar_telao) {
        remote.revelar = !!row.revelar_telao; mudou = true;
        if (remote.revelar) telao.revelInicio = Date.now(); telao.vencedores = null;
      }
      remote.aberta = !!row.votacao_aberta;
      remote.resultadoPublico = !!row.resultado_publico;
      remote.exigeChave = !!row.exige_chave;
      remote.totalTrilheiros = total;
      // "Zerar tudo" da organização: limpa o que este aparelho guarda
      var rein = parseInt(row.reinicio, 10) || 0;
      if (row.reinicio != null) {
        if (localState.reinicio == null) { localState.reinicio = rein; saveLocal(); }
        else if (localState.reinicio !== rein) {
          localState.reinicio = rein; localState.visited = []; localState.voted = null;
          flow.picked = null; flow.error = ''; flow.busy = false;
          banca.itens = {}; banca.rascunho = {}; banca.carregou = false; banca.dec.dados = null; banca.dec.escolha = null;
          saveLocal(); mudou = true;
        }
      }
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
  }

  /* tempo real (Supabase Realtime, WebSocket): no telão e no controle, cada
     mudança do estado chega na hora. Se a conexão não abrir ou cair, segue
     tudo pela consulta de 1 em 1 segundo, como antes.                     */
  var rt = { ws: null, ok: false, ref: 0, hb: null, falhas: 0, espera: null };
  function rtEnviar(o) { try { rt.ws.send(JSON.stringify(o)); } catch (e) { /* conexão caiu */ } }
  function rtConectar() {
    if (!remote.on || rt.ws || rt.espera || !window.WebSocket || !/^(telao|controle)$/.test(route.name)) return;
    var url = String(BE.url).replace(/^http/, 'ws').replace(/\/+$/, '') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(BE.anonKey) + '&vsn=1.0.0';
    var ws;
    try { ws = new WebSocket(url); } catch (e) { return; }
    rt.ws = ws;
    ws.onopen = function () {
      rtEnviar({ topic: 'realtime:idl-estado', event: 'phx_join', ref: String(++rt.ref), join_ref: '1',
        payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: 'UPDATE', schema: 'public', table: 'estado_votacao' }] }, access_token: BE.anonKey } });
      rt.hb = setInterval(function () { rtEnviar({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++rt.ref) }); }, 25000);
    };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.event === 'phx_reply' && m.topic === 'realtime:idl-estado' && m.payload && m.payload.status === 'ok') { rt.ok = true; rt.falhas = 0; }
      if (m.event === 'postgres_changes' && m.payload && m.payload.data && m.payload.data.record) aplicarEstado(m.payload.data.record);
    };
    ws.onclose = ws.onerror = function () {
      if (rt.ws !== ws) return;
      clearInterval(rt.hb); rt.ws = null; rt.ok = false; rt.falhas++;
      rt.espera = setTimeout(function () { rt.espera = null; rtConectar(); }, Math.min(30000, 1000 * Math.pow(2, rt.falhas)));
    };
  }
  function rtFechar() {
    if (!rt.ws) return;
    var ws = rt.ws; rt.ws = null; rt.ok = false; clearInterval(rt.hb);
    try { ws.close(); } catch (e) { /* já fechou */ }
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
    db = corrigirTextos(dados);
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
  // os dois prêmios lado a lado: Herói do público e Projeto destaque da banca
  function vencBancaOpcao(id) {
    var p = byId(id); if (!p) return null;
    var hs = p.heroes || [];
    return { id: id, name: p.name, image: (hs[0] && hs[0].image) || projectImage(p).src,
      sub: hs.length ? (hs.length > 1 ? 'Heróis: ' : 'Herói: ') + hs.map(function (h) { return String(h.name).split(/\s+[—–-]\s+/)[0]; }).join(', ') : (p.tagline || ''),
      go: 'projeto/' + id };
  }
  function vencedoresHtml(publico, banca) {
    var bs = (banca || []).map(function (v) { return vencBancaOpcao(v.id); }).filter(Boolean);
    function card(cls, tag, titulo, lista, vazio) {
      return '<section class="venc-card ' + cls + '"><span class="venc-tag">' + esc(tag) + '</span><h3 class="venc-premio">' + esc(titulo) + '</h3>' +
        (lista.length ? lista.map(function (o) {
          return '<div class="venc-item">' + (o.image ? '<figure class="venc-fig"><img src="' + esc(mini(o.image)) + '" alt="" loading="lazy"></figure>' : '') +
            '<h2 class="h2">' + esc(o.name) + '</h2>' + (o.sub ? '<p class="small">' + esc(o.sub) + '</p>' : '') +
            (o.go ? '<button class="btn btn-outline btn-sm" data-go="' + esc(o.go) + '">Conheça a história</button>' : '') + '</div>';
        }).join('') : '<p class="venc-vazio">' + esc(vazio) + '</p>') + '</section>';
    }
    return '<div class="venc-grade">' +
      card('venc-pub', 'Prêmio do público', 'Herói da Trilha', publico || [], 'Ainda sem votos.') +
      card('venc-banca', 'Prêmio da banca', 'Projeto destaque', bs, 'A banca ainda não decidiu.') +
      '</div>';
  }
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
        return espera('Os vencedores são revelados no palco',
          'Acompanhe pelo telão: os resultados são anunciados na cerimônia. Depois, o Herói escolhido pelo público e o Projeto destaque da banca aparecem aqui no site.');
      }
      if (!pubRes.dados && !pubRes.erro) {
        if (!pubRes.pediu) { pubRes.pediu = true; setTimeout(loadPublicResult, 0); }
        return espera('Buscando a apuração…', 'Só um instante.');
      }
      if (pubRes.erro) {
        return espera('Não consegui buscar o resultado', pubRes.erro,
          '<button class="btn btn-primary" data-act="reloadResult">Tentar de novo</button>');
      }
      if (pubRes.dados.so_vencedor) {
        // para o público: só quem venceu (os dois prêmios), sem números
        var vs = (pubRes.dados.vencedores || []).map(function (v) { return opcaoPorId(v.id) || { name: v.nome, id: v.id }; });
        return '<div class="view view-faixa">' +
          faixaTopo('escuro', 'IDL · Trilha 2026', 'Os vencedores da Trilha 2026',
            'Escolhidos pelo público e pela banca na Banca Final. Obrigado a todos que votaram!', '', '') +
          '<div class="corpo"><div class="painel-centro painel-resultado painel-venc">' + vencedoresHtml(vs, pubRes.dados.banca) +
          '<div class="botoeira">' + verTodos + '</div></div></div></div>';
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
      faixaTopo('escuro', 'IDL · Trilha 2026',
        herois ? 'O Herói escolhido pelo público' : 'Os projetos escolhidos pelo público',
        herois ? 'Cada Herói nasceu das histórias e das causas de um grupo de trilheiros ao longo do ano.'
               : 'Todos estes projetos chegaram até a Banca. Cada um carrega uma jornada de transformação.',
        '', '') +
      '<div class="corpo"><div class="painel-centro painel-resultado">' +
      (remote.on ? vencedoresHtml(rows.filter(function (r) { return r.n > 0 && r.n === rows[0].n; }).map(function (r) { return r.p; }), pubRes.dados && pubRes.dados.banca)
        : (top ? '<div class="painelinho painelinho-destaque vencedor">' +
        (top.image ? '<figure class="pr-fig pr-fig-grande"><img src="' + esc(top.image) + '" alt=""></figure>' : '') +
        '<span class="eyebrow">' + (herois ? 'Herói mais votado' : 'Projeto mais lembrado pelo público') + '</span>' +
        '<h2 class="h2">' + esc(top.name) + '</h2>' +
        (top.sub ? '<p class="small">' + esc(top.sub) + '</p>' : '') +
        '</div>' : '')) +
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
    ['check', 'Checklist'], ['aovivo', 'Ao vivo'], ['apres', 'Apresentação'], ['leilao', 'Leilão'], ['geral', 'Visão geral'], ['votacao', 'Votação'], ['evento', 'Evento'],
    ['programacao', 'Programação'], ['projetos', 'Projetos'],
    ['herois', 'Heróis'], ['banca', 'Banca'], ['retro', 'Trilha 2026'], ['dados', 'Dados']
  ];

  var login = { erro: '', ocupado: false };

  function viewAdmin() {
    if (!localState.admin) return viewEntrar('admin');

    var tabs = '<div class="tabs" role="tablist">' + ADMIN_TABS.map(function (t) {
      var curto = { programacao: 'Agenda', retro: 'Fotos', geral: 'Geral', apres: 'Slides' }[t[0]];
      if (t[0] === 'aovivo') return '<button role="tab" class="tab-aovivo" data-atab="aovivo" aria-selected="' + (admin.tab === 'aovivo') + '"><i class="tab-ponto"></i>Ao vivo</button>';
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
    if (admin.tab === 'check') return adminChecklist();
    if (admin.tab === 'aovivo') return adminAoVivo();
    if (admin.tab === 'apres') return adminApresentacao();
    if (admin.tab === 'leilao') return adminLeilao();
    if (admin.tab === 'geral') return adminGeral();
    if (admin.tab === 'evento') return adminEvento();
    if (admin.tab === 'programacao') return adminPrograma();
    if (admin.tab === 'projetos') return adminProjetos();
    if (admin.tab === 'herois') return adminHerois();
    if (admin.tab === 'votacao') return adminVotacao();
    if (admin.tab === 'retro') return adminRetro();
    if (admin.tab === 'banca') return adminBanca();
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
  function chavePosEvento() {
    var on = posEvento();
    return '<section class="painelinho stack pos-chave"><span class="eyebrow">Depois da Banca</span>' +
      '<label class="av-vis' + (on ? ' on' : '') + '"><input type="checkbox" data-act="togglePosEvento"' + (on ? ' checked' : '') + '>' +
      '<span class="cv-trilho" aria-hidden="true"><span></span></span><span><b>' + (on ? 'Modo pós-evento ligado' : 'Modo pós-evento desligado') + '</b>' +
      '<span class="tiny">' + (on
        ? 'O Início mostra o agradecimento, os vencedores e as fotos; a aba Votação vira "Vencedores". Desligue para voltar ao modo de evento (ex.: na próxima Banca).'
        : 'Ligue quando a Banca terminar: o Início troca a contagem e a programação por um agradecimento, os vencedores e as fotos.') + '</span></span></label>' +
      (on && remote.on && !remote.resultadoPublico ? '<p class="tiny pos-aviso">Os vencedores ainda não estão no site. Para mostrá-los, use "Mostrar os vencedores no site" na aba Votação.</p>' : '') +
      '</section>';
  }
  function adminEvento() {
    var e = db.event;
    return chavePosEvento() + '<form id="eventForm" class="stack">' +
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
          '<button class="btn btn-primary" data-act="askRevelar">' + ico('i-spark') + (remote.revelar ? ' Revelado no telão' : ' Revelar o Herói no telão') + '</button>' +
          '<button class="btn btn-outline" data-act="pubResult">' + (remote.resultadoPublico ? 'Tirar os vencedores do site' : 'Mostrar os vencedores no site') + '</button>' +
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
      (remote.on ? '<button class="av-chamada" data-atab="aovivo"><span class="tab-ponto"></span><span><b>Modo evento · Ao vivo</b><span class="tiny">Palco, votação, banca e telão numa tela só, feita para o celular.</span></span>' + ico('i-chev') + '</button>' : '') +
      controlePalco() +
      painelResultado() +
      '<section class="stack">' +
      '<h2 class="h2">Visão geral</h2>' +
      '<p class="small">Tudo o que a organização controla está aqui dentro. Esta conta é a única com acesso.</p>' +
      cartoes + '</section>' +
      comandos +
      '<section class="stack"><h3 class="h3">Onde editar cada coisa</h3>' +
      '<div class="shortcuts">' + atalhos + '</div></section>' +
      (remote.on ? '<section class="zerar-tudo">' +
        '<div class="grow"><h3 class="h3">Zerar tudo</h3>' +
        '<p class="small">Depois do ensaio, deixa o site pronto para o dia: apaga <b>votos</b>, <b>avaliações e decisão da banca</b> e os <b>projetos conhecidos</b> de todos os aparelhos; fecha a votação, a decisão e a revelação e tira a equipe do palco.</p>' +
        '<p class="tiny">Continuam: textos, Heróis, fotos, senhas, palavra-chave, candidatos e a chave "mostrar a votação".</p></div>' +
        '<button class="btn btn-danger" data-act="askZerarTudo">' + ico('i-trash') + ' Zerar tudo</button></section>' : '') +
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
        (x.hero.image ? '<img src="' + esc(mini(x.hero.image)) + '" alt="" style="object-fit:contain">' : '<span>' + esc(initials(x.hero.name)) + '</span>') + '</div>' +
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
      '<p class="small">Abra no computador ligado ao projetor: mostra os Heróis candidatos e o QR Code grande da votação, com um selo do horário ("Abre às…" / "Vote agora"). Os "+1" que sobem em volta dos Heróis são só um convite a votar: passam por todos igualmente e não usam os votos reais. ' +
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
        (x.hero.image ? '<img src="' + esc(mini(x.hero.image)) + '" alt="" style="width:34px;height:44px;object-fit:contain;object-position:bottom">' : '') +
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
      '<button class="btn btn-outline" data-act="loadResult">Atualizar números</button>' +
      '</div>' +
      blocoRevelacao() +
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
      (c.yes2 ? '<button class="btn btn-block btn-lg btn-outline" data-act="confirmYes2">' + esc(c.yes2) + '</button>' : '') +
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
  function telaoQrSvg(texto, cor) {
    if (typeof window.qrcode !== 'function') return '';
    var q = window.qrcode(0, 'M');
    q.addData(texto); q.make();
    var n = q.getModuleCount(), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR Code para a votação">' +
      '<rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="' + (cor || '#2e006a') + '"/></svg>';
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
    if (remote.on && remote.pausa) return viewPausa();
    if (remote.on && remote.revelarBanca) return viewTelaoRevelacaoBanca();
    if (remote.on && remote.revelar) return viewTelaoRevelacao();
    if (remote.on && remote.slide) { var sl = slideTelao(remote.slide); if (sl) return sl; }
    telao.slideVisto = 'votacao';
    telaoGarantirQr();
    var cs = candidatos();
    if (!cs.length) cs = opcoesDeVoto().slice(0, 6);
    // a palavra vem do endereço (#/telao/PALAVRA) ou, se este aparelho estiver
    // com o painel aberto, do próprio banco
    var palavra = route.param ? decodeURIComponent(route.param).trim() : (remote.exigeChave ? telao.palavra : '');
    // logo abaixo de "Aponte a câmera": a palavra-chave anunciada no palco
    var selo = palavra ? '<div class="tl-palavra tl-palavra-topo"><span>Palavra-chave</span><b>' + esc(palavra) + '</b></div>' : '';
    var host = siteBase().replace(/^https?:\/\//, '') || 'o site do evento';

    var cartoes = cs.map(function (o) {
      return '<li class="tl-cand" data-tl="' + esc(o.id) + '">' +
        '<span class="tl-quadro">' + (o.image ? '<img src="' + esc(o.image) + '" alt="">' : sementeSvg()) + '</span>' +
        '<span class="tl-nome"><span>' + esc(String(o.name).split(/\s+[—–-]\s+/)[0]) + '</span></span>' +
        '</li>';
    }).join('');

    return '<div class="telao tl-c tl-estilo-' + (telao.estilo || 'portal') + '">' +
      telaoFundo() +
      '<div class="tl-corpo">' +
        '<section class="tl-palco">' +
          '<h1 class="tl-tit">Escolha o Herói da Trilha 2026</h1>' +
          '<ol class="tl-cands" style="--n:' + cs.length + '">' + cartoes + '</ol>' +
          '<p class="tl-aviso">' + ico('i-info') + '<span><b>Animação ilustrativa.</b> Os +1 desta tela não representam os votos reais. O resultado só é revelado no palco.</span></p>' +
        '</section>' +
        '<aside class="tl-qr">' +
          '<span class="tl-qr-cab">Aponte a câmera do celular</span>' +
          selo +
          '<div class="tl-qr-img">' + (telao.qrSvg || '<span class="tl-qr-carrega">Gerando o QR Code…</span>') + '</div>' +
          '<span class="tl-qr-url">' + esc(host) + '</span>' +
          '<p class="tl-qr-pe">Informe seu CPF, escolha o seu Herói e confirme. Um voto por pessoa.</p>' +
        '</aside>' +
      '</div>' +
      '<button class="tl-tela-cheia" data-act="telaoTelaCheia" title="Tela cheia">Tela cheia</button>' +
      '</div>';
  }

  /* A animação: só "+1" subindo em volta dos Heróis, como um convite a votar.
     Não há barras, números acumulados nem ranking: os +1 passam por todos os
     candidatos em rodízio embaralhado, então todos recebem a mesma quantidade
     e ninguém parece estar na frente.                                       */
  var telaoFila = [];
  function telaoMaisUm() {
    var itens = Array.prototype.slice.call(document.querySelectorAll('.tl-cand'));
    if (!itens.length) return;
    if (!telaoFila.length) {
      telaoFila = itens.map(function (_, i) { return i; });
      for (var i = telaoFila.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = telaoFila[i]; telaoFila[i] = telaoFila[j]; telaoFila[j] = t; }
    }
    var el = itens[telaoFila.shift() % itens.length];
    var q = el.querySelector('.tl-quadro');
    if (!q) return;
    var b = document.createElement('span');
    b.className = 'tl-mais';
    b.textContent = '+1';
    b.style.left = (18 + Math.random() * 64).toFixed(0) + '%';
    b.style.top = (25 + Math.random() * 45).toFixed(0) + '%';
    b.style.setProperty('--dx', ((Math.random() - .5) * 50).toFixed(0) + 'px');
    b.style.setProperty('--esc', (0.85 + Math.random() * 0.4).toFixed(2));
    q.appendChild(b);
    el.classList.remove('tl-pulso'); void el.offsetWidth; el.classList.add('tl-pulso');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 2200);
  }

  // todos os Heróis com a mesma altura: a maior que caiba na largura disponível,
  // considerando a proporção real de cada ilustração (o Lumen é mais largo)
  function telaoMedir() {
    var lista = document.querySelector('.tl-c .tl-cands');
    if (!lista) return;
    // estilo portal: todos os portais com a mesma largura e altura e o mesmo
    // espaço entre eles; o Herói mais largo (proporcionalmente) define a altura
    if (lista.closest('.tl-estilo-portal')) {
      var cs = lista.querySelectorAll('.tl-cand'), n = cs.length || 1, maior = 0.4, falta = false;
      Array.prototype.forEach.call(cs, function (c) {
        var im = c.querySelector('.tl-quadro img');
        if (im && im.naturalWidth) maior = Math.max(maior, im.naturalWidth / im.naturalHeight);
        else falta = true;
      });
      var g = parseFloat(getComputedStyle(lista).columnGap) || 0;
      var w = Math.floor((lista.parentNode.clientWidth - g * (n - 1) - 4) / n);
      var hh = Math.floor(Math.min(window.innerHeight * 0.5, (w * 0.9) / maior));
      // o portal fica um pouco mais alto que o Herói mais alto e com a mesma largura para todos
      lista.style.setProperty('--w', w + 'px');
      lista.style.setProperty('--h', Math.max(120, hh) + 'px');
      if (falta) Array.prototype.forEach.call(lista.querySelectorAll('img'), function (im) {
        if (!im.complete) im.addEventListener('load', telaoMedir, { once: true });
      });
      return;
    }
    var cands = lista.querySelectorAll('.tl-cand');
    var soma = 0, folga = 0, faltam = false;
    Array.prototype.forEach.call(cands, function (c) {
      var im = c.querySelector('.tl-quadro img');
      if (!im || !im.naturalWidth) { faltam = true; soma += 0.4; }
      else soma += im.naturalWidth / im.naturalHeight;
      // margens que o estilo põe em volta da ilustração (o nome não conta: ele não alarga o Herói)
      var cc = getComputedStyle(c), qq = getComputedStyle(c.querySelector('.tl-quadro') || c);
      folga += parseFloat(cc.paddingLeft) + parseFloat(cc.paddingRight) + parseFloat(qq.paddingLeft) + parseFloat(qq.paddingRight);
    });
    var gap = parseFloat(getComputedStyle(lista).columnGap) || 0;
    // "folga" = espaço que cada estilo põe em volta da ilustração (margens, cartão, arco)
    var livre = lista.parentNode.clientWidth - gap * Math.max(0, cands.length - 1) - folga - 8;
    var h = Math.min(window.innerHeight * 0.5, livre / Math.max(0.1, soma));
    lista.style.setProperty('--h', Math.max(120, Math.floor(h)) + 'px');
    if (faltam) Array.prototype.forEach.call(lista.querySelectorAll('img'), function (im) {
      if (!im.complete) im.addEventListener('load', telaoMedir, { once: true });
    });
  }
  window.addEventListener('resize', function () { if (route.name === 'telao') telaoMedir(); });

  function telaoMontar() {
    if (route.name !== 'telao') {
      if (telao.timer) { clearTimeout(telao.timer); telao.timer = null; }
      return;
    }
    telaoMedir();
    telaoPalavraDoBanco();
    if (telao.timer) return;
    (function proximo() {
      if (route.name !== 'telao') { telao.timer = null; return; }
      telaoMaisUm();
      telao.timer = setTimeout(proximo, 1500 + Math.random() * 1300);
    })();
  }


  /* ============================== NO PALCO ===============================
     A organização marca no painel a equipe que está apresentando. O site
     inteiro (Início, Programação, projeto, banca) passa a mostrar essa
     equipe, mesmo que a programação atrase.                                */
  function projetosEmOrdem() {
    return db.projects.slice().sort(function (a, b) { return (toMin(a.slot) || 9999) - (toMin(b.slot) || 9999); });
  }
  function palcoAtual() { return remote.on && remote.palco ? byId(remote.palco) : null; }
  function palcoVizinho(passo) {
    var lista = projetosEmOrdem(), atual = palcoAtual();
    if (!atual) return passo > 0 ? lista[0] : null;
    var i = lista.indexOf(atual) + passo;
    return (i >= 0 && i < lista.length) ? lista[i] : null;
  }
  function nomesHerois(p) { return (p.heroes || []).map(function (h) { return String(h.name).split(/\s+[—–-]\s+/)[0]; }).join(' e '); }

  function cartaoPalco() {
    var p = palcoAtual();
    if (!p) return '';
    var prox = palcoVizinho(1);
    var figs = (p.heroes || []).filter(function (h) { return h.image; }).map(function (h) {
      return '<img src="' + esc(mini(h.image)) + '" alt="">';
    }).join('');
    return '<section class="cont palco-card" aria-live="polite">' +
      '<div class="pc-figs" aria-hidden="true">' + figs + '</div>' +
      '<div class="pc-txt">' +
        '<span class="pc-ao-vivo"><i></i>No palco agora</span>' +
        '<h2 class="pc-nome">' + esc(p.name) + '</h2>' +
        '<p class="pc-sub">' + esc([p.group ? 'Grupo ' + p.group : '', nomesHerois(p)].filter(Boolean).join(' · ')) + '</p>' +
        (prox ? '<p class="pc-prox">A seguir: <b>' + esc(prox.name) + '</b></p>' : '') +
      '</div>' +
      '<button class="btn btn-laranja inst-btn pc-btn" data-go="projeto/' + esc(p.id) + '">Ver o projeto</button>' +
      '</section>';
  }

  function controlePalco() {
    if (!remote.on) return '';
    var p = palcoAtual(), ant = palcoVizinho(-1), prox = palcoVizinho(1);
    var opcoes = '<option value="">Ninguém no palco</option>' + projetosEmOrdem().map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (p && p.id === x.id ? ' selected' : '') + '>' + esc((x.slot ? x.slot + ' · ' : '') + x.name) + '</option>';
    }).join('');
    return '<section class="painel-palco">' +
      '<div class="pp-cab"><span class="eyebrow">No palco agora</span>' +
      '<h2 class="h2">' + (p ? esc(p.name) : 'Ninguém apresentando') + '</h2>' +
      '<p class="small">' + (p ? esc([p.group ? 'Grupo ' + p.group : '', nomesHerois(p)].filter(Boolean).join(' · ')) + (prox ? ' · a seguir: <b>' + esc(prox.name) + '</b>' : ' · é a última equipe') : 'Quando a primeira equipe subir ao palco, toque em <b>Começar</b>. O site inteiro e a banca acompanham.') + '</p></div>' +
      '<div class="row wrap" style="gap:8px">' +
        (p ? '<button class="btn btn-outline" data-act="palcoAnt"' + (ant ? '' : ' disabled') + '>' + ico('i-arrow-left') + ' Anterior</button>' : '') +
        '<button class="btn btn-primary btn-lg" data-act="palcoProx"' + (p && !prox ? ' disabled' : '') + '>' + (p ? 'Próxima equipe' : 'Começar: ' + esc((projetosEmOrdem()[0] || {}).name || '')) + ' ' + ico('i-chev') + '</button>' +
        (p ? '<button class="btn btn-ghost" data-act="palcoLimpar">Encerrar apresentações</button>' : '') +
      '</div>' +
      '<div class="field" style="max-width:420px"><label for="palcoSel">Ou escolha direto</label>' +
        '<select id="palcoSel" data-act="palcoEscolher">' + opcoes + '</select></div>' +
      '</section>';
  }
  function definirPalco(id) {
    if (!remote.on) { toast('Disponível na versão publicada.'); return; }
    var antes = remote.palco;
    remote.palco = id || null; render();
    sbRpc('definir_palco', { p_chave: localState.adminKey || '', p_projeto: id || null }).then(function (r) {
      if (!r || !r.ok) { remote.palco = antes; render(); if (!(r && r.erro === 'chave_invalida')) toast('Não consegui atualizar o palco.'); return; }
      var x = byId(id);
      toast(x ? 'No palco: ' + x.name : 'Apresentações encerradas.');
    }).catch(function (e) {
      remote.palco = antes; render();
      toast(String(e && e.message) === 'http 404' ? 'O banco ainda não tem essa opção. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.');
    });
  }

  /* ============================ ENTRADA ÚNICA ============================
     #/entrar (ou 4 toques na logo, ou o QR da mesa): nome completo + senha.
     A senha diz o papel: a da organização abre o painel; a da banca abre a
     área de avaliação. O voto do público continua sendo pelo CPF.        */
  var entrada = { erro: '', ocupado: false, nome: '' };
  function normSenha(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function viewEntrar(contexto, sub) {
    var jaAdm = !!localState.admin, jaBan = bancaLogada();
    var titulo = contexto === 'admin' ? 'Painel da organização' : contexto === 'banca' ? 'Área da banca' : 'Entrar';
    var texto = sub || (contexto === 'admin' ? 'Entre com o seu nome e a senha da organização.'
      : contexto === 'banca' ? 'Avalie cada projeto em 6 critérios, de 1 a 5, e confirme.'
      : 'Acesso da organização e da banca. Use o seu nome completo e a senha que você recebeu.');
    var status = (jaAdm || jaBan) ? '<div class="entrar-status">' +
        (jaAdm ? '<div><b>Organização</b><span class="tiny">' + esc(localState.name || 'conectado') + '</span></div><button class="btn btn-primary btn-sm" data-go="admin">Abrir o painel</button>' : '') +
        (jaBan ? '<div><b>Banca</b><span class="tiny">' + esc(localState.banca.nome) + '</span></div><button class="btn btn-primary btn-sm" data-go="banca">Abrir a banca</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-act="sairTudo">Sair deste aparelho</button></div>' : '';
    return '<div class="view view-faixa">' +
      faixaTopo('escuro', 'IDL · Acesso', titulo, texto, '', '') +
      '<div class="corpo"><div class="painel-centro stack">' + status +
      '<form id="entrarForm" class="painelinho painelinho-destaque stack banca-login" novalidate>' +
      ((jaAdm || jaBan) ? '<p class="tiny" style="margin:0">Entrar com outra senha neste aparelho:</p>' : '') +
      '<div class="field"><label for="eNome">Nome completo</label>' +
        '<input class="big" id="eNome" type="text" autocomplete="name" autocapitalize="words" maxlength="60" placeholder="Ex.: Maria Oliveira" value="' + esc(entrada.nome || (contexto === 'banca' && banca.loginNome) || '') + '">' +
        '<span class="tiny">Na banca, é assim que suas avaliações aparecem. Use o mesmo nome se entrar por outro aparelho.</span></div>' +
      '<div class="field"><label for="eSenha">Senha</label><input class="big" id="eSenha" type="password" autocomplete="current-password" placeholder="••••••••"></div>' +
      (entrada.erro ? '<span class="errmsg">' + ico('i-info') + esc(entrada.erro) + '</span>' : '') +
      '<button class="btn btn-primary btn-block btn-lg" type="submit"' + (entrada.ocupado ? ' disabled' : '') + '>' + (entrada.ocupado ? 'Verificando…' : 'Entrar') + '</button>' +
      '<p class="tiny">A senha foi passada pela organização. Ela vale do jeito que for digitada: com ou sem espaço, maiúscula ou minúscula.</p>' +
      '</form>' +
      '<button class="btn btn-ghost btn-sm" data-go="home" style="justify-self:center">Voltar ao site</button>' +
      '</div></div></div>';
  }
  function entrarSubmit() {
    var nome = String(($('#eNome') || {}).value || '').trim().replace(/\s+/g, ' ');
    var senha = normSenha(($('#eSenha') || {}).value);
    entrada.nome = nome;
    if (!senha) { entrada.erro = 'Informe a senha.'; render(); return; }
    entrada.ocupado = true; entrada.erro = ''; render();
    function papel(p) {
      entrada.ocupado = false;
      if (p === 'admin') {
        localState.admin = true; localState.adminKey = senha;
        if (nome) localState.name = nome;
        saveLocal(); entrada.erro = ''; entrada.nome = '';
        toast('Bem-vindo ao painel' + (nome ? ', ' + firstName(nome) : '') + '.');
        go('admin'); render(); if (remote.on) loadResult();
        return;
      }
      if (p === 'banca') {
        if (nome.length < 3 || nome.split(' ').length < 2) { entrada.erro = 'Para a banca, informe o seu nome e sobrenome.'; render(); return; }
        localState.banca = { nome: nome, senha: senha }; saveLocal();
        banca.erro = ''; banca.carregou = false; banca.itens = {}; banca.rascunho = {}; banca.dec.dados = null; banca.dec.escolha = null;
        entrada.erro = ''; entrada.nome = '';
        toast('Bem-vindo à banca, ' + firstName(nome) + '.');
        go(route.name === 'decisao' ? 'decisao' : 'banca'); render();
        return;
      }
      entrada.erro = 'Senha incorreta.'; render();
    }
    if (!remote.on) {
      sha256(senha + '|' + SALT_SENHA).then(function (hs) { papel(SENHA_HASH && hs === SENHA_HASH ? 'admin' : null); });
      return;
    }
    sbRpc('entrar', { p_senha: senha }).then(function (r) { papel(r && r.ok ? r.papel : null); })
      .catch(function (e) {
        if (String(e && e.message) !== 'http 404') { entrada.ocupado = false; entrada.erro = 'Sem conexão com o servidor. Verifique sua internet.'; render(); return; }
        // banco ainda na versão anterior: tenta as funções antigas
        sbRpc('entrar_admin', { p_chave: senha }).then(function (r) {
          if (r && r.ok) return papel('admin');
          return sbRpc('entrar_banca', { p_senha: senha }).then(function (r2) { papel(r2 && r2.ok ? 'banca' : null); });
        }).catch(function () { entrada.ocupado = false; entrada.erro = 'Sem conexão com o servidor.'; render(); });
      });
  }
  // a senha da organização mudou em outro aparelho: este sai do painel
  function conferirSessao() {
    if (!remote.on || !localState.admin || !localState.adminKey) return;
    sbRpc('entrar_admin', { p_chave: localState.adminKey }).then(function (r) {
      if (r && r.ok === false) { localState.admin = false; localState.adminKey = ''; saveLocal(); render(); toast('A senha da organização mudou. Entre de novo.'); }
    }).catch(function () {});
  }
  setTimeout(conferirSessao, 1500);

  /* ================================ BANCA ================================
     #/banca          os jurados entram com nome e sobrenome + a senha da banca
                      e veem um card por projeto (o que está no palco fica "NO AR")
     #/banca/<id>     avaliação de um projeto: 6 critérios de 1 a 5 + comentário;
                      "Confirmar avaliação" salva e volta para os cards
     #/decisao        decisão final: médias de todos + voto de cada jurado
     #/mesa           tela com QR Code para a mesa da banca (avaliação)
     #/mesa/decisao   tela com QR Code da decisão final                      */
  var CRITERIOS = [
    { k: 'ideia',        t: 'Ideia geral',                d: 'Clareza e força da proposta.',
      g: ['Proposta confusa ou genérica; não fica claro o que o projeto quer fazer.', 'Proposta compreensível, mas com pontos vagos ou pouco definidos.', 'Proposta clara, bem definida e com identidade própria.'] },
    { k: 'problema',     t: 'Problema real',              d: 'O grupo identificou bem uma necessidade concreta da comunidade.',
      g: ['Problema pouco claro ou sem ligação com a comunidade.', 'Problema real, mas pouco investigado ou explicado.', 'Necessidade concreta, bem investigada e explicada com exemplos.'] },
    { k: 'impacto',      t: 'Impacto',                    d: 'O quanto o projeto transforma a vida das pessoas atendidas.',
      g: ['Pouca mudança para quem é atendido.', 'Benefício perceptível, mas pontual ou limitado.', 'Transforma de forma clara a vida de quem é atendido.'] },
    { k: 'viabilidade',  t: 'Viabilidade e continuidade', d: 'Dá para executar e manter depois da trilha.',
      g: ['Difícil de executar ou sem plano para continuar.', 'Executável, mas a continuidade é incerta.', 'Plano realista, com recursos e caminho para seguir depois da trilha.'] },
    { k: 'protagonismo', t: 'Protagonismo e equipe',      d: 'Os trilheiros conduziram o projeto juntos.',
      g: ['Pouca participação dos trilheiros; dependeu de adultos.', 'Parte do grupo conduziu; participação desigual.', 'Todos conduziram juntos, com autonomia e papéis claros.'] },
    { k: 'apresentacao', t: 'Apresentação',               d: 'Comunicação no palco e defesa diante da banca.',
      g: ['Comunicação confusa e pouco preparo.', 'Apresentação clara, com respostas parciais às perguntas.', 'Comunicação envolvente e boa defesa diante da banca.'] }
  ];
  var ESCALA = ['', 'Insuficiente', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
  var banca = { itens: {}, rascunho: {}, carregou: false, erro: '', salvando: false, renderPendente: false, loginNome: '',
                dec: { dados: null, erro: '', escolha: null, enviando: false, buscando: false } };

  function fmt1(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(1).replace('.', ','); }
  function notasMedia(n) {
    var v = CRITERIOS.map(function (c) { return n && n[c.k]; }).filter(function (x) { return x >= 1 && x <= 5; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }
  function notasQtd(n) { return CRITERIOS.filter(function (c) { return n && n[c.k] >= 1; }).length; }
  function notasCompletas(n) { return notasQtd(n) === CRITERIOS.length; }

  function bancaLogada() { return !!(localState.banca && localState.banca.nome && localState.banca.senha); }
  function bancaSenhaMudou() { localState.banca = null; saveLocal(); banca.carregou = false; banca.erro = 'A senha da banca mudou. Entre de novo.'; }
  function carregarBanca() {
    if (!remote.on || !bancaLogada()) return;
    sbRpc('minhas_avaliacoes', { p_senha: localState.banca.senha, p_jurado: localState.banca.nome }).then(function (r) {
      if (!r || !r.ok) { if (r && r.erro === 'senha_banca_invalida') bancaSenhaMudou(); render(); return; }
      if (r.jurado && r.jurado !== localState.banca.nome) { localState.banca.nome = r.jurado; saveLocal(); }
      banca.itens = {};
      (r.itens || []).forEach(function (it) { banca.itens[it.projeto] = { notas: it.notas || {}, comentario: it.comentario || '' }; });
      banca.carregou = true; render();
    }).catch(function () { banca.erro = 'Sem conexão com o servidor.'; render(); });
  }
  function bancaFig(p, cls) {
    var hs = (p.heroes || []).filter(function (h) { return h.image; }).slice(0, 2);
    return hs.length ? '<span class="' + cls + ' n' + hs.length + '" aria-hidden="true">' + hs.map(function (h) { return '<img src="' + esc(mini(h.image)) + '" alt="">'; }).join('') + '</span>' : '';
  }
  function bancaLogin(sub) { return viewEntrar('banca', sub); }
  function bancaSemBanco() {
    return '<div class="view view-faixa">' + faixaTopo('escuro', 'Banca', 'Área da banca', 'Disponível na versão publicada do site, com o banco de dados ligado.', '', '') + '</div>';
  }

  function viewBanca() {
    if (!remote.on) return bancaSemBanco();
    if (!bancaLogada()) return bancaLogin('Avalie cada projeto em 6 critérios, de 1 a 5, e confirme.');
    if (!banca.carregou) setTimeout(carregarBanca, 0);
    if (route.param) return viewBancaProjeto(route.param);
    var p = palcoAtual(), lista = projetosEmOrdem();
    var feitas = lista.filter(function (x) { return banca.itens[x.id] && notasCompletas(banca.itens[x.id].notas); }).length;
    var pct = lista.length ? Math.round(feitas / lista.length * 100) : 0;
    var cards = lista.map(function (x) {
      var s = banca.itens[x.id], r = banca.rascunho[x.id], noar = p && p.id === x.id;
      var ok = s && notasCompletas(s.notas);
      var st = r && r.mudou ? '<span class="bc-st rasc">Rascunho não confirmado</span>'
        : ok ? '<span class="bc-st ok">✓ Avaliado · média ' + fmt1(notasMedia(s.notas)) + '</span>'
        : s && notasQtd(s.notas) ? '<span class="bc-st inc">Incompleto · ' + notasQtd(s.notas) + ' de 6</span>'
        : '<span class="bc-st">A avaliar</span>';
      return '<button class="bcard' + (noar ? ' noar' : '') + (ok ? ' feito' : '') + '" data-go="banca/' + esc(x.id) + '">' +
        (noar ? '<span class="bc-noar"><i></i>NO AR</span>' : '') +
        bancaFig(x, 'bc-fig') +
        '<span class="bc-txt"><span class="tiny num">' + esc([x.slot, x.group ? 'Grupo ' + x.group : ''].filter(Boolean).join(' · ')) + '</span>' +
        '<span class="bc-nome">' + esc(x.name) + '</span>' +
        '<span class="tiny">' + esc(nomesHerois(x)) + '</span>' + st + '</span>' +
        '<span class="bc-go">' + ico('i-chev') + '</span></button>';
    }).join('');
    return '<div class="view banca-view">' +
      '<section class="banca-topo"><div class="cont">' +
        '<div><span class="eyebrow">Banca · ' + esc(localState.banca.nome) + '</span><h1 class="titulo-pag">Avaliação dos projetos</h1>' +
        '<p class="small">' + feitas + ' de ' + lista.length + ' projetos avaliados</p>' +
        '<div class="banca-prog" aria-hidden="true"><i style="width:' + pct + '%"></i></div></div>' +
        '<button class="btn btn-ghost btn-sm" data-act="bancaSair">Sair</button>' +
      '</div></section>' +
      '<div class="cont banca-corpo">' +
        (!remote.avaliacoes ? '<div class="banca-fechada">' + ico('i-lock') + '<span><b>As avaliações ainda estão fechadas</b><span class="tiny">Você já pode ler os projetos. As notas abrem quando a organização liberar; esta tela atualiza sozinha.</span></span></div>' : '') +
        (remote.decisao ? '<a class="banca-aviso dec" href="#/decisao"><span><b>A decisão final está aberta</b><span class="tiny">Veja as médias de todos e escolha o vencedor.</span></span>' + ico('i-chev') + '</a>' : '') +
        (p ? '<button class="banca-aviso" data-go="banca/' + esc(p.id) + '"><span class="bc-noar"><i></i>NO AR</span><span class="grow"><b>' + esc(p.name) + '</b><span class="tiny">Apresentando agora · toque para avaliar</span></span>' + ico('i-chev') + '</button>' : '') +
        '<div class="bcards">' + cards + '</div>' +
      '</div></div>';
  }

  function bancaDraft(id) {
    if (!banca.rascunho[id]) {
      var s = banca.itens[id] || {};
      var n = {}; CRITERIOS.forEach(function (c) { if (s.notas && s.notas[c.k]) n[c.k] = +s.notas[c.k]; });
      banca.rascunho[id] = { notas: n, comentario: s.comentario || '', mudou: false };
    }
    return banca.rascunho[id];
  }
  function viewBancaProjeto(id) {
    var p = byId(id);
    if (!p) return notFound('Projeto não encontrado', 'banca', 'Voltar aos projetos');
    var d = bancaDraft(id), noar = palcoAtual() && palcoAtual().id === id;
    var q = notasQtd(d.notas), salvo = banca.itens[id], trava = !remote.avaliacoes;
    var crit = CRITERIOS.map(function (c, i) {
      var v = d.notas[c.k] || 0;
      return '<fieldset class="crit' + (v ? ' tem' : '') + '" data-crit="' + c.k + '">' +
        '<legend><span class="crit-n num">' + (i + 1) + '</span><span class="grow"><b>' + esc(c.t) + '</b><span class="tiny">' + esc(c.d) + '</span></span></legend>' +
        '<details class="crit-guia"><summary aria-label="Como dar a nota em ' + esc(c.t) + '"><span>?</span> Como dar a nota</summary>' +
          '<ul>' + [[1, 0], [3, 1], [5, 2]].map(function (x) { return '<li><b class="num">' + x[0] + '</b><span>' + esc(c.g[x[1]]) + '</span></li>'; }).join('') + '</ul>' +
          '<p class="tiny">2 e 4 ficam entre esses pontos.</p></details>' +
        '<div class="crit-escala" role="radiogroup" aria-label="' + esc(c.t) + '">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="crit-b' + (v === n ? ' on' : '') + '" role="radio" aria-checked="' + (v === n) + '" data-act="bancaNota" data-k="' + c.k + '" data-v="' + n + '" aria-label="' + n + ' — ' + ESCALA[n] + '"' + (trava ? ' disabled' : '') + '>' + n + '</button>';
        }).join('') + '</div>' +
        '<span class="crit-rot tiny">' + (v ? v + ' · ' + ESCALA[v] : '1 = Insuficiente · 5 = Excelente') + '</span>' +
        '</fieldset>';
    }).join('');
    return '<div class="view banca-view banca-proj">' +
      '<section class="banca-topo"><div class="cont bp-cab">' +
        '<button class="voltar" data-act="bancaVoltar">' + ico('i-arrow-left') + 'Todos os projetos</button>' +
        '<div class="bp-tit">' + bancaFig(p, 'bp-fig') +
          '<div><span class="eyebrow">' + esc([p.slot, p.group ? 'Grupo ' + p.group : ''].filter(Boolean).join(' · ')) + '</span>' +
          (noar ? '<span class="bc-noar"><i></i>NO AR</span>' : '') +
          '<h1 class="titulo-pag">' + esc(p.name) + '</h1>' +
          '<p class="small">' + esc(nomesHerois(p)) + '</p></div></div>' +
      '</div></section>' +
      '<div class="cont banca-corpo">' +
        (trava ? '<div class="banca-fechada">' + ico('i-lock') + '<span><b>Avaliações fechadas</b><span class="tiny">Leia o resumo do projeto. Os botões de nota liberam quando a organização abrir as avaliações.</span></span></div>' : '') +
        bancaResumo(p) +
        '<form class="bp-form' + (trava ? ' travado' : '') + '" data-aval="' + esc(id) + '" novalidate>' + crit +
        '<div class="field"><label for="bpCom">Comentário <span class="tiny">(opcional)</span></label>' +
          '<textarea id="bpCom" rows="4" maxlength="4000" data-aval-campo="comentario" placeholder="Pontos fortes, sugestões, observações…">' + esc(d.comentario) + '</textarea></div>' +
        '</form>' +
      '</div>' +
      '<div class="bp-pe"><div class="cont">' +
        '<span class="bp-resumo"><b class="num" id="bpMedia">' + fmt1(notasMedia(d.notas)) + '</b><span class="tiny" id="bpQtd">' + q + ' de 6 critérios' + (salvo && !d.mudou && notasCompletas(salvo.notas) ? ' · ✓ confirmada' : '') + '</span></span>' +
        '<button class="btn btn-primary btn-lg" data-act="bancaConfirmar" data-id="' + esc(id) + '"' + (banca.salvando || trava ? ' disabled' : '') + '>' + (trava ? 'Avaliações fechadas' : banca.salvando ? 'Salvando…' : 'Confirmar avaliação') + '</button>' +
      '</div></div></div>';
  }
  // resumo do projeto para o jurado, recolhido por padrão (abre com um toque)
  function bancaResumo(p) {
    var item = function (rot, txt, lista) { return txt ? '<div class="br-item"><span class="eyebrow">' + esc(rot) + '</span>' + (lista ? listaOuTexto(txt) : nl2p(txt)) + '</div>' : ''; };
    var eqs = p.teams || [];
    var pessoas = eqs.length > 1
      ? eqs.map(function (t) { return '<div class="br-eq"><b>' + esc(t.label) + '</b> ' + esc((t.members || []).join(', ')) + '</div>'; }).join('')
      : ((p.members || []).length ? '<p>' + esc(p.members.join(', ')) + '</p>' : '');
    var corpo = (p.tagline ? '<p class="br-lead">' + esc(p.tagline) + '</p>' : '') +
      item('O problema', p.problem) + item('A proposta', p.solution) + item('Impacto esperado', p.impact, true) +
      (eqs.length > 1 ? item('Integração', p.integration) : '') +
      '<div class="br-item"><span class="eyebrow">Heróis e trilheiros</span><p><b>' + esc((p.heroes || []).map(function (h) { return h.name; }).join(' · ')) + '</b></p>' + pessoas + '</div>' +
      '<a class="btn btn-ghost btn-sm" href="#/projeto/' + esc(p.id) + '" target="_blank" rel="noopener">Abrir a página completa do projeto</a>';
    return '<details class="banca-resumo"><summary><span>' + ico('i-info') + ' Sobre o projeto</span><span class="tiny">problema, proposta, impacto e equipe</span></summary>' +
      '<div class="br-corpo">' + corpo + '</div></details>';
  }
  // 4. aviso quando a equipe no palco muda (com vibração, onde o celular permite)
  var bancaAvisoTimer = null;
  function bancaAvisoPalco(id) {
    var p = byId(id);
    if (!p || !bancaLogada() || !/^(banca|decisao)$/.test(route.name)) return;
    if (route.name === 'banca' && route.param === id) return;
    var velho = $('#bancaAviso'); if (velho) velho.remove();
    var a = document.createElement('a');
    a.id = 'bancaAviso'; a.className = 'banca-aviso-flut'; a.href = '#/banca/' + id; a.setAttribute('role', 'status');
    a.innerHTML = '<span class="bc-noar"><i></i>NO AR</span><span class="grow"><b>Agora no palco</b><span>' + esc(p.name) + '</span></span><span class="baf-ir">Avaliar ' + ico('i-chev') + '</span>';
    a.addEventListener('click', function () { a.remove(); });
    document.body.appendChild(a);
    try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* sem vibração */ }
    clearTimeout(bancaAvisoTimer);
    bancaAvisoTimer = setTimeout(function () { var x = $('#bancaAviso'); if (x) { x.classList.add('sai'); setTimeout(function () { x.remove(); }, 400); } }, 15000);
  }
  window.addEventListener('hashchange', function () {
    var x = $('#bancaAviso'); if (x && !/^#\/(banca|decisao)\/?$/.test(location.hash)) x.remove();
  });
  function bancaMarcar(btn) {
    if (!remote.avaliacoes) { toast('As avaliações ainda estão fechadas.'); return; }
    var f = btn.closest('form.bp-form'); if (!f) return;
    var id = f.getAttribute('data-aval'), d = bancaDraft(id);
    var k = btn.getAttribute('data-k'), v = +btn.getAttribute('data-v');
    d.notas[k] = v; d.mudou = true;
    var fs = btn.closest('.crit');
    fs.classList.add('tem');
    Array.prototype.forEach.call(fs.querySelectorAll('.crit-b'), function (b) {
      var on = +b.getAttribute('data-v') === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    });
    fs.querySelector('.crit-rot').textContent = v + ' · ' + ESCALA[v];
    var m = $('#bpMedia'), q = $('#bpQtd');
    if (m) m.textContent = fmt1(notasMedia(d.notas));
    if (q) q.textContent = notasQtd(d.notas) + ' de 6 critérios';
  }
  function bancaConfirmar(id) {
    var d = bancaDraft(id);
    var falta = CRITERIOS.filter(function (c) { return !d.notas[c.k]; });
    if (falta.length) {
      toast(falta.length === 1 ? 'Falta dar nota em: ' + falta[0].t + '.' : 'Faltam ' + falta.length + ' critérios: ' + falta.map(function (c) { return c.t; }).join(', ') + '.');
      var el = document.querySelector('.crit[data-crit="' + falta[0].k + '"]');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('falta'); setTimeout(function () { el.classList.remove('falta'); }, 1600); }
      return;
    }
    var t = $('#bpCom'); if (t) d.comentario = t.value || '';
    banca.salvando = true; render();
    sbRpc('salvar_avaliacao', { p_senha: localState.banca.senha, p_jurado: localState.banca.nome, p_projeto: id, p_notas: d.notas, p_comentario: d.comentario }).then(function (r) {
      banca.salvando = false;
      if (r && r.ok) {
        banca.itens[id] = { notas: JSON.parse(JSON.stringify(d.notas)), comentario: d.comentario };
        delete banca.rascunho[id];
        var p = byId(id);
        toast('Avaliação de ' + (p ? p.name : 'projeto') + ' confirmada.');
        go('banca'); window.scrollTo(0, 0);
      } else if (r && r.erro === 'senha_banca_invalida') { bancaSenhaMudou(); render(); }
      else if (r && r.erro === 'avaliacoes_fechadas') { remote.avaliacoes = false; toast('As avaliações foram fechadas pela organização. Suas notas continuam aqui.'); render(); }
      else { toast('Não consegui salvar. Tente de novo.'); render(); }
    }).catch(function (e) {
      banca.salvando = false; render();
      toast(String(e && e.message) === 'http 404' ? 'O banco ainda não tem a nova área da banca. Rode o supabase.sql mais recente.' : 'Sem conexão. Suas notas continuam aqui; tente confirmar de novo.');
    });
  }
  function bancaEditando() {
    // só segura o redesenho enquanto o jurado digita o comentário
    var a = document.activeElement;
    return !!(a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.closest && a.closest('form.bp-form'));
  }
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (banca.renderPendente && !bancaEditando()) { banca.renderPendente = false; render(); } }, 120);
  });
  document.addEventListener('input', function (e) {
    var t = e.target, f = t && t.closest && t.closest('form.bp-form');
    if (!f || t.getAttribute('data-aval-campo') !== 'comentario') return;
    var d = bancaDraft(f.getAttribute('data-aval'));
    d.comentario = t.value; d.mudou = true;
  });

  /* ------------------------- decisão final da banca ------------------------- */
  function carregarDecisao() {
    if (!remote.on || !bancaLogada() || banca.dec.buscando) return;
    banca.dec.buscando = true;
    sbRpc('decisao_banca_ver', { p_senha: localState.banca.senha, p_jurado: localState.banca.nome }).then(function (r) {
      banca.dec.buscando = false;
      if (!r || !r.ok) { if (r && r.erro === 'senha_banca_invalida') bancaSenhaMudou(); render(); return; }
      var antes = JSON.stringify(banca.dec.dados);
      banca.dec.dados = r; banca.dec.erro = '';
      if (banca.dec.escolha == null && r.meu_voto) banca.dec.escolha = r.meu_voto;
      if (JSON.stringify(r) !== antes && route.name === 'decisao') render();
    }).catch(function (e) {
      banca.dec.buscando = false;
      banca.dec.erro = String(e && e.message) === 'http 404' ? 'O banco ainda não tem a decisão final. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.';
      if (route.name === 'decisao') render();
    });
  }
  // ranking: média geral (maior primeiro); quem não tem nota vai para o fim
  function rankingMedias(medias) {
    var por = {}; (medias || []).forEach(function (m) { por[m.projeto] = m; });
    return projetosEmOrdem().map(function (p) {
      var m = por[p.id];
      return { p: p, media: m ? +m.media : null, jurados: m ? m.jurados : 0, crit: (m && m.criterios) || {} };
    }).sort(function (a, b) { return (b.media == null ? -1 : b.media) - (a.media == null ? -1 : a.media); });
  }
  // mais votado; empate desempata pela média das notas
  function vencedorDecisao(rank, votos) {
    var max = 0; rank.forEach(function (l) { max = Math.max(max, votos[l.p.id] || 0); });
    if (!max) return null;
    var emp = rank.filter(function (l) { return (votos[l.p.id] || 0) === max; });
    return { lider: emp[0], votos: max, empate: emp.length > 1 ? emp : null };
  }
  function critBarras(crit) {
    return '<div class="dc-crit">' + CRITERIOS.map(function (c) {
      var v = crit[c.k] != null ? +crit[c.k] : null;
      return '<span class="dc-cl"><span class="tiny">' + esc(c.t) + '</span><span class="dc-bar"><i style="width:' + (v ? v / 5 * 100 : 0) + '%"></i></span><b class="num">' + fmt1(v) + '</b></span>';
    }).join('') + '</div>';
  }
  function viewDecisao() {
    if (!remote.on) return bancaSemBanco();
    if (!bancaLogada()) return bancaLogin('Decisão final: veja as médias de todos os jurados e escolha o projeto vencedor.');
    var d = banca.dec.dados;
    if (!d && !banca.dec.erro) setTimeout(carregarDecisao, 0);
    var topo = '<section class="banca-topo"><div class="cont">' +
      '<div><span class="eyebrow">Banca · ' + esc(localState.banca.nome) + '</span><h1 class="titulo-pag">Decisão final</h1>' +
      '<p class="small">Prêmio da banca: o Projeto destaque. Veja as médias e as notas de todos os jurados (e, como informação, o voto do público) e escolha o vencedor.</p></div>' +
      '<a class="btn btn-ghost btn-sm" href="#/banca">Avaliações</a></div></section>';
    if (banca.dec.erro && !d) return '<div class="view banca-view">' + topo + '<div class="cont banca-corpo"><div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">' + esc(banca.dec.erro) + '</p></div></div></div>';
    if (!d) return '<div class="view banca-view">' + topo + '<div class="cont banca-corpo"><p class="small">Carregando…</p></div></div>';
    if (!d.aberta) {
      return '<div class="view banca-view">' + topo + '<div class="cont banca-corpo"><div class="dec-espera">' +
        '<span class="dec-semente" aria-hidden="true">' + ico('i-seed') + '</span>' +
        '<h2 class="h3">A decisão final ainda não foi aberta</h2>' +
        '<p class="small">Quando a organização liberar, esta tela atualiza sozinha. Enquanto isso, confira se todos os projetos estão avaliados.</p>' +
        '<a class="btn btn-outline" href="#/banca">Ver minhas avaliações</a></div></div></div>';
    }
    var rank = rankingMedias(d.medias), votos = d.votos || {}, meu = d.meu_voto, esc1 = banca.dec.escolha;
    var pub = d.publico || {}, pubTot = d.publico_total || 0;
    var porProj = {}; (d.avaliacoes || []).forEach(function (a) { (porProj[a.projeto] = porProj[a.projeto] || []).push(a); });
    // jurados chegam do banco sem nome ("Você", "Jurado 1, 2…"); se vier nome (banco antigo), esconde aqui
    var eu = String(localState.banca.nome || '').toLowerCase(), apelido = {}, nJ0 = 0;
    (d.avaliacoes || []).map(function (a) { return a.jurado; }).filter(function (j, i, arr) { return arr.indexOf(j) === i; })
      .forEach(function (j) { apelido[j] = /^(Você|Jurado \d+)$/.test(j) ? j : (j.toLowerCase() === eu ? 'Você' : 'Jurado ' + (++nJ0)); });
    function votosPublico(p) {
      var n = pub[p.id] || 0; (p.heroes || []).forEach(function (h) { n += pub[h.id] || 0; }); return n;
    }
    function detalhePublico(p) {
      var hs = (p.heroes || []).map(function (h) { return '<li><span>' + esc(h.name) + '</span><b class="num">' + (pub[h.id] || 0) + '</b></li>'; }).join('');
      return '<div class="dc-pub"><span class="eyebrow">Voto do público · Herói da Trilha</span><ul>' + hs + '</ul></div>';
    }
    function detalheJurados(p) {
      var its = porProj[p.id] || [];
      if (!its.length) return '<p class="tiny">Nenhum jurado avaliou este projeto.</p>';
      return '<div class="dc-jur"><span class="eyebrow">Notas de cada jurado</span>' + its.map(function (a) {
        return '<div class="dc-j"><div class="dc-j-cab"><b>' + esc(apelido[a.jurado] || 'Jurado') + '</b><span class="num">média ' + fmt1(notasMedia(a.notas)) + '</span></div>' +
          '<div class="dc-j-notas">' + CRITERIOS.map(function (c) { return '<span title="' + esc(c.t) + '">' + esc(c.t.split(' ')[0]) + ' <b class="num">' + (a.notas[c.k] || '–') + '</b></span>'; }).join('') + '</div>' +
          (a.comentario ? '<p>' + esc(a.comentario) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }
    var venc = vencedorDecisao(rank, votos), todos = d.jurados && d.votaram >= d.jurados;
    var lista = rank.map(function (l, i) {
      var sel = esc1 === l.p.id, nv = votos[l.p.id] || 0;
      return '<div class="dcard' + (sel ? ' sel' : '') + (meu === l.p.id ? ' meu' : '') + '">' +
        '<button class="dc-main" data-act="decEscolher" data-id="' + esc(l.p.id) + '" aria-pressed="' + sel + '">' +
          '<span class="dc-pos num">' + (l.media == null ? '–' : (i + 1) + 'º') + '</span>' +
          bancaFig(l.p, 'bc-fig') +
          '<span class="bc-txt"><span class="bc-nome">' + esc(l.p.name) + '</span><span class="tiny">' + esc(nomesHerois(l.p)) + ' · ' + l.jurados + (l.jurados === 1 ? ' jurado' : ' jurados') + '</span>' +
          '<span class="dc-pubchip">Público: <b class="num">' + votosPublico(l.p) + '</b>' + (pubTot ? ' · ' + Math.round(votosPublico(l.p) / pubTot * 100) + '%' : '') + '</span>' +
          (meu ? '<span class="dc-votos">' + nv + (nv === 1 ? ' voto' : ' votos') + '</span>' : '') + '</span>' +
          '<span class="dc-media"><b class="num">' + fmt1(l.media) + '</b><span class="tiny">média</span></span>' +
          '<span class="dc-radio" aria-hidden="true"></span>' +
        '</button>' +
        '<details class="dc-det"><summary>Ver notas, jurados e público</summary>' + critBarras(l.crit) + detalheJurados(l.p) + detalhePublico(l.p) + '</details>' +
        '</div>';
    }).join('');
    var placar = '<div class="dec-placar"><b class="num">' + (d.votaram || 0) + ' de ' + (d.jurados || 0) + '</b> jurados já votaram' + (pubTot ? ' · público: <b class="num">' + pubTot + '</b> votos no Herói da Trilha' : '') +
      (meu && venc ? (venc.empate
        ? ' · <span>Empate em ' + venc.votos + (venc.votos === 1 ? ' voto' : ' votos') + ' — pela média, à frente: <b>' + esc(venc.lider.p.name) + '</b></span>'
        : ' · <span>' + (todos ? 'Vencedor' : 'Mais votado até agora') + ': <b>' + esc(venc.lider.p.name) + '</b> (' + venc.votos + (venc.votos === 1 ? ' voto' : ' votos') + ')</span>') : '') +
      (meu ? '' : ' · <span>a apuração aparece depois do seu voto</span>') + '</div>';
    var pe = esc1 ? (byId(esc1) || {}).name : null;
    return '<div class="view banca-view banca-dec">' + topo +
      '<div class="cont banca-corpo">' + placar + '<div class="dcards">' + lista + '</div></div>' +
      '<div class="bp-pe"><div class="cont">' +
        '<span class="bp-resumo"><span class="tiny">' + (meu ? 'Seu voto: <b>' + esc((byId(meu) || {}).name || '') + '</b> · dá para trocar enquanto estiver aberta' : 'Escolha um projeto na lista') + '</span></span>' +
        '<button class="btn btn-laranja btn-lg" data-act="decVotar"' + (!esc1 || banca.dec.enviando || esc1 === meu ? ' disabled' : '') + '>' +
          (banca.dec.enviando ? 'Enviando…' : esc1 === meu && meu ? '✓ Voto confirmado' : pe ? 'Confirmar voto em ' + esc(pe) : 'Confirmar voto') + '</button>' +
      '</div></div></div>';
  }
  function decVotar() {
    var id = banca.dec.escolha; if (!id) return;
    banca.dec.enviando = true; render();
    sbRpc('votar_decisao', { p_senha: localState.banca.senha, p_jurado: localState.banca.nome, p_projeto: id }).then(function (r) {
      banca.dec.enviando = false;
      if (r && r.ok) { toast('Voto confirmado.'); if (banca.dec.dados) banca.dec.dados.meu_voto = id; carregarDecisao(); }
      else if (r && r.erro === 'decisao_fechada') { toast('A organização encerrou a decisão.'); banca.dec.dados = null; carregarDecisao(); }
      else if (r && r.erro === 'senha_banca_invalida') bancaSenhaMudou();
      else toast('Não consegui registrar. Tente de novo.');
      render();
    }).catch(function () { banca.dec.enviando = false; render(); toast('Sem conexão. Tente de novo.'); });
  }

  /* ------------------- telas com QR Code para a mesa da banca ------------------- */
  var qrCache = {}, qrLibPedida = false;
  function qrPara(url, cor) {
    var ch = url + '|' + (cor || '');
    if (qrCache[ch]) return qrCache[ch];
    if (typeof window.qrcode === 'function') { qrCache[ch] = telaoQrSvg(url, cor); return qrCache[ch]; }
    if (!qrLibPedida) {
      qrLibPedida = true;
      var sc = document.createElement('script'); sc.src = 'vendor/qrcode.js';
      sc.onload = function () { render(); };
      document.head.appendChild(sc);
    }
    return '';
  }
  function viewMesa() {
    if (route.param === 'entrar') return viewMesaEntrar();
    var dec = route.param === 'decisao';
    var url = siteBase() + (dec ? '/#/decisao' : '/#/banca');
    var svg = qrPara(url, dec ? '#7a2c06' : '#2e006a');
    var passos = dec
      ? ['Entre com seu nome e sobrenome e a senha da banca', 'Veja a média de cada projeto, dada por todos os jurados', 'Escolha o projeto vencedor e confirme o seu voto']
      : ['Entre com seu nome e sobrenome e a senha da banca', 'Toque no card do projeto — o que está no palco aparece como NO AR', 'Dê uma nota de 1 a 5 em cada um dos 6 critérios e confirme'];
    return '<div class="mesa' + (dec ? ' mesa-dec' : '') + '">' + telaoFundo() +
      '<div class="mesa-in">' +
        '<div class="mesa-txt">' +
          '<span class="mesa-eyebrow">IDL · Trilha 2026</span>' +
          '<h1>' + (dec ? 'Decisão final<br>da banca' : 'Banca,<br>avalie aqui') + '</h1>' +
          (dec ? '<span class="mesa-status' + (remote.decisao ? ' on' : '') + '"><i></i>' + (remote.decisao ? 'Aberta' : 'Aguardando a organização liberar') + '</span>' : '') +
          '<ol class="mesa-passos">' + passos.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
          (dec ? '' : '<p class="mesa-crit">' + CRITERIOS.map(function (c) { return esc(c.t); }).join(' · ') + '</p>') +
        '</div>' +
        '<div class="mesa-qr"><span class="mesa-qr-tag">' + (dec ? '★ Decisão final' : '✎ Avaliação dos projetos') + '</span><span class="mesa-qr-cab">Aponte a câmera do celular</span>' +
          '<div class="mesa-qr-img">' + (svg || '<span class="tl-qr-carrega">Gerando o QR Code…</span>') + '</div>' +
          '<span class="mesa-url">' + esc(url.replace(/^https?:\/\//, '')) + '</span></div>' +
      '</div>' +
      '<button class="mesa-print" data-act="mesaImprimir">Imprimir</button>' +
      '</div>';
  }

  // QR que abre a tela Entrar (organização e banca)
  function viewMesaEntrar() {
    var url = siteBase() + '/#/entrar';
    var svg = qrPara(url, '#2e006a');
    var passos = ['Aponte a câmera do celular para o QR Code', 'Digite o seu nome completo e a senha que você recebeu', 'A senha leva você direto para a sua área: banca ou organização'];
    return '<div class="mesa mesa-entrar">' + telaoFundo() +
      '<div class="mesa-in">' +
        '<div class="mesa-txt">' +
          '<span class="mesa-eyebrow">IDL · Trilha 2026</span>' +
          '<h1>Acesso<br>da equipe</h1>' +
          '<span class="mesa-status on"><i></i>Banca e organização</span>' +
          '<ol class="mesa-passos">' + passos.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
        '</div>' +
        '<div class="mesa-qr"><span class="mesa-qr-tag">● Entrar</span><span class="mesa-qr-cab">Aponte a câmera do celular</span>' +
          '<div class="mesa-qr-img">' + (svg || '<span class="tl-qr-carrega">Gerando o QR Code…</span>') + '</div>' +
          '<span class="mesa-url">' + esc(url.replace(/^https?:\/\//, '')) + '</span></div>' +
      '</div>' +
      '<button class="mesa-print" data-act="mesaImprimir">Imprimir</button>' +
      '</div>';
  }

  /* ------------------------- aba Banca do painel ------------------------- */
  var adminBancaDados = { carregando: false, itens: null, decisao: [], erro: '' };
  function carregarAdminBanca() {
    if (!remote.on) return;
    adminBancaDados.carregando = true; render();
    sbRpc('avaliacoes_banca', { p_chave: localState.adminKey || '' }).then(function (r) {
      adminBancaDados.carregando = false;
      if (r && r.ok) { adminBancaDados.itens = r.itens || []; adminBancaDados.decisao = r.decisao || []; adminBancaDados.erro = ''; adminBancaDados.em = Date.now(); }
      else adminBancaDados.erro = 'Não consegui buscar as avaliações.';
      render();
    }).catch(function (e) {
      adminBancaDados.carregando = false;
      adminBancaDados.erro = String(e && e.message) === 'http 404' ? 'O banco ainda não tem a área da banca. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.';
      render();
    });
  }
  function consolidadoBanca() {
    var por = {};
    (adminBancaDados.itens || []).filter(function (it) { return it.notas && notasQtd(it.notas); })
      .forEach(function (it) { (por[it.projeto] = por[it.projeto] || []).push(it); });
    var votos = {}; (adminBancaDados.decisao || []).forEach(function (v) { votos[v.projeto] = (votos[v.projeto] || 0) + 1; });
    return projetosEmOrdem().map(function (p) {
      var its = por[p.id] || [], crit = {};
      CRITERIOS.forEach(function (c) {
        var v = its.map(function (i) { return i.notas[c.k]; }).filter(function (x) { return x >= 1; });
        crit[c.k] = v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
      });
      var ms = its.map(function (i) { return notasMedia(i.notas); }).filter(function (x) { return x != null; });
      return { p: p, itens: its, n: its.length, crit: crit, votos: votos[p.id] || 0,
               media: ms.length ? ms.reduce(function (a, b) { return a + b; }, 0) / ms.length : null };
    }).sort(function (a, b) { return (b.media == null ? -1 : b.media) - (a.media == null ? -1 : a.media); });
  }
  // ranking da aba Banca: atualiza sozinho e lembra quais projetos estavam abertos
  var rankAberto = {};
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.classList && d.classList.contains('banca-linha')) rankAberto[d.getAttribute('data-pid')] = d.open;
  }, true);
  function rankingAtualizar() {
    if (!remote.on || !localState.adminKey) return;
    var antes = JSON.stringify([adminBancaDados.itens, adminBancaDados.decisao]);
    sbRpc('avaliacoes_banca', { p_chave: localState.adminKey }).then(function (r) {
      if (!r || !r.ok) return;
      adminBancaDados.itens = r.itens || []; adminBancaDados.decisao = r.decisao || []; adminBancaDados.erro = ''; adminBancaDados.em = Date.now();
      if (route.name !== 'admin' || admin.tab !== 'banca') return;
      var a = document.activeElement, digitando = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
      if (JSON.stringify([adminBancaDados.itens, adminBancaDados.decisao]) !== antes && !digitando && !admin.confirm && !admin.editor) {
        var y = window.scrollY; render(); window.scrollTo(0, y);
      } else {
        var h = document.querySelector('.rank-auto'); if (h) h.innerHTML = '<i class="tab-ponto"></i>Atualiza sozinho a cada 10 s · ' + horaCurta(adminBancaDados.em);
      }
    }).catch(function () {});
  }
  setInterval(function () {
    if (route.name === 'admin' && admin.tab === 'banca' && localState.admin && document.visibilityState !== 'hidden') { syncEstado(); rankingAtualizar(); }
  }, 10000);
  function adminBanca() {
    if (!remote.on) return '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow"><b>Modo prévia.</b> A área da banca funciona na versão publicada, com o banco ligado.</p></div>';
    if (adminBancaDados.itens == null && !adminBancaDados.carregando && !adminBancaDados.erro) setTimeout(carregarAdminBanca, 0);
    var base = siteBase();
    var linhas = consolidadoBanca();
    var jurados = {}; (adminBancaDados.itens || []).forEach(function (i) { jurados[i.jurado] = true; });
    var nJur = Object.keys(jurados).length, nVot = (adminBancaDados.decisao || []).length;
    var venc = vencedorDecisao(linhas, linhas.reduce(function (o, l) { o[l.p.id] = l.votos; return o; }, {}));
    var tabela = adminBancaDados.itens == null ? '<p class="small">' + (adminBancaDados.erro ? esc(adminBancaDados.erro) : 'Buscando as avaliações…') + '</p>' :
      '<div class="banca-tab">' + linhas.map(function (l, i) {
        return '<details class="sanfona banca-linha" data-pid="' + esc(l.p.id) + '"' + (rankAberto[l.p.id] ? ' open' : '') + '>' +
          '<summary><span class="bl-pos num">' + (l.media == null ? '–' : (i + 1) + 'º') + '</span><span class="sf-cab"><span class="sf-tit">' + esc(l.p.name) + '</span>' +
          '<span class="sf-res">' + esc([l.p.group ? 'Grupo ' + l.p.group : '', l.n + (l.n === 1 ? ' jurado' : ' jurados'), remote.decisao || nVot ? l.votos + (l.votos === 1 ? ' voto na decisão' : ' votos na decisão') : ''].filter(Boolean).join(' · ')) + '</span></span>' +
          '<span class="bl-media num">' + fmt1(l.media) + '</span>' +
          '<span class="sf-ico" aria-hidden="true">' + ico('i-down') + '</span></summary>' +
          '<div class="sf-corpo">' + critBarras(l.crit) + (l.itens.length ? l.itens.map(function (it) {
            return '<div class="bl-item"><b>' + esc(it.jurado) + '</b> <span class="num">média ' + fmt1(notasMedia(it.notas)) + '</span>' +
              '<span class="tiny bl-notas">' + CRITERIOS.map(function (c) { return esc(c.t) + ' ' + (it.notas[c.k] || '–'); }).join(' · ') + '</span>' +
              (it.comentario ? '<p>' + esc(it.comentario) + '</p>' : '') + '</div>';
          }).join('') : '<p class="small">Nenhuma avaliação ainda.</p>') + '</div></details>';
      }).join('') + '</div>';
    return '<div class="stack-lg">' +
      '<section class="stack"><h2 class="h2">Banca</h2>' +
      '<p class="small">Os jurados entram em <b>' + esc(base + '/#/banca') + '</b> com nome e sobrenome e a senha da banca, abrem o card de cada projeto e dão uma nota de 1 a 5 em 6 critérios: ' + esc(CRITERIOS.map(function (c) { return c.t; }).join(', ')) + '.</p>' +
      '<div class="row wrap" style="gap:8px">' +
        '<a class="btn btn-outline" href="#/mesa/entrar" target="_blank" rel="noopener">' + ico('i-key') + ' Tela QR · entrar (login)</a>' +
        '<a class="btn btn-outline" href="#/mesa" target="_blank" rel="noopener">' + ico('i-grid') + ' Tela QR · avaliação</a>' +
        '<a class="btn btn-outline" href="#/mesa/decisao" target="_blank" rel="noopener">' + ico('i-grid') + ' Tela QR · decisão final</a>' +
        '<a class="btn btn-ghost" href="#/banca" target="_blank" rel="noopener">' + ico('i-eye') + ' Abrir a área da banca</a></div>' +
      '</section>' +
      '<section class="stack"><h3 class="h3">Avaliações</h3>' + chaveAvaliacoes() + '</section>' +
      '<section class="stack"><h3 class="h3">Decisão final</h3>' +
      '<div class="revelar-box' + (remote.decisao ? ' on' : '') + '"><div class="grow"><b>' + (remote.decisao ? 'A decisão está aberta' : 'A decisão está fechada') + '</b>' +
        '<p class="small">' + (remote.decisao
          ? nVot + ' de ' + nJur + ' jurados já votaram' + (venc ? ' · ' + (venc.empate ? 'empate em ' + venc.votos + (venc.votos === 1 ? ' voto' : ' votos') + '; pela média, à frente: ' : 'mais votado: ') + esc(venc.lider.p.name) : '') + '.'
          : 'Quando a banca sair do palco para decidir, abra aqui. Cada jurado vê as médias de todos e vota em 1 projeto; empate desempata pela média.') + '</p></div>' +
        '<button class="btn ' + (remote.decisao ? 'btn-outline' : 'btn-laranja') + '" data-act="decisaoAbrir" data-v="' + (remote.decisao ? '0' : '1') + '">' + (remote.decisao ? 'Encerrar a decisão' : 'Abrir a decisão final') + '</button></div>' +
      (nVot ? '<p class="small">Votos: ' + (adminBancaDados.decisao || []).map(function (v) { var p = byId(v.projeto); return '<b>' + esc(v.jurado) + '</b> → ' + esc(p ? p.name : v.projeto); }).join(' · ') + '</p>' : '') +
      '<div class="revelar-box' + (remote.revelarBanca ? ' on' : '') + '"><div class="grow"><b>Revelação no telão</b><p class="small">' + (remote.revelarBanca
          ? 'O telão está mostrando o Projeto destaque.' : 'Mostra o projeto vencedor da banca no telão, com animação. O telão precisa estar com a organização conectada.') + '</p></div>' +
        (remote.revelarBanca ? '<button class="btn btn-outline" data-act="desrevelar">Voltar o telão para a votação</button>'
          : '<button class="btn btn-laranja" data-act="askRevelarBanca">' + ico('i-spark') + ' Revelar no telão</button>') + '</div>' +
      '</section>' +
      '<section class="stack"><div class="row wrap" style="gap:8px;justify-content:space-between;align-items:center"><h3 class="h3">Ranking pelas médias <span class="tiny" style="font-weight:400">(1 a 5)</span></h3>' +
        '<span class="tiny rank-auto"><i class="tab-ponto"></i>Atualiza sozinho a cada 10 s' + (adminBancaDados.em ? ' · ' + horaCurta(adminBancaDados.em) : '') + '</span>' +
        '<div class="row wrap" style="gap:8px"><button class="btn btn-outline btn-sm" data-act="bancaAtualizar">Atualizar</button>' +
        '<button class="btn btn-outline btn-sm" data-act="bancaPlanilha">' + ico('i-save') + ' Baixar planilha</button></div></div>' +
        tabela + '</section>' +
      '<section class="stack"><h3 class="h3">Senhas de acesso</h3>' +
      '<p class="small">A entrada é a mesma para todos: <b>4 toques na logo</b> do site (ou o QR da mesa) e depois nome completo + senha. A senha decide o papel. Ela vale com ou sem espaço, maiúscula ou minúscula.</p>' +
      '<form id="senhaAdminForm" class="row wrap" style="gap:10px;align-items:flex-end">' +
      '<div class="field" style="flex:1 1 220px"><label for="novaSenhaAdmin">Nova senha da organização <span class="tiny">(hoje: trilhei2026, se não foi trocada)</span></label><input id="novaSenhaAdmin" type="text" autocomplete="off" minlength="6"></div>' +
      '<button class="btn btn-primary" type="submit" style="min-height:53px">' + ico('i-save') + ' Salvar</button></form>' +
      '<p class="small" style="margin-top:6px">Senha da banca: é a mesma para todos os jurados. Começa como <b>banca2026</b>.</p>' +
      '<form id="senhaBancaForm" class="row wrap" style="gap:10px;align-items:flex-end">' +
      '<div class="field" style="flex:1 1 220px"><label for="novaSenhaBanca">Nova senha da banca</label><input id="novaSenhaBanca" type="text" autocomplete="off" minlength="4"></div>' +
      '<button class="btn btn-primary" type="submit" style="min-height:53px">' + ico('i-save') + ' Salvar</button></form>' +
      '</section>' +
      '<section class="stack"><h3 class="h3">Depois do ensaio</h3>' +
      '<div class="row wrap" style="gap:8px"><button class="btn btn-outline" data-act="bancaZerar" data-v="0">' + ico('i-trash') + ' Apagar votos da decisão</button>' +
      '<button class="btn btn-outline btn-danger" data-act="bancaZerar" data-v="1">' + ico('i-trash') + ' Apagar todas as avaliações</button></div></section>' +
      '</div>';
  }
  function planilhaBanca() {
    var linhas = consolidadoBanca(), quando = agoraBR();
    var jur = {}; (adminBancaDados.itens || []).forEach(function (i) { if (i.notas && notasQtd(i.notas)) jur[i.jurado] = true; });
    var nJ = Object.keys(jur).length, dec = adminBancaDados.decisao || [];
    var critCols = CRITERIOS.map(function (c) { return { t: c.t, w: 15, tipo: 'n2' }; });
    var r1 = linhas.map(function (l, i) {
      return [l.media == null ? '' : i + 1, l.p.name, l.p.group || '', nomesHerois(l.p), l.n]
        .concat(CRITERIOS.map(function (c) { return l.crit[c.k] == null ? '' : +l.crit[c.k].toFixed(2); }),
          [l.media == null ? '' : +l.media.toFixed(2), l.votos]);
    });
    var f1 = XL.folha('Ranking', 'Ranking da banca · notas de 1 a 5',
      'IDL · ' + nJ + (nJ === 1 ? ' jurado' : ' jurados') + ' · média de todos os jurados por critério · gerado em ' + quando,
      [{ t: 'Posição', w: 10, tipo: 'pos' }, { t: 'Projeto', w: 50, tipo: 'forte' }, { t: 'Grupo', w: 14 }, { t: 'Heróis', w: 24 }, { t: 'Jurados', w: 10, tipo: 'int' }]
        .concat(critCols, [{ t: 'Média geral', w: 13, tipo: 'n2' }, { t: 'Votos na decisão', w: 13, tipo: 'int' }]),
      r1, { destacar: function (l, i) { return i === 0 && l[0] === 1; } });
    var r2 = [];
    linhas.forEach(function (l) { l.itens.forEach(function (it) {
      r2.push([it.jurado, l.p.name, l.p.group || ''].concat(CRITERIOS.map(function (c) { return it.notas[c.k] || ''; }),
        [+(notasMedia(it.notas) || 0).toFixed(2), it.comentario || '']));
    }); });
    r2.sort(function (a, b) { return a[0].localeCompare(b[0], 'pt') || a[1].localeCompare(b[1], 'pt'); });
    var f2 = XL.folha('Notas por jurado', 'Notas de cada jurado', 'IDL · uma linha por jurado e projeto · gerado em ' + quando,
      [{ t: 'Jurado', w: 24, tipo: 'forte' }, { t: 'Projeto', w: 48 }, { t: 'Grupo', w: 14 }]
        .concat(CRITERIOS.map(function (c) { return { t: c.t, w: 14, tipo: 'int' }; }), [{ t: 'Média', w: 10, tipo: 'n2' }, { t: 'Comentário', w: 60, tipo: 'longo' }]),
      r2);
    var r3 = linhas.filter(function (l) { return l.votos > 0; })
      .sort(function (a, b) { return b.votos - a.votos || (b.media || 0) - (a.media || 0); })
      .map(function (l, i) { return [i + 1, l.p.name, l.p.group || '', l.votos, l.media == null ? '' : +l.media.toFixed(2)]; });
    var f3 = XL.folha('Decisão final', 'Decisão final da banca',
      'IDL · ' + dec.length + ' de ' + nJ + ' jurados votaram · empate desempata pela média · gerado em ' + quando,
      [{ t: 'Posição', w: 10, tipo: 'pos' }, { t: 'Projeto', w: 40, tipo: 'forte' }, { t: 'Grupo', w: 14 }, { t: 'Votos', w: 10, tipo: 'int' }, { t: 'Média das notas', w: 16, tipo: 'n2' }],
      r3, { destacar: function (l, i) { return i === 0; } });
    var r4 = dec.map(function (v) { var p = byId(v.projeto); return [v.jurado, p ? p.name : v.projeto, new Date(v.em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })]; });
    var f4 = XL.folha('Votos da decisão', 'Voto de cada jurado na decisão final', 'IDL · gerado em ' + quando,
      [{ t: 'Jurado', w: 26, tipo: 'forte' }, { t: 'Projeto escolhido', w: 42 }, { t: 'Horário', w: 18 }], r4);
    return [f1, f2, f3, f4];
  }


  /* ============================ APRESENTAÇÃO ============================
     A apresentação da formatura roda dentro do telão (#/telao, em F11) e é
     comandada pelo controlador (#/controle) ou pelo teclado/passador no
     próprio telão. O roteiro fica em db.apresentacao (editável na aba
     Apresentação do painel). Blocos automáticos: "equipes" vira 1 slide por
     equipe (e marca a equipe No palco), "candidatos" vira 1 vídeo por Herói
     candidato. Votação e revelações usam as telas vivas que já existem.  */
  var DECK_PADRAO = [
    { id: 'abertura',       tipo: 'abertura',     on: true, titulo: 'Banca Final IDL Tech', texto: 'Encerramento da Trilha 2026' },
    { id: 'instituto',      tipo: 'instituto',    on: true, titulo: 'Instituto Dente de Leão', texto: 'Fortalecendo pessoas, semeando consciência e transformando realidades.' },
    { id: 'programacao',    tipo: 'programacao',  on: true, titulo: 'Programação do dia' },
    { id: 'numeros',        tipo: 'numeros',      on: true, titulo: 'A Trilha 2026 em números' },
    { id: 'retrospectiva',  tipo: 'video',        on: true, titulo: 'Retrospectiva da Trilha 2026', video: '' },
    { id: 'comofunciona',   tipo: 'comofunciona', on: true, titulo: 'Como funciona a Banca Final' },
    { id: 'candidatos',     tipo: 'candidatos',   on: true, titulo: 'Vídeos dos candidatos a Herói' },
    { id: 'votacao',        tipo: 'votacao',      on: true, titulo: 'Votação do público' },
    { id: 'equipes',        tipo: 'equipes',      on: true, titulo: 'Apresentação das equipes' },
    { id: 'intervalo',      tipo: 'texto',        on: true, titulo: 'A banca está deliberando', texto: 'Em instantes: a devolutiva da banca e as revelações.' },
    { id: 'revelaBanca',    tipo: 'revelaBanca',  on: true, titulo: 'Revelação · Projeto destaque' },
    { id: 'revelaHeroi',    tipo: 'revelaHeroi',  on: true, titulo: 'Revelação · Herói da Trilha' },
    { id: 'fotos',          tipo: 'fotos',        on: true, titulo: 'Fotos da Trilha 2026' },
    { id: 'agradecimentos', tipo: 'texto',        on: true, titulo: 'Obrigado!', texto: 'A Trilha 2026 foi feita por cada trilheiro, cada família e cada parceiro que acreditou. Até a próxima!' }
  ];
  function deckConfig() {
    var salvo = (db.apresentacao && db.apresentacao.slides) || [];
    var ids = salvo.map(function (x) { return x.id; });
    var lista = salvo.map(function (x) { return JSON.parse(JSON.stringify(x)); });
    // slides novos do padrão que ainda não estão no roteiro salvo entram no fim
    DECK_PADRAO.forEach(function (d) { if (ids.indexOf(d.id) < 0) lista.push(JSON.parse(JSON.stringify(d))); });
    return lista;
  }
  // roteiro expandido: um item por slide de verdade, na ordem
  function deckSlides() {
    var out = [];
    deckConfig().forEach(function (it) {
      if (!it.on) return;
      if (it.tipo === 'equipes') {
        var ps = projetosEmOrdem();
        ps.forEach(function (p, i) { out.push({ key: 'equipe:' + p.id, tipo: 'equipe', pid: p.id, rotulo: p.name, grupo: it.titulo, n: i + 1, de: ps.length }); });
      } else if (it.tipo === 'candidatos') {
        candidatos().filter(function (c) { return c.video; }).forEach(function (c) {
          out.push({ key: 'video:' + c.id, tipo: 'videoHeroi', hid: c.id, rotulo: 'Vídeo · ' + String(c.name).split(/\s+[—–-]\s+/)[0], grupo: it.titulo });
        });
      } else out.push({ key: it.id, tipo: it.tipo, item: it, rotulo: it.titulo });
    });
    return out;
  }
  function deckIndice(key) { var l = deckSlides(); for (var i = 0; i < l.length; i++) if (l[i].key === key) return i; return -1; }

  // ---------- conteúdo de cada slide (telão e prévia do controlador) ----------
  function slideMarca() { return '<span class="sl-marca"><img src="img/kv/trilhei.webp" alt=""><i></i><img src="img/kv/idltech.webp" alt=""></span>'; }
  function ytId(v) { var m = String(v || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(String(v || '').trim()) ? String(v).trim() : ''); }
  function slideHtml(s, previa) {
    var it = s.item || {}, h = '';
    switch (s.tipo) {
      case 'abertura':
        h = '<div class="sl-centro">' + slideMarca() +
          '<h1 class="sl-mega">' + esc(it.titulo) + '</h1>' +
          '<p class="sl-lead">' + esc(it.texto || '') + '</p>' +
          '<p class="sl-data">' + esc([db.event.dateLabel, db.event.place].filter(Boolean).join(' · ')) + '</p></div>' +
          '<div class="sl-desfile" aria-hidden="true">' + allHeroes().filter(function (x) { return x.hero.image; }).map(function (x, i) { return '<img style="--i:' + i + '" src="' + esc(mini(x.hero.image)) + '" alt="">'; }).join('') + '</div>';
        break;
      case 'instituto':
        h = '<div class="sl-centro"><span class="sl-logo-caixa"><img class="sl-logo-inst" src="img/logo-instituto.webp" alt="Instituto Dente de Leão"></span>' +
          '<p class="sl-frase">' + esc(it.texto || '') + '</p></div>';
        break;
      case 'texto':
        h = '<div class="sl-centro"><span class="sl-eyebrow">IDL · Trilha 2026</span><h1 class="sl-mega">' + esc(it.titulo) + '</h1>' +
          (it.texto ? '<p class="sl-lead">' + esc(it.texto) + '</p>' : '') + '</div>';
        break;
      case 'programacao':
        h = '<div class="sl-col"><span class="sl-eyebrow">IDL · Trilha 2026</span><h2 class="sl-tit">' + esc(it.titulo) + '</h2>' +
          '<ol class="sl-prog">' + ordered().filter(function (x) { return x.start && x.start !== x.end; }).map(function (x) {
            return '<li><b class="num">' + esc(x.start) + '</b><span>' + esc(x.name) + '</span></li>'; }).join('') + '</ol></div>';
        break;
      case 'numeros':
        var nEq = db.projects.reduce(function (a, p) { return a + Math.max(1, (p.teams || []).length); }, 0);
        h = '<div class="sl-centro"><span class="sl-eyebrow">IDL · Trilha 2026</span><h2 class="sl-tit">' + esc(it.titulo) + '</h2>' +
          '<div class="sl-nums">' + [[nTrilheiros(), 'trilheiros'], [db.projects.length, 'projetos'], [nEq, 'equipes'], [allHeroes().length, 'Heróis']].map(function (n, i) {
            return '<div style="--i:' + i + '"><b class="num">' + n[0] + '</b><span>' + n[1] + '</span></div>'; }).join('') + '</div></div>';
        break;
      case 'comofunciona':
        h = '<div class="sl-col"><span class="sl-eyebrow">IDL · Trilha 2026</span><h2 class="sl-tit">' + esc(it.titulo) + '</h2>' +
          '<div class="sl-dois">' +
            '<section class="sl-caixa sl-cx-pub"><span class="sl-tag">Prêmio do público</span><h3>Herói da Trilha</h3>' +
              '<ol><li>Aponte a câmera para o QR Code no telão</li><li>Informe o seu CPF</li><li>Escolha o seu Herói e confirme. Um voto por pessoa</li></ol></section>' +
            '<section class="sl-caixa sl-cx-banca"><span class="sl-tag">Prêmio da banca</span><h3>Projeto destaque</h3>' +
              '<p>Cada jurado dá uma nota de 1 a 5 em:</p><ul>' + CRITERIOS.map(function (c) { return '<li>' + esc(c.t) + '</li>'; }).join('') + '</ul></section>' +
          '</div></div>';
        break;
      case 'video':
      case 'videoHeroi':
        var vid = '', tit = it.titulo || '', sub = '';
        if (s.tipo === 'videoHeroi') { var x = heroById(s.hid); if (x) { vid = x.hero.video; tit = 'Campanha do Herói ' + String(x.hero.name).split(/\s+[—–-]\s+/)[0]; sub = x.project.name; } }
        else vid = it.video;
        var id = ytId(vid);
        if (previa || !id) {
          h = '<div class="sl-centro"><span class="sl-eyebrow">' + (id ? 'Vídeo' : 'Vídeo · coloque o link na aba Apresentação') + '</span><h1 class="sl-mega sl-mega-m">' + esc(tit) + '</h1>' +
            (sub ? '<p class="sl-lead">' + esc(sub) + '</p>' : '') + (id ? '<span class="sl-play">▶</span>' : '') + '</div>';
        } else {
          h = '<div class="sl-video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + esc(tit) + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>';
        }
        break;
      case 'equipe':
        var p = byId(s.pid);
        if (!p) { h = '<div class="sl-centro"><h1 class="sl-mega">Equipe</h1></div>'; break; }
        var hs = (p.heroes || []).filter(function (h2) { return h2.image; }).slice(0, 2);
        var membros = (p.teams && p.teams.length > 1) ? p.teams.reduce(function (a, t) { return a.concat(t.members || []); }, []) : (p.members || []);
        h = '<div class="sl-equipe">' +
          '<div class="sl-eq-txt"><span class="sl-noar"><i></i>No palco · equipe ' + s.n + ' de ' + s.de + '</span>' +
            '<h1 class="sl-eq-nome">' + esc(p.name) + '</h1>' +
            (p.tagline ? '<p class="sl-eq-lead">' + esc(p.tagline) + '</p>' : '') +
            '<p class="sl-eq-meta">' + esc([p.group ? 'Grupo ' + p.group : '', p.category, p.slot ? p.slot : ''].filter(Boolean).join(' · ')) + '</p>' +
            (membros.length ? '<p class="sl-eq-membros">' + esc(membros.join(' · ')) + '</p>' : '') +
          '</div>' +
          '<div class="sl-eq-figs n' + hs.length + '">' + hs.map(function (h2) { return '<figure><img src="' + esc(previa ? mini(h2.image) : h2.image) + '" alt=""><figcaption>' + esc(String(h2.name).split(/\s+[—–-]\s+/)[0]) + '</figcaption></figure>'; }).join('') + '</div>' +
        '</div>';
        break;
      case 'fotos':
        var fs = todasAsFotos().filter(function (f) { return f[0] || f[3]; });
        if (!fs.length) fs = (db.retro && db.retro.photos) || [];
        fs = fs.slice(0, 24);
        var k = fs.length ? Math.floor(Date.now() / 6000) % fs.length : 0;
        h = fs.length ? '<div class="sl-fotos">' + fs.map(function (f, i) { return '<figure class="' + (i === k ? 'on' : '') + '">' + imgFoto(f, '') + (f[2] ? '<figcaption>' + esc(f[2]) + '</figcaption>' : '') + '</figure>'; }).join('') + '</div>' +
              '<span class="sl-fotos-tit">' + esc(it.titulo || '') + '</span>'
          : '<div class="sl-centro"><h1 class="sl-mega">' + esc(it.titulo || 'Fotos') + '</h1></div>';
        break;
      case 'votacao':
        h = previa ? '<div class="sl-centro"><span class="sl-eyebrow">Tela viva</span><h1 class="sl-mega sl-mega-m">Votação do público</h1><p class="sl-lead">QR Code + candidatos</p></div>' : '';
        break;
      case 'revelaHeroi':
      case 'revelaBanca':
        h = '<div class="sl-centro"><span class="sl-eyebrow">Tela viva</span><h1 class="sl-mega sl-mega-m">' + (s.tipo === 'revelaHeroi' ? 'Revelação do Herói' : 'Revelação do Projeto destaque') + '</h1><p class="sl-lead">Suspense, contagem e o vencedor</p></div>';
        break;
    }
    return h;
  }
  function slideTelao(key) {
    var l = deckSlides(), i = deckIndice(key);
    if (i < 0) return '';
    var s = l[i];
    if (s.tipo === 'votacao') return '';            // usa a tela da votação de sempre
    var entra = telao.slideVisto !== key; telao.slideVisto = key;
    if (s.tipo === 'fotos' && !telao.fotosTimer) telao.fotosTimer = setInterval(function () {
      if (route.name !== 'telao' || remote.slide !== 'fotos') { clearInterval(telao.fotosTimer); telao.fotosTimer = null; return; }
      var figs = document.querySelectorAll('.sl-fotos figure'); if (!figs.length) return;
      var k = Math.floor(Date.now() / 6000) % figs.length;
      Array.prototype.forEach.call(figs, function (f, j) { f.classList.toggle('on', j === k); });
    }, 1000);
    return '<div class="telao tl-slide sl-' + s.tipo + (entra ? ' sl-entra' : '') + '">' + telaoFundo() + slideHtml(s, false) +
      (s.tipo !== 'video' && s.tipo !== 'videoHeroi' && s.tipo !== 'fotos' ? '<span class="sl-rodape">' + slideMarca() + '</span>' : '') + '</div>';
  }

  // telão e mosaico: o cursor some depois de 3 s parado
  (function () {
    var t = null;
    document.addEventListener('mousemove', function () {
      document.body.classList.remove('cursor-oculto'); clearTimeout(t);
      if (/^(telao|mosaico)$/.test(route.name)) t = setTimeout(function () { document.body.classList.add('cursor-oculto'); }, 3000);
    });
  })();
  /* ---------- MODO PAUSA: mosaico de fotos da Trilha ----------
     Liga pelo controle (ou tecla P no telão) e fica por cima de qualquer
     slide. As fotos trocam sozinhas, em quadros de tamanhos diferentes, em
     ordem aleatória; de tempos em tempos uma foto cresce no centro com a
     legenda. Desligar volta exatamente para o slide em que estava.      */
  var PZ_QUADROS = 12;
  function viewPausa() {
    var q = '';
    for (var i = 0; i < PZ_QUADROS; i++) q += '<div class="pz-t pz-' + i + '"></div>';
    return '<div class="telao pausa" id="pausaTela">' + telaoFundo() +
      '<div class="pz-grade">' + q + '</div>' +
      '<div class="pz-destaque" aria-hidden="true"></div>' +
      // QR do site só no mosaico avulso (leilão); no modo pausa do telão não aparece
      (route.name === 'mosaico' ? '<div class="pz-qr"><div class="pz-qr-img" id="pzQr"></div><span class="pz-qr-txt"><b>Conheça o site</b><span>' + esc(siteBase().replace(/^https?:\/\//, '')) + '</span></span></div>' : '') +
      (route.name === 'mosaico' && route.param !== 'marca' ? '' : '<span class="pz-marca">' + slideMarca() + '<span>Trilha 2026</span></span>') +
      '</div>';
  }
  var pz = { troca: null, dest: null, ult: -1, visiveis: [], destVistas: {}, destUltima: '', info: {}, medindo: {} };
  function pausaFotos() {
    var fs = todasAsFotos().filter(function (f) { return f[0] || f[3]; });
    if (!fs.length) fs = (db.retro && db.retro.photos) || [];
    var out = [];
    fs.forEach(function (f) {
      var src = f[0] || (f[3] && nuvem.dados[f[3]]) || '';
      if (!src && f[3]) { pedirDado(f[3]); return; }
      if (src) out.push({ src: src, leg: f[2] || '' });
    });
    return out;
  }
  var PZ_GRANDES = [0, 2, 9], PZ_ALTOS = [4, 7, 8];   // quadros 2x2 e quadros em pé do mosaico
  function pzSorteia(lista, evitar, quadro) {
    if (!lista.length) return null;
    pzMedir(lista);
    var livres = lista.filter(function (f) { return evitar.indexOf(f.src) < 0; });
    var base = livres.length ? livres : lista;
    if (quadro != null) {
      var pref = PZ_GRANDES.indexOf(quadro) >= 0 ? base.filter(function (f) { return pzUtil(f) >= PZ_NITIDA && !pzRetrato(f); })
               : PZ_ALTOS.indexOf(quadro) >= 0 ? base.filter(function (f) { return pzRetrato(f); })
               : base.filter(function (f) { return !pzRetrato(f); });   // fotos em pé ficam para os quadros em pé
      if (pref.length) base = pref;
    }
    return base[Math.floor(Math.random() * base.length)];
  }
  /* qualidade de cada foto: o site mede a resolução real (largura x altura)
     ao carregar. "Largura útil" = quanto da foto aproveita um quadro
     deitado 3:2 (o formato do destaque): min(largura, altura x 1,5).     */
  var PZ_NITIDA = 1200;   // a partir disso a foto fica nítida no destaque em tela Full HD
  function pzMedir(lista) {
    lista.forEach(function (f) {
      if (pz.info[f.src] || pz.medindo[f.src]) return;
      pz.medindo[f.src] = true;
      var im = new Image();
      im.onload = function () { pz.info[f.src] = { w: im.naturalWidth, h: im.naturalHeight }; };
      im.src = f.src;
    });
  }
  function pzUtil(f) { var i = pz.info[f.src]; return i ? Math.min(i.w, i.h * 1.5) : 0; }
  function pzRetrato(f) { var i = pz.info[f.src]; return !!(i && i.h > i.w * 1.1); }
  // só entram no destaque as fotos nítidas; se houver poucas, as melhores que existirem
  function pzCandidatasDestaque(lista) {
    pzMedir(lista);
    var medidas = lista.filter(function (f) { return pz.info[f.src]; });
    if (!medidas.length) return lista;
    var boas = medidas.filter(function (f) { return pzUtil(f) >= PZ_NITIDA && !pzRetrato(f); });
    if (boas.length >= 3) return boas;
    var ord = medidas.slice().sort(function (a, b) { return pzUtil(b) - pzUtil(a); });
    return ord.slice(0, Math.max(3, Math.ceil(ord.length / 2)));
  }
  /* foto de destaque SEM repetição: passa por todas as fotos, em ordem
     sorteada, antes de qualquer uma voltar. Ao recomeçar a rodada, a última
     mostrada nunca é a primeira da rodada nova. Fotos novas entram na roda. */
  function pzProximoDestaque(lista) {
    if (!lista.length) return null;
    var faltam = lista.filter(function (f) { return !pz.destVistas[f.src]; });
    if (!faltam.length) {
      pz.destVistas = {};
      faltam = lista.filter(function (f) { return f.src !== pz.destUltima; });
      if (!faltam.length) faltam = lista;
    }
    var f = faltam[Math.floor(Math.random() * faltam.length)];
    pz.destVistas[f.src] = true; pz.destUltima = f.src;
    return f;
  }
  function pzColoca(quadro, foto, instantaneo) {
    if (!foto) return;
    var im = new Image(); im.decoding = 'async';
    im.onload = function () {
      var c = document.createElement('div');
      c.className = 'pz-cam' + (instantaneo ? ' ja' : '');
      c.style.setProperty('--px', (Math.random() * 6 - 3).toFixed(1) + '%');
      c.style.setProperty('--py', (Math.random() * 6 - 3).toFixed(1) + '%');
      c.style.setProperty('--dur', (9 + Math.random() * 6).toFixed(1) + 's');
      c.appendChild(im);
      quadro.appendChild(c);
      quadro.setAttribute('data-src', foto.src);
      var velhas = quadro.querySelectorAll('.pz-cam');
      if (velhas.length > 1) setTimeout(function () { for (var i = 0; i < velhas.length - 1; i++) if (velhas[i].parentNode) velhas[i].parentNode.removeChild(velhas[i]); }, 1600);
    };
    im.src = foto.src;
  }
  function pausaMontar() {
    var tela = $('#pausaTela');
    // QR do site no canto (preenchido aqui, sem redesenhar a tela)
    var qrEl = $('#pzQr');
    if (qrEl && !qrEl.firstChild) { var svgQr = qrPara(siteBase()); if (svgQr) qrEl.innerHTML = svgQr; }
    var ativo = route.name === 'mosaico' || (route.name === 'telao' && remote.pausa);
    if (!tela || !ativo) { clearInterval(pz.troca); clearInterval(pz.dest); clearInterval(pz.rod); pz.troca = pz.dest = null; return; }
    if (tela.getAttribute('data-vivo')) return;
    tela.setAttribute('data-vivo', '1');
    var fotos = pausaFotos();
    var quadros = Array.prototype.slice.call(tela.querySelectorAll('.pz-t'));
    var usadas = [];
    function encher() {
      // escolhe primeiro para os quadros em pé e os grandes; entram na tela uma a uma
      var ordem = PZ_ALTOS.concat(PZ_GRANDES), escolha = {};
      quadros.forEach(function (q, i) { if (ordem.indexOf(i) < 0) ordem.push(i); });
      ordem.forEach(function (i) { var f = pzSorteia(fotos, usadas, i); if (f) usadas.push(f.src); escolha[i] = f; });
      quadros.forEach(function (q, i) { setTimeout(function () { pzColoca(q, escolha[i], false); }, 120 + i * 140); });
    }
    // mede as fotos primeiro (até 1,5 s) para já começar com as nítidas nos quadros grandes
    pzMedir(fotos);
    var t0 = Date.now();
    (function esperar() {
      var medidas = fotos.filter(function (f) { return pz.info[f.src]; }).length;
      if (medidas >= fotos.length || Date.now() - t0 > 1500) encher(); else setTimeout(esperar, 100);
    })();
    clearInterval(pz.troca); clearInterval(pz.dest);
    pz.troca = setInterval(function () {
      if (!document.body.contains(tela)) { clearInterval(pz.troca); return; }
      fotos = pausaFotos(); if (!fotos.length) return;
      var i; do { i = Math.floor(Math.random() * quadros.length); } while (quadros.length > 1 && i === pz.ult);
      pz.ult = i;
      var vis = quadros.map(function (q) { return q.getAttribute('data-src'); });
      pzColoca(quadros[i], pzSorteia(fotos, vis, i), false);
    }, 1700);
    pz.dest = setInterval(function () {
      if (!document.body.contains(tela)) { clearInterval(pz.dest); return; }
      var f = pzProximoDestaque(pzCandidatasDestaque(pausaFotos())), d = tela.querySelector('.pz-destaque');
      if (!f || !d) return;
      var im = new Image();
      im.onload = function () {
        d.innerHTML = '';
        var fig = document.createElement('figure'); fig.appendChild(im);
        if (f.leg) { var cap = document.createElement('figcaption'); cap.textContent = f.leg; fig.appendChild(cap); }
        d.appendChild(fig);
        d.classList.remove('on'); void d.offsetWidth; d.classList.add('on');
      };
      im.src = f.src;
    }, 12000);
    clearInterval(pz.rod);
    if (route.name === 'mosaico') pzRodizio(tela);
  }
  /* telão do leilão (/#/mosaico e /#/mosaico/marca): mostra UMA tela por vez,
     escolhida no painel (aba Leilão): o mosaico de fotos ou a tela do
     Instituto com os apresentadores. Não há rodízio automático.          */
  var PZ_ROD = { mosaico: 180000, tela: 20000 };
  // o que entra no rodízio do mosaico (aba Leilão do painel); vale para todos os telões
  function leilaoCfg() {
    var c = (db && db.leilao) || {};
    var ap = Array.isArray(c.apres) ? c.apres : ['Ismael Akiyama', 'Thais Carneiro'];
    return { tela: c.tela === 'idl' ? 'idl' : 'mosaico', apres: [String(ap[0] || '').trim(), String(ap[1] || '').trim()], modo: c.apresModo || 'alternar' };
  }
  /* flor do Instituto Dente de Leão, desenhada em SVG (fica nítida em
     qualquer tamanho): três anéis de pétalas laranja que se sobrepõem   */
  function idlFlorSvg(cls) {
    var aneis = [[100, 'rgba(244,160,30,.55)', 0], [78, 'rgba(226,112,8,.55)', 7.5], [52, 'rgba(184,78,0,.6)', 15]];
    var out = '';
    aneis.forEach(function (a) {
      var L = a[0], w = L * .2;
      for (var i = 0; i < 16; i++) {
        out += '<path transform="rotate(' + (i * 22.5 + a[2]) + ')" fill="' + a[1] + '" d="M0 0 C' + w + ' ' + (-L * .35) + ' ' + (w * .7) + ' ' + (-L * .75) + ' 0 ' + (-L) + ' C' + (-w * .7) + ' ' + (-L * .75) + ' ' + (-w) + ' ' + (-L * .35) + ' 0 0Z"/>';
      }
    });
    var ast = '';
    for (var k = 0; k < 8; k++) ast += '<line x1="0" y1="0" x2="0" y2="-11" transform="rotate(' + (k * 45) + ')"/>';
    return '<svg class="' + (cls || '') + '" viewBox="-110 -110 220 220" aria-hidden="true">' + out +
      '<circle r="15" fill="#7a3a00" opacity=".55"/><g stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9">' + ast + '</g></svg>';
  }
  // tela do Instituto (visual do IDL, não do IDL Tech) com os apresentadores
  function telaIdlHtml() {
    var c = leilaoCfg(), a = c.apres.filter(Boolean), nomes;
    // nome no estilo do logo: 1ª palavra forte em amarelo (como DENTE), o resto fino em cinza (como DE)
    function nm(n) {
      var p = String(n).trim().split(/\s+/), pri = p.shift();
      return '<span class="ti-nome"><b>' + esc(pri) + '</b>' + (p.length ? '<em>' + esc(p.join(' ')) + '</em>' : '') + '</span>';
    }
    if (!a.length) nomes = '';
    else if (c.modo === 'juntos' && a.length > 1) nomes = '<div class="ti-nomes ti-juntos">' + nm(a[0]) + '<i>&amp;</i>' + nm(a[1]) + '</div>';
    else if (c.modo === 'p2' && a.length > 1) nomes = '<div class="ti-nomes">' + nm(a[1]) + '</div>';
    else if (c.modo === 'p1' || c.modo === 'p2' || a.length === 1) nomes = '<div class="ti-nomes">' + nm(a[0]) + '</div>';
    else nomes = '<div class="ti-nomes ti-alterna">' + nm(a[0]) + nm(a[1]) + '</div>';
    return '<div class="ti-fundo" aria-hidden="true">' + idlFlorSvg('ti-flor ti-flor-a') + idlFlorSvg('ti-flor ti-flor-b') + idlFlorSvg('ti-flor ti-flor-c') + '</div>' +
      '<div class="ti-centro">' +
        '<img class="ti-logo" src="img/logo-idl-telao.webp" alt="Instituto Dente de Leão">' +
        '<span class="ti-traco" aria-hidden="true"><i></i>' + idlFlorSvg('ti-mini') + '<i></i></span>' +
        (nomes ? '<span class="ti-rotulo">Apresentação</span>' + nomes : '') +
      '</div>' +
      '<span class="ti-site">institutodentedeleao.com.br</span>';
  }
  function pzRodizio(tela) {
    clearInterval(pz.rod);
    var camada = document.createElement('div');
    camada.className = 'pz-rodizio tela-idl';
    camada.setAttribute('aria-hidden', 'true');
    tela.appendChild(camada);
    // já baixa a fonte e o logo da tela do Instituto, para ela entrar pronta (sem piscar)
    try { ['200', '300', '800'].forEach(function (w) { document.fonts.load(w + ' 40px "Montserrat IDL"'); }); } catch (e) {}
    (new Image()).src = 'img/logo-idl-telao.webp';
    // segue a escolha do painel (chega ao telão aberto em até 30 s); confere 2x por segundo
    var mostrando = null, assin = '';
    function passo() {
      if (!document.body.contains(tela)) { clearInterval(pz.rod); return; }
      var c = leilaoCfg(), deve = c.tela === 'idl';
      var a2 = deve ? JSON.stringify(c.apres) + c.modo : '';
      if (deve === mostrando && a2 === assin) return;
      if (deve) camada.innerHTML = telaIdlHtml();   // nomes trocados no painel com a tela no ar: redesenha só o conteúdo
      mostrando = deve; assin = a2;
      camada.classList.toggle('on', deve);
    }
    passo();
    pz.rod = setInterval(passo, 500);
  }
  function definirPausaTelao(v) {
    if (!remote.on || !localState.adminKey) { toast('Entre como organização para usar o modo pausa.'); return; }
    var antes = remote.pausa;
    remote.pausa = !!v; render();
    sbRpc('definir_pausa', { p_chave: localState.adminKey, p_pausa: !!v }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
      toast(v ? 'Modo pausa ligado: fotos passando no telão.' : 'Modo pausa desligado.');
    }).catch(function (e) {
      remote.pausa = antes; render();
      toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente para usar o modo pausa.' : 'Não consegui mudar o modo pausa.');
    });
  }

  // ---------- navegação ----------
  var apres = { pend: null, voando: false, fila: null, corte: 0 };
  function irSlide(key) {
    if (!remote.on || !localState.adminKey) { toast('Entre como organização para controlar a apresentação.'); return; }
    var l = deckSlides(), i = deckIndice(key), s = l[i];
    var ultEq = -1; l.forEach(function (x, j) { if (x.tipo === 'equipe') ultEq = j; });
    var palco = null;
    if (s && s.tipo === 'equipe') palco = s.pid;
    else if (ultEq >= 0 && i > ultEq) palco = '';
    var antes = { slide: remote.slide, palco: remote.palco, rev: remote.revelar, revB: remote.revelarBanca };
    remote.slide = key || null; remote.pausa = false;
    if (palco !== null) remote.palco = palco || null;
    if ((key === 'revelaHeroi') !== remote.revelar) { remote.revelar = key === 'revelaHeroi'; if (remote.revelar) telao.revelInicio = Date.now(); telao.vencedores = null; }
    if ((key === 'revelaBanca') !== remote.revelarBanca) { remote.revelarBanca = key === 'revelaBanca'; if (remote.revelarBanca) telao.revelInicio = Date.now(); telao.vencBanca = null; }
    apres.pend = { key: key || '', palco: palco, t: Date.now() };
    render();
    preCarregarVizinho();
    enviarSlide({ key: key || '', palco: palco, antes: antes });
  }
  // envia uma troca por vez; se o passador for apertado várias vezes seguidas,
  // só a última posição vai para o banco (sem vai-e-volta no telão)
  function enviarSlide(m) {
    if (apres.voando) { if (apres.fila && apres.fila.palco !== null && m.palco === null) m.palco = apres.fila.palco; apres.fila = m; return; }
    apres.voando = true;
    sbRpc('definir_slide', { p_chave: localState.adminKey, p_slide: m.key, p_palco: m.palco }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
    }).catch(function (e) {
      if (!apres.fila) {
        remote.slide = m.antes.slide; remote.palco = m.antes.palco; remote.revelar = m.antes.rev; remote.revelarBanca = m.antes.revB; apres.pend = null; render();
        toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente para usar a apresentação.' : 'Não consegui trocar o slide. Tente de novo.');
      }
    }).then(function () {
      apres.voando = false;
      if (apres.fila) { var f = apres.fila; apres.fila = null; enviarSlide(f); return; }
      // gravado: a partir de agora o banco já tem a nossa troca
      apres.pend = null; apres.corte = Date.now();
    });
  }
  // deixa as imagens do próximo slide já carregadas
  function preCarregarVizinho() {
    var l = deckSlides(), i = deckIndice(remote.slide);
    [l[i + 1], l[i + 2]].forEach(function (s) {
      if (!s) return;
      var srcs = [];
      if (s.tipo === 'equipe') { var p = byId(s.pid); if (p) (p.heroes || []).forEach(function (h) { if (h.image) srcs.push(h.image); }); }
      srcs.forEach(function (u) { var im = new Image(); im.decoding = 'async'; im.src = u; });
    });
  }
  function passoSlide(d) {
    var l = deckSlides(); if (!l.length) return;
    var i = deckIndice(remote.slide);
    var j = i < 0 ? 0 : Math.max(0, Math.min(l.length - 1, i + d));
    if (j !== i) irSlide(l[j].key);
  }
  // teclado / passador no computador do telão
  /* passadores de slide funcionam como teclado: → ↓ PageDown espaço (avança),
     ← ↑ PageUp (volta). O botão "iniciar" do passador manda F5, que aqui NÃO
     recarrega a página; o botão de "tela preta" (B ou .) escurece o telão.  */
  document.addEventListener('keydown', function (e) {
    if (route.name !== 'telao' || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === 'F5') { e.preventDefault(); return; }
    if (k === 'b' || k === 'B' || k === '.' || k === 'w' || k === 'W') { e.preventDefault(); telaoPreta(); return; }
    if (!localState.admin) return;
    if (k === 'p' || k === 'P') { e.preventDefault(); definirPausaTelao(!remote.pausa); return; }
    var nav = /^(ArrowRight|ArrowDown|PageDown| |Enter|ArrowLeft|ArrowUp|PageUp|Backspace)$/.test(k);
    if (nav && remote.pausa) { e.preventDefault(); definirPausaTelao(false); return; }   // sai da pausa e volta ao slide
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); telaoPreta(false); passoSlide(1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); telaoPreta(false); passoSlide(-1); }
  });
  function telaoPreta(forcar) {
    var el = $('#tlPreta'), ligar = forcar == null ? !el : forcar;
    if (ligar && !el) { el = document.createElement('div'); el.id = 'tlPreta'; el.className = 'tl-preta'; document.body.appendChild(el); }
    else if (!ligar && el) el.remove();
  }

  // ---------- controlador (#/controle) · opção A: blocos separados ----------
  function previaPausa() {
    var fs = pausaFotos().slice(0, 6);
    return '<div class="telao tl-slide sl-previa pausa"><div class="pv-mosaico">' +
      fs.map(function (f) { return '<span style="background-image:url(\'' + String(f.src).replace(/'/g, '%27') + '\')"></span>'; }).join('') +
      '</div><span class="pv-selo">❚❚ Modo pausa · fotos passando</span></div>';
  }
  function previaTela(s, rotuloVazio) {
    var dentro;
    if (s === 'pausa') dentro = previaPausa();
    else if (s && s.tipo) dentro = '<div class="telao tl-slide sl-previa sl-' + s.tipo + '">' + slideHtml(s, true) + '</div>';
    else dentro = '<div class="telao tl-slide sl-previa"><div class="sl-centro"><span class="sl-eyebrow">Telão</span><h1 class="sl-mega sl-mega-m">' + esc(rotuloVazio || 'Fim do roteiro') + '</h1></div></div>';
    return '<div class="ctl-tela"><div class="ctl-escala">' + dentro + '</div></div>';
  }
  function viewControle() {
    if (!localState.admin) return viewEntrar('admin', 'Controle da apresentação: entre como organização.');
    if (!remote.on) return '<div class="view"><div class="corpo"><div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow">O controle funciona na versão publicada, com o banco ligado.</p></div></div></div>';
    var l = deckSlides(), i = deckIndice(remote.slide), atual = l[i] || null, prox = i < 0 ? l[0] : (l[i + 1] || null);
    // o que está DE FATO no telão agora
    var agora, estado, cor;
    if (remote.pausa) { agora = 'pausa'; estado = 'Modo pausa · fotos passando'; cor = 'pausa'; }
    else if (remote.revelarBanca) { agora = { tipo: 'revelaBanca' }; estado = 'Revelando o Projeto destaque'; cor = 'revela'; }
    else if (remote.revelar) { agora = { tipo: 'revelaHeroi' }; estado = 'Revelando o Herói'; cor = 'revela'; }
    else if (atual) { agora = atual; estado = 'Apresentação · slide ' + (i + 1) + ' de ' + l.length; cor = 'apres'; }
    else { agora = { tipo: 'votacao' }; estado = 'Fora da apresentação · votação no telão'; cor = 'fora'; }

    var roteiro = '', ult = '';
    l.forEach(function (s, j) {
      var g = s.grupo || '';
      if (g && g !== ult) roteiro += '<li class="ctl-grupo">' + esc(g) + '</li>';
      ult = g;
      roteiro += '<li><button class="ctl-item' + (j === i ? ' on' : '') + '" data-act="slideIr" data-k="' + esc(s.key) + '"><span class="num">' + (j + 1) + '</span><span class="ctl-item-t">' + esc(s.rotulo) + '</span>' + (j === i ? '<span class="ctl-item-ar">No ar</span>' : '') + '</button></li>';
    });

    return '<div class="view controle ctlA">' +
      '<div class="ctlA-status ' + cor + '"><span class="ctlA-ponto"></span><div class="grow"><span class="eyebrow">Controle · IDL</span><b>' + esc(estado) + '</b></div>' +
        '<div class="ctl-chips">' + avChip('Votação', remote.aberta, 'aberta', 'fechada') + avChip('Decisão', remote.decisao, 'aberta', 'fechada') + '</div></div>' +
      '<div class="ctlA-grade">' +
        '<section class="ctlA-esq">' +
          '<div class="ctlA-previas">' +
            '<div class="ctlA-pv ctlA-agora"><span class="ctl-rot">No telão agora</span>' + previaTela(agora) + '</div>' +
            '<div class="ctlA-pv ctlA-seguir"><span class="ctl-rot">A seguir</span>' + previaTela(prox, 'Fim do roteiro') + (prox ? '<span class="ctlA-pv-nome">' + esc(prox.rotulo) + '</span>' : '') + '</div>' +
          '</div>' +
          '<div class="ctlA-nav">' +
            '<button class="btn btn-outline btn-lg" data-act="slideAnt"' + (i <= 0 ? ' disabled' : '') + '>' + ico('i-arrow-left') + ' Anterior</button>' +
            '<button class="btn btn-primary btn-lg" data-act="slideProx"' + (i >= l.length - 1 ? ' disabled' : '') + '>' + (i < 0 ? 'Começar' : 'Próximo') + ' ' + ico('i-chev') + '</button>' +
          '</div>' +
          '<p class="tiny ctlA-dica">No computador do telão: → ou passador avança · ← volta · P liga a pausa · B escurece. <a href="#/telao" target="_blank" rel="noopener">Abrir o telão</a></p>' +
        '</section>' +
        '<section class="ctlA-dir">' +
          '<div class="ctlA-card"><span class="ctlA-tit">' + ico('i-eye') + ' Telão</span>' +
            '<label class="av-vis' + (remote.pausa ? ' on' : '') + '"><input type="checkbox" data-act="togglePausa"' + (remote.pausa ? ' checked' : '') + '>' +
              '<span class="cv-trilho" aria-hidden="true"><span></span></span><span><b>Modo pausa · fotos da Trilha</b><span class="tiny">' + (remote.pausa ? 'Mosaico de fotos no telão. Desligar volta ao slide.' : 'Para intervalos: fotos passando em mosaico.') + '</span></span></label>' +
            (atual ? '<button class="btn btn-ghost btn-sm" data-act="slideSair">Sair da apresentação (telão volta à votação)</button>' : '') +
          '</div>' +
          '<div class="ctlA-card"><span class="ctlA-tit">' + ico('i-vote') + ' Votação do público</span>' +
            '<div class="ctlA-par">' +
              (remote.aberta ? '<button class="btn btn-danger" data-act="askClose">Encerrar votação</button>' : '<button class="btn btn-laranja" data-act="askOpen">Abrir votação</button>') +
              '<button class="btn btn-outline" data-act="slideIr" data-k="votacao">Mostrar o QR</button>' +
            '</div></div>' +
          '<div class="ctlA-card ctlA-revela"><span class="ctlA-tit">' + ico('i-spark') + ' Revelações</span>' +
            '<div class="ctlA-par">' +
              '<button class="btn ctlA-rv banca' + (remote.revelarBanca ? ' on' : '') + '" data-act="askSlideRevela" data-k="revelaBanca"><b>Projeto destaque</b><span>banca</span></button>' +
              '<button class="btn ctlA-rv heroi' + (remote.revelar ? ' on' : '') + '" data-act="askSlideRevela" data-k="revelaHeroi"><b>Herói da Trilha</b><span>público</span></button>' +
            '</div><p class="tiny" style="margin:0">Pede confirmação antes de revelar. Encerre a votação/decisão antes.</p></div>' +
          '<div class="ctlA-card ctlA-roteiro"><span class="ctlA-tit">' + ico('i-grid') + ' Roteiro <span class="tiny">· toque para ir direto</span></span>' +
            '<ol class="ctl-lista">' + roteiro + '</ol></div>' +
        '</section>' +
      '</div></div>';
  }
  // mantém o slide atual visível na lista do roteiro (só quando muda)
  var ctlUltimoRolado = null;
  function ctlRolarRoteiro() {
    var on = document.querySelector('.ctlA .ctl-item.on'), lista = document.querySelector('.ctlA .ctl-lista');
    if (!on || !lista || ctlUltimoRolado === remote.slide) return;
    ctlUltimoRolado = remote.slide;
    lista.scrollTop = on.offsetTop - lista.offsetTop - lista.clientHeight / 2 + on.clientHeight / 2;
  }
  function ajustarPrevias() {
    Array.prototype.forEach.call(document.querySelectorAll('.ctl-tela'), function (b) {
      var e = b.querySelector('.ctl-escala'); if (e) e.style.transform = 'scale(' + (b.clientWidth / 1280).toFixed(4) + ')';
    });
  }
  window.addEventListener('resize', function () { if (route.name === 'controle') ajustarPrevias(); });

  // ---------- aba Apresentação do painel ----------
  function adminApresentacao() {
    var cfg = deckConfig();
    var linhas = cfg.map(function (it, i) {
      var auto = it.tipo === 'equipes' ? 'Automático: 1 slide por equipe, na ordem da programação (marca a equipe No palco)'
        : it.tipo === 'candidatos' ? 'Automático: 1 vídeo por Herói candidato com vídeo' : it.tipo === 'votacao' ? 'Tela viva: QR da votação'
        : it.tipo === 'revelaHeroi' || it.tipo === 'revelaBanca' ? 'Tela viva: revelação com animação e som' : it.tipo === 'programacao' ? 'Automático: puxa a Programação'
        : it.tipo === 'numeros' ? 'Automático: números da Trilha' : it.tipo === 'fotos' ? 'Automático: fotos da aba Fotos' : '';
      var temTexto = /^(abertura|instituto|texto)$/.test(it.tipo);
      return '<li class="ap-item' + (it.on ? '' : ' off') + '" data-i="' + i + '">' +
        '<div class="ap-cab"><label class="ap-on"><input type="checkbox" data-ap="on"' + (it.on ? ' checked' : '') + '> <span class="num">' + (i + 1) + '</span></label>' +
          '<input class="ap-tit" data-ap="titulo" value="' + esc(it.titulo || '') + '" aria-label="Título do slide">' +
          '<span class="ap-mov"><button type="button" class="iconbtn" data-act="apMover" data-d="-1" aria-label="Subir">' + ico('i-up') + '</button><button type="button" class="iconbtn" data-act="apMover" data-d="1" aria-label="Descer">' + ico('i-down') + '</button></span></div>' +
        (auto ? '<p class="tiny ap-auto">' + esc(auto) + '</p>' : '') +
        (temTexto ? '<textarea data-ap="texto" rows="2" aria-label="Texto do slide">' + esc(it.texto || '') + '</textarea>' : '') +
        (it.tipo === 'video' ? '<input data-ap="video" value="' + esc(it.video || '') + '" placeholder="Link do YouTube do vídeo" aria-label="Link do vídeo">' : '') +
        '</li>';
    }).join('');
    return '<div class="stack-lg">' +
      '<section class="stack"><h2 class="h2">Apresentação</h2>' +
      '<p class="small">A apresentação roda no telão (<b>' + esc(siteBase() + '/#/telao') + '</b>, em F11) e é comandada pelo controle (<b>' + esc(siteBase() + '/#/controle') + '</b>) no celular, ou pelo teclado/passador no computador do telão. Ligue, desligue, reordene e edite os textos aqui; depois clique em Salvar.</p>' +
      '<div class="row wrap" style="gap:8px"><a class="btn btn-primary" href="#/controle" target="_blank" rel="noopener">Abrir o controle</a><a class="btn btn-outline" href="#/telao" target="_blank" rel="noopener">Abrir o telão</a>' +
        '<button class="btn btn-ghost" data-act="apPadrao">Voltar ao roteiro padrão</button></div></section>' +
      '<form id="apForm" class="stack"><ol class="ap-lista">' + linhas + '</ol>' +
      '<button class="btn btn-primary btn-lg" type="submit">' + ico('i-save') + ' Salvar a apresentação</button></form></div>';
  }
  /* ---------- aba Leilão: atalhos para as telas usadas no leilão do IDL ---------- */
  function leiChaves() {
    var c = leilaoCfg();
    function opcao(k, titulo, sub) {
      var sel = c.tela === k;
      return '<label class="lei-opcao' + (sel ? ' on' : '') + '"><input type="radio" name="leiTela" data-act="leiTelaSel" value="' + k + '"' + (sel ? ' checked' : '') + '>' +
        '<span class="lei-radio" aria-hidden="true"></span><span><b>' + esc(titulo) + '</b><span class="tiny">' + esc(sel ? 'No telão agora' : sub) + '</span></span></label>';
    }
    var modos = [['alternar', 'Alternar os dois nomes'], ['juntos', 'Os dois nomes juntos'], ['p1', 'Só o 1º apresentador'], ['p2', 'Só o 2º apresentador']];
    return '<section class="painelinho stack lei-chaves"><div><span class="eyebrow">O que aparece no telão</span>' +
      '<p class="small">Escolha uma das duas telas: um clique já troca. Vale para o /#/mosaico e o /#/mosaico/marca; o telão aberto muda sozinho em até 30 s (ou na hora, com um clique na janela do telão).</p></div>' +
      '<div class="lei-chaves-l">' +
        opcao('mosaico', 'Mosaico de fotos', 'Fotos da Trilha passando, com o QR do site') +
        opcao('idl', 'Tela do Instituto · apresentação', 'Logo do IDL e os nomes dos apresentadores') +
      '</div>' +
      '<div class="lei-apres">' +
        '<div class="field"><label for="leiAp1">1º apresentador</label><input id="leiAp1" data-act="leiNome" data-i="0" value="' + esc(c.apres[0]) + '" placeholder="Nome"></div>' +
        '<div class="field"><label for="leiAp2">2º apresentador</label><input id="leiAp2" data-act="leiNome" data-i="1" value="' + esc(c.apres[1]) + '" placeholder="Nome"></div>' +
        '<div class="field"><label for="leiModo">Nomes na tela</label><select id="leiModo" data-act="leiModo">' + modos.map(function (m) {
          return '<option value="' + m[0] + '"' + (c.modo === m[0] ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="lei-ti-prev"><div class="tela-idl lei-ti-mini">' + telaIdlHtml() + '</div></div>' +
      '</section>';
  }
  function leiEscolherTela(k) {
    db.leilao = db.leilao || {};
    if (leilaoCfg().tela === k) return;
    db.leilao.tela = k === 'idl' ? 'idl' : 'mosaico';
    save();
    toast(k === 'idl' ? 'Telão: tela do Instituto. Muda em até 30 s.' : 'Telão: mosaico de fotos. Muda em até 30 s.');
  }
  function leiDefinirApres(i, v) {
    db.leilao = db.leilao || {};
    var ap = leilaoCfg().apres.slice(); ap[i] = String(v || '').trim();
    db.leilao.apres = ap; save(); toast('Nome salvo. O telão atualiza em até 30 s.');
  }
  var leiMedidas = -1;
  function adminLeilao() {
    var base = siteBase(), fotos = pausaFotos();
    pzMedir(fotos);
    var medidas = fotos.filter(function (f) { return pz.info[f.src]; });
    var nitidas = medidas.filter(function (f) { return pzUtil(f) >= PZ_NITIDA && !pzRetrato(f); }).length;
    // as medidas chegam aos poucos: redesenha enquanto a aba estiver aberta
    if (medidas.length < fotos.length && medidas.length !== leiMedidas) {
      leiMedidas = medidas.length;
      setTimeout(function () { if (route.name === 'admin' && admin.tab === 'leilao') render(); }, 1200);
    }
    var miniFotos = fotos.slice(0, 6).map(function (f) { return '<span style="background-image:url(\'' + String(mini(f.src)).replace(/'/g, '%27') + '\')"></span>'; }).join('');
    function tela(o) {
      var url = o.rota ? base + '/#/' + o.rota : base;
      return '<article class="lei-card' + (o.destaque ? ' lei-principal' : '') + '">' +
        '<div class="lei-prev' + (o.marca ? ' com-marca' : '') + '">' + o.prev + '</div>' +
        '<div class="lei-info">' + (o.destaque ? '<span class="lei-tag">Tela principal</span>' : '') +
          '<h3 class="h3">' + esc(o.titulo) + '</h3><p class="small">' + o.texto + '</p>' +
          '<code class="lei-url">' + esc(url.replace(/^https?:\/\//, '')) + '</code>' +
          '<div class="row wrap" style="gap:8px"><a class="btn btn-sm ' + (o.destaque ? 'btn-primary' : 'btn-outline') + '" href="' + (o.rota ? '#/' + o.rota : esc(base)) + '" target="_blank" rel="noopener">' + ico('i-play') + ' Abrir</a>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-act="leiCopiar" data-url="' + esc(url) + '">Copiar link</button></div>' +
        '</div></article>';
    }
    var prevMosaico = '<div class="lei-mos">' + miniFotos + '</div>';
    var prevQr = qrPara(base) || '';
    var espera = [['Painel do lote atual', 'Item, foto e lance atual, atualizados pelo celular'], ['Contagem regressiva', 'Tempo até o próximo lote'],
      ['Termômetro da arrecadação', 'Precisa da meta'], ['Heróis da Trilha 2026', 'Já dá para ligar: usa o que está no site'],
      ['QR de apoio', 'Precisa do link ou da chave de doação'], ['Agradecimento aos apoiadores', 'Precisa dos logos']];
    return '<div class="stack-lg">' +
      '<section class="stack"><h2 class="h2">Leilão</h2>' +
      '<p class="small">Atalhos para as telas do leilão do IDL. Abra no computador do telão e aperte <b>F11</b> para tela cheia; o cursor some sozinho.</p></section>' +
      leiChaves() +
      '<div class="lei-grade">' +
        tela({ destaque: true, marca: true, rota: 'mosaico/marca', titulo: 'Telão com a marca', prev: prevMosaico + '<span class="lei-selo">Trilhei · IDL Tech</span><span class="lei-mini-qr">' + prevQr + '</span>',
          texto: 'Mostra a tela escolhida acima (mosaico de fotos ou tela do Instituto). No mosaico, aparecem a marca Trilhei · IDL Tech e o QR do site.' }) +
        tela({ rota: 'mosaico', titulo: 'Mosaico sem marca', prev: prevMosaico + '<span class="lei-mini-qr">' + prevQr + '</span>',
          texto: 'Igual, mas sem a marca no mosaico. Também segue a tela escolhida acima.' }) +
        tela({ rota: '', titulo: 'Site do IDL', prev: '<div class="lei-qr">' + prevQr + '</div>',
          texto: 'É para onde aponta o QR no canto do mosaico.' }) +
      '</div>' +
      '<section class="painelinho lei-fotos"><div><span class="eyebrow">Fotos do mosaico</span>' +
        '<p class="lei-num"><b class="num">' + fotos.length + '</b> fotos · <b class="num">' + nitidas + '</b> em alta resolução' + (medidas.length < fotos.length ? ' <span class="tiny">(medindo ' + medidas.length + '/' + fotos.length + ')</span>' : '') + '</p>' +
        '<p class="tiny">As fotos em alta resolução têm prioridade nos quadros grandes e no destaque. Para incluir mais, use a aba Fotos.</p></div>' +
        '<button type="button" class="btn btn-sm btn-outline" data-atab="retro">Gerenciar fotos</button></section>' +
      '<section class="stack"><h3 class="h3">Próximas telas</h3>' +
        '<p class="small">Ideias para encaixar quando o roteiro do leilão chegar.</p>' +
        '<ul class="lei-espera">' + espera.map(function (e) { return '<li><b>' + esc(e[0]) + '</b><span>' + esc(e[1]) + '</span><i>em espera</i></li>'; }).join('') + '</ul></section>' +
      '</div>';
  }
  function apLerForm() {
    var cfg = deckConfig();
    Array.prototype.forEach.call(document.querySelectorAll('.ap-item'), function (li) {
      var it = cfg[+li.getAttribute('data-i')]; if (!it) return;
      Array.prototype.forEach.call(li.querySelectorAll('[data-ap]'), function (c) {
        var k = c.getAttribute('data-ap'); it[k] = k === 'on' ? c.checked : c.value;
      });
    });
    return cfg;
  }


  /* ======================= CHECKLIST PRÉ-EVENTO =======================
     Confere tudo de uma vez (banco, internet, tempo real, votação, banca,
     telão e site) e marca verde, amarelo ou vermelho, com o atalho para
     a aba onde se resolve. Para abrir na manhã do evento e no ensaio.    */
  var chk = { rodando: false, itens: null, em: 0 };
  function chkTempo(fn) { var t = performance.now(); return fn().then(function (v) { return { v: v, ms: performance.now() - t }; }); }
  function chkRealtime() {
    return new Promise(function (ok) {
      if (!remote.on || !window.WebSocket) return ok(false);
      var feito = false, ws;
      function fim(v) { if (feito) return; feito = true; try { ws.close(); } catch (e) {} ok(v); }
      try {
        ws = new WebSocket(String(BE.url).replace(/^http/, 'ws').replace(/\/+$/, '') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(BE.anonKey) + '&vsn=1.0.0');
      } catch (e) { return ok(false); }
      ws.onopen = function () {
        ws.send(JSON.stringify({ topic: 'realtime:idl-check', event: 'phx_join', ref: '1', join_ref: '1',
          payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: 'UPDATE', schema: 'public', table: 'estado_votacao' }] }, access_token: BE.anonKey } }));
      };
      ws.onmessage = function (ev) { try { var m = JSON.parse(ev.data); if (m.event === 'phx_reply' && m.payload) fim(m.payload.status === 'ok'); } catch (e) {} };
      ws.onerror = ws.onclose = function () { fim(false); };
      setTimeout(function () { fim(false); }, 6000);
    });
  }
  function chkRodar() {
    if (chk.rodando) return;
    chk.rodando = true; render();
    var k = localState.adminKey || '';
    function seguro(p) { return p.then(function (v) { return v; }, function (e) { return { erro: e }; }); }
    var lat = [];
    var pEstado = !remote.on ? Promise.resolve({ erro: 'off' }) : seguro(
      chkTempo(sbEstado).then(function (a) { lat.push(a.ms); return chkTempo(sbEstado); })
        .then(function (b) { lat.push(b.ms); return chkTempo(sbEstado); })
        .then(function (c) { lat.push(c.ms); aplicarEstado(c.v, false); return c.v; }));
    var pDown = seguro(chkTempo(function () {
      return fetch('img/banner-instituto.webp?chk=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.blob(); });
    }));
    var pRes = !remote.on ? Promise.resolve({ erro: 'off' }) : seguro(sbRpc('resultado', { p_chave: k }));
    var pBanca = !remote.on ? Promise.resolve({ erro: 'off' }) : seguro(sbRpc('avaliacoes_banca', { p_chave: k }));
    var pCand = !remote.on ? Promise.resolve({ erro: 'off' }) : seguro(fetch(sbUrl('/rest/v1/projetos?select=id,elegivel'), { headers: sbHeaders() }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }));
    var pRt = chkRealtime();
    Promise.all([pEstado, pDown, pRes, pBanca, pCand, pRt]).then(function (r) {
      chk.itens = chkMontar({ estado: r[0], down: r[1], res: r[2], banca: r[3], cand: r[4], rt: r[5], lat: lat });
      chk.em = Date.now(); chk.rodando = false; render();
    });
  }
  function chkMontar(x) {
    var L = [];
    function item(grupo, st, t, d, atab, rot) { L.push({ g: grupo, st: st, t: t, d: d, atab: atab, rot: rot }); }
    var on = remote.on, row = x.estado && !x.estado.erro ? x.estado : null;
    // ---- conexão
    if (!on) item('Conexão', 'erro', 'Banco de dados não configurado', 'O config.js está sem o endereço ou a chave do Supabase: votação e banca não funcionam.');
    else if (!row) item('Conexão', 'erro', 'Sem resposta do banco de dados', 'Confira a internet deste aparelho. Se ela estiver boa, o projeto do Supabase pode estar pausado: abra o painel do Supabase e reative.');
    else item('Conexão', 'ok', 'Banco de dados respondendo', 'O Supabase respondeu normalmente.');
    if (x.lat.length) {
      var ms = Math.round(x.lat.reduce(function (a, b) { return a + b; }, 0) / x.lat.length);
      var mbps = x.down && !x.down.erro && x.down.v ? (x.down.v.size * 8 / 1e6) / (x.down.ms / 1000) : 0;
      var stI = ms > 1200 || (mbps && mbps < 1) ? 'erro' : ms > 450 || (mbps && mbps < 4) ? 'aviso' : 'ok';
      item('Conexão', stI, 'Internet deste aparelho', 'Resposta do banco em ' + ms + ' ms' + (mbps ? ' · download de ~' + (mbps >= 10 ? Math.round(mbps) : mbps.toFixed(1)) + ' Mbit/s' : '') +
        (stI === 'ok' ? '. Boa para o telão e o controle.' : stI === 'aviso' ? '. Funciona, mas pode ter atraso: se der, use cabo ou outra rede no computador do telão.' : '. Lenta: troque de rede antes do evento.'));
    }
    if (on) item('Conexão', x.rt ? 'ok' : 'aviso', 'Tempo real (telão e controle)', x.rt
      ? 'Conectou: as trocas de slide chegam ao telão na hora.'
      : 'Não conectou daqui. O telão segue funcionando pela consulta de 1 em 1 segundo, só com um pouco mais de atraso. Se a rede do local bloquear, é esse o efeito.');
    // ---- banco atualizado + senha
    if (row) {
      var colunas = ['pausa', 'slide', 'revelar_banca', 'avaliacoes_abertas', 'decisao_aberta'].every(function (c) { return c in row; });
      var temBanca = x.res && !x.res.erro && 'banca' in x.res;
      var senhaOk = x.res && !x.res.erro && x.res.liberado && !x.res.so_vencedor;
      item('Banco de dados', colunas && temBanca ? 'ok' : 'erro', 'supabase.sql atualizado', colunas && temBanca
        ? 'O banco tem tudo o que o site usa (slides, pausa, revelações e os dois prêmios).'
        : 'O banco está numa versão anterior. Rode o backend/supabase.sql mais recente no SQL Editor do Supabase.');
      item('Banco de dados', senhaOk ? 'ok' : 'erro', 'Senha da organização', senhaOk ? 'Este aparelho está com a senha certa.' : 'O banco recusou a senha deste aparelho. Saia e entre de novo com a senha da organização.');
    }
    // ---- votação do público
    if (row) {
      var cands = x.cand && !x.cand.erro ? x.cand.filter(function (r) { return r.elegivel; }) : null;
      if (cands) item('Votação do público', cands.length ? 'ok' : 'erro', 'Heróis candidatos marcados', cands.length
        ? cands.length + ' candidato' + (cands.length > 1 ? 's' : '') + ': ' + cands.map(function (c) { var h = heroById(c.id); return h ? String(h.hero.name).split(/\s+[—–-]\s+/)[0] : c.id; }).join(', ') + '.'
        : 'Nenhum candidato marcado: o público não teria em quem votar.', 'votacao', 'Abrir Votação');
      var tot = x.res && !x.res.erro && x.res.total != null ? +x.res.total : null;
      if (tot != null) item('Votação do público', tot === 0 ? 'ok' : 'aviso', 'Votos zerados', tot === 0 ? 'Nenhum voto registrado: a votação começa limpa.'
        : 'Há ' + tot + ' voto' + (tot > 1 ? 's' : '') + ' registrado' + (tot > 1 ? 's' : '') + '. Se forem do ensaio, use "Zerar tudo" no Ao vivo.', 'aovivo', 'Abrir Ao vivo');
      item('Votação do público', remote.aberta ? 'aviso' : 'ok', 'Votação fechada', remote.aberta ? 'A votação está aberta agora. Antes do evento, deixe fechada e abra na hora certa.' : 'Fechada: abre pelo painel na hora das campanhas.', 'votacao', 'Abrir Votação');
      item('Votação do público', remote.resultadoPublico ? 'aviso' : 'ok', 'Vencedores fora do site', remote.resultadoPublico ? 'Os vencedores estão aparecendo no site. Antes do evento, tire do site.' : 'O site ainda não mostra vencedores.', 'votacao', 'Abrir Votação');
    }
    // ---- banca
    if (row) {
      var b = x.banca && !x.banca.erro && x.banca.ok ? x.banca : null;
      if (b) {
        var nA = (b.itens || []).length, nD = (b.decisao || []).length;
        item('Banca', nA + nD === 0 ? 'ok' : 'aviso', 'Notas da banca zeradas', nA + nD === 0 ? 'Nenhuma avaliação nem voto da decisão: a banca começa limpa.'
          : 'Há ' + nA + ' avaliaç' + (nA === 1 ? 'ão' : 'ões') + ' e ' + nD + ' voto' + (nD === 1 ? '' : 's') + ' da decisão. Se forem do ensaio, use "Zerar tudo" no Ao vivo.', 'aovivo', 'Abrir Ao vivo');
      }
      item('Banca', remote.avaliacoes ? 'aviso' : 'ok', 'Avaliações fechadas', remote.avaliacoes ? 'As avaliações estão abertas. O combinado é abrir só na hora.' : 'Fechadas: os jurados leem os projetos e vocês abrem na hora.', 'banca', 'Abrir Banca');
      item('Banca', remote.decisao ? 'aviso' : 'ok', 'Decisão final fechada', remote.decisao ? 'A decisão final está aberta agora.' : 'Fechada: abre depois das apresentações.', 'banca', 'Abrir Banca');
    }
    // ---- telão
    var nSl = deckSlides().length;
    item('Telão', nSl ? 'ok' : 'erro', 'Apresentação', nSl ? nSl + ' slides ligados no roteiro.' : 'Nenhum slide ligado.', 'apres', 'Abrir Apresentação');
    if (row) {
      var revel = remote.revelar || remote.revelarBanca;
      item('Telão', revel || remote.pausa ? 'aviso' : 'ok', 'Telão em estado inicial', revel ? 'Uma revelação está ligada no telão. Volte ao primeiro slide no controle.' : remote.pausa ? 'O modo pausa está ligado no telão.' : 'Sem revelação nem pausa ligadas.', 'apres', 'Abrir Apresentação');
    }
    var nF = pausaFotos().length;
    item('Telão', nF >= 12 ? 'ok' : 'aviso', 'Fotos do mosaico', nF + ' fotos para o modo pausa e o mosaico' + (nF >= 12 ? '.' : '. Com menos de 12, as fotos se repetem bastante.'), 'retro', 'Abrir Fotos');
    // ---- site
    var ev = db.event || {};
    var hoje = new Date().toISOString().slice(0, 10);
    item('Site', ev.dateISO && ev.dateISO >= hoje ? 'ok' : 'aviso', 'Data do evento', (ev.dateLabel || ev.dateISO || 'Sem data') + (ev.timeLabel ? ' · ' + ev.timeLabel : '') + (ev.place ? ' · ' + ev.place : '') +
      (ev.dateISO && ev.dateISO < hoje ? '. A data já passou.' : '.'), 'evento', 'Abrir Evento');
    item('Site', db.clock && db.clock.simulated ? 'erro' : 'ok', 'Ensaio do relógio desligado', db.clock && db.clock.simulated ? 'O relógio de ensaio está ligado: o site mostra um horário falso. Desligue na aba Dados.' : 'O site segue o horário real de Curitiba.', 'dados', 'Abrir Dados');
    item('Site', posEvento() ? 'aviso' : 'ok', 'Modo pós-evento desligado', posEvento() ? 'O modo pós-evento está ligado: o Início mostra o agradecimento em vez da programação.' : 'O Início está no modo de evento.', 'evento', 'Abrir Evento');
    return L;
  }
  function adminChecklist() {
    if (!chk.itens && !chk.rodando) setTimeout(chkRodar, 0);
    var L = chk.itens || [];
    var n = { ok: 0, aviso: 0, erro: 0 }; L.forEach(function (i) { n[i.st]++; });
    var grupos = []; L.forEach(function (i) { if (grupos.indexOf(i.g) < 0) grupos.push(i.g); });
    var resumo = chk.rodando && !L.length ? '<div class="chk-resumo"><b>Conferindo…</b><span class="tiny">Leva uns 5 segundos.</span></div>'
      : '<div class="chk-resumo ' + (n.erro ? 'is-erro' : n.aviso ? 'is-aviso' : 'is-ok') + '"><b>' +
        (n.erro ? n.erro + ' ponto' + (n.erro > 1 ? 's' : '') + ' a resolver' : n.aviso ? 'Quase tudo certo · ' + n.aviso + ' para olhar' : 'Tudo certo para a Banca') + '</b>' +
        '<span class="tiny">' + n.ok + ' ok · ' + n.aviso + ' aviso' + (n.aviso === 1 ? '' : 's') + ' · ' + n.erro + ' problema' + (n.erro === 1 ? '' : 's') +
        (chk.em ? ' · conferido às ' + new Date(chk.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '') + '</span></div>';
    var SIM = { ok: '✓', aviso: '!', erro: '✕' };
    return '<div class="stack-lg">' +
      '<section class="stack"><h2 class="h2">Checklist pré-evento</h2>' +
      '<p class="small">Confere de uma vez se está tudo pronto. Rode no ensaio e de novo na manhã do evento, de preferência no computador do telão e já na internet do local.</p>' +
      '<div class="row wrap" style="gap:8px">' + resumo +
      '<button class="btn btn-primary" data-act="chkRodar"' + (chk.rodando ? ' disabled' : '') + '>' + (chk.rodando ? 'Conferindo…' : 'Conferir de novo') + '</button></div></section>' +
      grupos.map(function (g) {
        return '<section class="chk-grupo"><h3 class="h3">' + esc(g) + '</h3><ul class="chk-lista">' + L.filter(function (i) { return i.g === g; }).map(function (i) {
          return '<li class="chk-item is-' + i.st + '"><span class="chk-sim" aria-label="' + i.st + '">' + SIM[i.st] + '</span>' +
            '<div class="chk-txt"><b>' + esc(i.t) + '</b><span>' + esc(i.d) + '</span></div>' +
            (i.atab && i.st !== 'ok' ? '<button class="btn btn-sm btn-outline" data-atab="' + i.atab + '">' + esc(i.rot || 'Abrir') + '</button>' : '') + '</li>';
        }).join('') + '</ul></section>';
      }).join('') + '</div>';
  }

  /* ============================ MODO EVENTO ============================
     Aba "Ao vivo" do painel: tudo o que se usa durante a Banca numa tela
     só, pensada para o celular de quem opera: palco, votação, banca,
     decisão e telão, com contadores que se atualizam sozinhos.          */
  var modoEv = { em: 0, timer: null };
  function aoVivoAtualizar(forcar) {
    if (!remote.on || !localState.adminKey) return;
    var antes = JSON.stringify([adminRes.dados && adminRes.dados.total, adminBancaDados.itens, adminBancaDados.decisao]);
    var p1 = sbRpc('resultado', { p_chave: localState.adminKey }).then(function (r) { if (r && r.liberado) { adminRes.dados = r; adminRes.quando = Date.now(); } }).catch(function () {});
    var p2 = sbRpc('avaliacoes_banca', { p_chave: localState.adminKey }).then(function (r) { if (r && r.ok) { adminBancaDados.itens = r.itens || []; adminBancaDados.decisao = r.decisao || []; } }).catch(function () {});
    Promise.all([p1, p2]).then(function () {
      modoEv.em = Date.now();
      var depois = JSON.stringify([adminRes.dados && adminRes.dados.total, adminBancaDados.itens, adminBancaDados.decisao]);
      if ((forcar || antes !== depois) && route.name === 'admin' && admin.tab === 'aovivo' && !admin.confirm && !admin.editor) render();
      else { var h = $('#avHora'); if (h) h.textContent = horaCurta(modoEv.em); }
    });
  }
  function horaCurta(t) { return new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  setInterval(function () {
    if (route.name === 'admin' && admin.tab === 'aovivo' && localState.admin && document.visibilityState !== 'hidden') { syncEstado(); aoVivoAtualizar(); }
  }, 8000);

  function avChip(rotulo, ligado, txtOn, txtOff) {
    return '<span class="av-chip' + (ligado ? ' on' : '') + '"><i></i><span>' + esc(rotulo) + ' <b>' + esc(ligado ? txtOn : txtOff) + '</b></span></span>';
  }
  function chaveAvaliacoes() {
    return '<label class="av-vis' + (remote.avaliacoes ? ' on' : '') + '"><input type="checkbox" data-act="toggleAvaliacoes"' + (remote.avaliacoes ? ' checked' : '') + '>' +
      '<span class="cv-trilho" aria-hidden="true"><span></span></span><span><b>' + (remote.avaliacoes ? 'Avaliações da banca abertas' : 'Avaliações da banca fechadas') + '</b>' +
      '<span class="tiny">' + (remote.avaliacoes ? 'Os jurados podem dar e mudar notas.' : 'Os jurados leem os projetos, mas ainda não dão nota.') + '</span></span></label>';
  }
  function definirAvaliacoes(quer) {
    if (!remote.on) { toast('Disponível na versão publicada.'); return; }
    sbRpc('definir_avaliacoes', { p_chave: localState.adminKey || '', p_abertas: !!quer }).then(function (r) {
      if (r && r.ok) { remote.avaliacoes = !!r.abertas; render(); toast(r.abertas ? 'Avaliações da banca abertas.' : 'Avaliações da banca fechadas.'); }
      else { render(); if (!(r && r.erro === 'chave_invalida')) toast('Não consegui mudar agora.'); }
    }).catch(function (e) { render(); toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.'); });
  }
  function adminAoVivo() {
    if (!remote.on) return '<div class="banner"><span class="bi">' + ico('i-info') + '</span><p class="grow"><b>Modo prévia.</b> O modo evento funciona na versão publicada, com o banco ligado.</p></div>';
    if (!modoEv.em) setTimeout(function () { aoVivoAtualizar(true); }, 0);
    var p = palcoAtual(), ant = palcoVizinho(-1), prox = palcoVizinho(1), lista = projetosEmOrdem();
    var pos = p ? lista.indexOf(p) + 1 : 0;
    var figs = p ? (p.heroes || []).filter(function (h) { return h.image; }).slice(0, 2).map(function (h) { return '<img src="' + esc(mini(h.image)) + '" alt="">'; }).join('') : '';
    var opcoes = '<option value="">Escolher equipe…</option>' + lista.map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (p && p.id === x.id ? ' selected' : '') + '>' + esc((x.slot ? x.slot + ' · ' : '') + x.name) + '</option>';
    }).join('');

    // números
    var tot = adminRes.dados && adminRes.dados.liberado ? (adminRes.dados.total || 0) : null;
    var its = (adminBancaDados.itens || []).filter(function (i) { return i.notas && notasQtd(i.notas); });
    var jur = {}; its.forEach(function (i) { jur[i.jurado] = true; });
    var nJ = Object.keys(jur).length;
    var noPalco = p ? its.filter(function (i) { return i.projeto === p.id && notasCompletas(i.notas); }).map(function (i) { return i.jurado; }) : [];
    var faltam = p ? Object.keys(jur).filter(function (j) { return noPalco.indexOf(j) < 0; }) : [];
    var nDec = (adminBancaDados.decisao || []).length;

    var palco = '<section class="av-card av-palco">' +
      '<div class="av-cab"><span class="av-tit">' + ico('i-users') + ' Palco</span>' +
        (p ? '<span class="av-pos num">' + pos + ' de ' + lista.length + '</span>' : '') + '</div>' +
      (p ? '<div class="av-palco-atual">' + (figs ? '<span class="av-figs">' + figs + '</span>' : '') +
            '<div><span class="pc-ao-vivo"><i></i>No palco</span><b class="av-nome">' + esc(p.name) + '</b>' +
            '<span class="tiny">' + esc([p.slot, p.group ? 'Grupo ' + p.group : '', nomesHerois(p)].filter(Boolean).join(' · ')) + '</span></div></div>'
         : '<p class="av-vazio">Ninguém apresentando agora.</p>') +
      '<div class="av-seguir">' + (prox ? 'A seguir: <b>' + esc(prox.name) + '</b>' + (prox.slot ? ' · ' + esc(prox.slot) : '') : (p ? '<b>Última equipe.</b>' : '')) + '</div>' +
      '<div class="av-botoes">' +
        (p ? '<button class="btn btn-outline av-ant" data-act="palcoAnt"' + (ant ? '' : ' disabled') + ' aria-label="Equipe anterior">' + ico('i-arrow-left') + '</button>' : '') +
        '<button class="btn btn-primary btn-lg av-prox" data-act="palcoProx"' + (p && !prox ? ' disabled' : '') + '>' +
          (p ? 'Próxima equipe' : 'Começar: ' + esc((lista[0] || {}).name || '')) + ' ' + ico('i-chev') + '</button>' +
      '</div>' +
      '<div class="av-linha"><select data-act="palcoEscolher" aria-label="Escolher a equipe no palco">' + opcoes + '</select>' +
        (p ? '<button class="btn btn-ghost btn-sm" data-act="palcoLimpar">Encerrar</button>' : '') + '</div>' +
      '</section>';

    var votacao = '<section class="av-card">' +
      '<div class="av-cab"><span class="av-tit">' + ico('i-vote') + ' Votação do público</span>' + avChip('', remote.aberta, 'Aberta', 'Fechada') + '</div>' +
      '<div class="av-num"><b class="num">' + (tot == null ? '—' : tot) + '</b><span>' + (tot === 1 ? 'voto' : 'votos') + '</span></div>' +
      (remote.aberta
        ? '<button class="btn btn-danger btn-block btn-lg" data-act="askClose">Encerrar a votação</button>'
        : '<button class="btn btn-laranja btn-block btn-lg" data-act="askOpen">' + ico('i-vote') + ' Abrir a votação</button>') +
      (!remote.aberta ? '<label class="av-vis' + (remote.visivel ? ' on' : '') + '"><input type="checkbox" data-act="toggleVisivelAv"' + (remote.visivel ? ' checked' : '') + '>' +
        '<span class="cv-trilho" aria-hidden="true"><span></span></span><span><b>' + (remote.visivel ? 'Aba Votação visível no site' : 'Aba Votação escondida do site') + '</b>' +
        '<span class="tiny">' + (remote.visivel ? 'O público vê a aba (com a votação fechada).' : 'Abrir a votação mostra a aba de novo.') + '</span></span></label>' : '') +
      '</section>';

    var bancaC = '<section class="av-card">' +
      '<div class="av-cab"><span class="av-tit">' + ico('i-users') + ' Banca</span>' + avChip('Decisão', remote.decisao, 'aberta', 'fechada') + '</div>' +
      chaveAvaliacoes() +
      '<div class="av-duplo">' +
        '<div class="av-num"><b class="num">' + nJ + '</b><span>' + (nJ === 1 ? 'jurado ativo' : 'jurados ativos') + '</span></div>' +
        (p ? '<div class="av-num"><b class="num">' + noPalco.length + '<small>/' + nJ + '</small></b><span>avaliaram a equipe no palco</span></div>' : '') +
      '</div>' +
      (p && faltam.length ? '<p class="tiny av-obs">Falta' + (faltam.length > 1 ? 'm' : '') + ': ' + faltam.map(esc).join(', ') + '</p>' : '') +
      (remote.decisao ? '<p class="small"><b>' + nDec + ' de ' + nJ + '</b> jurados já votaram na decisão final.</p>' : '') +
      '<button class="btn ' + (remote.decisao ? 'btn-outline' : 'btn-laranja') + ' btn-block btn-lg" data-act="decisaoAbrir" data-v="' + (remote.decisao ? '0' : '1') + '">' +
        (remote.decisao ? 'Encerrar a decisão final' : 'Abrir a decisão final') + '</button>' +
      '</section>';

    // pendências da banca: quem ainda não avaliou cada equipe (e quem falta na decisão)
    var jurList = Object.keys(jur).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    var pendC = '';
    if (nJ) {
      var linhasP = lista.map(function (x, i) {
        var feitos = its.filter(function (it) { return it.projeto === x.id && notasCompletas(it.notas); }).map(function (it) { return it.jurado; });
        var falta = jurList.filter(function (j) { return feitos.indexOf(j) < 0; });
        var passou = pos ? i < pos - 1 : false, agora = p && p.id === x.id;
        var st = !falta.length ? 'ok' : (passou ? 'atraso' : agora ? 'agora' : 'futuro');
        return '<li class="avp-' + st + '"><span class="avp-n num">' + (i + 1) + '</span>' +
          '<div class="avp-txt"><b>' + esc(x.name) + (agora ? ' <span class="avp-tag">no palco</span>' : '') + '</b>' +
          (falta.length ? '<span>' + (st === 'futuro' ? 'Ainda não apresentou' : 'Falta' + (falta.length > 1 ? 'm' : '') + ': ' + falta.map(esc).join(', ')) + '</span>' : '<span>Todos avaliaram</span>') + '</div>' +
          '<span class="avp-cont num">' + feitos.length + '/' + nJ + '</span></li>';
      }).join('');
      var atrasos = lista.filter(function (x, i) {
        if (!(pos ? i < pos - 1 : false)) return false;
        var f = its.filter(function (it) { return it.projeto === x.id && notasCompletas(it.notas); }).length;
        return f < nJ;
      }).length;
      var decJ = (adminBancaDados.decisao || []).map(function (d) { return d.jurado; });
      var faltaDec = jurList.filter(function (j) { return decJ.indexOf(j) < 0; });
      pendC = '<section class="av-card av-pend">' +
        '<div class="av-cab"><span class="av-tit">' + ico('i-users') + ' Pendências da banca</span>' + avChip('', !atrasos, 'em dia', atrasos + ' atrasada' + (atrasos > 1 ? 's' : '')) + '</div>' +
        '<p class="tiny" style="margin:0">Quem já avaliou alguma equipe entra na lista de jurados (' + jurList.map(esc).join(', ') + '). Em laranja: equipes que já passaram pelo palco e ainda têm nota faltando.</p>' +
        (remote.decisao ? '<p class="small av-obs">' + (faltaDec.length ? '<b>Decisão final:</b> falta' + (faltaDec.length > 1 ? 'm' : '') + ' ' + faltaDec.map(esc).join(', ') + '.' : '<b>Decisão final:</b> todos os jurados já votaram.') + '</p>' : '') +
        '<ul class="avp-lista">' + linhasP + '</ul></section>';
    }

    var telaoC = '<section class="av-card">' +
      '<div class="av-cab"><span class="av-tit">' + ico('i-eye') + ' Telão</span>' + avChip('', remote.revelar || remote.revelarBanca, 'Revelando', 'Votação') + '</div>' +
      ((remote.revelar || remote.revelarBanca)
        ? '<p class="small av-obs"><b>' + (remote.revelarBanca ? 'Revelando o Projeto destaque (banca).' : 'Revelando o Herói da Trilha (público).') + '</b></p>' +
          '<button class="btn btn-outline btn-block btn-lg" data-act="desrevelar">Voltar o telão para a votação</button>'
        : '<button class="btn btn-primary btn-block btn-lg" data-act="askRevelar">' + ico('i-spark') + ' Revelar o Herói (público)</button>' +
          '<button class="btn btn-laranja btn-block btn-lg" data-act="askRevelarBanca">' + ico('i-spark') + ' Revelar o Projeto destaque (banca)</button>') +
      (remote.aberta && !remote.revelar ? '<p class="tiny av-obs">Dica: encerre a votação antes de revelar o Herói.</p>' : '') +
      (remote.decisao && !remote.revelarBanca ? '<p class="tiny av-obs">Dica: encerre a decisão final antes de revelar o Projeto destaque.</p>' : '') +
      (remote.pausa ? '<button class="btn btn-block ctl-pausa on" data-act="pausaOff">■ Sair do modo pausa</button>' : '<button class="btn btn-block ctl-pausa" data-act="pausaOn">❚❚ Modo pausa · fotos da Trilha</button>') +
      '<a class="btn btn-outline btn-block" href="#/controle">Controle da apresentação</a>' +
      '<div class="av-linha"><a class="btn btn-ghost btn-sm" href="#/telao" target="_blank" rel="noopener">Abrir o telão</a>' +
        '<a class="btn btn-ghost btn-sm" href="#/mesa/entrar" target="_blank" rel="noopener">QR de login</a>' +
        '<a class="btn btn-ghost btn-sm" href="#/mesa" target="_blank" rel="noopener">QR da banca</a>' +
        '<a class="btn btn-ghost btn-sm" href="#/mesa/decisao" target="_blank" rel="noopener">QR da decisão</a></div>' +
      '</section>';

    return '<div class="aovivo">' +
      '<div class="av-topo"><div><h2 class="h2">Ao vivo</h2><p class="tiny">Atualiza sozinho a cada 8 s · <span id="avHora">' + (modoEv.em ? horaCurta(modoEv.em) : '—') + '</span></p></div>' +
        '<button class="btn btn-outline btn-sm" data-act="aoVivoAtualizar">Atualizar</button></div>' +
      palco + votacao + bancaC + pendC + telaoC +
      '<section class="av-card av-zerar"><div class="av-cab"><span class="av-tit">' + ico('i-trash') + ' Preparar para o evento</span></div>' +
        '<p class="small" style="margin:0">Depois do ensaio: apaga votos, notas e decisão da banca, limpa os projetos conhecidos, fecha votação, avaliações e decisão, e tira a apresentação, a pausa e o palco do telão. Textos, fotos, senhas e candidatos continuam.</p>' +
        '<button class="btn btn-danger btn-block btn-lg" data-act="askZerarTudo">' + ico('i-trash') + ' Zerar tudo</button></section>' +
      '</div>';
  }

  /* ===================== PLANILHAS FORMATADAS (.xlsx) =====================
     Gera um arquivo do Excel de verdade, com cores, larguras, cabeçalho
     fixo e filtro, direto no navegador (sem biblioteca externa). Abre no
     Excel, no Google Planilhas e no Numbers.                              */
  var XL = (function () {
    // estilos: [fonte, preenchimento, borda, formato numérico, alinhamento]
    var FONTES = [
      '<font><sz val="11"/><color rgb="FF241338"/><name val="Calibri"/></font>',
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
      '<font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
      '<font><i/><sz val="10"/><color rgb="FF574A6B"/><name val="Calibri"/></font>',
      '<font><b/><sz val="11"/><color rgb="FF2E006A"/><name val="Calibri"/></font>',
      '<font><b/><sz val="13"/><color rgb="FF2E006A"/><name val="Calibri"/></font>',
      '<font><b/><sz val="11"/><color rgb="FF9A3D06"/><name val="Calibri"/></font>'
    ];
    function fill(c) { return '<fill><patternFill patternType="solid"><fgColor rgb="FF' + c + '"/><bgColor indexed="64"/></patternFill></fill>'; }
    var PREENCH = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>',
      fill('2E006A'), fill('44108C'), fill('F6F2FC'), fill('FFE6D3'), fill('F97218'), fill('E8DBF7'), fill('FFFFFF')];
    var BORDAS = ['<border><left/><right/><top/><bottom/><diagonal/></border>',
      '<border><left style="thin"><color rgb="FFE0D2F3"/></left><right style="thin"><color rgb="FFE0D2F3"/></right><top style="thin"><color rgb="FFE0D2F3"/></top><bottom style="thin"><color rgb="FFE0D2F3"/></bottom><diagonal/></border>'];
    var FMT = { int: 1, n2: 164, pct: 165, n1: 166 };
    var estilos = [[0, 0, 0, 0, '']], mapa = {};
    function est(fonte, preench, borda, fmt, alin) {
      var k = [fonte, preench, borda, fmt, alin].join('|');
      if (mapa[k] == null) { mapa[k] = estilos.length; estilos.push([fonte, preench, borda, fmt, alin]); }
      return mapa[k];
    }
    // tipos de célula usados nas planilhas
    function estilo(tipo, linha) {
      var zebra = linha === 'z', topo = linha === 'top';
      var pf = topo ? 5 : (zebra ? 4 : 8), ft = topo ? 6 : 0;
      switch (tipo) {
        case 'titulo': return est(2, 2, 0, 0, 'left');
        case 'sub': return est(3, 7, 0, 0, 'left');
        case 'cab': return est(1, 3, 1, 0, 'cwrap');
        case 'secao': return est(5, 0, 0, 0, 'left');
        case 'total': return est(1, 6, 1, 0, 'left');
        case 'totalNum': return est(1, 6, 1, FMT.int, 'center');
        case 'totalPct': return est(1, 6, 1, FMT.pct, 'center');
        case 'pos': return est(topo ? 6 : 4, pf, 1, FMT.int, 'center');
        case 'int': return est(ft, pf, 1, FMT.int, 'center');
        case 'n2': return est(ft, pf, 1, FMT.n2, 'center');
        case 'n1': return est(ft, pf, 1, FMT.n1, 'center');
        case 'pct': return est(ft, pf, 1, FMT.pct, 'center');
        case 'forte': return est(topo ? 6 : 4, pf, 1, 0, 'left');
        case 'longo': return est(ft, pf, 1, 0, 'wrap');
        default: return est(ft, pf, 1, 0, 'left');
      }
    }
    function escX(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); }
    function colLetra(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
    function folhaXml(f) {
      var linhasXml = f.linhas.map(function (lin, r) {
        var alt = lin.alt ? ' ht="' + lin.alt + '" customHeight="1"' : '';
        return '<row r="' + (r + 1) + '"' + alt + '>' + (lin.c || []).map(function (c, k) {
          if (c == null) return '';
          var ref = colLetra(k) + (r + 1), s = c.s != null ? ' s="' + c.s + '"' : '';
          if (c.v === '' || c.v == null) return '<c r="' + ref + '"' + s + '/>';
          if (typeof c.v === 'number' && isFinite(c.v)) return '<c r="' + ref + '"' + s + '><v>' + c.v + '</v></c>';
          return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + escX(c.v) + '</t></is></c>';
        }).join('') + '</row>';
      }).join('');
      var vista = f.fixa ? '<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="' + f.fixa + '" topLeftCell="A' + (f.fixa + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
                         : '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>';
      var cols = '<cols>' + f.larguras.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
      var merges = (f.juntar || []).length ? '<mergeCells count="' + f.juntar.length + '">' + f.juntar.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>' : '';
      var filtro = f.filtro ? '<autoFilter ref="' + f.filtro + '"/>' : '';
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' + vista + '<sheetFormatPr defaultRowHeight="18"/>' + cols + '<sheetData>' + linhasXml + '</sheetData>' + filtro + merges +
        '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
    }
    function estilosXml() {
      var xfs = estilos.map(function (e) {
        var al = e[4] === 'wrap' ? '<alignment vertical="top" wrapText="1"/>' : e[4] === 'cwrap' ? '<alignment horizontal="center" vertical="center" wrapText="1"/>' : e[4] ? '<alignment horizontal="' + e[4] + '" vertical="center"/>' : '';
        return '<xf numFmtId="' + e[3] + '" fontId="' + e[0] + '" fillId="' + e[1] + '" borderId="' + e[2] + '" xfId="0"' +
          (e[3] ? ' applyNumberFormat="1"' : '') + ' applyFont="1" applyFill="1" applyBorder="1"' + (al ? ' applyAlignment="1">' + al + '</xf>' : '/>');
      }).join('');
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<numFmts count="3"><numFmt numFmtId="164" formatCode="0.00"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="0.0"/></numFmts>' +
        '<fonts count="' + FONTES.length + '">' + FONTES.join('') + '</fonts>' +
        '<fills count="' + PREENCH.length + '">' + PREENCH.join('') + '</fills>' +
        '<borders count="' + BORDAS.length + '">' + BORDAS.join('') + '</borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="' + estilos.length + '">' + xfs + '</cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    }
    // zip simples (sem compressão), suficiente para o .xlsx
    var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
    function zip(arquivos) {
      var enc = new TextEncoder(), partes = [], central = [], pos = 0;
      function u16(v) { return [v & 255, (v >>> 8) & 255]; }
      function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
      arquivos.forEach(function (a) {
        var nome = enc.encode(a[0]), dados = enc.encode(a[1]), crc = crc32(dados);
        var loc = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dados.length), u32(dados.length), u16(nome.length), u16(0));
        partes.push(new Uint8Array(loc), nome, dados);
        central.push([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(dados.length), u32(dados.length),
          u16(nome.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(pos)), nome);
        pos += loc.length + nome.length + dados.length;
      });
      var ini = pos, tam = 0, cent = [];
      for (var i = 0; i < central.length; i += 2) { var h = new Uint8Array(central[i]); cent.push(h, central[i + 1]); tam += h.length + central[i + 1].length; }
      var fim = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(arquivos.length), u16(arquivos.length), u32(tam), u32(ini), u16(0)));
      return new Blob(partes.concat(cent, [fim]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    function livro(folhas) {
      var xmls = folhas.map(folhaXml);   // gera as folhas antes: registra os estilos usados
      var arq = [
        ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          folhas.map(function (f, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>'],
        ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
        ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
          folhas.map(function (f, i) { return '<sheet name="' + escX(f.nome.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
          (folhas.some(function (f) { return f.filtro; }) ? '<definedNames>' + folhas.map(function (f, i) {
            if (!f.filtro) return '';
            var p = f.filtro.split(':'), abs = function (r) { return r.replace(/^([A-Z]+)(\d+)$/, '$$$1$$$2'); };
            return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + escX(f.nome.slice(0, 31)) + '\'!' + abs(p[0]) + ':' + abs(p[1]) + '</definedName>';
          }).join('') + '</definedNames>' : '') + '</workbook>'],
        ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          folhas.map(function (f, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
          '<Relationship Id="rId' + (folhas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']
      ];
      xmls.forEach(function (x, i) { arq.push(['xl/worksheets/sheet' + (i + 1) + '.xml', x]); });
      arq.push(['xl/styles.xml', estilosXml()]);
      return zip(arq);
    }
    /* monta uma folha padrão: título, subtítulo, cabeçalho e linhas.
       colunas: [{t: 'Título', w: 20, tipo: 'texto|int|n2|pct|forte|longo|pos'}] */
    function folha(nome, titulo, sub, colunas, dados, opc) {
      opc = opc || {};
      var n = colunas.length, ult = colLetra(n - 1);
      var linhas = [
        { alt: 34, c: [{ v: titulo, s: estilo('titulo') }].concat(colunas.slice(1).map(function () { return { v: '', s: estilo('titulo') }; })) },
        { alt: 20, c: [{ v: sub, s: estilo('sub') }].concat(colunas.slice(1).map(function () { return { v: '', s: estilo('sub') }; })) },
        { alt: 6, c: [] },
        { alt: 36, c: colunas.map(function (c) { return { v: c.t, s: estilo('cab') }; }) }
      ];
      dados.forEach(function (lin, i) {
        var tipoLinha = (opc.destacar && opc.destacar(lin, i)) ? 'top' : (i % 2 ? 'z' : '');
        linhas.push({ c: lin.map(function (v, k) { return { v: v, s: estilo(colunas[k].tipo || 'texto', tipoLinha) }; }) });
      });
      (opc.rodape || []).forEach(function (lin) { linhas.push(lin); });
      return { nome: nome, linhas: linhas, larguras: colunas.map(function (c) { return c.w || 14; }),
        juntar: ['A1:' + ult + '1', 'A2:' + ult + '2'], fixa: 4,
        filtro: dados.length ? 'A4:' + ult + (4 + dados.length) : null };
    }
    function baixar(nome, folhas) {
      try {
        var blob = livro(folhas), url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = nome; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
        toast('Planilha baixada.');
      } catch (e) { toast('Não consegui gerar a planilha neste navegador.'); }
    }
    return { folha: folha, baixar: baixar, estilo: estilo, livro: livro };
  })();
  function agoraBR() { return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }); }

  /* ===================== DOWNLOAD DE PLANILHAS (CSV) =====================
     Baixa direto no navegador. Separador ";" e acentos que o Excel lê bem. */
  function baixarArquivo(nome, texto, mime) {
    try {
      var blob = new Blob(['﻿' + texto], { type: (mime || 'text/csv') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast('Planilha baixada.');
    } catch (e) { offerFile(nome, texto, mime); }
  }
  function csv(v) { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  /* ===================== REVELAÇÃO DO HERÓI NO TELÃO =====================
     Só o telão revela. Ele precisa estar com o painel aberto neste computador
     (para ler a apuração); os celulares nunca mostram números.             */
  function blocoRevelacao() {
    if (!remote.on) return '';
    return '<div class="revelar-box">' +
      '<div><b>Revelação do Herói</b><p class="tiny">' + (remote.revelar
        ? 'O telão está mostrando o Herói vencedor. Os celulares continuam sem o resultado.'
        : 'Mostra o vencedor só no telão, com animação. O telão precisa estar com o painel aberto. Os celulares não mostram o resultado.') + '</p></div>' +
      (remote.revelar
        ? '<button class="btn btn-outline btn-sm" data-act="desrevelar">Voltar o telão para a votação</button>'
        : '<button class="btn btn-primary btn-sm" data-act="askRevelar">' + ico('i-spark') + ' Revelar no telão</button>') +
      '</div>' +
      '<div class="revelar-box revelar-site">' +
      '<div><b>Vencedores no site</b><p class="tiny">' + (remote.resultadoPublico
        ? 'O Início e a página Resultado mostram o Herói do público e o Projeto destaque da banca (sem números).'
        : 'Depois da revelação, ligue para o site mostrar o Herói do público e o Projeto destaque da banca. Ninguém vê números de votos nem notas.') + '</p></div>' +
      '<button class="btn ' + (remote.resultadoPublico ? 'btn-outline' : 'btn-primary') + ' btn-sm" data-act="pubResult">' + (remote.resultadoPublico ? 'Tirar do site' : 'Mostrar no site') + '</button>' +
      '</div>';
  }
  function setRevelacao(v) {
    if (!remote.on) return;
    sbRpc('definir_revelacao', { p_chave: localState.adminKey || '', p_revelar: !!v }).then(function (r) {
      if (r && r.ok) { remote.revelar = !!v; telao.revelInicio = v ? Date.now() : 0; telao.vencedores = null; render(); toast(v ? 'O telão está revelando o Herói.' : 'O telão voltou para a votação.'); }
      else if (!(r && r.erro === 'chave_invalida')) toast('Não consegui atualizar.');
    }).catch(function (e) { toast(String(e && e.message) === 'http 404' ? 'O banco ainda não tem essa opção. Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.'); });
  }
  /* ===================== CENA DE REVELAÇÃO (telão) =====================
     Suspense de 6,5 s (núcleo de luz crescendo, sementes girando cada vez
     mais rápido, contagem 3-2-1) e a revelação: clarão, ondas de choque,
     raios de luz girando, o vencedor surgindo, nome letra a letra, canhões
     de confete e brilhos. Os tempos usam o relógio da revelação, então um
     redesenho no meio não recomeça a animação.                            */
  var REVELA_MS = 6500;
  function cenaRevelacao(o) {
    var passou = Math.max(0, Date.now() - (telao.revelInicio || Date.now()));
    somRevelacao(o.tema, telao.revelInicio);
    var tema = o.tema === 'banca' ? ' rv-banca' : '';
    if (passou < REVELA_MS || o.itens == null) {
      if (!telao.revelTimer) telao.revelTimer = setTimeout(function () { telao.revelTimer = null; if (route.name === 'telao') render(); }, Math.max(300, REVELA_MS - passou + 50));
      return '<div class="telao tl-revela rv rv-suspense' + tema + '" style="--t0:-' + passou + 'ms">' + telaoFundo() +
        '<span class="rv-vinheta" aria-hidden="true"></span>' +
        '<span class="rv-nucleo" aria-hidden="true"></span>' +
        '<div class="rv-orbita" aria-hidden="true">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { return '<span style="--k:' + k + '">' + sementeSvg() + '</span>'; }).join('') + '</div>' +
        '<div class="tr-centro rv-susp-txt"><span class="tr-eyebrow">' + esc(o.eyebrowS) + '</span>' +
          '<h1 class="tr-chamada">' + esc(o.chamada) + '</h1></div>' +
        '<div class="rv-conta" aria-hidden="true"><b style="--n:0">3</b><b style="--n:1">2</b><b style="--n:2">1</b></div>' +
        '</div>';
    }
    var t1 = Math.min(passou - REVELA_MS, 60000);
    var cores = o.tema === 'banca' ? ['#ffffff', '#2e006a', '#ffd2ad', '#b98fe8', '#ffe066'] : ['#f97218', '#ffffff', '#e8dbf7', '#ffd166', '#b98fe8'];
    var canhoes = '';
    for (var i = 0; i < 90; i++) {
      var lado = i % 2 ? 1 : -1, ang = 0.25 + ((i * 37) % 50) / 100;
      canhoes += '<i class="rv-pc" style="--lado:' + lado + ';--tx:' + (lado * (18 + ((i * 53) % 46))).toFixed(0) + 'vw;--ty:-' + (55 + ((i * 29) % 40)) + 'vh;--fy:' + (8 + (i % 5) * 4) + 'vh;--r:' + ((i * 71) % 360) + 'deg;--dl:' + ((i % 9) * 35) + 'ms;--cor:' + cores[i % cores.length] + ';--w:' + (0.8 + (i % 3) * .35).toFixed(2) + 'vh;--s:' + ang.toFixed(2) + '"></i>';
    }
    var chuva = '';
    for (var c = 0; c < 40; c++) {
      chuva += '<span class="tr-c" style="--x:' + ((c * 37) % 100) + '%;--d:' + (3.2 + (c % 7) * .5).toFixed(2) + 's;--a:' + (1.4 + (c * .23) % 3).toFixed(2) + 's;--r:' + ((c * 47) % 360) + 'deg;--cor:' + cores[c % cores.length] + '"></span>';
    }
    var brilhos = '';
    for (var b = 0; b < 18; b++) {
      brilhos += '<i class="rv-brilho" style="--x:' + (8 + (b * 47) % 84) + '%;--y:' + (8 + (b * 31) % 70) + '%;--dl:' + (900 + (b * 173) % 2200) + 'ms;--sz:' + (1.4 + (b % 4) * .6).toFixed(1) + 'vh"></i>';
    }
    function letras(txt, base) {
      return String(txt).split('').map(function (ch, k) {
        return ch === ' ' ? '<span class="rv-l rv-esp"> </span>' : '<span class="rv-l" style="--i:' + (base + k) + '">' + esc(ch) + '</span>';
      }).join('');
    }
    return '<div class="telao tl-revela rv rv-revelado' + tema + '" style="--t1:-' + t1 + 'ms">' + telaoFundo() +
      '<span class="rv-raios" aria-hidden="true"></span>' +
      '<span class="rv-onda" style="--o:0" aria-hidden="true"></span><span class="rv-onda" style="--o:1" aria-hidden="true"></span><span class="rv-onda" style="--o:2" aria-hidden="true"></span>' +
      '<div class="tr-confete" aria-hidden="true">' + chuva + '</div>' +
      '<div class="rv-canhoes" aria-hidden="true">' + canhoes + '</div>' +
      '<div class="rv-brilhos" aria-hidden="true">' + brilhos + '</div>' +
      '<div class="tr-centro rv-centro">' +
        '<span class="tr-eyebrow rv-eyebrow">' + esc(o.itens.length > 1 ? o.eyebrowEmpate : o.eyebrowR) + '</span>' +
        '<div class="rv-vencedores n' + o.itens.length + '">' + o.itens.map(function (it, n) {
          var off = n * 6;
          return '<figure class="rv-v" style="--v:' + n + '">' +
            '<span class="rv-figs"><span class="rv-halo" aria-hidden="true"></span>' + (it.imgs || []).map(function (src) { return '<img src="' + esc(src) + '" alt="">'; }).join('') + '</span>' +
            '<figcaption><b class="rv-nome" aria-label="' + esc(it.nome) + '">' + letras(it.nome, off) + '</b>' +
            (it.sub ? '<span class="rv-sub">' + esc(it.sub) + '</span>' : '') + '</figcaption></figure>';
        }).join('') + '</div>' +
      '</div>' +
      '<span class="rv-flash" aria-hidden="true"></span>' +
      '</div>';
  }
  /* ======================= SOM DA REVELAÇÃO (telão) =======================
     Tudo gerado aqui mesmo (Web Audio), sem arquivo de áudio: rufar de tambor
     crescendo, "tum" na contagem 3-2-1, explosão + prato no clarão, fanfarra,
     estouros dos canhões de confete e brilhinhos. O navegador só deixa tocar
     depois de um clique na página, por isso o telão mostra "Ativar som".   */
  var som = { ctx: null, master: null, ruido: null, vol: 0.8, agendado: '', fontes: [], arq: {}, arqPedido: false, pref: true };
  try { som.pref = localStorage.getItem('idl.som.on') !== '0'; } catch (e) { /* sem storage: ligado */ }
  try { var vSalvo = parseFloat(localStorage.getItem('idl.som.vol')); if (vSalvo >= 0 && vSalvo <= 1) som.vol = vSalvo; } catch (e) { /* sem storage */ }
  function somAtivo() { return !!(som.ctx && som.ctx.state === 'running'); }
  function somIniciar() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast('Este navegador não toca som gerado.'); return false; }
    if (!som.ctx) {
      som.ctx = new AC();
      var comp = som.ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.25;
      som.master = som.ctx.createGain(); som.master.gain.value = som.vol;
      var saida = som.ctx.createGain(); saida.gain.value = 0.7;   // folga para não distorcer na caixa de som
      som.master.connect(comp); comp.connect(saida); saida.connect(som.ctx.destination);
      var n = som.ctx.sampleRate * 2, buf = som.ctx.createBuffer(1, n, som.ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      som.ruido = buf;
      som.ctx.onstatechange = function () {
        somPainelDesenhar();
        if (somAtivo() && route.name === 'telao' && (remote.revelar || remote.revelarBanca)) somRevelacao(remote.revelarBanca ? 'banca' : 'heroi', telao.revelInicio);
      };
    }
    if (som.ctx.state !== 'running') som.ctx.resume();
    somCarregarArquivos();
    return true;
  }
  // sons próprios opcionais: audio/suspense.mp3 (até 6,5 s) e audio/comemoracao.mp3
  function somCarregarArquivos() {
    if (som.arqPedido || !som.ctx) return; som.arqPedido = true;
    ['suspense', 'comemoracao'].forEach(function (nome) {
      fetch('audio/' + nome + '.mp3', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, erro) { som.ctx.decodeAudioData(ab, ok, erro); }); })
        .then(function (buf) { som.arq[nome] = buf; somPainelDesenhar(true); })
        .catch(function () { /* sem arquivo: usa o som gerado */ });
    });
  }
  function somVolume(v) {
    som.vol = Math.max(0, Math.min(1, v));
    if (som.master) som.master.gain.setTargetAtTime(som.vol, som.ctx.currentTime, 0.05);
    try { localStorage.setItem('idl.som.vol', String(som.vol)); } catch (e) { /* sem storage */ }
  }
  function somParar() {
    som.fontes.forEach(function (f) { try { f.stop(); } catch (e) { /* já parou */ } });
    som.fontes = []; som.agendado = '';
  }
  // --- peças básicas ---
  function sEnv(g, t, pico, ataque, queda) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + queda);
  }
  function sSaida(pan) {
    var g = som.ctx.createGain();
    if (pan && som.ctx.createStereoPanner) { var p = som.ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(som.master); }
    else g.connect(som.master);
    return g;
  }
  function sRuido(t, dur, filtros, pico, ataque, queda, pan) {
    var src = som.ctx.createBufferSource(); src.buffer = som.ruido; src.loop = true;
    var no = src;
    filtros.forEach(function (f) { var bq = som.ctx.createBiquadFilter(); bq.type = f[0]; bq.frequency.setValueAtTime(f[1], t); if (f[2]) bq.frequency.exponentialRampToValueAtTime(f[2], t + dur); if (f[3]) bq.Q.value = f[3]; no.connect(bq); no = bq; });
    var g = sSaida(pan); no.connect(g); sEnv(g, t, pico, ataque, queda);
    src.start(t, Math.random()); src.stop(t + ataque + queda + 0.05); som.fontes.push(src);
  }
  function sTom(t, tipo, f0, f1, pico, ataque, queda, pan) {
    var o = som.ctx.createOscillator(); o.type = tipo;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + ataque + queda);
    var g = sSaida(pan); o.connect(g); sEnv(g, t, pico, ataque, queda);
    o.start(t); o.stop(t + ataque + queda + 0.05); som.fontes.push(o);
  }
  function sCaixa(t, forca) {   // toque de caixa (rufar)
    sRuido(t, 0.12, [['highpass', 900], ['bandpass', 2400, 0, 0.8]], 1.1 * forca, 0.002, 0.11, (Math.random() - .5) * .3);
    sTom(t, 'triangle', 210, 160, 0.32 * forca, 0.002, 0.07);
  }
  function sTum(t, forca) {     // bumbo grave da contagem
    sTom(t, 'sine', 130, 42, 1.0 * forca, 0.004, 0.55);
    sRuido(t, 0.05, [['lowpass', 1800]], 0.25 * forca, 0.001, 0.04);
  }
  function sPrato(t) {          // prato de ataque (só ruído, sem "bip")
    sRuido(t, 3.2, [['highpass', 4200], ['peaking', 8000, 0, 1]], 0.5, 0.004, 3.0);
    sRuido(t, 1.2, [['bandpass', 3000, 1800, 0.7]], 0.18, 0.003, 1.1);
  }
  function sTimpano(t, forca) { // tímpano de orquestra (grave, sem "jogo")
    sTom(t, 'sine', 98, 82, 0.55 * forca, 0.006, 0.9);
    sTom(t, 'sine', 147, 130, 0.18 * forca, 0.006, 0.6);
    sRuido(t, 0.08, [['lowpass', 900]], 0.18 * forca, 0.002, 0.07);
  }
  // aplausos: muitas palmas curtinhas, cada uma num ponto da plateia
  function sAplausos(t, dur, forca) {
    var n = Math.round(dur * 70);
    for (var i = 0; i < n; i++) {
      var x = Math.random(), tt = t + x * dur;
      var env = Math.min(1, x * dur / 0.5) * Math.min(1, (1 - x) * dur / 1.6);   // entra em 0,5 s, sai em 1,6 s
      if (env < 0.05) continue;
      sRuido(tt, 0.03, [['highpass', 600], ['bandpass', 900 + Math.random() * 1900, 0, 1.4]], (0.42 + Math.random() * 0.3) * env * forca, 0.001, 0.02 + Math.random() * 0.025, Math.random() * 1.6 - 0.8);
    }
  }
  // "uhuu" da plateia: um véu de vozes (ruído com formantes) que sobe e desce
  function sTorcida(t, dur) {
    [[520, 0.22, -0.5], [880, 0.15, 0.5], [1250, 0.08, 0]].forEach(function (f) {
      var src = som.ctx.createBufferSource(); src.buffer = som.ruido; src.loop = true;
      var bp = som.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(f[0] * 0.8, t); bp.frequency.linearRampToValueAtTime(f[0] * 1.15, t + 0.6); bp.frequency.linearRampToValueAtTime(f[0], t + dur);
      var g = sSaida(f[2]); src.connect(bp); bp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(f[1], t + 0.35);
      g.gain.setValueAtTime(f[1], t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t, Math.random()); src.stop(t + dur + 0.05); som.fontes.push(src);
    });
  }
  // acorde quente de cordas (seno + triângulo com ataque lento), bem baixinho
  function sCordas(t, tema, dur) {
    var base = tema === 'banca' ? 146.83 : 130.81;
    [1, 1.5, 2, 2.5, 3].forEach(function (m, i) {
      [-7, 7].forEach(function (det) {
        var o = som.ctx.createOscillator(); o.type = i < 2 ? 'triangle' : 'sine'; o.frequency.value = base * m; o.detune.value = det;
        var lp = som.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
        var g = sSaida(det < 0 ? -0.3 : 0.3); o.connect(lp); lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.9);
        g.gain.setValueAtTime(0.05, t + dur - 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + 0.05); som.fontes.push(o);
      });
    });
  }
  function sExplosao(t) {
    sTom(t, 'sine', 95, 28, 0.95, 0.005, 1.6);
    sRuido(t, 1.4, [['lowpass', 2600, 180]], 0.9, 0.004, 1.3);
    sPrato(t + 0.01);
  }
  function sSubida(t, dur) {     // "whoosh" subindo até o clarão
    sRuido(t, dur, [['bandpass', 300, 5200, 2.5]], 0.35, dur * 0.9, 0.15);
  }
  function sFanfarra(t, tema) {
    var base = tema === 'banca' ? 293.66 : 261.63;               // Ré maior para a banca, Dó maior para o Herói
    var r = [1, 1.25, 1.5, 2];
    r.forEach(function (m, i) { sMetal(t + i * 0.11, base * m, 0.32, 0.5); });
    [1, 1.25, 1.5, 2, 2.5].forEach(function (m) { sMetal(t + 0.5, base * m, 0.22, 2.4); });
  }
  function sMetal(t, f, pico, queda) {  // nota de "metais": serrote com filtro abrindo
    [-6, 6].forEach(function (det) {
      var o = som.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      var lp = som.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.12); lp.frequency.exponentialRampToValueAtTime(1400, t + queda);
      var g = sSaida(det < 0 ? -0.25 : 0.25); o.connect(lp); lp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico / 2, t + 0.04);
      g.gain.setValueAtTime(pico / 2, t + Math.max(0.05, queda - 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + queda);
      o.start(t); o.stop(t + queda + 0.05); som.fontes.push(o);
    });
  }
  function sEstouros(t) {        // canhões de confete
    for (var i = 0; i < 14; i++) {
      var tt = t + 0.08 + i * 0.045 + Math.random() * 0.06, lado = i % 2 ? 0.8 : -0.8;
      sRuido(tt, 0.08, [['bandpass', 700 + Math.random() * 1400, 0, 1.2]], 0.22, 0.002, 0.07, lado);
    }
  }
  function sBrilhos(t, dur) {
    var notas = [2093, 2637, 3136, 3520, 4186];
    for (var i = 0; i < 16; i++) sTom(t + Math.random() * dur, 'sine', notas[i % notas.length], 0, 0.07, 0.004, 0.45, (Math.random() - .5) * 1.4);
  }
  // trilha completa, alinhada à animação (0 = início do suspense)
  function somRevelacao(tema, inicio) {
    if (!somAtivo() || !inicio) return;
    var chave = tema + ':' + inicio;
    if (som.agendado === chave) return;
    somParar(); som.agendado = chave;
    var passou = (Date.now() - inicio) / 1000, agora = som.ctx.currentTime;
    var T = function (s) { return agora + (s - passou); };       // segundo s da cena → relógio de áudio
    if (passou > 9) return;                                      // chegou tarde: sem som
    var S = REVELA_MS / 1000;                                     // 6,5 s
    // arquivos próprios (pasta audio/): se existirem, entram no lugar do som gerado
    if (som.arq.suspense && passou < S) {
      var a1 = som.ctx.createBufferSource(); a1.buffer = som.arq.suspense; var g1 = sSaida(0); a1.connect(g1);
      g1.gain.setValueAtTime(1, T(Math.max(passou, 0))); g1.gain.setValueAtTime(1, T(S - 0.15)); g1.gain.linearRampToValueAtTime(0.0001, T(S));
      a1.start(T(Math.max(passou, 0)), Math.max(0, passou)); a1.stop(T(S) + 0.05); som.fontes.push(a1);
    } else if (!som.arq.suspense) {
      // rufar de caixa com tímpano por baixo, cada vez mais rápido e forte
      for (var s = 0.4, k = 0; s < S - 0.02; k++) {
        var p = (s - 0.4) / (S - 0.4);
        if (s >= passou) { sCaixa(T(s), 0.2 + p * 0.85); if (k % 3 === 0) sTimpano(T(s), 0.25 + p * 0.6); }
        s += 0.11 - p * 0.075;
      }
      [3.5, 4.5, 5.5].forEach(function (x, i) { if (x >= passou) sTum(T(x), 0.7 + i * 0.15); });
      if (S - 2 >= passou) sSubida(T(S - 2), 2);
    }
    if (S >= passou - 0.2) {
      var r = Math.max(0, passou - S);
      sExplosao(T(S + r));
      if (som.arq.comemoracao) {
        var a2 = som.ctx.createBufferSource(); a2.buffer = som.arq.comemoracao; var g2 = sSaida(0); a2.connect(g2);
        a2.start(T(S + 0.05 + r)); som.fontes.push(a2);
      } else {
        sEstouros(T(S + 0.12 + r));
        sAplausos(T(S + 0.25 + r), 6.5, 1);
        sTorcida(T(S + 0.2 + r), 4.5);
        sCordas(T(S + 0.3 + r), tema, 5.5);
      }
    }
  }
  function somTeste() {
    if (!somIniciar()) return;
    setTimeout(function () {
      var t = som.ctx.currentTime + 0.05;
      somParar();
      for (var i = 0; i < 10; i++) sCaixa(t + i * 0.06, 0.4 + i * 0.05);
      sTum(t + 0.7, 0.9); sExplosao(t + 1.1);
      if (som.arq.comemoracao) { var a = som.ctx.createBufferSource(); a.buffer = som.arq.comemoracao; var g = sSaida(0); a.connect(g); a.start(t + 1.15); a.stop(t + 4.5); som.fontes.push(a); }
      else { sEstouros(t + 1.2); sAplausos(t + 1.3, 3, 1); sTorcida(t + 1.25, 2.6); sCordas(t + 1.3, 'heroi', 3); }
    }, 60);
  }
  /* som SEMPRE LIGADO no telão: ao abrir o telão o site já liga o som. Se o
     navegador ainda bloquear (regra dele até alguém interagir com a página),
     o primeiro clique ou tecla em QUALQUER lugar da tela libera sozinho.  */
  function somAuto() {
    if (!som.pref) return;
    somIniciar();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (route.name !== 'telao' || !som.pref) return;
      if (!som.ctx) somIniciar(); else if (som.ctx.state !== 'running') som.ctx.resume();
    }, true);
  });
  // painel discreto no canto do telão
  function somPainel(mostrar) {
    var el = $('#somPainel');
    if (!mostrar) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'somPainel'; el.className = 'som-painel';
      document.body.appendChild(el);
      somAuto();
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-som]'); if (!b) return;
        var a = b.getAttribute('data-som');
        if (a === 'ativar') { som.pref = true; try { localStorage.setItem('idl.som.on', '1'); } catch (er) { /* sem storage */ } if (somIniciar()) setTimeout(function () { somPainelDesenhar(); if (remote.revelar || remote.revelarBanca) somRevelacao(remote.revelarBanca ? 'banca' : 'heroi', telao.revelInicio); toast('Som da revelação ativado.'); }, 120); }
        else if (a === 'testar') somTeste();
        else if (a === 'desligar') { som.pref = false; try { localStorage.setItem('idl.som.on', '0'); } catch (er) { /* sem storage */ } somParar(); if (som.ctx) som.ctx.suspend(); setTimeout(somPainelDesenhar, 60); }
      });
      el.addEventListener('input', function (e) { if (e.target.id === 'somVol') somVolume(+e.target.value / 100); });
      var parado = null;
      document.addEventListener('mousemove', function () {
        var p = $('#somPainel'); if (!p) return;
        p.classList.add('acordado'); clearTimeout(parado); parado = setTimeout(function () { p.classList.remove('acordado'); }, 3000);
      });
    }
    somPainelDesenhar();
  }
  function somPainelDesenhar() {
    var el = $('#somPainel'); if (!el) return;
    var on = somAtivo();
    var estado = on + '|' + som.pref + '|' + !!som.arq.suspense + '|' + !!som.arq.comemoracao;
    if (el.getAttribute('data-estado') === estado) return;   // não redesenha à toa (o clique não pode "fugir")
    el.setAttribute('data-estado', estado);
    el.classList.toggle('ligado', on);
    el.innerHTML = on
      ? '<span class="sp-ic" aria-hidden="true">♪</span><span class="sp-tx">Som ligado' + ((som.arq.suspense || som.arq.comemoracao) ? ' · arquivos próprios' : '') + '</span>' +
        '<input id="somVol" type="range" min="0" max="100" value="' + Math.round(som.vol * 100) + '" aria-label="Volume da revelação">' +
        '<button data-som="testar">Testar</button><button data-som="desligar" aria-label="Desligar o som">✕</button>'
      : som.pref
        ? '<button class="sp-ativar" data-som="ativar"><span aria-hidden="true">♪</span> Som pronto · clique em qualquer lugar da tela para liberar</button>'
        : '<button class="sp-ativar sp-off" data-som="ativar"><span aria-hidden="true">♪</span> Som desligado · ligar</button>';
  }

  function setRevelacaoBanca(v) {
    if (!remote.on) return;
    sbRpc('definir_revelacao_banca', { p_chave: localState.adminKey || '', p_revelar: !!v }).then(function (r) {
      if (r && r.ok) {
        remote.revelarBanca = !!v; if (v) remote.revelar = false;
        telao.revelInicio = v ? Date.now() : 0; telao.vencBanca = null; render();
        toast(v ? 'O telão está revelando o Projeto destaque.' : 'O telão voltou para a votação.');
      } else if (!(r && r.erro === 'chave_invalida')) toast('Não consegui atualizar.');
    }).catch(function (e) { toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.'); });
  }
  function telaoBuscarVencBanca() {
    if (telao.buscandoBanca || !localState.adminKey) return;
    telao.buscandoBanca = true;
    sbRpc('vencedor_banca', { p_chave: localState.adminKey }).then(function (r) {
      telao.buscandoBanca = false;
      telao.vencBanca = (r && r.ok) ? (r.vencedores || []).map(function (v) { return v.id; }) : [];
      render();
    }).catch(function () { telao.buscandoBanca = false; });
  }
  // revelação do Projeto destaque (prêmio da banca), no laranja da decisão final
  function viewTelaoRevelacaoBanca() {
    if (!localState.adminKey) {
      return '<div class="telao tl-revela tl-banca"><div class="tr-centro"><h1 class="tr-chamada">Projeto destaque</h1>' +
        '<p class="tr-nota">Para revelar aqui, entre como organização neste computador (4 toques na logo, ou #/entrar) e volte para o telão.</p></div></div>';
    }
    if (telao.vencBanca == null) telaoBuscarVencBanca();
    var itens = null;
    if (telao.vencBanca != null) {
      itens = telao.vencBanca.map(byId).filter(Boolean).map(function (p) {
        return { imgs: (p.heroes || []).filter(function (h) { return h.image; }).slice(0, 2).map(function (h) { return h.image; }), nome: p.name,
                 sub: [p.group ? 'Grupo ' + p.group : '', nomesHerois(p)].filter(Boolean).join(' · ') };
      });
      if (!itens.length && Date.now() - (telao.revelInicio || 0) >= REVELA_MS) {
        return '<div class="telao tl-revela tl-banca"><div class="tr-centro"><h1 class="tr-chamada">A banca ainda não votou</h1><p class="tr-nota">A revelação aparece quando houver votos na decisão final.</p></div></div>';
      }
    }
    return cenaRevelacao({ tema: 'banca', itens: itens,
      eyebrowS: 'IDL · Trilha 2026 · Escolha da banca', chamada: 'E o Projeto destaque é…',
      eyebrowR: 'O Projeto destaque da banca é', eyebrowEmpate: 'Empate! Os Projetos destaque são' });
  }
  function telaoBuscarVencedores() {
    if (telao.buscando || !localState.adminKey) return;
    telao.buscando = true;
    sbRpc('resultado', { p_chave: localState.adminKey }).then(function (r) {
      telao.buscando = false;
      if (!r || !r.liberado || !r.projetos) { telao.vencedores = []; render(); return; }
      var max = r.projetos.reduce(function (m, x) { return Math.max(m, +x.votos || 0); }, 0);
      telao.vencedores = max > 0 ? r.projetos.filter(function (x) { return (+x.votos || 0) === max; }).map(function (x) { return x.id; }) : [];
      render();
    }).catch(function () { telao.buscando = false; });
  }
  function viewTelaoRevelacao() {
    if (!localState.adminKey) {
      return '<div class="telao tl-revela"><div class="tr-centro"><h1 class="tr-chamada">Revelação do Herói</h1>' +
        '<p class="tr-nota">Para revelar aqui, entre como organização neste computador (4 toques na logo, ou #/entrar) e volte para o telão.</p></div></div>';
    }
    if (telao.vencedores == null) telaoBuscarVencedores();
    var itens = null;
    if (telao.vencedores != null) {
      itens = telao.vencedores.map(function (id) {
        var x = heroById(id); if (x) return { imgs: x.hero.image ? [x.hero.image] : [], nome: String(x.hero.name).split(/\s+[—–-]\s+/)[0], sub: [x.project.name, x.project.group ? 'Grupo ' + x.project.group : ''].filter(Boolean).join(' · ') };
        var p = byId(id); return p ? { imgs: [], nome: p.name, sub: p.group ? 'Grupo ' + p.group : '' } : null;
      }).filter(Boolean);
      if (!itens.length && Date.now() - (telao.revelInicio || 0) >= REVELA_MS) {
        return '<div class="telao tl-revela"><div class="tr-centro"><h1 class="tr-chamada">Ainda não há votos</h1><p class="tr-nota">A revelação aparece quando houver votos registrados.</p></div></div>';
      }
    }
    return cenaRevelacao({ tema: 'heroi', itens: itens,
      eyebrowS: 'IDL · Trilha 2026 · Voto do público', chamada: 'E o Herói da Trilha 2026 é…',
      eyebrowR: 'O Herói da Trilha 2026 é', eyebrowEmpate: 'Empate! Os Heróis da Trilha 2026 são' });
  }

  /* ================= HERÓI VENCEDOR EM DESTAQUE NO INÍCIO =================
     Quando a organização liga "Herói vencedor no site", o Início ganha um
     primeiro banner com o vencedor (sem números de votos).                 */
  function vencedoresPublicos() {
    if (!remote.on || !remote.resultadoPublico) return [];
    if (!pubRes.dados && !pubRes.carregando && !pubRes.pediu) { pubRes.pediu = true; setTimeout(loadPublicResult, 0); }
    var d = pubRes.dados;
    if (!d || !d.liberado) return [];
    var ids = d.so_vencedor ? (d.vencedores || []).map(function (v) { return v.id; }) : (function () {
      var max = (d.projetos || []).reduce(function (m, x) { return Math.max(m, +x.votos || 0); }, 0);
      return max > 0 ? d.projetos.filter(function (x) { return (+x.votos || 0) === max; }).map(function (x) { return x.id; }) : [];
    })();
    return ids.map(function (id) { return heroById(id); }).filter(Boolean);
  }
  function slideVencedor(ativo) {
    var vs = vencedoresPublicos();
    if (!vs.length) return '';
    var um = vs.length === 1 ? vs[0] : null;
    var bs = ((pubRes.dados && pubRes.dados.banca) || []).map(function (v) { return vencBancaOpcao(v.id); }).filter(Boolean);
    var imgs = vs.map(function (x) { return x.hero.image; });
    bs.forEach(function (o) { if (o.image && imgs.indexOf(o.image) < 0) imgs.push(o.image); });
    return '<section class="faixa fx-escuro dobra dobra-venc car-slide' + (ativo ? ' is-ativo' : '') + '" aria-roledescription="slide">' +
      '<div class="dv-figs" aria-hidden="true">' + imgs.filter(Boolean).map(function (src) { return '<img src="' + esc(src) + '" alt="">'; }).join('') + '</div>' +
      '<div class="cont dobra-txt">' +
        '<span class="eyebrow">Os vencedores da Trilha 2026</span>' +
        '<h1 class="mega">' + esc(vs.map(function (x) { return String(x.hero.name).split(/\s+[—–-]\s+/)[0]; }).join(' e ')) + '</h1>' +
        '<p class="dobra-sub">' + esc(um ? 'Herói escolhido pelo público' : 'Heróis escolhidos pelo público') +
          (bs.length ? '<br><span class="dv-banca">Projeto destaque da banca: <b>' + esc(bs.map(function (o) { return o.name; }).join(' e ')) + '</b></span>' : '') + '</p>' +
        '<div class="dobra-chamada"><p>Obrigado a todos que votaram e acompanharam a Trilha 2026.</p>' +
        '<button class="btn btn-lg btn-laranja inst-btn" data-go="resultado">Ver os vencedores</button></div>' +
      '</div></section>';
  }

  /* ============================ VOLTAR AO TOPO ============================ */
  (function () {
    var b = null;
    function cria() {
      b = document.createElement('button');
      b.type = 'button'; b.className = 'topo-btn'; b.setAttribute('aria-label', 'Voltar ao topo');
      b.innerHTML = ico('i-up');
      b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      document.body.appendChild(b);
    }
    window.addEventListener('scroll', function () {
      if (!b) cria();
      var mostra = window.scrollY > window.innerHeight * 1.2 && !/^(telao|admin|mesa|mosaico)$/.test(route.name);
      b.classList.toggle('is-vis', mostra);
    }, { passive: true });
  })();

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
      case 'banca': return viewBanca();
      case 'entrar': return viewEntrar();
      case 'controle': return viewControle();
      case 'mosaico': return viewPausa();
      case 'decisao': return viewDecisao();
      case 'mesa': return viewMesa();
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
    // topo de "Heróis & Projetos": rostos um pouco mais afastados e fileiras
    // mais separadas, para ninguém ficar escondido atrás do outro
    var topo = t.classList.contains('turma-topo');
    if (topo) { S = 0.5; SOBE = 0.36; }
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
      if (topo) SOBE = 0.46;
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
    if (/^(votacao|admin|telao|resultado|banca|decisao|mesa|mosaico|controle)$/.test(route.name)) return '';
    return '<a class="cta-votar" href="#/votacao"><span class="cta-ponto" aria-hidden="true"></span>' +
      '<span><b>A votação está aberta</b><span class="cta-sub">Toque para escolher o seu Herói</span></span>' + ico('i-chev') + '</a>';
  }

  /* título da aba: "Página - IDL" (no Início, só "IDL") */
  function tituloPagina() {
    var r = route.name, nome = {
      trilhei: 'Por que Trilhei?', programacao: 'Programação', projetos: 'Projetos', herois: 'Heróis',
      trilha2026: 'A Trilha em 2026', votacao: 'Votação', resultado: 'Resultado', admin: 'Painel',
      banca: 'Banca', decisao: 'Decisão final', entrar: 'Entrar', telao: 'Telão', controle: 'Controle', mosaico: 'Mosaico de fotos'
    }[r] || '';
    if (r === 'projeto') { var p = byId(route.param); nome = p ? p.name : 'Projeto'; }
    if (r === 'heroi') { var x = heroById(route.param); nome = x ? String(x.hero.name).split(/\s+[—–-]\s+/)[0] : 'Herói'; }
    if (r === 'banca' && route.param) { var pb = byId(route.param); nome = pb ? pb.name + ' · Banca' : 'Banca'; }
    if (r === 'mesa') nome = route.param === 'decisao' ? 'QR · Decisão final' : route.param === 'entrar' ? 'QR · Entrar' : 'QR · Banca';
    return nome ? nome + ' - IDL' : 'IDL';
  }
  function render() {
    if (route.name === 'banca' && bancaEditando()) { banca.renderPendente = true; renderNav(); return; }
    renderBrand(); renderNav();
    document.title = tituloPagina();
    if (/^(telao|controle)$/.test(route.name)) rtConectar(); else rtFechar();
    var app = $('#app');
    var ehTelao = route.name === 'telao';
    var ehMesa = route.name === 'mesa';
    var ehMosaico = route.name === 'mosaico';
    document.body.classList.toggle('is-mesa', ehMesa);
    document.body.classList.toggle('is-mosaico', ehMosaico);
    document.body.classList.toggle('is-banca', route.name === 'banca' || route.name === 'decisao' || route.name === 'controle');
    document.body.classList.toggle('is-revela', ehTelao && remote.on && (remote.revelar || remote.revelarBanca));
    document.body.classList.toggle('is-revela-banca', ehTelao && remote.on && remote.revelarBanca);
    // som sempre ligado no telão, sem menu na tela: o primeiro clique/tecla libera
    if (ehTelao && remote.on) somAuto();
    var spV = $('#somPainel'); if (spV) spV.remove();
    if (!(ehTelao && remote.on && (remote.revelar || remote.revelarBanca)) && som.agendado) somParar();
    // o site é aberto a todos: o CPF só é pedido na tela de votação, quando ela abre
    var gated = false;
    document.body.classList.toggle('is-gated', gated);
    document.body.classList.toggle('is-telao', ehTelao || ehMosaico);
    var adminFull = route.name === 'admin' && localState.admin;
    document.body.classList.toggle('is-painel', adminFull);
    app.className = gated || ehTelao || ehMesa || ehMosaico ? '' : (adminFull ? '' : 'shell');
    var htmlNovo = (gated ? viewEntrada() : currentView()) + (!gated && comRodape() ? idlFooter() : '') + ctaVotar();
    // no telão, se nada mudou, não redesenha (vídeo não reinicia, imagem não pisca)
    if ((ehTelao || ehMosaico) && htmlNovo === render.ultimoTelao && app.firstChild) { renderOverlay(); pausaMontar(); return; }
    render.ultimoTelao = (ehTelao || ehMosaico) ? htmlNovo : null;
    app.innerHTML = htmlNovo;
    renderOverlay();

    // microanimação quando a atividade ao vivo muda
    var lv = liveItem(), card = $('#nowCard');
    if (card && lv && lv.id !== lastLiveId && lastLiveId !== null) card.classList.add('just-changed');
    lastLiveId = lv ? lv.id : null;

    countUp();
    if (route.name === 'controle') { ajustarPrevias(); ctlRolarRoteiro(); }
    tickLive();
    telaoMontar();
    pausaMontar();
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

  function setVotacao(aberta, resultado, visivelDepois) {
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
        toast(aberta === true ? 'Votação aberta.' : aberta === false ? (visivelDepois === false ? 'Votação encerrada e escondida do site.' : 'Votação encerrada.') : 'Atualizado.');
        if (visivelDepois === false) definirVisivel(false, true); else syncEstado(false);
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

  // mostra/esconde a aba Votação no site (só com a votação fechada)
  function definirVisivel(quer, quieto) {
    if (!remote.on) { toast('Disponível na versão publicada.'); return; }
    sbRpc('definir_visibilidade', { p_chave: localState.adminKey || '', p_visivel: !!quer }).then(function (r) {
      if (r && r.ok) { remote.visivel = !!r.visivel; render(); if (!quieto) toast(r.visivel ? 'A aba Votação agora aparece para todos.' : 'A aba Votação foi escondida do site.'); }
      else { render(); if (!(r && r.erro === 'chave_invalida')) toast('Não consegui mudar agora. Tente de novo.'); }
    }).catch(function () { render(); toast('Sem conexão com o servidor.'); });
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
    if (act === 'carAnt' || act === 'carProx') { carIr(carrossel.i + (act === 'carProx' ? 1 : -1), true); return; }
    if (act === 'carIr') { carIr(+el.getAttribute('data-i'), true); return; }
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
    else if (act === 'confirmYes2') { var c2 = admin.confirm; admin.confirm = null; if (c2 && c2.run2) c2.run2(); renderOverlay(); }
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
      admin.confirm = { title: 'Encerrar a votação?', body: 'Ninguém mais conseguirá votar. Os votos já registrados continuam guardados. A aba Votação continua no site (mostrando "votação encerrada") ou some?', danger: true,
        yes: 'Encerrar e esconder do site', run: function () { setVotacao(false, null, false); },
        yes2: 'Encerrar e manter a aba visível', run2: function () { setVotacao(false, null); } };
      renderOverlay();
    }
    else if (act === 'askZerarTudo') {
      admin.confirm = { title: 'Zerar tudo?', danger: true, yes: 'Sim, zerar tudo',
        body: 'Apaga todos os votos, as notas, os comentários e a decisão da banca, e limpa os projetos conhecidos de todos os aparelhos. A votação, a decisão final e a revelação ficam fechadas. Não dá para desfazer.',
        run: function () {
          sbRpc('zerar_tudo', { p_chave: localState.adminKey || '' }).then(function (r) {
            if (!r || !r.ok) { toast(ERROS[r && r.erro] || 'Não consegui zerar.'); return; }
            remote.rodada = r.rodada || remote.rodada; localState.rodada = remote.rodada;
            localState.voted = null; localState.visited = []; saveLocal();
            adminRes.dados = null; adminBancaDados.itens = null; adminBancaDados.decisao = [];
            toast('Tudo zerado: ' + (r.votos || 0) + ' votos e ' + (r.avaliacoes || 0) + ' avaliações apagados.');
            syncEstado(); loadResult();
          }).catch(function (e) {
            toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente para ter o "Zerar tudo".' : 'Sem conexão com o servidor.');
          });
        } };
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
    else if (act === 'slideProx') passoSlide(1);
    else if (act === 'slideAnt') passoSlide(-1);
    else if (act === 'slideIr') irSlide(el.getAttribute('data-k'));
    else if (act === 'slideSair') irSlide('');
    else if (act === 'askSlideRevela') {
      var kR = el.getAttribute('data-k'), ehB = kR === 'revelaBanca';
      admin.confirm = { title: ehB ? 'Revelar o Projeto destaque?' : 'Revelar o Herói da Trilha?',
        body: ehB ? 'O telão começa a revelação do projeto escolhido pela banca (suspense, contagem e o vencedor).' : 'O telão começa a revelação do Herói escolhido pelo público (suspense, contagem e o vencedor).',
        yes: 'Sim, revelar agora', run: function () { irSlide(kR); } };
      renderOverlay();
    }
    else if (act === 'pausaOn') definirPausaTelao(true);
    else if (act === 'pausaOff') definirPausaTelao(false);
    else if (act === 'apMover') {
      var cfgM = apLerForm(), li = el.closest('.ap-item'), iM = +li.getAttribute('data-i'), dM = +el.getAttribute('data-d'), jM = iM + dM;
      if (jM < 0 || jM >= cfgM.length) return;
      var tM = cfgM[iM]; cfgM[iM] = cfgM[jM]; cfgM[jM] = tM;
      db.apresentacao = { slides: cfgM }; render();
    }
    else if (act === 'apPadrao') {
      admin.confirm = { title: 'Voltar ao roteiro padrão?', body: 'A ordem, os slides ligados e os textos voltam ao padrão. Os textos que vocês editaram se perdem.', yes: 'Sim, voltar', danger: true,
        run: function () { db.apresentacao = null; save(); toast('Roteiro padrão restaurado.'); } };
      renderOverlay();
    }
    else if (act === 'aoVivoAtualizar') { syncEstado(); aoVivoAtualizar(true); toast('Atualizado.'); }
    else if (act === 'palcoProx') { var px = palcoVizinho(1); if (px) definirPalco(px.id); }
    else if (act === 'palcoAnt') { var pa2 = palcoVizinho(-1); if (pa2) definirPalco(pa2.id); }
    else if (act === 'palcoLimpar') definirPalco(null);
    else if (act === 'askRevelar') {
      admin.confirm = { title: 'Revelar o Herói no telão?', body: 'O telão mostra o vencedor com animação, com a apuração deste momento. Os celulares continuam sem o resultado. Encerre a votação antes, para ninguém votar depois da revelação.', yes: 'Sim, revelar agora',
        run: function () { setRevelacao(true); } };
      renderOverlay();
    }
    else if (act === 'desrevelar') { if (remote.revelarBanca) setRevelacaoBanca(false); if (remote.revelar || !remote.revelarBanca) setRevelacao(false); }
    else if (act === 'askRevelarBanca') {
      admin.confirm = { title: 'Revelar o Projeto destaque no telão?', body: 'O telão mostra, com animação, o projeto mais votado na decisão final da banca (empate desempata pela média das notas). Encerre a decisão antes, para ninguém mudar o voto.', yes: 'Sim, revelar',
        run: function () { setRevelacaoBanca(true); } };
      renderOverlay();
    }
    else if (act === 'bancaSair') { localState.banca = null; banca.itens = {}; banca.rascunho = {}; banca.carregou = false; banca.dec = { dados: null, erro: '', escolha: null, enviando: false, buscando: false }; saveLocal(); go('banca'); render(); }
    else if (act === 'bancaNota') bancaMarcar(el);
    else if (act === 'sairTudo') {
      localState.admin = false; localState.adminKey = ''; localState.banca = null;
      banca.itens = {}; banca.rascunho = {}; banca.carregou = false; banca.dec = { dados: null, erro: '', escolha: null, enviando: false, buscando: false };
      saveLocal(); toast('Você saiu deste aparelho.'); go('home'); render();
    }
    else if (act === 'bancaConfirmar') bancaConfirmar(el.getAttribute('data-id'));
    else if (act === 'bancaVoltar') { go('banca'); window.scrollTo(0, 0); }
    else if (act === 'decEscolher') { banca.dec.escolha = el.getAttribute('data-id'); render(); }
    else if (act === 'decVotar') decVotar();
    else if (act === 'mesaImprimir') window.print();
    else if (act === 'decisaoAbrir') {
      var abrir = el.getAttribute('data-v') === '1';
      var fazer = function () {
        sbRpc('definir_decisao', { p_chave: localState.adminKey || '', p_aberta: abrir }).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.erro) || 'falhou');
          remote.decisao = abrir; toast(abrir ? 'Decisão final aberta para a banca.' : 'Decisão final encerrada.'); carregarAdminBanca();
        }).catch(function (e) { toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente.' : 'Não deu certo agora. Tente de novo.'); });
      };
      if (abrir) { admin.confirm = { title: 'Abrir a decisão final?', body: 'Os jurados passam a ver as médias de todos e podem votar no projeto vencedor.', yes: 'Sim, abrir', run: fazer }; renderOverlay(); }
      else fazer();
    }
    else if (act === 'bancaZerar') {
      var tudo = el.getAttribute('data-v') === '1';
      admin.confirm = { title: tudo ? 'Apagar todas as avaliações?' : 'Apagar os votos da decisão?', danger: true, yes: 'Sim, apagar',
        body: tudo ? 'Apaga as notas, os comentários e os votos da decisão de todos os jurados. Use só depois do ensaio.' : 'Os jurados poderão votar de novo na decisão final. As notas continuam.',
        run: function () {
          sbRpc('zerar_banca', { p_chave: localState.adminKey || '', p_avaliacoes: tudo }).then(function (r) {
            if (!r || !r.ok) throw new Error('falhou');
            toast(tudo ? 'Avaliações apagadas.' : 'Votos da decisão apagados.'); carregarAdminBanca();
          }).catch(function () { toast('Não deu certo agora. Tente de novo.'); });
        } };
      renderOverlay();
    }
    else if (act === 'bancaAtualizar') carregarAdminBanca();
    else if (act === 'bancaPlanilha') {
      if (!adminBancaDados.itens) { toast('Atualize as notas primeiro.'); return; }
      XL.baixar('notas-da-banca-idl.xlsx', planilhaBanca());
    }
    else if (act === 'leiCopiar') {
      var lk = el.getAttribute('data-url');
      if (navigator.clipboard) navigator.clipboard.writeText(lk).then(function () { toast('Link copiado.'); }, function () { toast(lk); });
      else toast(lk);
    }
    else if (act === 'chkRodar') chkRodar();
    else if (act === 'copyNames') {
      var names = opcoesDeVoto().map(function (p) { return p.name; }).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(names).then(function () { toast('Nomes copiados.'); }, function () { toast('Não consegui copiar.'); });
      else { admin.copy = { title: 'Nomes dos projetos', hint: 'Copie e cole como opções da pergunta "Projeto escolhido".', text: names, editable: false }; renderOverlay(); }
    }
    else if (act === 'exportVotos') {
      var r = adminRes.dados;
      if (!r || !r.liberado) { toast('Atualize as respostas primeiro.'); return; }
      var emH = votoEmHerois(), tot = r.total || 0, maxV = 0;
      (r.projetos || []).forEach(function (p) { maxV = Math.max(maxV, p.votos || 0); });
      var dadosV = (r.projetos || []).map(function (p, i) {
        var loc = opcaoPorId(p.id), hx = heroById(p.id), pj = hx ? hx.project : byId(p.id);
        var nome = (loc && loc.name) || p.nome || p.id;
        return emH ? [i + 1, nome, pj ? pj.name : '', pj ? pj.group || '' : '', p.votos || 0, tot ? (p.votos || 0) / tot : 0]
                   : [i + 1, nome, pj ? pj.group || '' : '', p.votos || 0, tot ? (p.votos || 0) / tot : 0];
      });
      var colsV = emH
        ? [{ t: 'Posição', w: 10, tipo: 'pos' }, { t: 'Herói', w: 30, tipo: 'forte' }, { t: 'Projeto', w: 40 }, { t: 'Grupo', w: 16 }, { t: 'Votos', w: 11, tipo: 'int' }, { t: '% dos votos', w: 14, tipo: 'pct' }]
        : [{ t: 'Posição', w: 10, tipo: 'pos' }, { t: 'Projeto', w: 44, tipo: 'forte' }, { t: 'Grupo', w: 16 }, { t: 'Votos', w: 11, tipo: 'int' }, { t: '% dos votos', w: 14, tipo: 'pct' }];
      var tt = XL.estilo('total');
      var linTotal = { alt: 24, c: colsV.map(function (c, k) {
        if (k === colsV.length - 2) return { v: tot, s: XL.estilo('totalNum') };
        if (k === colsV.length - 1) return { v: tot ? 1 : 0, s: XL.estilo('totalPct') };
        return { v: k === 1 ? 'Total de votos' : '', s: tt };
      }) };
      XL.baixar('apuracao-votacao-idl.xlsx', [XL.folha('Apuração',
        'Apuração da votação · ' + (emH ? 'Herói' : 'Projeto') + ' da Trilha 2026',
        'IDL · apurado em ' + agoraBR() + ' · ' + tot + (tot === 1 ? ' voto' : ' votos') + (maxV ? ' · em destaque: o mais votado' : ''),
        colsV, dadosV, { destacar: function (l) { return maxV > 0 && l[colsV.length - 2] === maxV; }, rodape: [{ alt: 6, c: [] }, linTotal] })]);
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
    else if (act === 'palcoEscolher') { definirPalco(t.value || null); }
    else if (act === 'toggleVisivelAv') { definirVisivel(!!t.checked); }
    else if (act === 'toggleAvaliacoes') { definirAvaliacoes(!!t.checked); }
    else if (act === 'togglePausa') { definirPausaTelao(!!t.checked); }
    else if (act === 'togglePosEvento') { db.posEvento = !!t.checked; save(); toast(db.posEvento ? 'Modo pós-evento ligado. O site muda para todos em até 30 s.' : 'Modo pós-evento desligado.'); }
    else if (act === 'leiNome') { leiDefinirApres(+t.getAttribute('data-i'), t.value); }
    else if (act === 'leiModo') { db.leilao = db.leilao || {}; db.leilao.apresModo = t.value; save(); toast('Pronto. O telão atualiza em até 30 s.'); }
    else if (act === 'leiTelaSel') { leiEscolherTela(t.value); }
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

    if (f.matches && f.matches('form.bp-form')) return;
    if (f.id === 'entrarForm') { entrarSubmit(); return; }
    if (f.id === 'apForm') { db.apresentacao = { slides: apLerForm() }; save(); toast('Apresentação salva. O telão e o controle já usam o roteiro novo.'); return; }
    if (f.id === 'senhaAdminForm') {
      var novaA = normSenha($('#novaSenhaAdmin').value);
      if (novaA.length < 6) { toast('Use pelo menos 6 caracteres.'); return; }
      sbRpc('definir_senha_admin', { p_chave: localState.adminKey || '', p_nova: novaA }).then(function (r) {
        if (r && r.ok) { localState.adminKey = novaA; saveLocal(); $('#novaSenhaAdmin').value = ''; toast('Senha da organização trocada. Os outros aparelhos vão pedir a nova.'); }
        else toast(r && r.erro === 'igual_banca' ? 'A senha da organização não pode ser igual à da banca.' : r && r.erro === 'senha_curta' ? 'Use pelo menos 6 caracteres.' : 'Não consegui trocar a senha.');
      }).catch(function (e) { toast(String(e && e.message) === 'http 404' ? 'Rode o supabase.sql mais recente.' : 'Sem conexão com o servidor.'); });
      return;
    }
    if (f.id === 'senhaBancaForm') {
      var nova = normSenha($('#novaSenhaBanca').value);
      if (nova.length < 4) { toast('Use pelo menos 4 caracteres.'); return; }
      sbRpc('definir_senha_banca', { p_chave: localState.adminKey || '', p_nova: nova }).then(function (r) {
        if (r && r.ok) { toast('Senha da banca trocada. Avise os jurados.'); $('#novaSenhaBanca').value = ''; }
        else if (!(r && r.erro === 'chave_invalida')) toast('Não consegui trocar a senha.');
      }).catch(function () { toast('Sem conexão com o servidor.'); });
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
      if (taps >= 4) { taps = 0; go('entrar'); }
      else if (taps === 1) { if (route.name !== 'home') go('home'); }
    });
  })();

  /* ------------------------------ sincronismo ---------------------------- */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { load(); render(); }
  });

  /* rede de segurança para imagens novas: se o arquivo novo não estiver no
     servidor (ex.: não foi enviado ao repositório), usa a versão anterior   */
  var RESERVA_IMG = { 'img/kv/flor-roxa.svg': 'img/icon/favicon.svg' };
  Object.keys(IMAGENS_NOVAS).forEach(function (velha) {
    if (/-v2\.webp$/.test(velha)) return;
    RESERVA_IMG[IMAGENS_NOVAS[velha].split('?')[0]] = velha;
  });
  document.addEventListener('error', function (e) {
    var im = e.target;
    if (!im || im.tagName !== 'IMG' || im.getAttribute('data-reserva')) return;
    var src = im.getAttribute('src') || '';
    if (/(^|\/)img\/mini\//.test(src)) { im.setAttribute('src', src.replace('img/mini/', 'img/')); return; }
    var alt = RESERVA_IMG[src.replace(/^\.?\//, '').split('?')[0]];
    if (alt) { im.setAttribute('data-reserva', '1'); im.setAttribute('src', alt); }
  }, true);

  /* pré-carregamento: com o site aberto e parado, baixa em segundo plano as
     miniaturas de todos os Heróis (e as imagens da marca). Quem abre o site
     antes do evento já fica com tudo no aparelho: abrir a votação não baixa
     quase nada. Respeita o "economia de dados" do celular.               */
  (function () {
    var feito = false;
    function preCarregar() {
      if (feito) return; feito = true;
      var c = navigator.connection || {};
      if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;
      var urls = [];
      (db.projects || []).forEach(function (p) { (p.heroes || []).forEach(function (h) { if (h.image) urls.push(mini(h.image)); }); });
      var i = 0;
      (function proxima() {
        if (i >= urls.length) return;
        var im = new Image(); im.decoding = 'async';
        im.onload = im.onerror = function () { setTimeout(proxima, 120); };
        im.src = urls[i++];
      })();
    }
    window.addEventListener('load', function () {
      var ocioso = window.requestIdleCallback || function (f) { return setTimeout(f, 2500); };
      setTimeout(function () { ocioso(preCarregar); }, 1500);
    });
  })();

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
    setInterval(function () { if (/^(banca|decisao|mesa)$/.test(route.name)) syncEstado(); if (route.name === 'decisao') carregarDecisao(); }, 3000);
    setInterval(function () { if (/^(telao|controle)$/.test(route.name) && document.visibilityState !== 'hidden') syncEstado(); }, 1000);
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
