/**
 * Cardápio Digital — script.js
 * Fetch do config.json + renderização dinâmica.
 * Início é tela única: apresentação + carrosséis de "Pratos do dia" e
 * "Mais pedidos" (definidos via tags no config.json). Categorias, busca
 * (área dedicada) e Informações do estabelecimento vivem em views/overlays
 * próprios, sem depender de rolagem na tela inicial.
 */

const CONFIG_URL = 'config.json';
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const ICONES = {
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.25-1.55 1.57-1.55h1.68V3.3C15.9 3.2 15 3.13 14 3.13c-2.4 0-4.05 1.47-4.05 4.15v2.5H7.25v3.2H10V21h3.5z"/></svg>',
  pix: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3.5 3.5 8a3 3 0 0 0 0 4.2L8 16.7M16 3.5 20.5 8a3 3 0 0 1 0 4.2L16 16.7M12 7l-4 4 4 4 4-4-4-4Z"/></svg>',
  cartao: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/></svg>',
  dinheiro: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>'
};

// Vocabulário de selos/símbolos do produto: ícone + rótulo em pt-BR.
const ICONES_TAGS = {
  vegano: { rotulo: 'Vegano', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 20c8-1 12-6 13-14-8 1-13 5-13 14Z"/><path d="M6 19c2-3 4-6 9-11"/></svg>' },
  vegetariano: { rotulo: 'Vegetariano', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M8 13c0-3 1.8-5 4-5s4 2 4 5-1.8 4-4 4-4-1-4-4Z"/></svg>' },
  cafeina: { rotulo: 'Contém cafeína', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c0 1-1.2 1.2-1.2 2.2S8 7 8 8M12 3.5c0 1-1.2 1.2-1.2 2.2S12 7 12 8"/></svg>' },
  semGluten: { rotulo: 'Sem glúten', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3c1 3-2 4-2 7s3 4 2 7"/><path d="M12 3c-1 3 2 4 2 7s-3 4-2 7"/><path d="m4 4 16 16"/></svg>' },
  semLactose: { rotulo: 'Sem lactose', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 2h6v3.5L17 9v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3.5V2Z"/><path d="m4 4 16 16"/></svg>' },
  apimentado: { rotulo: 'Apimentado', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 10c-1.5 1.5-2 6 1 8.5 3 2.4 8 .8 9.5-2.5 1.3-3-1-5-2.5-4.5"/><path d="M8 9c2-3.5 5.5-5.5 9-5-1 2-.5 3.5.5 4-3 1-6.5.5-9.5 1Z"/></svg>' },
  doce: { rotulo: 'Doce', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2v3M12 19v3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/><circle cx="12" cy="12" r="5"/></svg>' },
  salgado: { rotulo: 'Salgado', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="10" width="16" height="9" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>' }
};

// Estado em memória
let ESTABELECIMENTO = null;
let CATEGORIAS = [];
let PRODUTOS_ACHATADOS = []; // [{ categoria, produto, idProduto, imagem }]
let INDICE_BUSCA = [];
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

    ESTABELECIMENTO = dados.estabelecimento;
    CATEGORIAS = dados.categorias;
    PRODUTOS_ACHATADOS = achatarProdutos(CATEGORIAS);

    renderizarMarca(ESTABELECIMENTO);
    renderizarCapa(ESTABELECIMENTO);
    renderizarCarrosseis(PRODUTOS_ACHATADOS);
    construirIndiceBusca(PRODUTOS_ACHATADOS);
    renderizarSidebar(CATEGORIAS);
    renderizarGradeCategorias(CATEGORIAS);
    renderizarPaineis(CATEGORIAS);
    preencherInformacoes(ESTABELECIMENTO);

    configurarNavegacaoPrincipal();
    configurarBusca();
    configurarModalProduto();
    configurarInformacoes();

    aplicarRota(location.hash.replace('#', ''));
    window.addEventListener('hashchange', () => aplicarRota(location.hash.replace('#', '')));
  } catch (erro) {
    console.error('Erro ao montar o cardápio:', erro);
    renderizarErro();
  }
}

/* ---------------------------------------------------------
   ACHATAMENTO DE PRODUTOS — fonte única para busca e carrosséis
--------------------------------------------------------- */
function achatarProdutos(categorias) {
  const lista = [];
  categorias.forEach((categoria) => {
    categoria.produtos.forEach((produto, i) => {
      lista.push({
        categoria,
        produto,
        idProduto: `${categoria.id}__${i}`,
        imagem: produto.imagem || categoria.imagem
      });
    });
  });
  return lista;
}

/* ---------------------------------------------------------
   MARCA (topbar) e CAPA (Início)
--------------------------------------------------------- */
function renderizarMarca(estabelecimento) {
  const logoTopo = document.getElementById('logo-estabelecimento');
  logoTopo.src = estabelecimento.logo;
  logoTopo.alt = `Logo de ${estabelecimento.nome}`;
  document.getElementById('nome-estabelecimento').textContent = estabelecimento.nome;
  document.getElementById('tagline-estabelecimento').textContent = estabelecimento.tagline || '';
  document.title = estabelecimento.nome;
}

function renderizarCapa(estabelecimento) {
  document.getElementById('capa-logo').src = estabelecimento.logo;
  document.getElementById('capa-logo').alt = `Logo de ${estabelecimento.nome}`;
  document.getElementById('capa-nome').textContent = estabelecimento.nome;
  document.getElementById('capa-tagline').textContent = estabelecimento.tagline || '';
}

/* ---------------------------------------------------------
   CARROSSÉIS DE DESTAQUE (Pratos do dia / Mais pedidos)
--------------------------------------------------------- */
function renderizarCarrosseis(produtosAchatados) {
  renderizarUmCarrossel(
    'secao-pratos-dia', 'carrossel-pratos-dia',
    produtosAchatados.filter((p) => p.produto.pratoDoDia)
  );
  renderizarUmCarrossel(
    'secao-mais-pedidos', 'carrossel-mais-pedidos',
    produtosAchatados.filter((p) => p.produto.maisPedido)
  );
}

function renderizarUmCarrossel(idSecao, idLista, itens) {
  const secao = document.getElementById(idSecao);
  if (itens.length === 0) { secao.hidden = true; return; }

  const lista = document.getElementById(idLista);
  const frag = document.createDocumentFragment();

  itens.forEach(({ categoria, produto, imagem }) => {
    const cartao = document.createElement('button');
    cartao.type = 'button';
    cartao.className = 'cartao-carrossel';
    cartao.innerHTML = `
      <img class="cartao-carrossel__imagem" src="${escapeAtributo(imagem)}" alt="" loading="lazy">
      <span class="cartao-carrossel__corpo">
        <span class="cartao-carrossel__nome">${escapeTexto(produto.nome)}</span>
        <span class="cartao-carrossel__valor">${formatarPreco(produto.valor)}</span>
      </span>
    `;
    cartao.addEventListener('click', () => abrirModalProduto(produto, categoria.nome, categoria.imagem));
    frag.appendChild(cartao);
  });

  lista.appendChild(frag);
  secao.hidden = false;
}

/* ---------------------------------------------------------
   NAVEGAÇÃO PRINCIPAL — topbar, bottom nav e CTA da capa
--------------------------------------------------------- */
function configurarNavegacaoPrincipal() {
  document.getElementById('botao-ir-inicio').addEventListener('click', irParaInicio);
  document.getElementById('botao-ver-cardapio').addEventListener('click', irParaCategorias);
  document.getElementById('sidebar-inicio').addEventListener('click', irParaInicio);

  document.querySelectorAll('[data-vista]').forEach((elemento) => {
    elemento.addEventListener('click', () => {
      const vista = elemento.dataset.vista;
      if (vista === 'inicio') irParaInicio();
      else irParaCategorias();
    });
  });
}

function irParaInicio() {
  history.replaceState(null, '', '#inicio');
  aplicarRota('inicio');
}
function irParaCategorias() {
  history.replaceState(null, '', '#categorias');
  aplicarRota('categorias');
}
function selecionarCategoria(id) {
  history.replaceState(null, '', `#${id}`);
  aplicarRota(id);
}

// Único ponto que efetivamente manipula o DOM de navegação — usado tanto
// pelas funções acima quanto pelo evento hashchange (sem duplicar histórico).
function aplicarRota(alvo) {
  const ehCategoriaValida = CATEGORIAS.some((c) => c.id === alvo);

  if (ehCategoriaValida) {
    mostrarVista('categorias');
    categoriaAtivaId = alvo;
  } else if (alvo === 'categorias') {
    mostrarVista('categorias');
    categoriaAtivaId = null;
  } else {
    mostrarVista('inicio');
    categoriaAtivaId = null;
  }

  document.getElementById('grade-categorias').hidden = categoriaAtivaId !== null;
  document.querySelectorAll('.categoria-painel').forEach((painel) => {
    painel.hidden = painel.id !== categoriaAtivaId;
  });
  document.querySelectorAll('.item-sidebar').forEach((el) => {
    el.classList.toggle('is-ativo', el.dataset.alvo === categoriaAtivaId);
  });

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function mostrarVista(nome) {
  document.getElementById('vista-inicio').hidden = nome !== 'inicio';
  document.getElementById('vista-cardapio').hidden = nome !== 'categorias';
  document.querySelectorAll('.topbar__link, .bottom-nav__item[data-vista]').forEach((el) => {
    el.classList.toggle('is-ativo', el.dataset.vista === nome);
  });
}

/* ---------------------------------------------------------
   SIDEBAR (desktop)
--------------------------------------------------------- */
function renderizarSidebar(categorias) {
  const sidebar = document.getElementById('sidebar-lista');
  const frag = document.createDocumentFragment();

  categorias.forEach((categoria, indice) => {
    const numero = ROMANOS[indice] || String(indice + 1).padStart(2, '0');
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'item-sidebar';
    item.dataset.alvo = categoria.id;
    item.innerHTML = `<span class="item-sidebar__numero">${numero}</span><span>${escapeTexto(categoria.nome)}</span>`;
    item.addEventListener('click', () => selecionarCategoria(categoria.id));
    frag.appendChild(item);
  });

  sidebar.appendChild(frag);
}

/* ---------------------------------------------------------
   GRADE DE CATEGORIAS (visão geral)
--------------------------------------------------------- */
function renderizarGradeCategorias(categorias) {
  const lista = document.getElementById('grade-categorias-lista');
  const frag = document.createDocumentFragment();

  categorias.forEach((categoria, indice) => {
    const numero = ROMANOS[indice] || String(indice + 1).padStart(2, '0');
    const cartao = document.createElement('button');
    cartao.type = 'button';
    cartao.className = 'cartao-categoria';
    cartao.innerHTML = `
      <img class="cartao-categoria__imagem" src="${escapeAtributo(categoria.imagem)}" alt="" loading="lazy">
      <span class="cartao-categoria__corpo">
        <span class="cartao-categoria__numero">CAPÍTULO ${numero}</span>
        <span class="cartao-categoria__nome">${escapeTexto(categoria.nome)}</span>
        <span class="cartao-categoria__contagem">${categoria.produtos.length} itens</span>
      </span>
    `;
    cartao.addEventListener('click', () => selecionarCategoria(categoria.id));
    frag.appendChild(cartao);
  });

  lista.appendChild(frag);
}

/* ---------------------------------------------------------
   PAINÉIS DE CATEGORIA + LISTA DE PRODUTOS
--------------------------------------------------------- */
function renderizarPaineis(categorias) {
  const painel = document.getElementById('painel-categoria');
  document.getElementById('estado-carregando')?.remove();

  const frag = document.createDocumentFragment();
  categorias.forEach((categoria, indice) => frag.appendChild(construirPainelCategoria(categoria, indice)));
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
    <button type="button" class="categoria-painel__voltar">&larr; Categorias</button>
    <div class="categoria-painel__cabecalho">
      <img class="categoria-painel__imagem" src="${escapeAtributo(categoria.imagem)}" alt="" loading="lazy">
      <div>
        <span class="categoria-painel__numero">CAPÍTULO ${numero}</span>
        <h2 class="categoria-painel__titulo" id="titulo-${categoria.id}">${escapeTexto(categoria.nome)}</h2>
        ${categoria.descricao ? `<p class="categoria-painel__descricao">${escapeTexto(categoria.descricao)}</p>` : ''}
      </div>
    </div>
    <div class="lista-produtos"></div>
  `;

  secao.querySelector('.categoria-painel__voltar').addEventListener('click', irParaCategorias);

  const lista = secao.querySelector('.lista-produtos');
  categoria.produtos.forEach((produto, i) => {
    lista.appendChild(construirItemProduto(produto, `${categoria.id}__${i}`, categoria.nome, categoria.imagem));
  });

  return secao;
}

function construirItemProduto(produto, idProduto, categoriaNome, imagemCategoriaFallback) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'produto';
  item.id = `produto-${idProduto}`;

  const tagsIcones = (produto.tags || []).slice(0, 3)
    .filter((chave) => ICONES_TAGS[chave])
    .map((chave) => `<span title="${escapeAtributo(ICONES_TAGS[chave].rotulo)}">${ICONES_TAGS[chave].svg}</span>`)
    .join('');

  item.innerHTML = `
    <img class="produto__miniatura" src="${escapeAtributo(produto.imagem || imagemCategoriaFallback)}" alt="" loading="lazy">
    <span class="produto__info">
      <span class="produto__cabecalho">
        ${produto.codigo ? `<span class="produto__codigo">#${escapeTexto(produto.codigo)}</span>` : ''}
        <span class="produto__nome">${escapeTexto(produto.nome)}</span>
        ${produto.destaque ? '<span class="produto__selo">Destaque</span>' : ''}
      </span>
      ${produto.descricao ? `<span class="produto__descricao">${escapeTexto(produto.descricao)}</span>` : ''}
      ${tagsIcones ? `<span class="produto__tags-mini">${tagsIcones}</span>` : ''}
    </span>
    <span class="produto__valor">${formatarPreco(produto.valor)}</span>
  `;

  item.addEventListener('click', () => abrirModalProduto(produto, categoriaNome, imagemCategoriaFallback));
  return item;
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ---------------------------------------------------------
   MODAL DE PRODUTO (janela flutuante)
--------------------------------------------------------- */
function configurarModalProduto() {
  const overlay = document.getElementById('produto-overlay');
  const botaoFechar = document.getElementById('botao-fechar-produto');

  botaoFechar.addEventListener('click', fecharModalProduto);
  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fecharModalProduto();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !overlay.hidden) fecharModalProduto();
  });
}

function abrirModalProduto(produto, categoriaNome, imagemFallback) {
  document.getElementById('modal-produto-imagem').src = produto.imagem || imagemFallback;
  document.getElementById('modal-produto-imagem').alt = produto.nome;
  document.getElementById('modal-produto-codigo').textContent = produto.codigo ? `#${produto.codigo} · ${categoriaNome}` : categoriaNome;
  document.getElementById('modal-produto-nome').textContent = produto.nome;
  document.getElementById('modal-produto-descricao').textContent = produto.descricao || '';
  document.getElementById('modal-produto-detalhes').textContent = produto.detalhes || '';
  document.getElementById('modal-produto-valor').textContent = formatarPreco(produto.valor);

  const containerTags = document.getElementById('modal-produto-tags');
  containerTags.innerHTML = (produto.tags || [])
    .filter((chave) => ICONES_TAGS[chave])
    .map((chave) => `<span class="chip-tag">${ICONES_TAGS[chave].svg}${escapeTexto(ICONES_TAGS[chave].rotulo)}</span>`)
    .join('');

  const linkWhats = document.getElementById('modal-produto-whatsapp');
  if (ESTABELECIMENTO?.contato?.whatsapp) {
    const mensagem = encodeURIComponent(`Olá! Gostaria de pedir: ${produto.nome}${produto.codigo ? ` (#${produto.codigo})` : ''}.`);
    linkWhats.href = `https://wa.me/${ESTABELECIMENTO.contato.whatsapp}?text=${mensagem}`;
    linkWhats.hidden = false;
  } else {
    linkWhats.hidden = true;
  }

  document.getElementById('produto-overlay').hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('botao-fechar-produto').focus();
}

function fecharModalProduto() {
  document.getElementById('produto-overlay').hidden = true;
  document.body.style.overflow = '';
}

/* ---------------------------------------------------------
   ÍNDICE DE BUSCA
--------------------------------------------------------- */
function construirIndiceBusca(produtosAchatados) {
  INDICE_BUSCA = produtosAchatados.map(({ categoria, produto, idProduto, imagem }) => ({
    idProduto,
    categoriaId: categoria.id,
    categoriaNome: categoria.nome,
    nome: produto.nome,
    codigo: produto.codigo || '',
    valor: produto.valor,
    imagem,
    chaveBusca: removerAcentos(`${produto.codigo || ''} ${produto.nome} ${produto.descricao || ''}`).toLowerCase()
  }));
}

function removerAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* ---------------------------------------------------------
   BUSCA EM ÁREA DEDICADA — abre em branco, filtra e redireciona até o item
--------------------------------------------------------- */
function configurarBusca() {
  const overlay = document.getElementById('busca-overlay');
  const campo = document.getElementById('campo-busca');
  const painelResultados = document.getElementById('busca-resultados');
  const estadoInicialHTML = painelResultados.innerHTML;

  document.getElementById('botao-abrir-busca').addEventListener('click', abrirBusca);
  document.getElementById('botao-abrir-busca-mobile').addEventListener('click', abrirBusca);
  document.getElementById('botao-fechar-busca').addEventListener('click', fecharBusca);

  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fecharBusca();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !overlay.hidden) fecharBusca();
  });

  campo.addEventListener('input', () => {
    const termo = campo.value.trim();
    if (termo.length === 0) {
      painelResultados.innerHTML = estadoInicialHTML;
      return;
    }
    const termoNormalizado = removerAcentos(termo).toLowerCase();
    const encontrados = INDICE_BUSCA.filter((p) => p.chaveBusca.includes(termoNormalizado)).slice(0, 10);
    renderizarResultadosBusca(encontrados, termo);
  });

  function abrirBusca() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    campo.value = '';
    painelResultados.innerHTML = estadoInicialHTML;
    setTimeout(() => campo.focus(), 30);
  }

  function fecharBusca() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function renderizarResultadosBusca(resultados, termoOriginal) {
    if (resultados.length === 0) {
      painelResultados.innerHTML = `<p class="busca__vazio">Nenhum item encontrado para "${escapeTexto(termoOriginal)}".</p>`;
      return;
    }

    painelResultados.innerHTML = '';
    const frag = document.createDocumentFragment();
    resultados.forEach((resultado) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'busca__resultado';
      botao.innerHTML = `
        <img class="busca__resultado-miniatura" src="${escapeAtributo(resultado.imagem)}" alt="" loading="lazy">
        <span class="busca__resultado-texto">
          <span class="busca__resultado-cabecalho">
            ${resultado.codigo ? `<span class="busca__resultado-codigo">#${escapeTexto(resultado.codigo)}</span>` : ''}
            <span class="busca__resultado-nome">${destacarTermo(resultado.nome, termoOriginal)}</span>
          </span>
          <span class="busca__resultado-categoria">${escapeTexto(resultado.categoriaNome)}</span>
        </span>
        <span class="busca__resultado-valor">${formatarPreco(resultado.valor)}</span>
      `;
      botao.addEventListener('click', () => {
        fecharBusca();
        irParaResultado(resultado);
      });
      frag.appendChild(botao);
    });
    painelResultados.appendChild(frag);
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

// Troca para a categoria do resultado e rola/realça o item encontrado na lista
function irParaResultado(resultado) {
  selecionarCategoria(resultado.categoriaId);

  requestAnimationFrame(() => {
    const elemento = document.getElementById(`produto-${resultado.idProduto}`);
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.classList.remove('is-encontrado');
    void elemento.offsetWidth; // reinicia a animação mesmo em buscas repetidas
    elemento.classList.add('is-encontrado');
    setTimeout(() => elemento.classList.remove('is-encontrado'), 1900);
  });
}

/* ---------------------------------------------------------
   INFORMAÇÕES DO ESTABELECIMENTO (overlay)
--------------------------------------------------------- */
function preencherInformacoes(estabelecimento) {
  document.getElementById('info-logo').src = estabelecimento.logo;
  document.getElementById('info-logo').alt = `Logo de ${estabelecimento.nome}`;
  document.getElementById('info-nome').textContent = estabelecimento.nome;
  document.getElementById('info-tagline').textContent = estabelecimento.tagline || '';

  document.getElementById('info-endereco').textContent = estabelecimento.endereco || '';
  document.getElementById('info-horario').textContent = estabelecimento.horario || '';

  const { whatsapp, whatsappExibicao, telefone } = estabelecimento.contato;
  const linkWhats = document.getElementById('info-whatsapp');
  linkWhats.textContent = `WhatsApp: ${whatsappExibicao || whatsapp}`;
  linkWhats.href = `https://wa.me/${whatsapp}`;

  const linkTel = document.getElementById('info-telefone');
  linkTel.textContent = `Telefone: ${telefone}`;
  linkTel.href = `tel:${telefone.replace(/\D/g, '')}`;

  const containerRedes = document.getElementById('info-redes');
  (estabelecimento.redesSociais || []).forEach((rede) => {
    const a = document.createElement('a');
    a.className = 'info-painel__rede-link';
    a.href = rede.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', rede.nome);
    a.innerHTML = ICONES[rede.icone] || rede.nome[0];
    containerRedes.appendChild(a);
  });

  const listaPagamentos = document.getElementById('info-pagamentos');
  estabelecimento.formasPagamento.forEach((forma) => {
    const li = document.createElement('li');
    li.className = 'info-painel__pagamento-item';
    li.innerHTML = `${ICONES[forma.icone] || ''}<span>${escapeTexto(forma.nome)}</span>`;
    listaPagamentos.appendChild(li);
  });

  const linkAvaliar = document.getElementById('info-link-avaliar');
  if (estabelecimento.avaliacaoUrl) {
    linkAvaliar.href = estabelecimento.avaliacaoUrl;
    linkAvaliar.hidden = false;
  }
}

function configurarInformacoes() {
  const overlay = document.getElementById('info-overlay');

  const abrir = () => {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const fechar = () => {
    overlay.hidden = true;
    document.body.style.overflow = '';
  };

  document.getElementById('botao-informacoes-desktop').addEventListener('click', abrir);
  document.getElementById('botao-informacoes-mobile').addEventListener('click', abrir);
  document.getElementById('botao-fechar-info').addEventListener('click', fechar);

  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fechar();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !overlay.hidden) fechar();
  });
}

/* ---------------------------------------------------------
   ESTADO DE ERRO
--------------------------------------------------------- */
function renderizarErro() {
  const painel = document.getElementById('painel-categoria') || document.getElementById('conteudo');
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
