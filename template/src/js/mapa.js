/* Mapa de revisão (o essencial em uma tela) e o cartão "roteiro de hoje" da capa.
   Mapa: data/mapa.js define window.BACT.mapa = { title, lead, homeDesc, parts: [{ id, title, src, blocks }] }
   ou null (a aba some). Os blocos são os mesmos do manual, incluindo { t: "figure" } e { t: "checklist" }.
   Roteiro: meta.examDate ("AAAA-MM-DD") e meta.roteiro (ver data/meta.js). */
(function () {
  "use strict";

  var B = window.BACT;
  var M = B.meta || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------------- roteiro de hoje ---------------- */

  function daysToExam() {
    var d = (M.examDate || "").split("-");
    if (d.length !== 3) return null;
    var now = new Date();
    var a = Date.UTC(+d[0], +d[1] - 1, +d[2]);
    var b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((a - b) / 86400000);
  }

  function actionBtn(a) {
    if (a.section) return '<button class="btn btn--ghost btn--sm" data-go-section="' + a.section + '" data-go-chapter-of="' + a.section.split("-")[0] + '"><i class="ph ph-book-open-text" aria-hidden="true"></i>' + a.label + "</button>";
    return '<button class="btn btn--ghost btn--sm" data-view="' + a.view + '"><i class="ph ' + (a.icon || "ph-arrow-right") + '" aria-hidden="true"></i>' + a.label + "</button>";
  }

  function todayCard() {
    var n = daysToExam();
    if (n === null) return "";
    var R = M.roteiro || {};
    var label = M.examDateLabel || M.examDate;
    if (n < 0) return '<div class="today today--past"><i class="ph ph-calendar-check" aria-hidden="true"></i><div><b>A prova foi em ' + label + ".</b> O conteúdo continua aqui para revisão.</div></div>";

    var step = (R.steps || []).filter(function (s) { return s.days === n; })[0];
    var title = n === 0 ? "A prova é hoje" : "Faltam " + n + " dia" + (n === 1 ? "" : "s") + " para a prova";
    var eyebrow = (R.title || "Roteiro de estudo") + (step ? " · " + step.momento : "");
    var body = step ? step.texto : (R.before || "Siga lendo o material e fazendo os exercícios sem consultar.");
    return '<div class="today">' +
      '<div class="today__eyebrow"><i class="ph ph-calendar-check" aria-hidden="true"></i>' + eyebrow + "</div>" +
      '<div class="today__title">' + title + "</div>" +
      '<p class="today__body">' + body + "</p>" +
      (n === 0 && R.examDayNote ? '<p class="today__body">' + R.examDayNote + "</p>" : "") +
      '<div class="today__actions">' + ((step && step.actions) || R.beforeActions || []).map(actionBtn).join("") + "</div></div>";
  }

  /* ---------------- Mapa ---------------- */

  function render() {
    var P = B.mapa;
    if (!P) return;
    var html = '<div class="wrap">' +
      '<div class="sec-h" style="margin-top:0"><h2>' + (P.title || "Mapa de revisão") + "</h2><p>Condensado do material pelo app</p></div>" +
      (P.lead ? '<p class="thelp" style="margin-top:-6px">' + P.lead + "</p>" : "") +
      '<nav class="mapnav" aria-label="Partes do mapa">' + P.parts.map(function (p, i) {
        return '<button type="button" class="chip" data-mjump="' + p.id + '"><span class="mono">' + (i + 1) + "</span>" + p.title + "</button>";
      }).join("") + "</nav>" +
      P.parts.map(function (p) {
        return '<section class="mapsec" id="' + p.id + '"><div class="mapsec__h"><h3>' + p.title + "</h3>" +
          (p.src ? '<span class="mono">' + p.src + "</span>" : "") + "</div>" +
          '<div class="prose prose--wide">' + p.blocks.map(function (b) {
            // no Mapa os esquemas entram sem a moldura "não está no material": a aba inteira já é do app
            return b.t === "figure" ? Figures.html(b.ref) : Render.block(b);
          }).join("") + "</div></section>";
      }).join("") + "</div>";
    $("#view-mapa").innerHTML = html;
    Figures.hydrate($("#view-mapa"));
  }

  function init() {
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      var j = t.closest ? t.closest("[data-mjump]") : null;
      if (j) {
        var el = document.getElementById(j.dataset.mjump);
        if (el) $("#main").scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });  // desconta a navegação fixa
      }
    });
    // Caixas do bloco { t: "checklist" } (no Mapa ou no manual)
    document.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.matches && t.matches("[data-mcheck]")) Store.setCheck(t.dataset.mcheck, t.checked);
    });
  }

  window.Mapa = { init: init, render: render, todayCard: todayCard, daysToExam: daysToExam };
})();
