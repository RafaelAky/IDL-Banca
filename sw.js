/* =====================================================================
   Banca Final IDL Tech — funcionar com internet fraca
   Guarda no aparelho o que o site precisa para abrir e navegar:
   · páginas, estilos e scripts: busca na internet primeiro (para pegar a
     versão nova), mas se a rede demorar mais de 3 s ou cair, usa a cópia;
   · imagens e fontes: usa a cópia guardada e só baixa o que ainda não tem.
   Nunca guarda nada do banco (Supabase): votação, painel, fotos enviadas e
   conteúdo editado sempre vêm da internet.
   Ao publicar uma mudança grande, aumente VERSAO para limpar as cópias.
   ===================================================================== */
var VERSAO = 'idl-banca-v2';
var BASE = VERSAO + '-base';
var IMAGENS = VERSAO + '-imagens';

var ESSENCIAIS = [
  './', 'styles.css', 'config.js', 'data.js', 'app.js', 'vendor/qrcode.js',
  'favicon.ico', 'img/icon/favicon.svg', 'site.webmanifest',
  'img/kv/trilhei.webp', 'img/kv/idltech.webp', 'img/kv/dente.svg',
  'img/kv/arvore-lilas.webp', 'img/kv/mao.webp', 'img/kv/mao-creme.webp', 'img/kv/flor-roxa.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(BASE).then(function (c) { return c.addAll(ESSENCIAIS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf(VERSAO) !== 0; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function guardar(nome, req, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    var copia = res.clone();
    caches.open(nome).then(function (c) { c.put(req, copia); });
  }
  return res;
}

// internet primeiro, com prazo; se não vier a tempo, a cópia guardada
function redePrimeiro(req) {
  return new Promise(function (resolve) {
    var resolvido = false;
    var prazo = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (c) {
        if (c && !resolvido) { resolvido = true; resolve(c); }
      });
    }, 3000);
    fetch(req).then(function (res) {
      guardar(BASE, req, res);
      clearTimeout(prazo);
      if (!resolvido) { resolvido = true; resolve(res); }
    }).catch(function () {
      clearTimeout(prazo);
      caches.match(req, { ignoreSearch: true }).then(function (c) {
        if (resolvido) return;
        resolvido = true;
        if (c) { resolve(c); return; }
        // sem rede e sem cópia: para páginas, a tela inicial guardada
        caches.match('./').then(function (ini) {
          resolve(req.mode === 'navigate' && ini ? ini : Response.error());
        });
      });
    });
  });
}

// cópia guardada primeiro; se não tiver, baixa e guarda
function copiaPrimeiro(req) {
  return caches.match(req).then(function (c) {
    return c || fetch(req).then(function (res) { return guardar(IMAGENS, req, res); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // fontes do Google: guardadas depois da primeira vez
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(copiaPrimeiro(req));
    return;
  }
  // nada de fora do site (banco, YouTube…) passa pelo cache
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { e.respondWith(redePrimeiro(req)); return; }
  if (/\.(webp|png|jpe?g|gif|svg|ico)$/i.test(url.pathname)) { e.respondWith(copiaPrimeiro(req)); return; }
  e.respondWith(redePrimeiro(req));
});
