/* Aba "Simulado": uma prova simulada entregue pelo professor (PDF à parte), transcrita em data/simulado.js.
   Fluxo: capa e instruções → começar (relógio) → responder → entregar → gabarito comentado embaixo de
   cada questão, autoavaliação com o critério da própria prova e leitura da nota.
   Se o material não tiver simulado, data/simulado.js define window.BACT.simulado = null e a aba some. */
(function () {
  "use strict";

  var B = window.BACT;
  var S = B.simulado;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return Render.esc(s || ""); };
  var AX = B.axes || {};

  if (!S) { window.Simulado = { init: function () {}, render: function () {} }; return; }

  var byN = {};
  S.questions.forEach(function (q) { byN[q.n] = q; });
  var SC = S.scoring || {};
  var MAX = SC.max || S.questions.length;

  /* ---------------- estado ---------------- */

  function state() { return Store.sim(); }
  function fresh() { return { started: 0, submitted: 0, peek: false, nome: "", ans: {}, score: {} }; }
  function answer(s, n) { return s.ans[n] || (s.ans[n] = { choice: {}, text: {} }); }
  function phase(s) {
    if (!s || (!s.started && !s.peek)) return "intro";
    return s.submitted || s.peek ? "review" : "doing";
  }
  function words(t) { t = (t || "").trim(); return t ? t.split(/\s+/).length : 0; }
  function num(v) { return String(v).replace(".", ","); }
  function opt(axis, v) { var a = AX[axis]; return a ? a.options.filter(function (o) { return o.v === v; })[0] : null; }
  function nameOf(axis, v) { var o = opt(axis, v); return o ? o.l : v; }

  function grade(f, v) {
    if (!v) return "vazio";
    if (v === f.ans) return "ok";
    if (f.alt && f.alt.indexOf(v) !== -1) return "alt";
    return "bad";
  }

  function totals(s) {
    var sum = 0, rated = 0, names = 0, namesOk = 0;
    S.questions.forEach(function (q) {
      var sc = s.score[q.n];
      if (sc !== undefined && sc !== "") { sum += parseFloat(sc); rated++; }
      var a = s.ans[q.n] || { choice: {} };
      q.fields.forEach(function (f) {
        if (!f.pick) return;
        names++;
        var g = grade(f, a.choice[f.k]);
        if (g === "ok" || g === "alt") namesOk++;
      });
    });
    return { sum: Math.round(sum * 10) / 10, rated: rated, names: names, namesOk: namesOk };
  }

  function leituraIdx(sum) {
    var L = SC.leitura;
    if (!L || !L.min) return -1;
    for (var i = 0; i < L.min.length; i++) if (sum >= L.min[i]) return i;
    return L.min.length - 1;
  }

  function clock(s) {
    var end = s.submitted || Date.now();
    var secs = Math.floor((end - s.started) / 1000);
    if (s.submitted) return Math.max(1, Math.round(secs / 60)) + " min";
    var left = (S.minutes || 60) * 60 - secs;
    if (left <= 0) return "Tempo esgotado";
    var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), x = left % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }

  /* ---------------- blocos ---------------- */

  function table(t, hi) {
    return '<div class="tablescroll"><table class="t"><thead><tr>' +
      t.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
      t.rows.map(function (r, i) {
        return "<tr" + (i === hi ? ' class="is-hi"' : "") + ">" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  // Campos da folha de rosto: { label, auto: "nome" | "data" | "tempo" | "nota" }
  function formValue(f, s, ph) {
    var t = s ? totals(s) : null;
    if (f.auto === "nome") return '<input type="text" class="siminput" data-snome value="' + esc(s ? s.nome : "") + '" placeholder="Seu nome" aria-label="Nome">';
    if (f.auto === "data") return s && s.submitted ? new Date(s.submitted).toLocaleDateString("pt-BR") : "—";
    if (f.auto === "tempo") return s && s.submitted ? clock(s) : "—";
    if (f.auto === "nota") return ph === "review" && t.rated ? num(t.sum.toFixed(1)) + " de " + num(MAX) + (t.rated < S.questions.length ? " (" + t.rated + " de " + S.questions.length + " questões avaliadas)" : "") : "—";
    return "";
  }

  function headHtml(s) {
    var ph = phase(s);
    var fields = (S.formFields || []).map(function (f) { return typeof f === "string" ? { label: f } : f; });
    return '<header class="simhead">' +
      (S.header ? '<div class="simhead__uni">' + S.header.join("<br>") + "</div>" : "") +
      (S.kicker ? '<div class="simhead__kicker">' + S.kicker + "</div>" : "") +
      "<h1>" + S.title + "</h1>" +
      (S.subtitle ? '<p class="simhead__sub"><em>' + S.subtitle + "</em></p>" : "") +
      (S.course ? '<p class="simhead__course"><b>' + S.course + "</b></p>" : "") +
      (S.note ? '<p class="simhead__note">' + S.note + "</p>" : "") +
    "</header>" +
    '<div class="prose simintro">' + (S.intro || []).map(function (p) { return "<p>" + p + "</p>"; }).join("") +
      (S.warning ? '<p class="simwarn">' + S.warning + "</p>" : "") + "</div>" +
    (fields.length ? '<div class="tablescroll"><table class="t simform"><thead><tr><th>' + (S.formCols || ["Campo", "Preenchimento"]).join("</th><th>") + "</th></tr></thead><tbody>" +
      fields.map(function (f) { return "<tr><td>" + f.label + "</td><td>" + formValue(f, s, ph) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "");
  }

  function fieldHtml(q, f, a, locked) {
    var chosen = a.choice[f.k] || "", text = a.text[f.k] || "", ax = AX[f.pick];
    var html = '<div class="dpart"><div class="dpart__label">' + f.label + "</div>";
    if (ax) {
      html += '<div class="dopts">' + ax.options.map(function (o) {
        return '<button type="button" class="dopt dopt--' + (ax.tone === "accent" ? "accent" : "ink") + '" data-spick="' + q.n + '" data-k="' + f.k + '" data-v="' + o.v + '" aria-pressed="' + (chosen === o.v) + '"' + (locked ? " disabled" : "") + ">" + o.l + "</button>";
      }).join("") + "</div>";
    }
    if (f.text) {
      html += '<textarea class="dtext" data-stext="' + q.n + '" data-k="' + f.k + '" rows="3"' + (locked ? " readonly" : "") +
        ' placeholder="' + (f.placeholder || (ax ? "Justifique…" : "Escreva a sua resposta…")) + '">' + esc(text) + "</textarea>" +
        '<div class="dcount" data-scount="' + q.n + "-" + f.k + '">' + words(text) + " palavra" + (words(text) === 1 ? "" : "s") + "</div>";
    }
    if (locked && ax) {
      var g = grade(f, chosen);
      html += g === "ok" ? '<div class="dres dres--ok"><i class="ph ph-check-circle" aria-hidden="true"></i><span>Correto: <b>' + nameOf(f.pick, f.ans) + "</b></span></div>"
        : g === "alt" ? '<div class="dres dres--alt"><i class="ph ph-scales" aria-hidden="true"></i><span>Também aceita se bem argumentada. Resposta esperada: <b>' + nameOf(f.pick, f.ans) + "</b>.</span></div>"
        : '<div class="dres dres--bad"><i class="ph ph-x-circle" aria-hidden="true"></i><span>' + (chosen ? "Você marcou <b>" + nameOf(f.pick, chosen) + "</b>. " : "Sem resposta. ") + "Resposta esperada: <b>" + nameOf(f.pick, f.ans) + "</b>.</span></div>";
    }
    return html + "</div>";
  }

  function gabHtml(q) {
    var g = q.gab || {}, c = null;
    B.chapters.forEach(function (ch) { ch.sections.forEach(function (sec) { if (sec.id === q.sec) c = { ch: ch.id, sec: sec }; }); });
    return '<div class="simgab">' +
      (g.head ? '<div class="simgab__h">' + g.head + "</div>" : "") +
      (g.answer ? '<p class="simgab__a">' + g.answer + "</p>" : "") +
      (g.lead ? "<p>" + g.lead + "</p>" : "") +
      (g.items ? "<ul>" + g.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>" : "") +
      (q.appNote ? '<div class="aside" style="margin:10px 0 0">' + q.appNote + "</div>" : "") +
      (c ? '<button class="missed__go" data-goto-sec="' + q.sec + '" data-goto-ch="' + c.ch + '">Abrir ' + c.sec.num + " " + c.sec.title + " →</button>" : "") +
    "</div>";
  }

  function scoreHtml(q, s) {
    var v = s.score[q.n], max = q.max || 1, step = SC.step || 0.1;
    var opts = ['<option value="">Avaliar…</option>'];
    for (var x = Math.round(max / step); x >= 0; x--) {
      var val = (x * step).toFixed(1);
      opts.push('<option value="' + val + '"' + (v === val ? " selected" : "") + ">" + num(val) + "</option>");
    }
    return '<div class="simscore">' +
      '<label><span class="dtag">Sua nota nesta questão</span><select class="select" data-sscore="' + q.n + '">' + opts.join("") + "</select></label>" +
      "<p>" + (SC.hint || "Use o critério de autoavaliação do simulado.") + " Seja rigoroso: conta só o que está escrito.</p></div>";
  }

  function questionHtml(q, s, ph) {
    var a = s ? answer(s, q.n) : { choice: {}, text: {} };
    var locked = ph === "review";
    var html = '<article class="drill simq" id="simq-' + q.n + '">' +
      '<header class="drill__head"><span class="drill__label"><i class="ph ph-clipboard-text" aria-hidden="true"></i>Questão ' + q.n + (q.pts ? " (" + q.pts + ")" : "") + "</span>" +
        (locked && s.score[q.n] ? '<span class="dstat">' + num(s.score[q.n]) + "</span>" : "") + "</header>" +
      '<div class="drill__stem">' + q.stem.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div>" +
      (q.quote ? '<blockquote class="simquote">' + q.quote + "</blockquote>" : "") +
      (q.after ? '<div class="drill__stem"><p>' + q.after + "</p></div>" : "") +
      (q.prompt ? '<p class="drill__ask">' + q.prompt + "</p>" : "") +
      q.fields.map(function (f) { return fieldHtml(q, f, a, locked); }).join("");
    if (locked) html += gabHtml(q) + scoreHtml(q, s);
    return html + "</article>";
  }

  // Blocos especiais das seções pós-gabarito: { t: "sim-leitura" } e { t: "sim-folha" }
  function sectionBlocks(blocks, s) {
    var t = totals(s);
    return blocks.map(function (b) {
      if (b.t === "sim-leitura") return SC.leitura ? table(SC.leitura, t.rated ? leituraIdx(t.sum) : -1) : "";
      if (b.t === "sim-folha") {
        var F = S.folha || { items: [] };
        return '<div class="checks">' + F.items.map(function (it) {
          var flag = typeof it.detect === "function" ? it.detect(s.ans, { words: words, nameOf: nameOf }) : null;
          return '<div class="checks__i' + (flag ? " is-flag" : "") + '"><i class="ph ' + (flag ? "ph-warning" : "ph-magnifying-glass") + '" aria-hidden="true"></i><span>' + it.t +
            (flag ? '<small class="simflag">Detectado no seu simulado: ' + flag + "</small>" : "") + "</span></div>";
        }).join("") + "</div>";
      }
      return '<div class="prose">' + Render.block(b) + "</div>";
    }).join("");
  }

  function reviewTail(s) {
    return (S.sections || []).map(function (sec) {
      return '<section class="mapsec"' + (sec.id ? ' id="' + sec.id + '"' : "") + '><div class="mapsec__h"><h3>' + sec.title + "</h3></div>" + sectionBlocks(sec.blocks, s) + "</section>";
    }).join("");
  }

  function summaryHtml(s) {
    var t = totals(s), i = leituraIdx(t.sum), L = SC.leitura && i >= 0 ? SC.leitura.rows[i] : null;
    var nQ = S.questions.length;
    return '<div class="tstats">' +
        '<div class="stat stat--accent"><div class="stat__v">' + (t.rated ? num(t.sum.toFixed(1)) : "—") + '</div><div class="stat__l">sua nota de ' + num(MAX) + " · " + t.rated + " de " + nQ + " avaliadas</div></div>" +
        '<div class="stat"><div class="stat__v">' + (t.names ? t.namesOk + " / " + t.names : "—") + '</div><div class="stat__l">escolhas certas (conferidas pelo app)</div></div>' +
        '<div class="stat"><div class="stat__v">' + (s.submitted ? clock(s) : "—") + '</div><div class="stat__l">tempo usado de ' + (S.minutes || 60) + " min</div></div>" +
      "</div>" +
      (t.rated === nQ && L
        ? '<div class="callout callout--examen" role="note"><div class="callout__head"><i class="ph ph-exam callout__icon" aria-hidden="true"></i><span class="callout__kind">' + L.slice(0, -1).join(" · ") + '</span></div><div class="callout__body prose"><p>' + L[L.length - 1] + ".</p></div></div>"
        : '<p class="thelp">Leia o gabarito embaixo de cada questão e dê a sua nota com o critério do simulado.' + (L ? " Com todas avaliadas, a leitura da nota aparece aqui." : "") + "</p>") +
      (s.peek && !s.submitted ? '<p class="thelp"><b>Você abriu o gabarito sem fazer o simulado.</b></p>' : "") +
      '<div class="tactions"><button type="button" class="btn btn--ghost btn--sm" data-sim-reset><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>' + (s.submitted ? "Refazer o simulado" : "Fazer o simulado") + "</button>" +
      (SC.anchor ? '<button type="button" class="btn btn--ghost btn--sm" data-sim-jump="' + SC.anchor + '"><i class="ph ph-list-checks" aria-hidden="true"></i>Critério de autoavaliação</button>' : "") + "</div>";
  }

  /* ---------------- render ---------------- */

  function render(opts) {
    var s = state(), ph = phase(s);
    var html = '<div class="wrap wrap--narrow">' + headHtml(s);

    if (ph === "intro") {
      html += '<div class="simstart">' +
        '<button type="button" class="btn btn--primary" data-sim-start><i class="ph ph-timer" aria-hidden="true"></i>Começar o simulado · ' + (S.minutes || 60) + " minutos</button>" +
        '<button type="button" class="btn btn--ghost" data-sim-peek><i class="ph ph-eye" aria-hidden="true"></i>Ver o gabarito sem fazer</button>' +
        '<p class="thelp">As questões aparecem quando você começa. As respostas ficam salvas neste computador; o relógio conta o tempo mas não trava a prova. Ao entregar, o gabarito comentado aparece embaixo de cada questão.</p></div>';
    } else {
      if (ph === "doing") {
        html += '<div class="exambar"><span class="exambar__clock" id="simClock"><i class="ph ph-timer" aria-hidden="true"></i><span>' + clock(s) + "</span></span>" +
          '<span class="exambar__t" id="simCount"></span>' +
          '<button type="button" class="btn btn--primary btn--sm" data-sim-submit><i class="ph ph-flag-checkered" aria-hidden="true"></i>Entregar</button></div>';
      } else {
        html += '<div class="sec-h"><h2>' + (S.gabaritoTitle || "Gabarito comentado") + "</h2></div>" +
          (S.gabaritoWarn ? '<p class="simwarn simwarn--solo"><b>' + S.gabaritoWarn + "</b></p>" : "") +
          (S.gabaritoIntro ? '<p class="thelp">' + S.gabaritoIntro + "</p>" : "") + summaryHtml(s);
      }
      (S.parts || [{ questions: S.questions.map(function (q) { return q.n; }) }]).forEach(function (p) {
        if (p.title) html += '<div class="tset"><h3>' + p.title + "</h3>" + (p.instr ? "<p>" + p.instr + "</p>" : "") + "</div>";
        html += p.questions.map(function (n) { return questionHtml(byN[n], s, ph); }).join("");
      });
      if (S.endNote) html += '<p class="simend"><em>' + S.endNote + "</em></p>";
      html += ph === "doing"
        ? '<div class="simstart"><button type="button" class="btn btn--primary" data-sim-submit><i class="ph ph-flag-checkered" aria-hidden="true"></i>Entregar e ver o gabarito</button></div>'
        : reviewTail(s);
    }

    $("#view-simulado").innerHTML = html + "</div>";
    updateCount();
    if (opts && opts.focus) {
      var el = document.getElementById("simq-" + opts.focus);
      if (el) requestAnimationFrame(function () { $("#main").scrollTop = el.offsetTop - 80; });
    }
  }

  function updateCount() {
    var el = $("#simCount"), s = state();
    if (!el || !s) return;
    var marked = 0, need = 0;
    S.questions.forEach(function (q) {
      var a = s.ans[q.n] || { choice: {}, text: {} };
      q.fields.forEach(function (f) {
        need++;
        if ((f.pick && a.choice[f.k]) || (!f.pick && words(a.text[f.k]))) marked++;
      });
    });
    el.textContent = marked + " de " + need + " campos respondidos · sem consulta";
  }

  function tick() {
    var el = document.querySelector("#simClock span"), s = state();
    if (!el || !s || s.submitted) return;
    el.textContent = clock(s);
    el.parentNode.classList.toggle("is-late", el.textContent === "Tempo esgotado");
  }

  /* ---------------- eventos ---------------- */

  function init() {
    var view = $("#view-simulado");
    if (!view) return;

    view.addEventListener("click", function (ev) {
      var t = ev.target, s = state();
      if (t.closest("[data-sim-start]")) {
        var n = fresh(); n.nome = s ? s.nome : ""; n.started = Date.now();
        Store.setSim(n); render(); $("#main").scrollTop = 0; return;
      }
      if (t.closest("[data-sim-peek]")) {
        if (!confirm(S.peekConfirm || "Ver o gabarito sem fazer o simulado?")) return;
        var p = fresh(); p.nome = s ? s.nome : ""; p.peek = true;
        Store.setSim(p); render(); return;
      }
      if (t.closest("[data-sim-submit]")) {
        if (!confirm("Entregar o simulado e abrir o gabarito comentado?")) return;
        s.submitted = Date.now(); Store.setSim(s); render(); $("#main").scrollTop = 0; return;
      }
      if (t.closest("[data-sim-reset]")) {
        if (s && s.submitted && !confirm("Apagar as respostas e as notas deste simulado e começar de novo?")) return;
        var r = fresh(); r.nome = s ? s.nome : "";
        Store.setSim(r); render(); $("#main").scrollTop = 0; return;
      }
      var j = t.closest("[data-sim-jump]");
      if (j) { var el = document.getElementById(j.dataset.simJump); if (el) $("#main").scrollTo({ top: el.offsetTop - 16, behavior: "smooth" }); return; }

      var pk = t.closest("[data-spick]");
      if (pk && !pk.disabled && s) {
        var a = answer(s, pk.dataset.spick);
        a.choice[pk.dataset.k] = a.choice[pk.dataset.k] === pk.dataset.v ? "" : pk.dataset.v;
        Store.setSim(s);
        $$('[data-spick="' + pk.dataset.spick + '"][data-k="' + pk.dataset.k + '"]', view).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.v === a.choice[pk.dataset.k]));
        });
        updateCount();
      }
    });

    view.addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.matches("[data-snome]")) { var s0 = state() || fresh(); s0.nome = t.value; Store.setSim(s0); return; }
      if (!t.matches("[data-stext]")) return;
      var s = state();
      answer(s, t.dataset.stext).text[t.dataset.k] = t.value;
      Store.setSim(s);
      var w = words(t.value), c = $('[data-scount="' + t.dataset.stext + "-" + t.dataset.k + '"]', view);
      if (c) c.textContent = w + " palavra" + (w === 1 ? "" : "s");
      updateCount();
    });

    view.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!t.matches("[data-sscore]")) return;
      var s = state();
      if (t.value === "") delete s.score[t.dataset.sscore]; else s.score[t.dataset.sscore] = t.value;
      Store.setSim(s);
      var top = $("#main").scrollTop;
      render();
      $("#main").scrollTop = top;
    });

    setInterval(tick, 1000);
  }

  window.Simulado = { init: init, render: render };
})();
