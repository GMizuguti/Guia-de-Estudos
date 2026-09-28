/* Esquemas visuais do app: acréscimos que NÃO estão no material (a moldura avisa isso ao aluno).
   Cada esquema é uma função que recebe F e devolve HTML:
     F.cat(eixo, valor)      chip de uma opção de data/eixos.js, na cor do eixo
     F.skeleton(eixo, valor) esqueleto de resposta da opção (campo `skeleton`)
     F.flow({...})           procedimento clicável (veja o exemplo abaixo)
   Use as classes do "kit de esquemas" de css/learn.css: .axes, .mx, .ann/.hl, .baits/.bait, .errs/.err.
   Referencie com { t: "figure", ref: "nome" } no manual ou dentro do Mapa. */
window.BACT = window.BACT || {};
window.BACT.figures = window.BACT.figures || {};

// Exemplo 1: dois quadros lado a lado
window.BACT.figures.exemplo = function (F) {
  return '<div class="axes">' +
    '<div class="axes__col axes__col--accent"><div class="axes__k">Eixo A</div>' +
      '<div class="axes__q">A pergunta que este eixo responde</div>' +
      '<div class="axes__chips">' + F.cat("tipo", "a") + F.cat("tipo", "b") + "</div></div>" +
    '<div class="axes__x" aria-hidden="true">×</div>' +
    '<div class="axes__col axes__col--ink"><div class="axes__k">Eixo B</div>' +
      '<div class="axes__q">A pergunta que este outro eixo responde</div>' +
      '<div class="axes__chips">' + F.cat("saida", "x") + F.cat("saida", "y") + "</div></div>" +
  "</div>" +
  '<p class="fig__note">Nota curta dizendo de onde o esquema foi tirado (ex.: "resume a tabela da seção 2").</p>';
};

// Exemplo 2: procedimento clicável. `showIf` apaga um passo que não se aplica; `clears` limpa passos dependentes.
window.BACT.figures.procedimento = function (F) {
  return F.flow({
    id: "procedimento",
    steps: [
      { n: "1ª", key: "q1", q: "Primeira pergunta do procedimento?", clears: ["q2"], opts: [
        { val: "sim", label: "Sim", out: F.cat("tipo", "a") },
        { val: "nao", label: "Não", out: '<span class="flow__go">vá para a 2ª pergunta</span>' }
      ] },
      { n: "2ª", key: "q2", q: "Segunda pergunta?", showIf: function (st) { return st.q1 === "nao"; }, opts: [
        { val: "sim", label: "Sim", out: F.cat("tipo", "b"), note: "observação curta" },
        { val: "nao", label: "Não", out: F.cat("tipo", "c") }
      ] }
    ],
    resultN: "✓",
    resultQ: "Resultado",
    result: function (st, F) {
      var v = st.q1 === "sim" ? "a" : st.q2 === "sim" ? "b" : st.q2 === "nao" ? "c" : null;
      if (!v) return '<p class="flow__hint">Clique nas respostas acima: o resultado e um esqueleto de resposta aparecem aqui.</p>';
      return '<div class="flow__verdict is-ok"><i class="ph ph-check-circle" aria-hidden="true"></i>' + F.cat("tipo", v) + "</div>" +
        '<div class="skels">' + F.skeleton("tipo", v) + "</div>";
    }
  });
};
