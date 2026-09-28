/* Identidade do manual.
   ÚNICO arquivo com texto próprio da matéria fora dos dados de conteúdo.
   Reescreva-o inteiro para cada material novo. Use o idioma do material. */
window.BACT = window.BACT || {};
window.BACT.meta = {
  // Título da janela e da aba
  appTitle: "{{TITULO_COMPLETO}}",

  // Barra superior. brandIcon: classe Phosphor (ex.: "ph-virus", "ph-graph", "ph-scales", "ph-atom")
  brandTitle: "{{MARCA}}",
  brandSub: "{{SUBTITULO_CURTO}}",
  brandIcon: "ph-book-open",

  // Vocabulário do material. `doc` tem de ser substantivo masculino (manual, guia, resumo).
  // Para um guia dividido em "seções" numeradas, por exemplo:
  //   { chapter: "Seção", chapterShort: "Seção", chapters: "seções", sections: "tópicos",
  //     sectionOne: "tópico", sectionsRead: "tópicos lidos", doc: "guia", docTab: "Guia", compareNoun: "categorias" }
  words: {
    chapter: "Capítulo", chapterShort: "Cap.", chapters: "capítulos",
    sections: "seções", sectionOne: "seção", sectionsRead: "seções lidas",
    doc: "manual", docTab: "Manual", compareNoun: "perfis"
  },

  // Capa
  heroEyebrow: "{{LINHA_FINA}}",          // ex.: "Guia de estudo · 2º semestre de 2026"
  heroTitle: "{{TITULO}}",                 // parte em peso normal
  heroEmphasis: "{{ENFASE}}",              // parte em itálico; use "" para omitir
  heroLead: "{{RESUMO_UMA_FRASE}}",

  // Sugestões da busca (Ctrl K) quando o campo está vazio: termos distintivos do material
  searchHints: ["{{TERMO_1}}", "{{TERMO_2}}", "{{TERMO_3}}"],

  // Data da prova ("AAAA-MM-DD") para o cartão "roteiro de hoje" da capa. "" desliga o cartão.
  examDate: "",
  examDateLabel: "",                       // ex.: "28/09/2026"

  // Roteiro da última semana, se o material trouxer um (texto transcrito do material).
  // steps: o passo exibido quando faltam `days` dias; actions: botões para uma aba ou uma seção.
  roteiro: null,
  /* exemplo:
  roteiro: {
    title: "Roteiro da seção 10",
    before: "O roteiro começa cinco dias antes da prova.",
    beforeActions: [{ label: "Treino", view: "treino", icon: "ph-pencil-line" }],
    examDayNote: "São 105 minutos para dez questões.",
    steps: [
      { days: 1, momento: "Um dia antes", texto: "Reler apenas a seção 7…", actions: [{ label: "Seção 7", section: "c7-1" }] },
      { days: 0, momento: "No dia", texto: "Leia as dez questões antes…", actions: [{ label: "Mapa", view: "mapa", icon: "ph-map-trifold" }] }
    ]
  }, */

  // Seção "Como usar este aplicativo" da capa. null oculta a seção inteira.
  howToUse: "{{COMO_USAR}}",

  // Legenda dos quatro tipos de destaque. Mantenha os quatro `kind` (clave/examen/lab/alerta), que são
  // as chaves do CSS, mas troque `name` e `desc`. O `name` também vira o rótulo dos quadros no texto.
  // null oculta a legenda.
  legend: [
    { kind: "clave",  name: "{{NOME_CONCEITO}}", desc: "{{DESC}}" },
    { kind: "examen", name: "{{NOME_EXAME}}",    desc: "{{DESC}}" },
    { kind: "lab",    name: "{{NOME_PRATICA}}",  desc: "{{DESC}}" },
    { kind: "alerta", name: "{{NOME_ALERTA}}",   desc: "{{DESC}}" }
  ],

  // Rodapé do painel de ajustes. Aceita HTML.
  footerNote: "{{PROCEDENCIA}} <b>Material de estudo</b>: {{RESSALVA}}"
};
