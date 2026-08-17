# Cardápio Digital — PWA

Cardápio gastronômico interativo, mobile-first, alimentado 100% por `config.json` (sem conteúdo hardcoded no HTML).

## Estrutura de pastas

```
cardapio-pwa/
├── index.html          # Estrutura semântica (header, nav, main, footer)
├── style.css            # Design system (tokens, layout, componentes)
├── script.js             # Fetch do config.json + renderização dinâmica do DOM
├── config.json           # Fonte única de dados: estabelecimento + categorias + produtos
├── manifest.json          # Metadados do PWA (nome, cores, ícones)
├── sw.js                   # Service worker (cache-first para app shell, network-first para config.json)
├── README.md
└── assets/
    ├── logo.svg              # Logo placeholder (substitua pela logo real)
    ├── cat-cafes.svg          # Imagens ilustrativas de categoria (placeholders SVG)
    ├── cat-panificacao.svg
    ├── cat-pratos.svg
    ├── cat-doces.svg
    └── icons/
        ├── icon-192.png       # Ícone do PWA (instalação)
        └── icon-512.png
```

## Como rodar localmente

Como o `script.js` usa `fetch()` para carregar o `config.json`, é preciso servir os arquivos por HTTP (abrir o `index.html` direto com `file://` bloqueia o fetch em vários navegadores).

```bash
cd cardapio-pwa
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

Qualquer outro servidor estático (Vercel, Netlify, `live-server`, nginx) funciona igual.

## Como manter o cardápio (sem tocar em código)

Todo o conteúdo visível — nome do estabelecimento, categorias, produtos, preços, endereço, redes sociais, formas de pagamento — vem do `config.json`. Para atualizar o cardápio, edite apenas esse arquivo e publique de novo. O `script.js` lê o JSON e monta o DOM automaticamente.

Campos por produto:
- `nome` (obrigatório)
- `descricao` (opcional)
- `valor` (obrigatório, número — ex: `18.50`)
- `destaque` (opcional, `true`/`false` — mostra o selo "Destaque")

## Instalação como app (PWA)

1. Sirva o projeto via HTTPS (obrigatório em produção; `localhost` funciona em dev).
2. No celular, abra no Chrome/Safari → menu → "Adicionar à tela inicial" / "Instalar app".
3. O `sw.js` cacheia o app shell no primeiro acesso, permitindo abrir offline depois.

## Publicando mudanças no visual (HTML/CSS/JS)

Sempre que alterar `index.html`, `style.css` ou `script.js`, incremente `CACHE_VERSION` em `sw.js` (ex: `cardapio-v1` → `cardapio-v2`). Isso garante que clientes que já instalaram o app recebam a versão nova em vez de continuar servindo a versão antiga do cache.

## Personalização rápida

- **Cores**: variáveis no topo de `style.css` (`:root`), seção "DESIGN TOKENS".
- **Fontes**: trocar o `<link>` do Google Fonts no `index.html` e as variáveis `--fonte-*` em `style.css`.
- **Imagens de categoria e logo**: substitua os arquivos em `assets/` mantendo os mesmos nomes, ou aponte para novos arquivos no `config.json`.
- **Ícones do PWA**: gere novos `icon-192.png` e `icon-512.png` (fundo sólido, sem transparência recomendado) e substitua em `assets/icons/`.
