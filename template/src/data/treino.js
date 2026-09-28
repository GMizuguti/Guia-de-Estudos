/* Treino com resposta escrita.
   drillSets: grupos de exercícios. origin "material" (exercícios do próprio material) ou "app"
              (extras que você escreveu com os critérios do material: aparecem marcados como extras).
   drills:    exercícios. Casos de data/cases.js sem exercício próprio entram sozinhos (set "casos").

   Exercício: { id, set, slot, case, title, stem, proposal, ask, gab, ch, sec, note, label, parts }
     case     id de um caso de cases.js: reaproveita título e enunciado (e o gabarito, se o caso
              tiver uma pergunta só e o exercício tiver eixo)
     slot     eixo principal (vira filtro e alimenta a prova aleatória)
     proposal texto de uma proposta a criticar ("encontre o erro")
     gab      gabarito do material, em HTML (opcional)
     note     observação exibida depois da correção
   Parte:     { label, axis, ans, alt, altNote, model, text, placeholder, fromMaterial }
     axis     chave de data/eixos.js; null = só resposta escrita
     ans/alt  resposta e alternativas aceitas se bem argumentadas
     model    resposta-modelo (escrita pelo app, a menos que fromMaterial: true)
     text     false = sem campo de texto (só a escolha) */
window.BACT = window.BACT || {};

window.BACT.drillSets = [
  { id: "material", name: "Exercícios do material", origin: "material" },
  { id: "extras", name: "Proposta mal enquadrada", origin: "app", desc: "Identifique o erro, explique e dê a formulação correta." }
];

window.BACT.drills = [
  { id: "ex-1", set: "material", slot: "tipo", case: "caso-1",
    parts: [{ axis: "tipo", ans: "a", alt: ["b"], altNote: "Aceita se você argumentar …",
      model: "Tipo A. O enunciado informa que …, ou seja, … Isso descarta o tipo B, que exigiria …" }] },

  { id: "x-1", set: "extras", slot: "saida", ch: "c1", sec: "c1-3",
    title: "Resumo do cenário em uma linha",
    stem: "Enunciado elaborado pelo app, seguindo o padrão dos exercícios do material.",
    proposal: "Proposta com um erro de enquadramento.",
    ask: "Identifique o erro, explique por que é erro e dê a formulação correta.",
    parts: [
      { label: "Erro da proposta", axis: "erro", ans: "e1", model: "A proposta cometeu o erro 1 porque …" },
      { label: "Tipo correto", axis: "tipo", ans: "c", model: "Tipo C, porque …" },
      { label: "Saída correta", axis: "saida", ans: "y", model: "Saída Y, porque …" }
    ],
    note: "Observação exibida depois da correção." }
];

// Prova aleatória com relógio (opcional; null desliga a subaba). pick: regras de sorteio em ordem.
window.BACT.drillExam = {
  minutes: 30,
  title: "Prova aleatória",
  intro: "Questões sorteadas do treino, fora de ordem, com relógio.",
  pick: [ { set: "material", n: 1 }, { set: "extras", n: 1 } ]
};

// Leitura do resultado quando um set inteiro foi corrigido (opcional). Use o texto do próprio material.
window.BACT.drillInterpret = null;
/* exemplo:
window.BACT.drillInterpret = { set: "material", title: "Seu resultado nos exercícios",
  fn: function (right, total) { return right >= 18 ? "…" : right >= 14 ? "…" : "…"; } }; */
