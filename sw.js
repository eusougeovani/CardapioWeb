/**
 * Service Worker — Cardápio Digital
 *
 * Estratégia:
 *  - App shell (HTML/CSS/JS/ícones/imagens locais): cache-first, com fallback de rede.
 *  - config.json: network-first, para o cliente sempre ver o cardápio mais recente
 *    quando online, mas ainda funcionar offline com a última versão em cache.
 *
 * IMPORTANTE: incremente CACHE_VERSION sempre que publicar mudanças no app shell
 * (HTML/CSS/JS), para que os clientes já instalados peguem a versão nova.
 */

const CACHE_VERSION = 'cardapio-v2';

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
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
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
    // Sem cache e sem rede: não há muito a fazer para recursos não previstos
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
