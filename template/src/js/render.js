/* Conversão dos blocos de dados em HTML */
(function () {
  "use strict";

  var CALLOUT = {
    clave:  { icon: "ph-lightbulb-filament", label: "Ideia central" },
    examen: { icon: "ph-exam",               label: "Cai na prova" },
    lab:    { icon: "ph-flask",              label: "Na prática" },
    alerta: { icon: "ph-warning-circle",     label: "Atenção" }
  };

  // Os rótulos exibidos nos destaques seguem meta.legend, quando definida
  (((window.BACT || {}).meta || {}).legend || []).forEach(function (l) {
    if (CALLOUT[l.kind] && l.name) CALLOUT[l.kind].label = l.name;
  });

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function blocks(list) {
    return (list || []).map(block).join("");
  }

  function block(b) {
    switch (b.t) {
      case "p":
        return "<p>" + b.html + "</p>";

      case "h":
        return "<h4>" + b.text + "</h4>";

      case "ul":
        return "<ul>" + b.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>";

      case "steps":
        return '<div class="steps">' +
          (b.title ? '<div class="steps__title">' + b.title + "</div>" : "") +
          "<ol>" + b.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ol>" +
          "</div>";

      case "aside":
        return '<div class="aside">' + b.html + "</div>";

      case "cols":
        return '<div class="cols">' + b.columns.map(function (c) {
          return '<div class="cols__col">' +
            (c.title ? '<div class="cols__title">' + c.title + "</div>" : "") +
            blocks(c.blocks) + "</div>";
        }).join("") + "</div>";

      case "table":
        return table(b);

      case "callout":
        var meta = CALLOUT[b.kind] || CALLOUT.clave;
        return '<aside class="callout callout--' + b.kind + '" role="note">' +
          '<div class="callout__head">' +
            '<i class="ph ' + meta.icon + ' callout__icon" aria-hidden="true"></i>' +
            '<span class="callout__kind">' + meta.label + "</span>" +
          "</div>" +
          (b.title ? '<p class="callout__title">' + b.title + "</p>" : "") +
          '<div class="callout__body prose">' + blocks(b.blocks) + "</div>" +
          "</aside>";

      case "phrases":
        return '<div class="phrases">' + b.items.map(function (t, i) {
          return '<div class="phrase"><div class="phrase__n">' + (i + 1) + '</div>' +
            '<div class="phrase__t">' + t + "</div></div>";
        }).join("") + "</div>";

      case "case":
        var c = (window.BACT.cases || []).filter(function (x) { return x.id === b.ref; })[0];
        return c ? caseBlock(c) : "";

      case "figure":
        return window.Figures ? window.Figures.block(b.ref) : "";

      case "checklist":
        return '<div class="checks">' + b.items.map(function (t, i) {
          var k = b.id + "-" + i;
          var on = window.Store && Store.check(k);
          return '<label class="checks__i"><input type="checkbox" data-mcheck="' + k + '"' + (on ? " checked" : "") + "><span>" + t + "</span></label>";
        }).join("") + "</div>";

      default:
        return "";
    }
  }

  function table(b) {
    var id = "tf" + Math.random().toString(36).slice(2, 8);
    var head = "<thead><tr>" + b.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead>";
    var body = "<tbody>" + b.rows.map(function (r) {
      return '<tr data-search="' + esc(r.join(" ").replace(/<[^>]+>/g, "")).toLowerCase() + '">' +
        r.map(function (cell) { return "<td>" + cell + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody>";

    return '<div class="tablewrap" data-table="' + id + '">' +
      (b.caption ? '<div class="tablewrap__cap">' + b.caption + "</div>" : "") +
      (b.filterable
        ? '<div class="tablewrap__filter">' +
            '<i class="ph ph-funnel-simple" aria-hidden="true"></i>' +
            '<input type="search" placeholder="Filtrar linhas desta tabela…" aria-label="Filtrar tabela" data-tfilter>' +
            '<span class="tablewrap__count" data-tcount>' + b.rows.length + " linhas</span>" +
          "</div>"
        : "") +
      '<div class="tablescroll"><table class="t">' + head + body + "</table></div>" +
      "</div>";
  }

  function caseBlock(c) {
    return '<div class="case">' +
      '<div class="case__head">' +
        '<div class="case__label"><i class="ph ph-pencil-line" aria-hidden="true"></i>' + c.label + "</div>" +
        '<p class="case__title">' + c.title + "</p>" +
      "</div>" +
      '<div class="case__stem">' + c.stem + "</div>" +
      '<div class="case__qs">' + c.questions.map(function (q, i) {
        return '<div class="caseq" data-open="0">' +
          '<button class="caseq__btn" type="button" data-caseq>' +
            '<i class="ph ph-caret-right" aria-hidden="true"></i>' +
            "<span>" + q.q + "</span>" +
          "</button>" +
          '<div class="caseq__a">' + q.a + "</div>" +
          "</div>";
      }).join("") + "</div>" +
      (window.Treino && Treino.drillFor(c.id)
        ? '<div class="case__foot"><button type="button" class="missed__go" data-treino="' + Treino.drillFor(c.id) + '">Responder por escrito no Treino →</button></div>'
        : "") +
      "</div>";
  }

  window.Render = { blocks: blocks, block: block, esc: esc, calloutMeta: CALLOUT };
})();
