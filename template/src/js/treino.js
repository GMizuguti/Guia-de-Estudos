/* Treino com resposta escrita: escolher (quando houver eixo), escrever, corrigir, comparar com o modelo
   e se autoavaliar. Opcionalmente, uma prova aleatória com relógio.
   Dados: data/eixos.js (B.axes, B.axesConflict, B.selfCheck) e data/treino.js (B.drillSets, B.drills,
   B.drillExam, B.drillInterpret). Casos de data/cases.js que nenhum exercício referencia viram
   exercícios automaticamente, com a resposta do material como modelo. */
(function () {
  "use strict";

  var B = window.BACT;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return Render.esc(s || ""); };
  var AX = B.axes || {};

  var DEFAULT_CHECKS = [
    ["ev", "Citei o <b>dado do enunciado</b> que sustenta a resposta"],
    ["li", "Expliquei o <b>raciocínio</b> que liga o dado à resposta"],
    ["de", "Disse por que a <b>alternativa mais próxima</b> não serve"]
  ];

  var st = { tab: null, filter: "todos" };
  var caseById = {};
  (B.cases || []).forEach(function (c) { caseById[c.id] = c; });

  /* ---------------- montagem da lista ---------------- */

  var sets = (B.drillSets || []).slice();
  var drills = (B.drills || []).slice();
  (function autoFromCases() {
    var used = {};
    drills.forEach(function (d) { if (d.case) used[d.case] = true; });
    var auto = (B.cases || []).filter(function (c) { return !used[c.id]; }).map(function (c) {
      return { id: c.id, set: "casos", case: c.id, parts: c.questions.map(function (q) {
        return { label: q.q, axis: null, model: q.a, fromMaterial: true };
      }) };
    });
    if (auto.length) {
      drills = drills.concat(auto);
      if (!sets.some(function (s) { return s.id === "casos"; })) sets.push({ id: "casos", name: "Casos do material", origin: "material" });
    }
  })();
  var byId = {};
  drills.forEach(function (d) { byId[d.id] = d; });

  function setOf(d) { return sets.filter(function (s) { return s.id === d.set; })[0] || { id: d.set, name: d.set, origin: "material" }; }
  function tabOf(d) { return setOf(d).origin === "app" ? "extras" : "material"; }

  /* ---------------- utilidades ---------------- */

  function opt(axis, v) {
    var a = AX[axis];
    return a ? a.options.filter(function (o) { return o.v === v; })[0] : null;
  }
  function nameOf(axis, v) { var o = opt(axis, v); return o ? o.l : v; }
  function keyOf(d, mode) { return (mode === "exam" ? "e:" : "") + d.id; }
  function rec(d, mode) { return Store.drill(keyOf(d, mode)) || { choice: {}, text: {}, self: {} }; }
  function save(d, mode, r) { r.at = Date.now(); Store.setDrill(keyOf(d, mode), r); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function words(t) { t = (t || "").trim(); return t ? t.split(/\s+/).length : 0; }

  function label(d) {
    if (d.label) return d.label;
    if (d.case && caseById[d.case]) return caseById[d.case].label;
    var s = setOf(d);
    var n = drills.filter(function (x) { return x.set === d.set; }).indexOf(d) + 1;
    return (s.origin === "app" ? "Extra · " : "") + s.name + " " + n;
  }

  function info(d) {
    var c = d.case ? caseById[d.case] : null;
    return {
      title: d.title || (c ? c.title : ""),
      stem: d.stem || (c ? c.stem : ""),
      proposal: d.proposal, note: d.note,
      ask: d.ask || (c && !d.parts.some(function (p) { return p.axis; }) ? "" : "Responda e justifique."),
      gab: d.gab || (c && d.parts.some(function (p) { return p.axis; }) && c.questions.length === 1 ? c.questions[0].a : ""),
      ch: d.ch || (c ? c.chapter : ""), sec: d.sec || (c ? c.section : "")
    };
  }

  // resultado de uma parte com eixo: "ok" | "alt" | "bad" | "vazio"; sem eixo: null
  function grade(p, chosen) {
    if (!p.axis) return null;
    if (!chosen) return "vazio";
    if (chosen === p.ans) return "ok";
    if (p.alt && p.alt.indexOf(chosen) !== -1) return "alt";
    return "bad";
  }
  function examState() { return Store.exam(); }
  function examSubmitted() { var e = examState(); return !!(e && e.submitted); }

  /* ---------------- um exercício ---------------- */

  function choiceHtml(p, i, chosen, done) {
    var a = AX[p.axis];
    if (!a) return "";
    if (a.tone === "select") {
      return '<select class="select dsel" data-dsel="' + i + '"' + (done ? " disabled" : "") + ' aria-label="' + a.label + '">' +
        '<option value="">' + (a.placeholder || "Escolha…") + "</option>" +
        a.options.map(function (o) { return '<option value="' + o.v + '"' + (chosen === o.v ? " selected" : "") + ">" + o.l + "</option>"; }).join("") +
        "</select>";
    }
    return '<div class="dopts" role="group" aria-label="' + a.label + '">' + a.options.map(function (o) {
      return '<button type="button" class="dopt dopt--' + (a.tone === "accent" ? "accent" : "ink") + '" data-dpick="' + i + '" data-v="' + o.v + '" aria-pressed="' + (chosen === o.v) + '"' + (done ? " disabled" : "") + ">" + o.l + "</button>";
    }).join("") + "</div>";
  }

  function partHtml(d, p, i, r, done) {
    var chosen = r.choice[i] || "";
    var text = r.text[i] || "";
    var w = words(text);
    var axisName = p.axis && AX[p.axis] ? AX[p.axis].label : "";
    var body = '<div class="dpart__label">' + (p.label || "") + (p.label && axisName ? " · " : "") +
        (axisName ? '<span class="dpart__axis">' + axisName + "</span>" : "") + "</div>" +
      choiceHtml(p, i, chosen, done) +
      (p.text === false ? "" :
        '<textarea class="dtext" data-dtext="' + i + '" rows="3" placeholder="' + (p.placeholder || (AX[p.axis] && AX[p.axis].textPlaceholder) || (p.axis ? "Justifique: o dado do enunciado, o raciocínio e por que a alternativa próxima não serve…" : "Escreva a sua resposta…")) + '"' + (done ? " readonly" : "") + ">" + esc(text) + "</textarea>" +
        '<div class="dcount" data-dcount="' + i + '">' + w + " palavra" + (w === 1 ? "" : "s") + "</div>");

    if (done) {
      var g = grade(p, chosen);
      var res = "";
      if (g === "ok") res = '<div class="dres dres--ok"><i class="ph ph-check-circle" aria-hidden="true"></i><span>Correto: <b>' + nameOf(p.axis, p.ans) + "</b></span></div>";
      else if (g === "alt") res = '<div class="dres dres--alt"><i class="ph ph-scales" aria-hidden="true"></i><span>Aceita se bem argumentada. Resposta principal: <b>' + nameOf(p.axis, p.ans) + "</b>. " + (p.altNote || "") + "</span></div>";
      else if (g) res = '<div class="dres dres--bad"><i class="ph ph-x-circle" aria-hidden="true"></i><span>' +
        (chosen ? "Você marcou <b>" + nameOf(p.axis, chosen) + "</b>. " : "Sem resposta. ") + "Resposta: <b>" + nameOf(p.axis, p.ans) + "</b>" +
        (p.alt ? " (também aceita, se argumentada: " + p.alt.map(function (v) { return nameOf(p.axis, v); }).join(", ") + ")" : "") + ".</span></div>";
      if (!text.trim() && p.text !== false) res += '<div class="dres dres--warn"><i class="ph ph-warning" aria-hidden="true"></i><span>Você não escreveu nada. Escrever a resposta é o que fixa o raciocínio e o que a prova corrige.</span></div>';

      var checks = p.checks || (p.axis && AX[p.axis] && AX[p.axis].checks) || B.selfCheck || DEFAULT_CHECKS;
      var self = r.self[i] || {};
      // fromMaterial: resposta transcrita do material; senão, o modelo foi escrito pelo app
      var origin = p.fromMaterial ? "Resposta do material" : "Resposta-modelo · escrita pelo app";
      body += res +
        (i === 0 && info(d).gab ? '<div class="dbox dbox--guide"><span class="dtag">Gabarito do material</span>' + info(d).gab + "</div>" : "") +
        (p.model ? '<div class="dbox dbox--model"><span class="dtag">' + origin + "</span>" + p.model + "</div>" : "") +
        '<div class="dself"><span class="dtag">Compare com o modelo e marque o que a sua resposta tem</span>' +
          checks.map(function (c) {
            return '<label class="dself__i"><input type="checkbox" data-dself="' + i + '" data-k="' + c[0] + '"' + (self[c[0]] ? " checked" : "") + "> <span>" + c[1] + "</span></label>";
          }).join("") + "</div>";
    }
    return '<div class="dpart" data-part="' + i + '">' + body + "</div>";
  }

  // Checagem de compatibilidade entre escolhas de eixos diferentes (B.axesConflict, opcional)
  function conflictHtml(d, r) {
    if (typeof B.axesConflict !== "function") return "";
    var ch = {}, axes = {};
    d.parts.forEach(function (p, i) { if (p.axis) { axes[p.axis] = true; if (r.choice[i] && !ch[p.axis]) ch[p.axis] = r.choice[i]; } });
    if (Object.keys(axes).length < 2) return "";
    var msg = B.axesConflict(ch);
    return msg ? '<div class="dres dres--warn"><i class="ph ph-warning" aria-hidden="true"></i><span>' + msg + "</span></div>" : "";
  }

  function hintHtml(d) {
    var seen = {}, out = "";
    d.parts.forEach(function (p) {
      var a = AX[p.axis];
      if (a && a.hint && !seen[p.axis]) { seen[p.axis] = true; out += a.hint; }
    });
    return out ? '<div class="dhint" hidden><span class="dtag">Dica</span>' + out + "</div>" : "";
  }

  function readLink(d) {
    var I = info(d);
    var p0 = d.parts[0], o = p0 && p0.axis ? opt(p0.axis, p0.ans) : null;
    if (d.parts.length === 1 && o && o.sec) return '<button class="missed__go" data-goto-sec="' + o.sec + '" data-goto-ch="' + o.sec.split("-")[0] + '">Reler: ' + o.l + " →</button>";
    if (I.sec) return '<button class="missed__go" data-goto-sec="' + I.sec + '" data-goto-ch="' + (I.ch || I.sec.split("-")[0]) + '">Ler o trecho relacionado →</button>';
    return "";
  }

  function drillHtml(d, mode, num) {
    var r = rec(d, mode);
    var I = info(d);
    var done = mode === "exam" ? examSubmitted() : !!r.done;
    var graded = d.parts.filter(function (p) { return p.axis; });
    var status = done
      ? (graded.length
          ? (graded.every(function (p) { var i = d.parts.indexOf(p); var g = grade(p, r.choice[i]); return g === "ok" || g === "alt"; })
              ? '<span class="dstat dstat--ok">escolhas certas</span>' : '<span class="dstat dstat--bad">rever</span>')
          : '<span class="dstat">corrigido</span>')
      : (Object.keys(r.choice).length || Object.keys(r.text).length ? '<span class="dstat">rascunho</span>' : "");
    var hint = mode === "exam" || done ? "" : hintHtml(d);

    return '<article class="drill" id="drill-' + d.id + '" data-drill="' + d.id + '" data-mode="' + (mode || "") + '"' + (num ? ' data-num="' + num + '"' : "") + ">" +
      '<header class="drill__head">' +
        '<span class="drill__label"><i class="ph ph-pencil-line" aria-hidden="true"></i>' + (num ? "Questão " + num + " · " : "") + label(d) + "</span>" + status +
      "</header>" +
      (I.title ? '<p class="drill__title">' + I.title + "</p>" : "") +
      '<div class="drill__stem">' + I.stem + "</div>" +
      (I.proposal ? '<div class="drill__prop"><span class="dtag">Proposta apresentada</span>"' + I.proposal + '"</div>' : "") +
      (I.ask ? '<p class="drill__ask">' + I.ask + "</p>" : "") +
      d.parts.map(function (p, i) { return partHtml(d, p, i, r, done); }).join("") +
      (mode === "exam" && !done ? "" : '<div data-dconflict>' + conflictHtml(d, r) + "</div>") +
      (done && I.note ? '<div class="aside" style="margin:14px 0 0">' + I.note + "</div>" : "") +
      '<footer class="drill__foot">' +
        (mode === "exam" ? "" :
          (done
            ? '<button type="button" class="btn btn--ghost btn--sm" data-dreset><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>Refazer</button>'
            : (hint ? '<button type="button" class="btn btn--ghost btn--sm" data-dhint><i class="ph ph-signpost" aria-hidden="true"></i>Dica</button>' : "") +
              '<button type="button" class="btn btn--primary btn--sm" data-dcorrect><i class="ph ph-check" aria-hidden="true"></i>Corrigir</button>')) +
        (done ? readLink(d) : "") +
      "</footer>" + hint +
    "</article>";
  }

  function rerender(id, mode) {
    var el = document.getElementById("drill-" + id);
    if (!el) return;
    el.outerHTML = drillHtml(byId[id], mode, el.dataset.num ? parseInt(el.dataset.num, 10) : 0);
    renderStats();
  }

  /* ---------------- estatísticas ---------------- */

  function practiceStats(filterFn) {
    var s = { items: 0, done: 0, parts: 0, right: 0, texts: 0, selfFull: 0, conf: {} };
    drills.forEach(function (d) {
      if (filterFn && !filterFn(d)) return;
      s.items++;
      var r = Store.drill(d.id);
      if (!r || !r.done) return;
      s.done++;
      d.parts.forEach(function (p, i) {
        var g = grade(p, r.choice[i]);
        if (g) {
          s.parts++;
          if (g === "ok" || g === "alt") s.right++;
          else if (r.choice[i] && AX[p.axis] && AX[p.axis].tone !== "select") {
            var k = p.axis + ":" + r.choice[i] + ">" + p.ans;
            s.conf[k] = (s.conf[k] || 0) + 1;
          }
        }
        if (p.text !== false) {
          s.texts++;
          var self = r.self && r.self[i];
          if (self && Object.keys(self).filter(function (k) { return self[k]; }).length >= 3) s.selfFull++;
        }
      });
    });
    return s;
  }

  function stat(v, l) { return '<div class="stat"><div class="stat__v">' + v + '</div><div class="stat__l">' + l + "</div></div>"; }

  function renderStats() {
    var box = $("#treinoStats");
    if (!box) return;
    if (st.tab === "prova") { renderExamBar(); return; }

    var s = practiceStats(function (d) { return tabOf(d) === st.tab; });
    var all = practiceStats();
    var html = '<div class="tstats">' +
      stat(s.done + " / " + s.items, "exercícios corrigidos") +
      stat(s.parts ? s.right + " / " + s.parts : "—", "escolhas certas") +
      stat(s.texts ? Math.round((s.selfFull / s.texts) * 100) + "%" : "—", "respostas com todos os itens da autoavaliação") +
    "</div>";

    var I = B.drillInterpret;
    if (I && typeof I.fn === "function") {
      var si = practiceStats(function (d) { return d.set === I.set; });
      if (si.items && si.done === si.items && tabOf(drills.filter(function (d) { return d.set === I.set; })[0]) === st.tab) {
        html += '<div class="callout callout--examen" role="note"><div class="callout__head"><i class="ph ph-exam callout__icon" aria-hidden="true"></i><span class="callout__kind">' + (I.title || "Seu resultado") + "</span></div>" +
          '<div class="callout__body prose"><p><b>' + si.right + " de " + si.parts + ".</b> " + I.fn(si.right, si.parts) + "</p></div></div>";
      }
    }

    var conf = Object.keys(all.conf).sort(function (a, b) { return all.conf[b] - all.conf[a]; }).slice(0, 4);
    if (conf.length) {
      html += '<div class="tconf"><div class="dtag">Suas confusões mais frequentes no treino</div>' +
        conf.map(function (k) {
          var axis = k.split(":")[0], pair = k.split(":")[1].split(">"), o = opt(axis, pair[1]);
          return '<div class="tconf__i"><span>Marcou ' + Figures.cat(axis, pair[0]) + " quando era " + Figures.cat(axis, pair[1]) + ' <span class="mono">' + all.conf[k] + "×</span></span>" +
            (o && o.sec ? '<button class="missed__go" data-goto-sec="' + o.sec + '" data-goto-ch="' + o.sec.split("-")[0] + '">Reler →</button>' : "") + "</div>";
        }).join("") + "</div>";
    }
    box.innerHTML = html;
  }

  /* ---------------- prova aleatória (B.drillExam) ---------------- */

  function newExam() {
    Object.keys(Store.drillsAll()).forEach(function (k) { if (k.indexOf("e:") === 0) Store.setDrill(k, null); });
    var X = B.drillExam, ids = [];
    (X.pick || []).forEach(function (rule) {
      var pool = drills.filter(function (d) {
        return (!rule.set || d.set === rule.set) && (!rule.slot || d.slot === rule.slot) && ids.indexOf(d.id) === -1;
      });
      ids = ids.concat(shuffle(pool).slice(0, rule.n || 1).map(function (d) { return d.id; }));
    });
    Store.setExam({ ids: shuffle(ids), started: Date.now(), submitted: 0 });
  }

  function examCounts() {
    var e = examState(), parts = 0, answered = 0, right = 0;
    e.ids.forEach(function (id) {
      var d = byId[id];
      if (!d) return;
      var r = rec(d, "exam");
      d.parts.forEach(function (p, i) {
        var g = grade(p, r.choice[i]);
        if (!g) return;
        parts++;
        if (r.choice[i]) answered++;
        if (g === "ok" || g === "alt") right++;
      });
    });
    return { parts: parts, answered: answered, right: right };
  }

  function clockText() {
    var e = examState(), mins = B.drillExam.minutes || 60;
    var end = e.submitted || Date.now();
    var secs = Math.floor((end - e.started) / 1000);
    if (e.submitted) return Math.max(1, Math.round(secs / 60)) + " min";
    var left = mins * 60 - secs;
    if (left <= 0) return "Tempo esgotado";
    var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function renderExamBar() {
    var box = $("#treinoStats"), e = examState();
    if (!e) { box.innerHTML = ""; return; }
    var c = examCounts();
    if (!e.submitted) {
      box.innerHTML = '<div class="exambar">' +
        '<span class="exambar__clock" id="examClock"><i class="ph ph-timer" aria-hidden="true"></i><span>' + clockText() + "</span></span>" +
        '<span class="exambar__t">' + c.answered + " de " + c.parts + " escolhas marcadas · sem consulta</span>" +
        '<button type="button" class="btn btn--primary btn--sm" data-exam-submit><i class="ph ph-flag-checkered" aria-hidden="true"></i>Entregar</button></div>';
    } else {
      box.innerHTML = '<div class="tstats">' +
        stat(c.right + " / " + c.parts, "escolhas certas") +
        stat(clockText(), "tempo usado de " + B.drillExam.minutes + " min") +
        stat(e.ids.length, "questões") +
      "</div>" +
      '<p class="thelp">A nota real depende de quem corrige. Aqui a escolha é conferida automaticamente e a resposta escrita pela sua autoavaliação, comparando com o modelo.</p>' +
      '<div class="tactions"><button type="button" class="btn btn--primary btn--sm" data-exam-new><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>Nova prova</button>' +
      '<button type="button" class="btn btn--ghost btn--sm" data-exam-clear><i class="ph ph-trash" aria-hidden="true"></i>Descartar esta prova</button></div>';
    }
  }

  function tickClock() {
    var el = document.querySelector("#examClock span"), e = examState();
    if (!el || !e || e.submitted) return;
    el.textContent = clockText();
    el.parentNode.classList.toggle("is-late", el.textContent === "Tempo esgotado");
  }

  /* ---------------- lista ---------------- */

  function filterOk(d) {
    var r = Store.drill(d.id);
    if (st.filter === "afazer") return !r || !r.done;
    if (st.filter === "errados") return r && r.done && d.parts.some(function (p, i) { var g = grade(p, r.choice[i]); return g === "bad" || g === "vazio"; });
    if (st.filter.indexOf("slot:") === 0) return d.slot === st.filter.slice(5);
    return true;
  }

  function listHtml() {
    if (st.tab === "prova") {
      var e = examState(), X = B.drillExam;
      if (!e) {
        return '<div class="qcard examintro">' +
          '<h3><i class="ph ph-exam" aria-hidden="true"></i>' + (X.title || "Prova aleatória") + "</h3>" +
          "<p>" + (X.intro || "Questões sorteadas do treino, com relógio.") + "</p>" +
          "<p>Sem dicas e sem consulta. A correção aparece só quando você entregar.</p>" +
          '<button type="button" class="btn btn--primary" data-exam-new><i class="ph ph-play" aria-hidden="true"></i>Começar a prova</button></div>';
      }
      return e.ids.filter(function (id) { return byId[id]; }).map(function (id, i) { return drillHtml(byId[id], "exam", i + 1); }).join("");
    }
    var html = "";
    var tabSets = sets.filter(function (s) { return (s.origin === "app" ? "extras" : "material") === st.tab; });
    tabSets.forEach(function (set) {
      var items = drills.filter(function (d) { return d.set === set.id && filterOk(d); });
      if (tabSets.length > 1 || set.desc) html += '<div class="tset"><h3>' + set.name + "</h3>" + (set.desc ? "<p>" + set.desc + "</p>" : "") + "</div>";
      html += items.length ? items.map(function (d) { return drillHtml(d, ""); }).join("") : '<p class="thelp">Nada com esse filtro.</p>';
    });
    return html;
  }

  function filters() {
    var f = [["todos", "Todos"], ["afazer", "A fazer"], ["errados", "Para rever"]];
    var slots = {};
    drills.forEach(function (d) { if (d.slot && tabOf(d) === st.tab) slots[d.slot] = true; });
    Object.keys(slots).forEach(function (sl) { f.push(["slot:" + sl, AX[sl] ? AX[sl].label : sl]); });
    return '<div class="cmp-pick" style="margin:0 0 18px">' + f.map(function (x) {
      return '<button type="button" class="chip" data-tfilter-set="' + x[0] + '" aria-pressed="' + (st.filter === x[0]) + '">' + x[1] + "</button>";
    }).join("") + "</div>";
  }

  function tabs() {
    var t = [];
    var nMat = drills.filter(function (d) { return tabOf(d) === "material"; }).length;
    var nExt = drills.filter(function (d) { return tabOf(d) === "extras"; }).length;
    if (nMat) t.push(["material", "Do material", nMat]);
    if (nExt) t.push(["extras", "Extras", nExt]);
    if (B.drillExam) t.push(["prova", "Prova aleatória", null]);
    return t;
  }

  function render(opts) {
    opts = opts || {};
    var T = tabs();
    if (opts.focus && byId[opts.focus]) { st.tab = tabOf(byId[opts.focus]); st.filter = "todos"; }
    if (!st.tab || !T.some(function (t) { return t[0] === st.tab; })) st.tab = T.length ? T[0][0] : "material";

    var html = '<div class="wrap wrap--narrow">' +
      '<div class="sec-h" style="margin-top:0"><h2>Treino com resposta escrita</h2><p>' + drills.length + " exercícios</p></div>" +
      '<p class="thelp" style="margin-top:-6px">Escolha, <b>escreva</b> a resposta e só então corrija: você vê o gabarito, uma resposta-modelo e marca o que a sua tinha.' +
        (st.tab === "extras" ? " Os extras foram elaborados pelo app com os critérios do material; não fazem parte dele." : "") + "</p>" +
      (T.length > 1 ? '<div class="subtabs" role="tablist">' + T.map(function (t) {
        return '<button type="button" class="subtab" role="tab" data-ttab="' + t[0] + '" aria-selected="' + (st.tab === t[0]) + '">' + t[1] +
          (t[2] ? ' <span class="mono">' + t[2] + "</span>" : "") + "</button>";
      }).join("") + "</div>" : "") +
      '<div id="treinoStats"></div>' +
      (st.tab === "prova" ? "" : filters()) +
      '<div id="treinoList">' + listHtml() + "</div></div>";

    $("#view-treino").innerHTML = html;
    renderStats();

    if (opts.focus) {
      var el = document.getElementById("drill-" + opts.focus);
      if (el) requestAnimationFrame(function () {
        $("#main").scrollTop = el.offsetTop - 16;
        el.classList.add("is-flash");
        setTimeout(function () { el.classList.remove("is-flash"); }, 1600);
      });
    }
  }

  /* ---------------- eventos ---------------- */

  function ctxOf(t) {
    var el = t.closest ? t.closest("[data-drill]") : null;
    return el ? { el: el, d: byId[el.dataset.drill], mode: el.dataset.mode || "" } : null;
  }

  function init() {
    var view = $("#view-treino");
    if (!view) return;

    view.addEventListener("click", function (ev) {
      var t = ev.target;
      var tab = t.closest("[data-ttab]");
      if (tab) { st.tab = tab.dataset.ttab; st.filter = "todos"; render(); $("#main").scrollTop = 0; return; }
      var fl = t.closest("[data-tfilter-set]");
      if (fl) { st.filter = fl.dataset.tfilterSet; render(); return; }

      if (t.closest("[data-exam-new]")) {
        var e = examState();
        if (e && !e.submitted && !confirm("Descartar a prova em andamento e começar outra?")) return;
        newExam(); render(); $("#main").scrollTop = 0; return;
      }
      if (t.closest("[data-exam-clear]")) {
        Object.keys(Store.drillsAll()).forEach(function (k) { if (k.indexOf("e:") === 0) Store.setDrill(k, null); });
        Store.setExam(null); render(); return;
      }
      if (t.closest("[data-exam-submit]")) {
        var c = examCounts();
        if (!confirm(c.answered < c.parts ? "Há " + (c.parts - c.answered) + " escolha(s) sem marcar. Entregar assim mesmo?" : "Entregar a prova e ver a correção?")) return;
        var ex = examState(); ex.submitted = Date.now(); Store.setExam(ex);
        render(); $("#main").scrollTop = 0; return;
      }

      var ctx = ctxOf(t);
      if (!ctx) return;
      var r = rec(ctx.d, ctx.mode);
      var pk = t.closest("[data-dpick]");
      if (pk && !pk.disabled) {
        var i = pk.dataset.dpick;
        r.choice[i] = r.choice[i] === pk.dataset.v ? "" : pk.dataset.v;
        save(ctx.d, ctx.mode, r);
        $$('[data-dpick="' + i + '"]', ctx.el).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === r.choice[i])); });
        var cf = $("[data-dconflict]", ctx.el); if (cf) cf.innerHTML = conflictHtml(ctx.d, r);
        if (ctx.mode === "exam") renderExamBar();
        return;
      }
      if (t.closest("[data-dhint]")) { var h = $(".dhint", ctx.el); if (h) h.hidden = !h.hidden; return; }
      if (t.closest("[data-dcorrect]")) { r.done = true; save(ctx.d, ctx.mode, r); rerender(ctx.d.id, ctx.mode); return; }
      if (t.closest("[data-dreset]")) { Store.setDrill(keyOf(ctx.d, ctx.mode), null); rerender(ctx.d.id, ctx.mode); }
    });

    view.addEventListener("change", function (ev) {
      var t = ev.target, ctx = ctxOf(t);
      if (!ctx) return;
      var r = rec(ctx.d, ctx.mode);
      if (t.matches("[data-dsel]")) {
        r.choice[t.dataset.dsel] = t.value; save(ctx.d, ctx.mode, r);
        var cf = $("[data-dconflict]", ctx.el); if (cf) cf.innerHTML = conflictHtml(ctx.d, r);
        if (ctx.mode === "exam") renderExamBar();
        return;
      }
      if (t.matches("[data-dself]")) {
        var i = t.dataset.dself;
        r.self[i] = r.self[i] || {};
        r.self[i][t.dataset.k] = t.checked;
        save(ctx.d, ctx.mode, r);
        renderStats();
      }
    });

    view.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t.matches("[data-dtext]")) return;
      var ctx = ctxOf(t), r = rec(ctx.d, ctx.mode);
      r.text[t.dataset.dtext] = t.value;
      save(ctx.d, ctx.mode, r);
      var n = words(t.value), c = $('[data-dcount="' + t.dataset.dtext + '"]', ctx.el);
      if (c) c.textContent = n + " palavra" + (n === 1 ? "" : "s");
    });

    setInterval(tickClock, 1000);
  }

  window.Treino = {
    init: init, render: render,
    count: function () { return drills.length; },
    has: function (id) { return !!byId[id]; },
    // exercício que treina um caso (mesmo id, ou um exercício com case: id)
    drillFor: function (caseId) {
      if (byId[caseId]) return caseId;
      var d = drills.filter(function (x) { return x.case === caseId; })[0];
      return d ? d.id : null;
    },
    progress: function () { var s = practiceStats(); return { items: s.items, done: s.done, parts: s.parts, right: s.right }; }
  };
})();
