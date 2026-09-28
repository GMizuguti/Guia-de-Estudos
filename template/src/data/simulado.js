/* Simulado: uma prova simulada que o professor entregou À PARTE (outro PDF), transcrita na íntegra.
   Sem simulado: window.BACT.simulado = null (a aba e o atalho da capa somem).

   Fidelidade: enunciados, gabarito comentado, tabelas de critério e leitura da nota entram como estão.
   Só os rótulos dos campos de resposta (fields[].label) são do app. Divergência com o material
   principal vira `appNote` na questão ("Nota do app, não está no PDF: …"), nunca correção no texto. */
window.BACT = window.BACT || {};
window.BACT.simulado = {
  homeTitle: "Simulado do professor",                       // atalho da capa e título na busca
  homeDesc: "Prova simulada com relógio, gabarito comentado e autoavaliação pelo critério da prova",
  header: ["{{INSTITUICAO}}", "{{CURSO}}"],
  kicker: "PROVA SIMULADA",
  title: "{{TITULO_DO_SIMULADO}}",
  subtitle: "",
  course: "{{DISCIPLINA}} | {{PROFESSOR}}",
  note: "",
  minutes: 60,
  intro: ["<b>Para que serve este simulado.</b> Texto de apresentação transcrito do PDF."],
  warning: "<b>Não leia o gabarito antes.</b> Aviso transcrito do PDF, se houver.",
  peekConfirm: "Ver o gabarito sem fazer o simulado?",
  // Folha de rosto. auto: "nome" (campo editável) | "data" | "tempo" | "nota" (preenchidos pelo app)
  formFields: [
    { label: "Nome", auto: "nome" },
    { label: "Data em que fiz o simulado", auto: "data" },
    { label: "Tempo que levei", auto: "tempo" },
    { label: "Pontuação obtida", auto: "nota" }
  ],

  parts: [
    { title: "Parte I (1,0 ponto)", instr: "Instrução da parte, transcrita.", questions: [1] },
    { title: "Parte II (1,0 ponto)", instr: "Instrução da parte, transcrita.", questions: [2] }
  ],

  // Questão: { n, pts, max, sec, stem: [parágrafos], quote, after, prompt, fields, gab, appNote }
  //   fields: [{ k, label, pick (eixo de data/eixos.js), ans, alt, text }]
  //   gab: { head, answer, lead, items: [itens do gabarito comentado] }
  questions: [
    { n: 1, pts: "0,5 ponto", max: 0.5, sec: "c1-1",
      stem: ["Enunciado transcrito."],
      prompt: "Tipo: ______________ Justifique:",
      fields: [{ k: "a", label: "Tipo", pick: "tipo", ans: "a", text: true }],
      gab: { head: "Questão 1", answer: "Resposta: tipo A.", items: [
        "<b>Justificativa completa:</b> transcrita do gabarito.",
        "<b>Erro mais provável:</b> transcrito."
      ] } },
    { n: 2, pts: "0,5 ponto", max: 0.5, sec: "c1-2",
      stem: ["Leia a afirmação abaixo:"],
      quote: "Proposta citada no enunciado.",
      after: "<b>Identifique o erro e dê a formulação correta.</b>",
      fields: [
        { k: "a", label: "O erro", text: true },
        { k: "b", label: "Formulação correta", pick: "saida", ans: "y", text: true }
      ],
      gab: { head: "Questão 2", lead: "<b>O erro:</b> transcrito.", items: ["<b>Pontuação:</b> transcrita."] },
      appNote: "<b>Nota do app, não está no PDF:</b> use só para apontar divergência com o material principal." }
  ],

  endNote: "Fim do simulado. Frase de fechamento transcrita.",
  gabaritoTitle: "Gabarito comentado",
  gabaritoWarn: "Só leia daqui em diante depois de ter respondido.",
  gabaritoIntro: "",

  // Autoavaliação. hint: lembrete curto ao lado da nota de cada questão (texto seu, resumindo o critério).
  // leitura: tabela "sua pontuação → o que fazer" do PDF; min = limite inferior de cada linha, na ordem.
  // anchor: id da seção que tem o critério completo (vira o botão "Critério de autoavaliação").
  scoring: {
    max: 1, step: 0.1, anchor: "simAuto",
    hint: "Critério da prova: <b>1,0</b> resposta completa · <b>0,5</b> sem justificativa.",
    leitura: { cols: ["Sua pontuação", "Leitura", "O que fazer agora"], rows: [
      ["0,8 a 1,0", "Domínio", "Texto transcrito"],
      ["Abaixo de 0,8", "Rever", "Texto transcrito"]
    ], min: [0.8, 0] }
  },

  // Lista "confira na sua folha". detect(ans) devolve uma frase quando encontra o padrão nas respostas
  // (ans[n].choice[k] e ans[n].text[k]) ou null.
  folha: { items: [
    { t: "Item transcrito do PDF.", detect: function (ans) { var a = (ans[2] || { choice: {} }).choice; return a.b ? null : "Você não marcou a formulação correta na questão 2."; } },
    { t: "Outro item transcrito." }
  ] },

  // Seções exibidas depois das questões, na ordem do PDF. Blocos comuns do manual, mais
  // { t: "sim-leitura" } (tabela de leitura com a linha da sua nota destacada) e { t: "sim-folha" }.
  sections: [
    { id: "simAuto", title: "Como se autoavaliar", blocks: [
      { t: "p", html: "Texto transcrito." },
      { t: "table", cols: ["Situação", "Pontuação"], rows: [["Resposta completa", "1,0"], ["Sem justificativa", "0,5"]] },
      { t: "sim-leitura" }
    ] },
    { title: "Erros para conferir na sua própria folha", blocks: [
      { t: "p", html: "Introdução transcrita." },
      { t: "sim-folha" },
      { t: "p", html: "<i>Fechamento transcrito.</i>" }
    ] }
  ]
};
