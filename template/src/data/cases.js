/* Casos / exercícios resolvidos do material original.
   Aparecem dentro do capítulo (bloco { t:"case", ref:"..." }) e no Treino: todo caso que nenhum
   exercício de data/treino.js referencia vira um exercício de resposta escrita, uma parte por pergunta,
   com a resposta do material como modelo. */
window.BACT = window.BACT || {};
window.BACT.cases = [
  {
    id: "caso-1",
    label: "Caso 1",
    chapter: "c1",          // id do capítulo
    section: "c1-3",        // id da seção onde o caso aparece no texto
    title: "Enunciado resumido em uma linha",
    stem: "Enunciado completo em HTML, com os dados que o aluno precisa para responder.",
    questions: [
      { q: "Primeira pergunta?", a: "Resposta com o <b>ponto-chave</b> em destaque." },
      { q: "Segunda pergunta?",  a: "Resposta." }
    ]
  }
];
