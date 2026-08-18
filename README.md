# Cardápio Digital — PWA

Cardápio gastronômico interativo, mobile-first, alimentado 100% por `config.json` (sem conteúdo hardcoded no HTML).

## Estrutura de pastas

```
cardapio-pwa/
├── index.html          # Capa/Início, grade de categorias, painéis, modal e busca
├── style.css             # Design system (papel reciclado + azul marinho + acento terracota)
├── script.js               # Fetch do config.json, roteamento entre views e toda a interação
├── config.json               # Fonte única de dados: estabelecimento + categorias + produtos
├── manifest.json               # Metadados do PWA (nome, cores, ícones)
├── sw.js                         # Service worker (cache-first para app shell, network-first p/ config.json)
├── README.md
└── assets/
    ├── logo.svg
    ├── cat-*.svg              # Imagens de categoria
    ├── icons/                  # Ícones do PWA (192/512)
    └── produtos/                 # Uma imagem por produto (uma foto quadrada substitui o placeholder)
```

## Como rodar localmente

```bash
cd cardapio-pwa
python3 -m http.server 8080
# acesse http://localhost:8080
```

## Arquitetura de navegação

O app tem duas "vistas" principais controladas por `script.js`, sem recarregar a página:

- **Início** (`#inicio`): capa do cardápio — logo, nome, tagline, endereço/horário e atalhos de categoria. É a tela de entrada.
- **Categorias** (`#categorias` ou `#<id-da-categoria>`): mostra a grade de categorias (visão geral) ou, ao selecionar uma, o painel daquela categoria com a lista de produtos. Cada categoria tem uma URL própria (ex: `#cafes-especiais`), então dá pra compartilhar o link direto.

Navegação disponível em dois formatos:
- **Mobile**: bottom nav fixa (Início / Categorias / Buscar / Avaliar).
- **Desktop**: topbar com links + sidebar fixa listando as categorias.

## Busca

Ícone de lupa (topbar no desktop, bottom nav no mobile) abre um overlay de busca. Filtra por **nome, código e descrição** (ignorando acentuação) em tempo real. Ao clicar num resultado, o app troca para a categoria correta, rola até o produto e o destaca por alguns segundos.

## Modal de produto

Clicar em qualquer item da lista abre uma janela flutuante com: imagem ampliada, código, nome, selos (vegano, contém cafeína, sem glúten etc.), descrição, detalhes adicionais (campo opcional `detalhes`) e valor — além de um botão que abre o WhatsApp com uma mensagem pré-preenchida pedindo aquele item.

## Como manter o cardápio (sem tocar em código)

Edite apenas o `config.json`. Campos por produto:

| Campo        | Obrigatório | Descrição |
|--------------|:-----------:|-----------|
| `codigo`     | não | Código do item exibido na lista e no modal (ex: `"C01"`) |
| `nome`       | sim | Nome do produto |
| `descricao`  | não | Descrição curta, aparece na lista e no modal |
| `detalhes`   | não | Texto mais longo, aparece só no modal |
| `valor`      | sim | Número (ex: `18.50`) |
| `imagem`     | não | Caminho da foto do produto; sem ela, usa a imagem da categoria |
| `tags`       | não | Array com selos: `vegano`, `vegetariano`, `cafeina`, `semGluten`, `semLactose`, `apimentado`, `doce`, `salgado` |
| `destaque`   | não | `true` mostra o selo "Destaque" |

No nível do estabelecimento, o campo `avaliacaoUrl` define para onde o botão "Avaliar" (topbar e bottom nav) redireciona — normalmente o link de avaliação do Google Maps do estabelecimento.

## Instalação como app (PWA)

1. Sirva o projeto via HTTPS (obrigatório em produção; `localhost` funciona em dev).
2. No celular, abra no Chrome/Safari → menu → "Adicionar à tela inicial" / "Instalar app".
3. O `sw.js` cacheia o app shell (incluindo as imagens de produto) no primeiro acesso, permitindo abrir offline depois.

## Publicando mudanças

Sempre que alterar `index.html`, `style.css`, `script.js` **ou adicionar/trocar imagens**, incremente `CACHE_VERSION` em `sw.js` (ex: `cardapio-v3` → `cardapio-v4`) e adicione o novo arquivo à lista `APP_SHELL`. Isso garante que clientes que já instalaram o app recebam a versão nova.

## Personalização rápida

- **Cores**: variáveis no topo de `style.css` (`:root`).
- **Fotos dos produtos**: substitua os SVGs em `assets/produtos/` por fotos reais (JPG/WEBP quadradas funcionam bem) e atualize o campo `imagem` de cada produto no `config.json`.
- **Selos/tags**: para adicionar um novo tipo de selo, inclua um ícone em `ICONES_TAGS` no `script.js` e use a mesma chave no array `tags` do produto.
