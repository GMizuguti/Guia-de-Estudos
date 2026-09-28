/* Mapa de revisão: o essencial do material em uma tela, para a véspera e o dia da prova.
   É CONDENSADO pelo app (o texto integral continua no manual). Cada parte cita a seção de origem.
   Sem mapa: window.BACT.mapa = null (a aba e o atalho da capa somem).
   Blocos: os mesmos do manual, incluindo { t: "figure", ref } e { t: "checklist", id, items }. */
window.BACT = window.BACT || {};
window.BACT.mapa = {
  title: "Mapa de revisão",
  lead: "O essencial em uma tela. Não substitui o texto completo, que está na aba Manual.",
  homeDesc: "O essencial do material em uma tela, com esquemas e o procedimento clicável",
  parts: [
    { id: "m-eixos", title: "Os dois eixos", src: "Cap. 1", blocks: [
      { t: "figure", ref: "exemplo" }
    ] },
    { id: "m-proc", title: "Procedimento", src: "Cap. 1", blocks: [
      { t: "p", html: "Clique nas respostas pensando em um enunciado." },
      { t: "figure", ref: "procedimento" }
    ] },
    { id: "m-check", title: "Antes de entregar", src: "Cap. 1", blocks: [
      { t: "checklist", id: "mapa-lista", items: ["Item transcrito da lista de conferência.", "Outro item."] }
    ] }
  ]
};
