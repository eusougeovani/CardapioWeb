# Cardápio Digital — PWA

Cardápio gastronômico interativo, mobile-first, alimentado 100% por `config.json` (sem conteúdo hardcoded no HTML). Início é uma tela única, sem rolagem — no estilo de apps de delivery.

## Estrutura de pastas

```
cardapio-pwa/
├── index.html          # Início (tela única), grade de categorias, painéis, modal, busca e Informações
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
    └── produtos/                 # Uma imagem por produto (troque pelos placeholders por fotos reais)
```

## Como rodar localmente

```bash
cd cardapio-pwa
python3 -m http.server 8080
# acesse http://localhost:8080
```

## Arquitetura de navegação

Duas "vistas" principais controladas por `script.js`, sem recarregar a página:

- **Início** (`#inicio`): tela única — logo, nome, tagline, botão "Ver cardápio" e os carrosséis de destaque ("Pratos do dia" e "Mais pedidos"). Cabe inteira na tela, sem precisar rolar.
- **Categorias** (`#categorias` ou `#<id-da-categoria>`): grade de categorias (visão geral) ou, ao selecionar uma, o painel daquela categoria com a lista de produtos. Cada categoria tem URL própria (ex: `#cafes-especiais`), então dá pra compartilhar o link direto.

Navegação em dois formatos:
- **Mobile**: bottom nav fixa com 4 ações — Início / Categorias / Buscar / Informações.
- **Desktop**: topbar com links (Início/Categorias) + ícone de busca + botão Informações, e sidebar fixa listando as categorias.

## Destaques da Início: Pratos do dia & Mais pedidos

Os carrosséis da tela inicial são preenchidos automaticamente a partir de duas flags por produto no `config.json`:

```json
{ "codigo": "C02", "nome": "Filtrado V60", "pratoDoDia": true, ... }
{ "codigo": "C01", "nome": "Espresso Duplo", "maisPedido": true, ... }
```

Um produto pode ter as duas flags, nenhuma, ou só uma. Se nenhum produto tiver `pratoDoDia`, a seção some sozinha da tela inicial (mesma lógica para `maisPedido`). Clicar num card do carrossel abre direto o modal daquele produto.

## Busca

O ícone de lupa (topbar no desktop, bottom nav no mobile) abre uma área dedicada de busca — em branco até o cliente digitar. Filtra por **nome, código e descrição** (ignorando acentuação) em tempo real. Ao clicar num resultado, o app troca para a categoria correta, rola até o produto e o destaca por alguns segundos.

## Modal de produto

Clicar em qualquer item (na lista, no carrossel ou na busca) abre uma janela flutuante com: imagem ampliada, código, nome, selos (vegano, contém cafeína, sem glúten etc.), descrição, detalhes adicionais (campo opcional `detalhes`) e valor — além de um botão que abre o WhatsApp com mensagem pré-preenchida pedindo aquele item.

## Informações do estabelecimento

O botão "Informações" (topbar no desktop, bottom nav no mobile) abre uma aba com tudo que antes ficava num rodapé fixo: endereço, horário, contato, redes sociais, formas de pagamento — e um botão "Avaliar estabelecimento" que leva ao link definido em `avaliacaoUrl`.

## Como manter o cardápio (sem tocar em código)

Edite apenas o `config.json`. Campos por produto:

| Campo         | Obrigatório | Descrição |
|---------------|:-----------:|-----------|
| `codigo`      | não | Código do item exibido na lista e no modal (ex: `"C01"`) |
| `nome`        | sim | Nome do produto |
| `descricao`   | não | Descrição curta, aparece na lista e no modal |
| `detalhes`    | não | Texto mais longo, aparece só no modal |
| `valor`       | sim | Número (ex: `18.50`) |
| `imagem`      | não | Caminho da foto do produto; sem ela, usa a imagem da categoria |
| `tags`        | não | Array com selos: `vegano`, `vegetariano`, `cafeina`, `semGluten`, `semLactose`, `apimentado`, `doce`, `salgado` |
| `destaque`    | não | `true` mostra o selo "Destaque" na lista |
| `pratoDoDia`  | não | `true` inclui o item no carrossel "Pratos do dia" da Início |
| `maisPedido`  | não | `true` inclui o item no carrossel "Mais pedidos" da Início |

No nível do estabelecimento, `avaliacaoUrl` define o link do botão "Avaliar estabelecimento" dentro da aba Informações.

## Instalação como app (PWA)

1. Sirva o projeto via HTTPS (obrigatório em produção; `localhost` funciona em dev).
2. No celular, abra no Chrome/Safari → menu → "Adicionar à tela inicial" / "Instalar app".
3. O `sw.js` cacheia o app shell (incluindo as imagens de produto) no primeiro acesso, permitindo abrir offline depois.

## Publicando mudanças

Sempre que alterar `index.html`, `style.css`, `script.js` **ou adicionar/trocar imagens**, incremente `CACHE_VERSION` em `sw.js` e adicione o novo arquivo à lista `APP_SHELL`. Isso garante que clientes que já instalaram o app recebam a versão nova.

## Personalização rápida

- **Cores**: variáveis no topo de `style.css` (`:root`).
- **Fotos dos produtos**: substitua os SVGs em `assets/produtos/` por fotos reais (JPG/WEBP quadradas funcionam bem) e atualize o campo `imagem` de cada produto no `config.json`.
- **Selos/tags**: para adicionar um novo tipo de selo, inclua um ícone em `ICONES_TAGS` no `script.js` e use a mesma chave no array `tags` do produto.
