/**
 * Service Worker — Cardápio Digital
 *
 * Estratégia:
 *  - App shell (HTML/CSS/JS/ícones/imagens locais): cache-first, com fallback de rede.
 *  - config.json: network-first, para o cliente sempre ver o cardápio mais recente
 *    quando online, mas ainda funcionar offline com a última versão em cache.
 *
 * IMPORTANTE: incremente CACHE_VERSION sempre que publicar mudanças no app shell
 * (HTML/CSS/JS) ou na lista de imagens, para que os clientes já instalados
 * peguem a versão nova.
 */

const CACHE_VERSION = 'cardapio-v5';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './config.json',
  './assets/logo.svg',
  './assets/cat-cafes.svg',
  './assets/cat-panificacao.svg',
  './assets/cat-pratos.svg',
  './assets/cat-doces.svg',
  './assets/cat-sucos.svg',
  './assets/cat-massas.svg',
  './assets/cat-vinhos.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/produtos/espresso-duplo.svg',
  './assets/produtos/filtrado-v60.svg',
  './assets/produtos/cappuccino.svg',
  './assets/produtos/flat-white.svg',
  './assets/produtos/nitro.svg',
  './assets/produtos/cortado.svg',
  './assets/produtos/affogato.svg',
  './assets/produtos/croissant.svg',
  './assets/produtos/pao-fermentacao.svg',
  './assets/produtos/focaccia.svg',
  './assets/produtos/scone.svg',
  './assets/produtos/pao-de-queijo.svg',
  './assets/produtos/torrada-abacate.svg',
  './assets/produtos/ovos-beneditinos.svg',
  './assets/produtos/tabua-frios.svg',
  './assets/produtos/pastrami.svg',
  './assets/produtos/salada-graos.svg',
  './assets/produtos/omelete.svg',
  './assets/produtos/wrap-frango.svg',
  './assets/produtos/bowl-mediterraneo.svg',
  './assets/produtos/bolo-cenoura.svg',
  './assets/produtos/cheesecake.svg',
  './assets/produtos/brownie.svg',
  './assets/produtos/torta-limao.svg',
  './assets/produtos/cookie.svg',
  './assets/produtos/petit-gateau.svg',
  './assets/produtos/suco-laranja.svg',
  './assets/produtos/limonada-rosa.svg',
  './assets/produtos/cha-hibisco.svg',
  './assets/produtos/refri-gengibre.svg',
  './assets/produtos/agua-gas.svg',
  './assets/produtos/risoto-cogumelos.svg',
  './assets/produtos/nhoque.svg',
  './assets/produtos/talharim.svg',
  './assets/produtos/lasanha.svg',
  './assets/produtos/vinho-tinto.svg',
  './assets/produtos/vinho-branco.svg',
  './assets/produtos/spritz.svg',
  './assets/produtos/chope.svg'
];

// Instalação: pré-armazena o app shell
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativação: remove caches de versões antigas
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_VERSION)
          .map((chave) => caches.delete(chave))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: estratégias diferentes por tipo de recurso
self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const ehConfig = url.pathname.endsWith('/config.json');

  if (ehConfig) {
    evento.respondWith(estrategiaNetworkFirst(request));
  } else {
    evento.respondWith(estrategiaCacheFirst(request));
  }
});

async function estrategiaCacheFirst(request) {
  const emCache = await caches.match(request);
  if (emCache) return emCache;

  try {
    const resposta = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, resposta.clone());
    return resposta;
  } catch (erro) {
    return new Response('Offline e recurso não disponível em cache.', {
      status: 503,
      statusText: 'Offline'
    });
  }
}

async function estrategiaNetworkFirst(request) {
  try {
    const resposta = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, resposta.clone());
    return resposta;
  } catch (erro) {
    const emCache = await caches.match(request);
    if (emCache) return emCache;
    throw erro;
  }
}
