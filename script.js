/**
 * Cardápio Digital — script.js
 * Busca config.json e renderiza toda a interface dinamicamente.
 * Nenhum dado de cardápio fica hardcoded no HTML.
 */

const CONFIG_URL = 'config.json';

// Numeração romana para os "capítulos" do cardápio (uso estrutural, não decorativo:
// menus impressos tradicionalmente numeram suas seções).
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Ícones inline (sem dependência externa, para funcionar 100% offline no PWA)
const ICONES = {
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.25-1.55 1.57-1.55h1.68V3.3C15.9 3.2 15 3.13 14 3.13c-2.4 0-4.05 1.47-4.05 4.15v2.5H7.25v3.2H10V21h3.5z"/></svg>',
  pix: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3.5 3.5 8a3 3 0 0 0 0 4.2L8 16.7M16 3.5 20.5 8a3 3 0 0 1 0 4.2L16 16.7M12 7l-4 4 4 4 4-4-4-4Z"/></svg>',
  cartao: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/></svg>',
  dinheiro: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>'
};

document.addEventListener('DOMContentLoaded', () => {
  iniciarCardapio();
  registrarServiceWorker();
});

async function iniciarCardapio() {
  try {
    const resposta = await fetch(CONFIG_URL, { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`Falha ao carregar ${CONFIG_URL}: ${resposta.status}`);
    const dados = await resposta.json();

    renderizarEstabelecimento(dados.estabelecimento);
    renderizarNavegacao(dados.categorias);
    renderizarCategorias(dados.categorias);
    renderizarFooter(dados.estabelecimento);

    configurarScrollSpy();
  } catch (erro) {
    console.error('Erro ao montar o cardápio:', erro);
    renderizarErro();
  }
}

/* ---------------------------------------------------------
   HEADER
--------------------------------------------------------- */
function renderizarEstabelecimento(estabelecimento) {
  const logo = document.getElementById('logo-estabelecimento');
  logo.src = estabelecimento.logo;
  logo.alt = `Logo de ${estabelecimento.nome}`;

  document.getElementById('nome-estabelecimento').textContent = estabelecimento.nome;
  document.getElementById('tagline-estabelecimento').textContent = estabelecimento.tagline || '';
  document.title = estabelecimento.nome;
}

/* ---------------------------------------------------------
   NAVEGAÇÃO STICKY (chips)
--------------------------------------------------------- */
function renderizarNavegacao(categorias) {
  const nav = document.getElementById('nav-categorias-lista');
  const frag = document.createDocumentFragment();

  categorias.forEach((categoria) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-categoria';
    chip.textContent = categoria.nome;
    chip.dataset.alvo = categoria.id;
    chip.addEventListener('click', () => irParaCategoria(categoria.id));
    frag.appendChild(chip);
  });

  nav.appendChild(frag);
}

function irParaCategoria(id) {
  const secao = document.getElementById(id);
  if (!secao) return;
  secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------------------------------------------------
   SEÇÕES DE CATEGORIA + PRODUTOS
--------------------------------------------------------- */
function renderizarCategorias(categorias) {
  const container = document.getElementById('categorias-container');
  container.innerHTML = ''; // remove o estado de carregamento

  const frag = document.createDocumentFragment();

  categorias.forEach((categoria, indice) => {
    frag.appendChild(construirSecaoCategoria(categoria, indice));
  });

  container.appendChild(frag);
}

function construirSecaoCategoria(categoria, indice) {
  const secao = document.createElement('section');
  secao.className = 'categoria';
  secao.id = categoria.id;
  secao.setAttribute('aria-labelledby', `titulo-${categoria.id}`);

  const numero = ROMANOS[indice] || String(indice + 1).padStart(2, '0');

  secao.innerHTML = `
    <div class="categoria__cabecalho">
      <img class="categoria__imagem" src="${escapeAtributo(categoria.imagem)}"
           alt="${escapeAtributo(categoria.nome)}" loading="lazy">
      <div class="categoria__legenda">
        <span class="categoria__numero">CAPÍTULO ${numero}</span>
        <h2 class="categoria__titulo" id="titulo-${categoria.id}">${escapeTexto(categoria.nome)}</h2>
        ${categoria.descricao ? `<p class="categoria__descricao">${escapeTexto(categoria.descricao)}</p>` : ''}
      </div>
    </div>
    <ul class="lista-produtos"></ul>
  `;

  const lista = secao.querySelector('.lista-produtos');
  categoria.produtos.forEach((produto) => {
    lista.appendChild(construirItemProduto(produto));
  });

  return secao;
}

function construirItemProduto(produto) {
  const item = document.createElement('li');
  item.className = 'produto';
  item.innerHTML = `
    <div class="produto__info">
      <div class="produto__cabecalho">
        <span class="produto__nome">${escapeTexto(produto.nome)}</span>
        ${produto.destaque ? '<span class="produto__selo">Destaque</span>' : ''}
      </div>
      ${produto.descricao ? `<p class="produto__descricao">${escapeTexto(produto.descricao)}</p>` : ''}
    </div>
    <span class="produto__valor">${formatarPreco(produto.valor)}</span>
  `;
  return item;
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/* ---------------------------------------------------------
   SCROLL SPY — destaca a chip da categoria visível
--------------------------------------------------------- */
function configurarScrollSpy() {
  const secoes = Array.from(document.querySelectorAll('.categoria'));
  const chips = Array.from(document.querySelectorAll('.chip-categoria'));
  if (!secoes.length) return;

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        chips.forEach((chip) => {
          chip.classList.toggle('is-ativo', chip.dataset.alvo === entrada.target.id);
        });
        const chipAtiva = chips.find((c) => c.dataset.alvo === entrada.target.id);
        if (chipAtiva) chipAtiva.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  secoes.forEach((secao) => observer.observe(secao));
}

/* ---------------------------------------------------------
   FOOTER
--------------------------------------------------------- */
function renderizarFooter(estabelecimento) {
  // Pagamentos
  const listaPagamentos = document.getElementById('lista-pagamentos');
  estabelecimento.formasPagamento.forEach((forma) => {
    const li = document.createElement('li');
    li.className = 'footer__pagamento-item';
    li.innerHTML = `${ICONES[forma.icone] || ''}<span>${escapeTexto(forma.nome)}</span>`;
    listaPagamentos.appendChild(li);
  });

  // Endereço e horário
  document.getElementById('footer-endereco').textContent = estabelecimento.endereco;
  document.getElementById('footer-horario').textContent = estabelecimento.horario || '';

  // Contato
  const { whatsapp, whatsappExibicao, telefone } = estabelecimento.contato;
  const linkWhats = document.getElementById('footer-whatsapp');
  linkWhats.textContent = `WhatsApp: ${whatsappExibicao || whatsapp}`;
  linkWhats.href = `https://wa.me/${whatsapp}`;
  linkWhats.target = '_blank';
  linkWhats.rel = 'noopener';

  const linkTel = document.getElementById('footer-telefone');
  linkTel.textContent = `Telefone: ${telefone}`;
  linkTel.href = `tel:${telefone.replace(/\D/g, '')}`;

  // Botão flutuante do WhatsApp
  const botaoWhats = document.getElementById('botao-whatsapp');
  botaoWhats.href = `https://wa.me/${whatsapp}`;
  botaoWhats.hidden = false;

  // Redes sociais
  const containerRedes = document.getElementById('footer-redes');
  (estabelecimento.redesSociais || []).forEach((rede) => {
    const a = document.createElement('a');
    a.className = 'footer__rede-link';
    a.href = rede.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', rede.nome);
    a.innerHTML = ICONES[rede.icone] || rede.nome[0];
    containerRedes.appendChild(a);
  });

  document.getElementById('footer-ano').textContent = new Date().getFullYear();
}

/* ---------------------------------------------------------
   ESTADO DE ERRO
--------------------------------------------------------- */
function renderizarErro() {
  const container = document.getElementById('categorias-container');
  container.innerHTML = `
    <div class="estado-erro" role="alert">
      <p>Não foi possível carregar o cardápio agora.</p>
      <p>Verifique sua conexão e tente novamente.</p>
    </div>
  `;
}

/* ---------------------------------------------------------
   UTILITÁRIOS
--------------------------------------------------------- */
function escapeTexto(texto = '') {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
function escapeAtributo(texto = '') {
  return String(texto).replace(/"/g, '&quot;');
}

/* ---------------------------------------------------------
   PWA — REGISTRO DO SERVICE WORKER
--------------------------------------------------------- */
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((erro) => {
        console.warn('Falha ao registrar o service worker:', erro);
      });
    });
  }
}
