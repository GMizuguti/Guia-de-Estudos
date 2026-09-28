# Esquema de dados

Tudo vive em `window.BACT`. Os arquivos de `src/data/` são carregados por
`<script>` comum, na ordem declarada em `index.html`:

```
meta.js → figuras.js → cases.js → c01.js … cNN.js → cards.js → quiz.js → compare.js
        → eixos.js → treino.js → simulado.js → mapa.js
```

`cases.js` vem antes dos capítulos porque eles referenciam casos. Arquivos
extras de fichas ou questões (ex.: `quiz-metodo.js`) podem concatenar:
`window.BACT.quiz = (window.BACT.quiz || []).concat([...])`.

---

## meta.js

| Campo | Uso |
|---|---|
| `appTitle`, `brandTitle`, `brandSub`, `brandIcon` | janela, barra superior; `brandIcon` é classe Phosphor (`ph-graph`, `ph-virus`) |
| `words` | vocabulário: `chapter`, `chapterShort`, `chapters`, `sections`, `sectionOne`, `sectionsRead`, `doc` (substantivo **masculino**: manual, guia), `docTab` (rótulo da aba de leitura), `compareNoun` |
| `heroEyebrow`, `heroTitle`, `heroEmphasis`, `heroLead` | capa |
| `searchHints` | sugestões da busca com o campo vazio |
| `examDate` (`"AAAA-MM-DD"`), `examDateLabel` | liga o cartão "roteiro de hoje"; `""` desliga |
| `roteiro` | `{ title, before, beforeActions, examDayNote, steps: [{ days, momento, texto, actions }] }`; `actions`: `{ label, view, icon }` ou `{ label, section }` |
| `howToUse` | parágrafo "Como usar este aplicativo"; `null` oculta |
| `legend` | 4 itens `{ kind, name, desc }`; o `name` vira o rótulo dos quadros no texto |
| `footerNote` | rodapé dos ajustes (procedência e ressalvas) |

---

## Capítulo

```js
window.BACT.chapters.push({
  id: "c1",              // estável para sempre; o progresso do usuário depende dele
  num: 1,                // a numeração do ORIGINAL
  title: "Título",
  kicker: "Uma linha sobre o recorte do capítulo",
  tocDesc: "Resumo curto (índice lateral e cartões da capa)",
  page: 3,               // página no material original
  short: "Apelido",
  isAnnex: true,         // opcional; troca "Cap. N" por "Anexo"
  tags: ["Tema A", "Tema B"],
  intro: "HTML de abertura; use o parágrafo de abertura do original, se houver, ou \"\"",
  sections: [ /* ... */ ]
});
```

## Seção

```js
{ id: "c1-1", num: "1.1", title: "Título da seção", blocks: [ /* ... */ ] }
```

`id` **sempre** `<idCapitulo>-<n>`. Trecho sem número próprio no original
(texto antes da 2.1, por exemplo) usa `num` do capítulo (`"2"`).

---

## Os 12 tipos de bloco

Todo campo `html`, `text`, item de lista e célula aceita HTML inline
(`<b>`, `<em>`, `<i>`, `<br>`, `<code>`).

| `t` | Forma | Uso |
|---|---|---|
| `p` | `{ t: "p", html }` | parágrafo |
| `h` | `{ t: "h", text }` | subtítulo dentro da seção |
| `ul` | `{ t: "ul", items: [] }` | lista |
| `steps` | `{ t: "steps", title?, items: [] }` | sequência numerada |
| `table` | `{ t: "table", caption?, filterable?, cols: [], rows: [[]] }` | toda linha com o mesmo nº de células de `cols`; rola no eixo X sozinha |
| `cols` | `{ t: "cols", columns: [{ title?, blocks }] }` | "de um lado X, do outro Y"; vira uma coluna abaixo de 780 px |
| `aside` | `{ t: "aside", html }` | nota lateral discreta; citação/exemplo recuado do original (com `<em>`) |
| `callout` | `{ t: "callout", kind, title?, blocks }` | destaque; `kind` = `clave` · `examen` · `lab` · `alerta` (papel no original) |
| `phrases` | `{ t: "phrases", items: [] }` | frases numeradas de fechamento |
| `case` | `{ t: "case", ref: "caso-1" }` | caso de `cases.js`, com perguntas expansíveis e link para o Treino |
| `figure` | `{ t: "figure", ref: "nome" }` | esquema de `figuras.js`, com a moldura "Esquema do app · não está no material" |
| `checklist` | `{ t: "checklist", id, items: [] }` | caixas que ficam salvas; `id` único e estável |

Parágrafo com início em negrito no original: mantenha dentro do `html`
(`"<b>Cuidado:</b> …"`) em vez de mover para `title` do callout.

---

## cases.js

```js
{ id: "caso-1", label: "Caso 1", chapter: "c6", section: "c6-15",
  title: "Resumo em uma linha (texto do app)",
  stem: "Enunciado completo em HTML",
  questions: [ { q: "Pergunta?", a: "Resposta do material." } ] }
```

Caso que nenhum exercício do `treino.js` referencia vira exercício do Treino
sozinho: uma parte de resposta escrita por pergunta, com `a` como modelo.

## cards.js

```js
{ id: "f1", ch: "c1", sec: "c1-1", front: "Pergunta", back: "Resposta" }
```

Agendamento SM-2 simplificado, guardado por `id`: mudar um `id` zera a ficha.

## quiz.js

```js
{ id: "q1", ch: "c1", sec: "c1-1", q: "Enunciado?",
  opts: ["A", "B", "C", "D"],   // exatamente 4; o app embaralha a cada rodada
  a: 1, why: "Explicação mostrada depois de responder." }
```

## compare.js

```js
window.BACT.compareFields = [ { key: "campo1", label: "Rótulo" } ];
window.BACT.compare = [ { id: "ent1", name: "Nome", ch: "c1", group: "Grupo", campo1: "valor" } ];
```

Até 4 perfis lado a lado. Campo sem dado: `"—"`. Vazio: a aba some. A busca
mostra o primeiro campo como resumo.

---

## eixos.js

```js
window.BACT.axes = {
  abordagem: { label: "Abordagem", tone: "accent",      // "accent" | "ink" | "select"
    hint: "<p><b>1ª</b> …</p>",                          // "Dica" do Treino
    checks: [["ev", "…"], ["li", "…"], ["de", "…"]],     // autoavaliação própria (opcional)
    placeholder: "Escolha…", textPlaceholder: "…",      // textos de ajuda
    options: [ { v: "sup", l: "Supervisionada", sec: "c3-1", skeleton: "<p>…</p>" } ] }
};
window.BACT.axesConflict = function (ch) { return null; };  // ch = { eixo: valor } → null | "mensagem"
window.BACT.selfCheck = null;  // [["ev","…"],…] ou null (padrão: dado, raciocínio, descarte)
```

## treino.js

```js
window.BACT.drillSets = [ { id: "guia", name: "Exercícios do guia", origin: "material", desc?: "…" },
                          { id: "objetivos", name: "Dois objetivos", origin: "app", desc: "…" } ];
window.BACT.drills = [
  { id: "ex-1", set: "guia", slot: "abordagem", case: "ex-1",       // reaproveita o caso
    parts: [{ axis: "abordagem", ans: "semi", alt: ["sup"], altNote: "…", model: "…" }] },
  { id: "x-1", set: "objetivos", slot: "tarefa", ch: "c7", sec: "c7-1",
    title: "…", stem: "… <b>Objetivo A:</b> … <b>Objetivo B:</b> …", ask: "…",
    proposal?: "texto a criticar", gab?: "gabarito em HTML", note?: "depois da correção",
    parts: [ { label: "Objetivo A", axis: "tarefa", ans: "classificacao", model: "…" },
             { label: "Objetivo B", axis: "tarefa", ans: "regressao", model: "…" } ] }
];
window.BACT.drillExam = { minutes: 105, title, intro, pick: [ { set, slot, n } ] } | null;
window.BACT.drillInterpret = { set: "guia", title, fn: function (certos, total) { return "…"; } } | null;
```

Parte: `axis` (ou `null` = só escrita), `ans`, `alt`, `altNote`, `model`,
`text: false` (sem campo de texto), `placeholder`, `checks`, `fromMaterial`
(modelo transcrito do material, etiqueta "Resposta do material").
Progresso gravado por `id` do exercício e índice da parte.

## simulado.js

```js
window.BACT.simulado = {
  homeTitle, homeDesc, header: [], kicker, title, subtitle, course, note, minutes,
  intro: ["<b>…</b> …"], warning, peekConfirm,
  formFields: [ { label: "Nome", auto: "nome" }, { label, auto: "data" | "tempo" | "nota" } ],
  parts: [ { title, instr, questions: [1, 2] } ],
  questions: [ { n, pts: "1,0 ponto", max: 1, sec, stem: [""], quote?, after?, prompt?,
                 fields: [ { k: "a", label, pick?: "eixo", ans?, alt?, text: true } ],
                 gab: { head, answer?, lead?, items: [] }, appNote? } ],
  endNote, gabaritoTitle, gabaritoWarn, gabaritoIntro,
  scoring: { max: 10, step: 0.1, anchor: "simAuto", hint: "resumo do critério",
             leitura: { cols, rows, min: [9, 7, 5, 0] } },
  folha: { items: [ { t: "…", detect: function (ans, h) { return null | "frase"; } } ] },
  sections: [ { id?, title, blocks: [ …, { t: "sim-leitura" }, { t: "sim-folha" } ] } ]
} | null;
```

`ans[n].choice[k]` e `ans[n].text[k]` guardam as respostas; `h.words(texto)`
conta palavras. Estado em `Store.sim()`.

## figuras.js

```js
window.BACT.figures.nome = function (F) { return "<html>"; };
```

`F.cat(eixo, v)` chip · `F.skeleton(eixo, v)` esqueleto da opção ·
`F.flow({ id, steps: [{ n, key, q, clears?, showIf?, opts: [{ val, label, out, note? }] }],
resultN?, resultQ?, result: function (st, F) {} })` procedimento clicável ·
`F.esc(texto)`. Classes prontas em `learn.css`: `.axes`, `.mx`, `.ann`/`.hl`,
`.baits`/`.bait`, `.errs`/`.err`, `.skels`/`.skel`, `.flow__verdict`.

## mapa.js

```js
window.BACT.mapa = { title, lead, homeDesc, parts: [ { id: "m-1", title, src: "Seção 2", blocks: [] } ] } | null;
```

No Mapa, `figure` entra sem moldura (a aba inteira já é do app).

---

## O que a busca indexa

Capítulos, seções (texto de todos os blocos, células inclusive), fichas,
questões, casos, exercícios do Treino que não vêm de caso, **só os enunciados**
do simulado e os perfis do comparador. Insensível a acentos e caixa.
