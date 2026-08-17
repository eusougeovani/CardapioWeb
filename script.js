/**
 * Cardápio Digital — script.js
 * Busca config.json e renderiza toda a interface dinamicamente.
 * Layout tipo painel (SaaS): uma categoria ativa por vez, navegação por
 * sidebar/abas, e busca global que troca de categoria e localiza o item.
 */

const CONFIG_URL = 'config.json';

// Numeração romana para os "capítulos" do cardápio (uso estrutural:
// menus tradicionalmente numeram suas seções — não é decoração).
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const ICONES = {
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.25-1.55 1.57-1.55h1.68V3.3C15.9 3.2 15 3.13 14 3.13c-2.4 0-4.05 1.47-4.05 4.15v2.5H7.25v3.2H10V21h3.5z"/></svg>',
  pix: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3.5 3.5 8a3 3 0 0 0 0 4.2L8 16.7M16 3.5 20.5 8a3 3 0 0 1 0 4.2L16 16.7M12 7l-4 4 4 4 4-4-4-4Z"/></svg>',
  cartao: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/></svg>',
  dinheiro: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>'
};

// Estado em memória
let CATEGORIAS = [];
let INDICE_BUSCA = []; // lista achatada de produtos com referência à categoria
let categoriaAtivaId = null;

document.addEventListener('DOMContentLoaded', () => {
  iniciarCardapio();
  registrarServiceWorker();
});

async function iniciarCardapio() {
  try {
    const resposta = await fetch(CONFIG_URL, { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`Falha ao carregar ${CONFIG_URL}: ${resposta.status}`);
    const dados = await resposta.json();

    CATEGORIAS = dados.categorias;

    renderizarEstabelecimento(dados.estabelecimento);
    construirIndiceBusca(CATEGORIAS);
    renderizarNavegacao(CATEGORIAS);
    renderizarPaineis(CATEGORIAS);
    renderizarFooter(dados.estabelecimento);
    configurarBusca();

    const alvoInicial = (location.hash || '').replace('#', '') || CATEGORIAS[0]?.id;
    ativarCategoria(alvoInicial, { atualizarHash: false });

    window.addEventListener('hashchange', () => {
      const id = location.hash.replace('#', '');
      if (id) ativarCategoria(id, { atualizarHash: false });
    });
  } catch (erro) {
    console.error('Erro ao montar o cardápio:', erro);
    renderizarErro();
  }
}

/* ---------------------------------------------------------
   TOPBAR — marca do estabelecimento
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
   NAVEGAÇÃO — abas (mobile) + sidebar (desktop), mesma fonte de dados
--------------------------------------------------------- */
function renderizarNavegacao(categorias) {
  const abas = document.getElementById('nav-categorias-lista');
  const sidebar = document.getElementById('sidebar-lista');
  const fragAbas = document.createDocumentFragment();
  const fragSidebar = document.createDocumentFragment();

  categorias.forEach((categoria, indice) => {
    const numero = ROMANOS[indice] || String(indice + 1).padStart(2, '0');

    const aba = document.createElement('button');
    aba.type = 'button';
    aba.className = 'aba-categoria';
    aba.dataset.alvo = categoria.id;
    aba.innerHTML = `<span class="aba-categoria__numero">${numero}</span><span>${escapeTexto(categoria.nome)}</span>`;
    aba.addEventListener('click', () => ativarCategoria(categoria.id));
    fragAbas.appendChild(aba);

    const itemSidebar = document.createElement('button');
    itemSidebar.type = 'button';
    itemSidebar.className = 'item-sidebar';
    itemSidebar.dataset.alvo = categoria.id;
    itemSidebar.innerHTML = `<span class="item-sidebar__numero">${numero}</span><span>${escapeTexto(categoria.nome)}</span>`;
    itemSidebar.addEventListener('click', () => ativarCategoria(categoria.id));
    fragSidebar.appendChild(itemSidebar);
  });

  abas.appendChild(fragAbas);
  sidebar.appendChild(fragSidebar);
}

/* ---------------------------------------------------------
   PAINÉIS DE CATEGORIA (um visível por vez)
--------------------------------------------------------- */
function renderizarPaineis(categorias) {
  const painel = document.getElementById('painel-categoria');
  document.getElementById('estado-carregando')?.remove();

  const frag = document.createDocumentFragment();
  categorias.forEach((categoria, indice) => {
    frag.appendChild(construirPainelCategoria(categoria, indice));
  });
  painel.appendChild(frag);
}

function construirPainelCategoria(categoria, indice) {
  const secao = document.createElement('section');
  secao.className = 'categoria-painel';
  secao.id = categoria.id;
  secao.hidden = true;
  secao.setAttribute('aria-labelledby', `titulo-${categoria.id}`);

  const numero = ROMANOS[indice] || String(indice + 1).padStart(2, '0');

  secao.innerHTML = `
    <div class="categoria-painel__cabecalho">
      <img class="categoria-painel__imagem" src="${escapeAtributo(categoria.imagem)}"
           alt="" loading="lazy">
      <div>
        <span class="categoria-painel__numero">CAPÍTULO ${numero}</span>
        <h2 class="categoria-painel__titulo" id="titulo-${categoria.id}">${escapeTexto(categoria.nome)}</h2>
        ${categoria.descricao ? `<p class="categoria-painel__descricao">${escapeTexto(categoria.descricao)}</p>` : ''}
      </div>
    </div>
    <ul class="lista-produtos"></ul>
  `;

  const lista = secao.querySelector('.lista-produtos');
  categoria.produtos.forEach((produto, i) => {
    lista.appendChild(construirItemProduto(produto, `${categoria.id}__${i}`));
  });

  return secao;
}

function construirItemProduto(produto, idProduto) {
  const item = document.createElement('li');
  item.className = 'produto';
  item.id = `produto-${idProduto}`;
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
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ---------------------------------------------------------
   TROCA DE CATEGORIA ATIVA (navegação tipo SaaS)
--------------------------------------------------------- */
function ativarCategoria(id, { atualizarHash = true } = {}) {
  const categoriaExiste = CATEGORIAS.some((c) => c.id === id);
  if (!categoriaExiste) return;

  document.querySelectorAll('.categoria-painel').forEach((painel) => {
    painel.hidden = painel.id !== id;
  });
  document.querySelectorAll('.aba-categoria, .item-sidebar').forEach((el) => {
    el.classList.toggle('is-ativo', el.dataset.alvo === id);
  });

  const abaAtiva = document.querySelector(`.aba-categoria[data-alvo="${id}"]`);
  abaAtiva?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });

  categoriaAtivaId = id;
  if (atualizarHash) history.replaceState(null, '', `#${id}`);

  document.getElementById('painel-categoria')?.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------------------------------------------------------
   ÍNDICE DE BUSCA (achatado, sem acentos, com referência à categoria)
--------------------------------------------------------- */
function construirIndiceBusca(categorias) {
  INDICE_BUSCA = [];
  categorias.forEach((categoria) => {
    categoria.produtos.forEach((produto, i) => {
      INDICE_BUSCA.push({
        idProduto: `${categoria.id}__${i}`,
        categoriaId: categoria.id,
        categoriaNome: categoria.nome,
        nome: produto.nome,
        descricao: produto.descricao || '',
        valor: produto.valor,
        chaveBusca: removerAcentos(`${produto.nome} ${produto.descricao || ''}`).toLowerCase()
      });
    });
  });
}

function removerAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* ---------------------------------------------------------
   BUSCA — campo, dropdown de resultados e redirecionamento
--------------------------------------------------------- */
function configurarBusca() {
  const campo = document.getElementById('campo-busca');
  const botaoLimpar = document.getElementById('busca-limpar');
  const painelResultados = document.getElementById('busca-resultados');
  const wrapper = document.getElementById('busca-wrapper');

  campo.addEventListener('input', () => {
    const termo = campo.value.trim();
    botaoLimpar.hidden = termo.length === 0;

    if (termo.length === 0) {
      fecharResultadosBusca();
      return;
    }
    const termoNormalizado = removerAcentos(termo).toLowerCase();
    const encontrados = INDICE_BUSCA.filter((p) => p.chaveBusca.includes(termoNormalizado)).slice(0, 8);
    renderizarResultadosBusca(encontrados, termo);
  });

  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharResultadosBusca();
      campo.blur();
    }
  });

  botaoLimpar.addEventListener('click', () => {
    campo.value = '';
    botaoLimpar.hidden = true;
    fecharResultadosBusca();
    campo.focus();
  });

  document.addEventListener('click', (evento) => {
    if (!wrapper.contains(evento.target)) fecharResultadosBusca();
  });

  function fecharResultadosBusca() {
    painelResultados.hidden = true;
    painelResultados.innerHTML = '';
    campo.setAttribute('aria-expanded', 'false');
  }

  function renderizarResultadosBusca(resultados, termoOriginal) {
    painelResultados.innerHTML = '';

    if (resultados.length === 0) {
      painelResultados.innerHTML = `<p class="busca__vazio">Nenhum item encontrado para "${escapeTexto(termoOriginal)}".</p>`;
      painelResultados.hidden = false;
      campo.setAttribute('aria-expanded', 'true');
      return;
    }

    const frag = document.createDocumentFragment();
    resultados.forEach((resultado) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'busca__resultado';
      botao.setAttribute('role', 'option');
      botao.innerHTML = `
        <span class="busca__resultado-texto">
          <span class="busca__resultado-nome">${destacarTermo(resultado.nome, termoOriginal)}</span>
          <span class="busca__resultado-categoria">${escapeTexto(resultado.categoriaNome)}</span>
        </span>
        <span class="busca__resultado-valor">${formatarPreco(resultado.valor)}</span>
      `;
      botao.addEventListener('click', () => {
        irParaResultado(resultado);
        campo.value = '';
        botaoLimpar.hidden = true;
        fecharResultadosBusca();
      });
      frag.appendChild(botao);
    });

    painelResultados.appendChild(frag);
    painelResultados.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
  }
}

function destacarTermo(texto, termo) {
  const textoEscapado = escapeTexto(texto);
  if (!termo) return textoEscapado;
  const termoNormalizado = removerAcentos(termo).toLowerCase();
  const textoNormalizado = removerAcentos(texto).toLowerCase();
  const posicao = textoNormalizado.indexOf(termoNormalizado);
  if (posicao === -1) return textoEscapado;

  const antes = escapeTexto(texto.slice(0, posicao));
  const meio = escapeTexto(texto.slice(posicao, posicao + termo.length));
  const depois = escapeTexto(texto.slice(posicao + termo.length));
  return `${antes}<mark>${meio}</mark>${depois}`;
}

// Troca para a categoria do resultado e rola/realça o produto encontrado
function irParaResultado(resultado) {
  ativarCategoria(resultado.categoriaId);

  requestAnimationFrame(() => {
    const elemento = document.getElementById(`produto-${resultado.idProduto}`);
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.classList.remove('is-encontrado');
    // força reflow para reiniciar a animação mesmo em cliques repetidos
    void elemento.offsetWidth;
    elemento.classList.add('is-encontrado');
    setTimeout(() => elemento.classList.remove('is-encontrado'), 1900);
  });
}

/* ---------------------------------------------------------
   FOOTER
--------------------------------------------------------- */
function renderizarFooter(estabelecimento) {
  const listaPagamentos = document.getElementById('lista-pagamentos');
  estabelecimento.formasPagamento.forEach((forma) => {
    const li = document.createElement('li');
    li.className = 'footer__pagamento-item';
    li.innerHTML = `${ICONES[forma.icone] || ''}<span>${escapeTexto(forma.nome)}</span>`;
    listaPagamentos.appendChild(li);
  });

  document.getElementById('footer-endereco').textContent = estabelecimento.endereco;
  document.getElementById('footer-horario').textContent = estabelecimento.horario || '';

  const { whatsapp, whatsappExibicao, telefone } = estabelecimento.contato;
  const linkWhats = document.getElementById('footer-whatsapp');
  linkWhats.textContent = `WhatsApp: ${whatsappExibicao || whatsapp}`;
  linkWhats.href = `https://wa.me/${whatsapp}`;
  linkWhats.target = '_blank';
  linkWhats.rel = 'noopener';

  const linkTel = document.getElementById('footer-telefone');
  linkTel.textContent = `Telefone: ${telefone}`;
  linkTel.href = `tel:${telefone.replace(/\D/g, '')}`;

  const botaoWhats = document.getElementById('botao-whatsapp');
  botaoWhats.href = `https://wa.me/${whatsapp}`;
  botaoWhats.hidden = false;

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
  const painel = document.getElementById('painel-categoria');
  painel.innerHTML = `
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
