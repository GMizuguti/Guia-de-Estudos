# Exemplo trabalhado: matéria de "classificar o cenário e justificar"

Exemplo ilustrativo: um guia de revisão de uma disciplina introdutória de
aprendizagem de máquina, mais uma prova simulada entregue à parte. A prova
pede, para cada cenário, a **abordagem** (supervisionada, não supervisionada,
semissupervisionada, por reforço) ou a **tarefa** (classificação, regressão,
agrupamento), e a justificativa vale mais do que o nome. O padrão serve para
qualquer matéria em que a prova é "classifique e justifique" (tipo de
contrato, gênero textual, figura de linguagem, tipo de falácia, agente
etiológico…). Os textos abaixo são do app, não de um material real.

## O que o material indicava sobre a prova, e o que isso ligou

| O material indicava | Módulo / decisão |
|---|---|
| a justificativa pesa mais do que o nome da categoria | Treino com resposta escrita + autoavaliação nos 3 elementos que o material ensina |
| haverá uma proposta técnica errada para corrigir | extras "proposta mal enquadrada", eixo `erro` em lista suspensa |
| haverá questões com dois objetivos sobre a mesma base | extras "dois objetivos" (mesma base, respostas diferentes) |
| um procedimento de decisão em perguntas + checagem de compatibilidade | `F.flow` no Mapa e no capítulo do procedimento; `axesConflict` no Treino |
| exercícios de autoavaliação com gabarito comentado | exercícios do Treino (`case` = id do exercício), `drillInterpret` com a leitura do resultado |
| um roteiro para a última semana | `meta.roteiro` com o texto do roteiro |
| prova com N questões por eixo e tempo fixo | `drillExam` com a mesma composição |

## meta.words

Guia dividido em "seções" numeradas, com subdivisões "3.1, 3.2":

```js
words: { chapter: "Seção", chapterShort: "Seção", chapters: "seções", sections: "tópicos",
         sectionOne: "tópico", sectionsRead: "tópicos lidos", doc: "guia", docTab: "Guia",
         compareNoun: "categorias" }
```

## eixos.js

```js
window.BACT.axes = {
  abordagem: { label: "abordagem", tone: "accent",
    hint: "<p><b>1ª</b> Os casos passados têm a resposta que se quer prever? …</p><p><b>2ª</b> …</p>",
    options: [
      { v: "supervisionada", l: "Supervisionada", sec: "c3-1",
        skeleton: "<p><b class=\"an an--ev\">Evidência</b> O trecho que mostra que cada caso passado tem o desfecho registrado.</p>" +
                  "<p><b class=\"an an--li\">Ligação</b> \"…, portanto há rótulo para aprender a prever.\"</p>" +
                  "<p><b class=\"an an--de\">Descarte</b> \"Não é não supervisionada: essa serviria se nenhum desfecho fosse conhecido.\"</p>" },
      { v: "naosupervisionada", l: "Não supervisionada", sec: "c3-2" },
      { v: "semissupervisionada", l: "Semissupervisionada", sec: "c3-3" },
      { v: "reforco", l: "Por reforço", sec: "c3-4" } ] },
  tarefa: { label: "tarefa", tone: "ink",
    hint: "<p><b>3ª</b> Qual é a forma da saída? …</p>",
    options: [ { v: "classificacao", l: "Classificação", sec: "c4-1" },
               { v: "regressao", l: "Regressão", sec: "c4-2" },
               { v: "agrupamento", l: "Agrupamento", sec: "c4-3" } ] },
  erro: { label: "erro", tone: "select", placeholder: "Escolha o erro no catálogo…",
    textPlaceholder: "Por que é erro, e qual seria a formulação correta…",
    checks: [["ev", "<b>Identifiquei</b> o erro"], ["li", "<b>Expliquei</b> por que é erro"], ["de", "Dei a <b>formulação correta</b>"]],
    // os nomes do catálogo de erros do próprio material, mais os que ele ensina em outro lugar (marque a origem)
    options: [ { v: "eixos", l: "Trocar os eixos (tarefa no lugar de abordagem)", sec: "c2-1" },
               { v: "semelhanca", l: "Deixar a palavra \"parecido\" decidir", sec: "c4-4" },
               /* … */
               { v: "incompativel", l: "Abordagem e tarefa incompatíveis (procedimento)", sec: "c5-1" } ] }
};

// checagem de compatibilidade do procedimento
window.BACT.axesConflict = function (ch) {
  var ab = ch.abordagem, ta = ch.tarefa;
  if (!ab || !ta) return null;
  if (ab === "reforco") return "<b>Compatibilidade:</b> por reforço não tem uma dessas tarefas; o objetivo é uma política de ação.";
  if (ta === "agrupamento" && ab !== "naosupervisionada") return "<b>Compatibilidade:</b> agrupamento vai com não supervisionada. Releia o enunciado.";
  if (ta !== "agrupamento" && ab === "naosupervisionada") return "<b>Compatibilidade:</b> classificação e regressão pedem dados com resposta conhecida.";
  return null;
};

// os três elementos de resposta que o material ensina
window.BACT.selfCheck = [
  ["ev", "<b>Evidência</b>: citei o trecho do enunciado"],
  ["li", "<b>Ligação</b>: expliquei por que leva à categoria"],
  ["de", "<b>Descarte</b>: disse por que a alternativa próxima não serve"]
];
```

## Procedimento clicável (figuras.js)

```js
window.BACT.figures.fluxo = function (F) {
  return F.flow({ id: "fluxo", resultN: "4ª", resultQ: "A tarefa combina com a abordagem?",
    steps: [
      { n: "1ª", key: "q1", q: "Os casos passados têm a resposta que se quer prever?", clears: ["q2"], opts: [
        { val: "todos", label: "Sim, todos", out: F.cat("abordagem", "supervisionada") },
        { val: "parte", label: "Só uma pequena parte; o resto não tem", out: F.cat("abordagem", "semissupervisionada"),
          note: "confira se o resto está sem rótulo ou é a classe negativa" },
        { val: "nenhum", label: "Nenhum", out: '<span class="flow__go">vá para a 2ª pergunta</span>' } ] },
      { n: "2ª", key: "q2", q: "O sistema age, vê a consequência e recebe uma nota, repetidamente?",
        showIf: function (st) { return !st.q1 || st.q1 === "nenhum"; }, opts: [
        { val: "sim", label: "Sim", out: F.cat("abordagem", "reforco"), note: "a nota avalia a ação; não é o alvo" },
        { val: "nao", label: "Não", out: F.cat("abordagem", "naosupervisionada") } ] },
      { n: "3ª", key: "q3", q: "Qual é a forma da saída?", opts: [
        { val: "classificacao", label: "Uma etiqueta de uma lista que já existe", out: F.cat("tarefa", "classificacao") },
        { val: "regressao", label: "Um número com unidade", out: F.cat("tarefa", "regressao") },
        { val: "agrupamento", label: "Grupos que ainda não existem", out: F.cat("tarefa", "agrupamento") } ] }
    ],
    result: function (st, F) {
      var ab = { todos: "supervisionada", parte: "semissupervisionada" }[st.q1] ||
               (st.q1 === "nenhum" ? { sim: "reforco", nao: "naosupervisionada" }[st.q2] : null);
      var ta = st.q3 || null;
      if (!ab && !ta) return '<p class="flow__hint">Clique nas respostas pensando em um enunciado.</p>';
      var c = window.BACT.axesConflict({ abordagem: ab, tarefa: ta });
      return (ab && ta ? '<div class="flow__verdict ' + (c ? "is-bad" : "is-ok") + '">' + F.cat("abordagem", ab) + " + " + F.cat("tarefa", ta) + " · " + (c || "combinação compatível.") + "</div>" : "") +
        '<div class="skels">' + (ab ? F.skeleton("abordagem", ab) : "") + (ta ? F.skeleton("tarefa", ta) : "") + "</div>";
    } });
};
```

Outros esquemas que funcionam nesse tipo de matéria: os dois eixos lado a lado
(`.axes`), a matriz abordagem × tarefa com um exemplo do material em cada
célula válida (`.mx`), o exemplo de resposta completa do material com os três
elementos coloridos (`.ann`), uma tabela "se o enunciado diz… aponta para…"
com as iscas em `.baits`, o catálogo de erros em `.errs`, a lista de
conferência final como `checklist`.

## Exercícios

```js
// do material: enunciado e gabarito vêm do caso de mesmo id
{ id: "ex-3", set: "guia", slot: "abordagem", case: "ex-3",
  parts: [{ axis: "abordagem", ans: "semissupervisionada", alt: ["supervisionada"],
    altNote: "Supervisionada só se você argumentar que dá para treinar com os poucos rotulados E disser o custo de descartar o resto.",
    model: "Abordagem: semissupervisionada. Há 900 imagens rotuladas contra 120 mil sem rótulo, rotular o resto é inviável e o objetivo pede para usar todas. Só com as 900, sobraria um volume enorme sem uso." }] },

// extra: dois objetivos (a mesma base serve a abordagens diferentes)
{ id: "x-ob1", set: "objetivos", slot: "abordagem", ch: "c7", sec: "c7-1",
  title: "Operadora · cancelamento e perfis",
  stem: "… registro de quem cancelou. <b>Objetivo A:</b> prever quem vai cancelar. <b>Objetivo B:</b> descobrir perfis de uso sem lista prévia.",
  ask: "Qual é a abordagem de cada objetivo? Justifique separadamente.",
  parts: [ { label: "Objetivo A", axis: "abordagem", ans: "supervisionada", model: "…" },
           { label: "Objetivo B", axis: "abordagem", ans: "naosupervisionada", model: "…" } ] },

// extra: proposta mal enquadrada (erro + formulação correta)
{ id: "x-pr1", set: "proposta", slot: "tarefa", ch: "c4", sec: "c4-4",
  stem: "3.100 fraudes confirmadas e 4 milhões de transações sem indício. Quer achar transações parecidas com as fraudes.",
  proposal: "Como o objetivo é achar transações parecidas, é agrupamento não supervisionado.",
  parts: [ { label: "Erro da proposta", axis: "erro", ans: "semelhanca", model: "…" },
           { label: "Abordagem correta", axis: "abordagem", ans: "supervisionada", alt: ["semissupervisionada"], altNote: "…", model: "…" },
           { label: "Tarefa correta", axis: "tarefa", ans: "classificacao", model: "…" } ] }
```

Casos de fronteira úteis: a isca da palavra "parecido" perguntando a
abordagem em vez da tarefa; dados sem rótulo apenas **mencionados** (números
não desproporcionais, objetivo sem pedir para usá-los), que continuam sendo
supervisionada; por reforço descrito sem as palavras técnicas.

```js
window.BACT.drillExam = { minutes: 105, title: "Prova aleatória no formato da oficial",
  intro: "Dez questões, metade por eixo, fora de ordem de dificuldade…",
  pick: [ { set: "guia", slot: "abordagem", n: 3 }, { set: "guia", slot: "tarefa", n: 3 },
          { set: "objetivos", slot: "abordagem", n: 1 }, { set: "objetivos", slot: "tarefa", n: 1 },
          { set: "limite", slot: "abordagem", n: 1 }, { set: "proposta", slot: "tarefa", n: 1 } ] };

window.BACT.drillInterpret = { set: "guia", title: "Seu resultado nos exercícios",
  fn: function (r, total) {   // transcreva a leitura de resultado do próprio material
    return r >= 18 ? "…" : r >= 14 ? "…" : "…"; } };
```

## Simulado: detectores da lista "confira na sua folha"

```js
folha: { items: [
  { t: "(item transcrito do simulado sobre dar a mesma resposta aos dois objetivos)",
    detect: function (ans) { var c = (ans[5] || { choice: {} }).choice; return c.a && c.a === c.b ? "Você marcou a mesma abordagem nos dois objetivos." : null; } },
  { t: "(item sobre esquecer a segunda metade de uma questão em duas partes)",
    detect: function (ans, h) { return h.words((ans[9] || { text: {} }).text.c) < 3 ? "O campo da circunstância está vazio." : null; } },
  { t: "(item sobre escrever pouco)",
    detect: function (ans, h) {
      var n = [1,2,3,4,5,6,7,8,9,10].filter(function (q) { var t = (ans[q] || { text: {} }).text;
        return Object.keys(t).reduce(function (s, k) { return s + h.words(t[k]); }, 0) < 20; });
      return n.length ? n.length + " questão(ões) com menos de 20 palavras (" + n.join(", ") + ")." : null; } }
] }
```

## Lições desse tipo de projeto

- Dois materiais do mesmo professor podem divergir: um gabarito de simulado
  aceitava como alternativa uma resposta que o guia recusava de forma
  explícita. Transcreva os dois fielmente, ponha uma `appNote` no ponto e
  avise o usuário.
- Tabelas de critério e de leitura da nota costumam ficar nas últimas páginas
  e saem embaralhadas no `pdftotext` (níveis trocados entre questões). Use
  `tabelas.txt` e confira na imagem da página.
