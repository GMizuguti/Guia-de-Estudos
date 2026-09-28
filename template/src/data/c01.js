/* CAPÍTULO DE EXEMPLO — mostra os 12 tipos de bloco.
   Apague este arquivo quando escrever os capítulos reais, ou use-o como molde.
   Referência completa do esquema: ../../references/esquema-de-dados.md */
window.BACT = window.BACT || {};
window.BACT.chapters = window.BACT.chapters || [];
window.BACT.chapters.push({
  id: "c1",                       // c1, c2, ... — estável, nunca renomear
  num: 1,
  title: "Título do capítulo",
  kicker: "Uma linha explicando o recorte do capítulo",
  tocDesc: "Resumo curto para o índice lateral e para os cartões da capa",
  page: 3,                        // página no PDF de origem
  short: "Apelido curto",
  tags: ["Tema", "Outro tema"],
  intro: "Parágrafo de abertura em HTML. Aceita <b>negrito</b>, <em>itálico</em> e <i>termos técnicos</i>.",
  sections: [
    {
      id: "c1-1",                 // SEMPRE <idCapitulo>-<n>: o progresso salvo depende disso
      num: "1.1",
      title: "Texto corrido, listas e subtítulos",
      blocks: [
        { t: "p", html: "Parágrafo simples. O HTML inline é permitido e esperado." },
        { t: "h", text: "Subtítulo dentro da seção" },
        { t: "ul", items: [
          "Item de lista com <b>termo em destaque</b>.",
          "Outro item."
        ]},
        { t: "aside", html: "<b>Curiosidade:</b> nota lateral discreta, para observações do texto original." }
      ]
    },
    {
      id: "c1-2", num: "1.2", title: "Tabelas e passos numerados",
      blocks: [
        { t: "table",
          caption: "Legenda opcional",
          filterable: false,        // true adiciona busca por linha (use no anexo)
          cols: ["Coluna A", "Coluna B"],
          rows: [
            ["Valor", "Descrição"],
            ["Valor", "Descrição"]
          ]
        },
        { t: "steps", title: "Sequência opcional", items: [
          "Primeiro passo.",
          "Segundo passo.",
          "Terceiro passo."
        ]}
      ]
    },
    {
      id: "c1-3", num: "1.3", title: "Colunas e destaques",
      blocks: [
        { t: "cols", columns: [
          { title: "Coluna esquerda", blocks: [ { t: "ul", items: ["Um", "Dois"] } ] },
          { title: "Coluna direita",  blocks: [ { t: "ul", items: ["Três", "Quatro"] } ] }
        ]},

        // Os quatro tipos de destaque. Use o `kind` que corresponde ao papel
        // do quadro no texto original, não a cor que você quer.
        { t: "callout", kind: "clave", title: "Conceito-chave", blocks: [
          { t: "p", html: "A ideia central que sustenta o resto do tema." }
        ]},
        { t: "callout", kind: "examen", title: "Cai na prova", blocks: [
          { t: "ul", items: ["Dado que costuma ser cobrado."] }
        ]},
        { t: "callout", kind: "lab", title: "Na prática", blocks: [
          { t: "p", html: "Procedimentos, critérios, aplicação." }
        ]},
        { t: "callout", kind: "alerta", title: "Atenção", blocks: [
          { t: "p", html: "Erro frequente ou situação crítica." }
        ]},

        // Referência a um caso de data/cases.js (ganha o link "Responder por escrito no Treino")
        { t: "case", ref: "caso-1" },

        // Esquema do app registrado em data/figuras.js. Sai com a moldura
        // "Esquema do app · não está no material": use para acréscimos visuais, nunca para texto original.
        { t: "figure", ref: "exemplo" }
      ]
    },
    {
      id: "c1-4", num: "1.4", title: "Frases de fechamento",
      blocks: [
        // Numera automaticamente; use no anexo de revisão
        { t: "phrases", items: [
          "Primeira frase para levar para a prova.",
          "Segunda frase."
        ]},

        // Lista de conferência com caixas que ficam salvas. `id` único: é a chave do progresso.
        { t: "checklist", id: "c1-lista", items: [
          "Primeiro item a conferir.",
          "Segundo item."
        ]}
      ]
    }
  ]
});
