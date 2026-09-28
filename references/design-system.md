# Design system

Todo o visual sai de `src/css/tokens.css`. `app.css` (estrutura, leitor,
fichas, questões, comparador) e `learn.css` (esquemas, Mapa, Treino, Simulado)
só consomem tokens. Se você está escrevendo um valor de cor fora de
`tokens.css`, está no arquivo errado.

## Cor

### Um acento por projeto

Um acento só, para todo o app: navegação ativa, links, anéis de progresso,
botões primários, números destacados. Ele precisa existir em **três** lugares
de `tokens.css`, ou o tema quebra:

```css
:root { --accent: #8A1538; }                                   /* claro */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --accent: #F0909F; } }
:root[data-theme="dark"] { --accent: #F0909F; }                /* alternância manual */
```

O mesmo vale para `--accent-hover`, `--accent-soft` e `--accent-line`.

No escuro o acento **clareia** — um vinho escuro fica ilegível sobre fundo
preto. Regra prática: no claro use o tom saturado e escuro; no escuro use uma
versão dessaturada e clara da mesma família.

### Escolhendo o acento

Que converse com a matéria e seja memorável. O carmim do manual de
bacteriologia referencia a safranina da coloração de Gram — é arbitrário para
quem olha, mas dá coerência.

Evite: roxo/violeta de gradiente de IA, e a família bege + latão + oxblood.
Alternativas que funcionam: verde-floresta, cobalto, terracota, petróleo,
grafite com um único pop saturado.

### Os quatro destaques são semânticos

`--clave` azul · `--examen` âmbar · `--lab` verde · `--alerta` vermelho.

Não os realinhe com o acento. Eles servem para escanear a página rapidamente, e
isso depende de serem distintos entre si **e** do acento. Se o acento escolhido
colidir com um deles (um acento verde brigando com `--lab`), mude o acento.

Cada destaque tem três tokens: `--x`, `--x-bg`, `--x-line`.

Nos módulos de estudo eles mantêm o sentido: `--lab` para certo/compatível,
`--alerta` para errado/armadilha/proposta a criticar, `--examen` para "aceita
se argumentada" e para o cartão do roteiro, `--clave` para respostas-modelo e
gabaritos. No texto anotado por cores (`.ann`), evidência/ligação/descarte usam
`clave`/`lab`/`examen` **sempre com a etiqueta escrita ao lado**: a cor nunca
é a única pista.

### Tons dos eixos

As opções de um eixo (`data/eixos.js`) aparecem como chips (`.cat--accent`,
`.cat--ink`) e botões (`.dopt--accent`, `.dopt--ink`). Um eixo usa o acento, o
outro o neutro, para o aluno ver de relance de qual eixo é cada palavra (ex.:
abordagem no acento, tarefa no neutro). Listas longas (catálogo de erros) usam
`tone: "select"`.

## Tipografia

- **Geist** — interface e títulos
- **Geist Mono** — números, códigos, dados tabulares
- **Source Serif 4** — modo de leitura opcional, ativado nos ajustes

Todas auto-hospedadas em `src/assets/fonts/`. Não troque por fonte de CDN: o
app é offline e a CSP bloqueia.

Serif como padrão é desencorajado, mas o **modo de leitura serif opcional** faz
sentido aqui — é texto corrido longo, e o usuário escolhe.

## Forma

Uma escala de raio, documentada e seguida:

| Elemento | Token | Valor |
|---|---|---|
| painéis, cards, tabelas | `--r-card` | 14 px |
| botões, inputs, selects | `--r-ctl` | 10 px |
| chips, badges, pílulas | `--r-pill` | cheio |

Sombras sempre tingidas com o matiz do fundo, nunca preto puro sobre claro.

## Densidade e leitura

O usuário controla tamanho (14–22 px), entrelinha (1,40–2,10) e largura da
coluna (52–100 caracteres) pelos ajustes. Esses três viram
`--read-size`, `--read-lh`, `--read-measure` e o CSS de prosa os respeita.

Não fixe tamanho de fonte em pixel dentro de `.prose`. Use os tokens.

## Movimento

Contido: transições de 0,16 s com `cubic-bezier(.16, 1, .3, 1)`, virada de
ficha em 0,55 s, e nada mais. Tudo com `prefers-reduced-motion: reduce`
desligando a animação.

Nenhum loop infinito. É uma ferramenta de leitura longa.

## Armadilhas de layout já pagas

- **`<span>` não empilha.** Título e descrição dentro de um card saindo na
  mesma linha = falta `display: block`. Aconteceu em `.action__n/.action__d`,
  `.brand__title/.brand__sub`, `.chap__name`, `.pager__dir/.pager__name`.
- **Tabela larga** precisa rolar dentro do próprio contêiner
  (`.tablescroll { overflow-x: auto }`), nunca deixar a página rolar no eixo X.
- **`min-h-[100dvh]`**, nunca `100vh` — a barra de endereço do mobile quebra.
- **Grid com coluna automática estoura.** `.app` é grid; sem
  `grid-template-columns: minmax(0, 1fr)` e `.topbar { min-width: 0 }`, a barra
  superior larga empurra a página inteira para os lados.
- **Barra superior com muitas abas.** O `app.css` esconde o texto da busca e o
  subtítulo da marca em ≤ 1360 px, os rótulos das abas em ≤ 1180 px (cada
  `.nav__btn` tem `title`) e rola a navegação em ≤ 640 px. Aba nova: meça em
  1100, 1190 e 1370 px se tema e ajustes continuam dentro da tela.
- **Comparador com 4 colunas** cabe na janela padrão (1380 px) com colunas de
  210 px; mais largo que isso, rola dentro do próprio contêiner.
- O tema é **travado para a página inteira**. Nenhuma seção inverte para claro
  no meio de um app escuro.
