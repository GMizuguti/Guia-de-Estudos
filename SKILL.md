---
name: manual-de-estudo
description: Transforma um PDF, apostila ou conjunto de slides de uma matéria em um aplicativo de estudo offline (Tauri + WebView2) com leitor completo, treino com resposta escrita e autoavaliação, mapa de revisão com esquemas clicáveis, simulado do professor com relógio e gabarito, fichas de repetição espaçada, banco de questões, comparador e busca global. Use quando o usuário quiser estudar um material, pedir um "app de estudo", "manual interativo", "guia de revisão", entregar um PDF de matéria dizendo que precisa aprender/decorar aquilo para uma prova, ou pedir para acrescentar um simulado/lista de exercícios a um app já feito.
---

# Manual de estudo a partir de um material

Gera um app de desktop que contém **todo** o material original, mais as
ferramentas de estudo em cima dele. Roda 100 % offline: fontes, ícones e dados
vão embutidos no binário. O template vem em **português (pt-BR)**.

## As três regras que não se negociam

**1. Fidelidade total ao original.** O objetivo é estudar para uma prova sobre
*aquele* material, não sobre o assunto em geral.

- Não resuma, não corte, não "melhore" o texto do manual.
- Não corrija o conteúdo contra fontes externas, nem que esteja desatualizado.
  O aluno será avaliado pelo que o professor deu. Ressalva vai no rodapé
  (`meta.footerNote`), não no corpo.
- Preserve a pontuação do original, travessões inclusive. A regra que proíbe
  travessão vale para o texto que **você** escreve, não para o transcrito.
- Ao final, rode a **checagem de cobertura linha a linha** (passo 7).

**2. Tudo o que o app acrescenta aparece marcado como do app.** O aluno precisa
saber o que é do professor e o que não é.

- Esquemas no manual saem com a moldura "Esquema do app · não está no material"
  (bloco `figure`). O Mapa inteiro se apresenta como "condensado pelo app".
- Respostas-modelo escritas por você levam a etiqueta "escrita pelo app";
  exercícios extras ficam na subaba "Extras", com aviso.
- Divergência entre dois materiais do mesmo professor (ex.: o simulado aceita
  uma resposta que o guia recusa): transcreva os dois como estão e ponha uma
  `appNote` ("Nota do app, não está no PDF: …") junto do trecho. Avise o
  usuário na resposta final.

**3. Zero etapa de build no frontend.** O `src/` é HTML, CSS e JS clássicos que
o Tauri serve direto.

- Nada de `import`/`export`: `<script>` comum e o namespace global `window.BACT`.
  Permite abrir o `index.html` no navegador e satisfaz a CSP do Tauri.
- Nada de npm, bundler, TypeScript ou CDN. Fontes e ícones já estão em `src/assets/`.
- Se algo parecer "faltando modernização", não é descuido: é o requisito.

## Fluxo

### 1. Extrair

```bash
python -X utf8 tools/extract-pdf.py "material.pdf" "<scratchpad>/material"
```

Gera `texto.txt` (layout), `tabelas.txt` (tabelas célula por célula, via
PyMuPDF), `enfase.txt` (negrito, itálico, cor) e `pNN.png` (cada página).
Requer `pip install pymupdf`. Sem PDF (slides, .docx), converta antes.

### 2. Ler o material inteiro, antes de escrever qualquer coisa

Leia o `texto.txt` do começo ao fim. Não comece a codar pelo capítulo 1.

**Tabelas: nunca monte `rows` a partir do `pdftotext`.** Ele desalinha colunas
e desloca linhas sem avisar, produzindo conteúdo **errado**, não faltante (já
trocou o nível de dificuldade de questões inteiras). Use `tabelas.txt` e
confira a tabela na imagem da página. Tabela que atravessa página vira uma só.

**Ênfase:** `enfase.txt` mostra os destaques. Parágrafo com início em negrito
("**Cuidado:** …") mantém o negrito; texto em vermelho vira `callout` `alerta`;
bloco recuado em itálico (citação, exemplo) vira `aside` com `<em>`.

Depois de ler, planeje: capítulos e seções, o que é anexo, quais entidades são
comparáveis, e **como a prova é corrigida** (passo 6).

### 3. Instanciar o template

Copie `template/` para a pasta do projeto e troque os placeholders `{{...}}`:

| Placeholder | Onde | Exemplo |
|---|---|---|
| `{{SLUG}}` | `js/store.js`, `js/app.js` | `calculo2` · **único por matéria**, é a chave do `localStorage` |
| `{{TITULO_COMPLETO}}` | `index.html`, `tauri.conf.json`, `lib.rs`, `meta.js` | `Manual de Cálculo II` |
| `{{NOME_PRODUTO_ASCII}}` | `tauri.conf.json` → `productName` | `Calculo II` (sem acento: vira nome de binário) |
| `{{com.exemplo.materia}}` | `tauri.conf.json` → `identifier` | `com.gusta.calculo2` |
| `{{DESCRICAO_CURTA}}` / `{{DESCRICAO_LONGA}}` / `{{AUTOR}}` / `{{COPYRIGHT}}` | `Cargo.toml`, `tauri.conf.json`, `index.html` | |

Reescreva `src/data/meta.js` inteiro: identidade, `brandIcon`, `words`
(vocabulário: "Capítulo" ou "Seção", "manual" ou "guia"), `searchHints`,
`legend`, `examDate`/`roteiro`. Troque o acento em `src/css/tokens.css` (três
lugares) e gere os ícones com a mesma cor:

```bash
powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1 -Accent "#1F5E3D" -Glyph "C2"
```

**Idioma:** a interface fala a língua do material. Material em outra língua:
traduza as strings de `index.html` e de todos os `js/*.js` (app, render,
search, treino, simulado, mapa, figures) e `languages` do NSIS em
`tauri.conf.json` (`"PortugueseBR"`, `"Spanish"`, `"English"`…).

### 4. Escrever o conteúdo

Um arquivo por capítulo em `src/data/` (`c01.js`, `c02.js`, …), com `<script>`
em `index.html` na ordem. Esquema dos **12 tipos de bloco** e de todos os
arquivos de dados: **`references/esquema-de-dados.md`**. `template/src/data/`
é um exemplo funcional de tudo.

- Numere como o original: se o material diz "seção 4.4", o capítulo 4 tem a
  seção de `num: "4.4"`. Os textos se referem uns aos outros por esse número.
- `id` de capítulo `c1`, `c2`…; de seção `<idCapitulo>-<n>`. **Nunca renomeie
  um id publicado**: progresso, marcadores, notas e treino são gravados por id.
- `callout` só aceita `clave`, `examen`, `lab`, `alerta`, escolhidos pelo papel
  do quadro no original. Tabelas de revisão/gabarito: `filterable: true`.

### 5. Auxiliares de reconhecimento

Derivados do conteúdo, nunca de conhecimento externo:

- **`cards.js`**: 2 a 3 fichas por seção; uma ficha = um fato verificável.
- **`quiz.js`**: exatamente 4 alternativas, `a` = índice da correta, `why`
  explica. O app embaralha as alternativas a cada rodada, mas distribua a
  resposta certa mesmo assim. Distratores tirados do próprio material (o erro
  comum que o texto cita é ótima alternativa errada; a palavra do eixo errado
  também).
- **`cases.js`**: exercícios resolvidos do original, perguntas separadas.
- **`compare.js`**: só com entidades paralelas (organismos, algoritmos,
  categorias). Campo que o material não informa: `"—"`. Sem entidades: `[]`.

### 6. Módulos de estudo: decida pelo material e pela prova

Leia o que o material diz sobre a prova (formato, o que vale ponto, tipos de
questão) e ligue o que ajuda. Cada módulo some sozinho se o dado for `null`/vazio.

| Módulo | Arquivos | Quando ligar |
|---|---|---|
| **Treino** com resposta escrita | `eixos.js`, `treino.js` | Sempre que houver exercícios ou casos (casos sem exercício entram sozinhos). Essencial quando a prova é discursiva ou a justificativa vale ponto. |
| **Mapa** de revisão | `mapa.js`, `figuras.js` | Material com estrutura que cabe em uma tela: eixos, classificações, procedimento de decisão, catálogo de erros, lista de conferência. |
| **Simulado** do professor | `simulado.js` | O usuário entregou uma prova simulada à parte. Transcreva na íntegra. |
| **Roteiro de hoje** | `meta.examDate`, `meta.roteiro` | Há data de prova e o material traz um plano de estudo. |

**Treino.** Cada exercício: escolher (se houver eixo), **escrever**, corrigir,
comparar com o modelo, marcar a autoavaliação. Regras:
- Eixos (`eixos.js`) são as classificações que a prova pede (ex.: "abordagem"
  e "tarefa"; "gênero do agente"; "tipo de erro" como lista suspensa).
  `axesConflict` implementa a checagem de compatibilidade que o material ensinar.
- Nos exercícios do material, a resposta (`ans`) tem de bater com o gabarito
  do material: confira por script (passo 7). Respostas alternativas que o
  material aceita "se bem argumentadas" vão em `alt` + `altNote`.
- Respostas-modelo seguem o formato de resposta que o próprio material ensina
  (ex.: evidência, ligação, descarte). `selfCheck` usa esses mesmos itens.
- **Extras** (`origin: "app"`) só para tipos de questão que o material anuncia
  e não exercita (dois objetivos sobre a mesma base, proposta mal enquadrada,
  caso de fronteira, categoria pouco praticada). Cenários novos, critérios do
  material; nunca conteúdo externo. Uns 15 a 20 bastam.
- `drillExam` monta uma prova aleatória no formato da oficial (mesma
  quantidade por eixo, mistura de direta e "segundo movimento").

**Mapa.** Condensado, com a seção de origem em cada parte. Bons esquemas
(`figuras.js`, com o kit de classes de `learn.css`): dois eixos lado a lado,
matriz de compatibilidade, procedimento clicável (`F.flow`) que termina num
esqueleto de resposta, tabela de sinais e iscas do enunciado, exemplo anotado
por cores, catálogo de erros, lista de conferência (`checklist`). Os mesmos
esquemas podem entrar no manual como bloco `figure`, com moldura.

**Simulado.** Gabarito oculto até entregar (é o que o próprio simulado pede);
relógio que não trava; nota por autoavaliação com o critério do PDF; tabela de
leitura com a linha da nota destacada; lista "confira na sua folha" com
`detect` para marcar sozinho o que der (mesma resposta nos dois objetivos,
campo vazio, isca escolhida). A busca indexa só os enunciados.

### 7. Verificar antes de compilar

```bash
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Rode `node --check` em todo `src/**/*.js` (aspas trocadas em strings geradas
passam despercebidas). Abra `http://localhost:5177` e, no console:

```js
const B = window.BACT, ids = new Set(), M = B.axes || {};
B.chapters.forEach(c => c.sections.forEach(s => ids.add(s.id)));
const optOk = (ax, v) => !!(M[ax] && M[ax].options.some(o => o.v === v));
({ chapters: B.chapters.length, sections: ids.size,
   badCards: B.cards.filter(c => !ids.has(c.sec) || !c.sec.startsWith(c.ch + "-")).length,
   badQuiz:  B.quiz.filter(q => !ids.has(q.sec) || !q.sec.startsWith(q.ch + "-")).length,
   badOpts:  B.quiz.filter(q => q.opts.length !== 4 || q.a < 0 || q.a > 3).length,
   badCases: B.cases.filter(c => !ids.has(c.section)).length,
   badDrills: (B.drills || []).filter(d => (d.sec && !ids.has(d.sec)) || (d.case && !B.cases.some(c => c.id === d.case))
     || d.parts.some(p => p.axis && (!optOk(p.axis, p.ans) || (p.alt || []).some(a => !optOk(p.axis, a))))).map(d => d.id),
   badSim: ((B.simulado || {}).questions || []).filter(q => (q.sec && !ids.has(q.sec))
     || q.fields.some(f => f.pick && !optOk(f.pick, f.ans))).map(q => q.n),
   dup: [B.cards, B.quiz, B.drills || []].map(a => a.length - new Set(a.map(x => x.id)).size) })
```

Tudo que começa com `bad` tem que sair vazio/0 e `dup` `[0,0,0]`. Confira
também, por script, que o `ans` de cada exercício do material bate com o texto
do gabarito do material.

**Cobertura linha a linha**, uma vez para cada PDF:

```bash
python -X utf8 tools/coverage.py "material.pdf" "src/data/c*.js" src/data/cases.js
python -X utf8 tools/coverage.py "simulado.pdf" src/data/simulado.js
```

Ausências aceitáveis: rodapés, títulos numerados (viram `num` + `title`),
rótulos montados pela interface. Qualquer outra é texto perdido: corrija.

Depois percorra **todas as abas nos dois temas**, faça um exercício, uma prova
aleatória e o simulado inteiros por script, e meça estouro horizontal em 375,
1100 e 1380 px (`document.documentElement.scrollWidth - innerWidth` e se os
botões de tema/ajustes ficam dentro da tela). Limpe o `localStorage` no fim.

### 8. Compilar

```bash
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

Remove BOM dos arquivos de `src-tauri/`, roda `cargo tauri build` e lista os
instaladores (`.exe` NSIS, instala sem admin, e `.msi`) em
`src-tauri/target/release/bundle/`. Ambiente: Rust + MSVC Build Tools +
WebView2 (`tools/dev.ps1` confere). Se o usuário não quiser instalar a
toolchain, o `serve.ps1` já entrega o app no navegador: diga isso em vez de travar.

Smoke test sem ver a tela: rode o `.exe`, espere uns segundos, ache o processo
por **nome e horário de início** (o `HasExited` do `Start-Process -PassThru`
mente no PowerShell 5.1), confira o `MainWindowTitle` e que
`%LOCALAPPDATA%\<identifier>\EBWebView\Default\Local Storage\leveldb\*.log` foi
escrito nesta execução: só acontece se o frontend bootou.

## Design

Regras de cor, tipografia e forma: **`references/design-system.md`**.

Um único acento, definido em três lugares de `tokens.css`. Os quatro tons dos
destaques são semânticos e não se misturam com o acento. Nos eixos, `tone:
"accent"` usa o acento e `"ink"` o neutro. Fuja de roxo-de-IA e de bege+latão.

Exemplo completo de uma matéria de "classificar o cenário e justificar", com
eixos, compatibilidade, procedimento clicável, extras e simulado:
**`references/exemplo-classificacao.md`**.

## Armadilhas já pagas

- **BOM em `tauri.conf.json`** quebra o build com "unable to parse JSON Tauri
  config file … expected value at line 1 column 1". O `build.ps1` remove.
- **Heredoc grande no Bash** (`cat > arquivo <<'EOF'` com CSS/JS cheio de
  aspas) falhou com "unexpected EOF while looking for matching `'`". Escreva
  arquivos com a ferramenta Write; para substituições, Python com asserção de
  ocorrência única.
- **PowerShell 5.1** lê `.ps1` UTF-8 sem BOM como ANSI: mensagens de
  `Write-Host` sem acento.
- `cargo tauri build` pinta stderr de vermelho mesmo em sucesso: vale o exit code.
- Barra superior com 8 abas: o template já esconde o texto da busca (≤ 1360 px),
  os rótulos das abas (≤ 1180 px, com `title`) e rola a navegação no celular.
  Não acrescente aba sem medir de novo.
- `<span>` dentro de card não empilha sozinho: falta `display: block`.
- Screenshot do painel falha com a janela minimizada: verifique por JS
  (`innerText`, `getComputedStyle`, `performance.getEntriesByType`). Cor lida
  logo após um clique pode estar no meio da transição de 0,16 s.
- Pastas no OneDrive podem migrar quando o backup da Área de Trabalho é
  desligado: se arquivos "sumirem", procure em `C:\Users\<user>\Desktop`.
