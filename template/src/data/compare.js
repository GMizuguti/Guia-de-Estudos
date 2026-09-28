/* Comparador: perfis confrontáveis lado a lado (até 4 por vez).
   Só vale a pena quando o material tem entidades paralelas — organismos, algoritmos,
   arquiteturas, autores, períodos, ligas químicas. Se a matéria não tiver isso,
   deixe `compare` como array vazio: o app esconde a aba e o atalho da capa sozinho.

   `compareFields` define as linhas e a ordem; cada perfil usa as mesmas chaves.
   Campo que o material não informa: use "—" (nunca invente). */
window.BACT = window.BACT || {};

window.BACT.compareFields = [
  { key: "campo1", label: "Primeiro atributo" },
  { key: "campo2", label: "Segundo atributo" },
  { key: "campo3", label: "Terceiro atributo" }
];

window.BACT.compare = [
  {
    id: "ent1",
    name: "Nome da entidade",
    ch: "c1",                    // capítulo onde é tratada
    group: "Família / categoria", // agrupa os botões de seleção
    campo1: "Valor",
    campo2: "Valor com <b>destaque</b>",
    campo3: "—"
  }
];
